import { supabase } from './supabase'
import type {
  AccountSnapshot,
  IdStatus,
  Profile,
  SignInFields,
  SignUpFields,
} from '../types'

/** Kept in step with the bucket created in `supabase/schema.sql`. */
export const ID_BUCKET = 'id-documents'
export const MAX_ID_BYTES = 5 * 1024 * 1024
export const ID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const PASSWORD_MIN_LENGTH = 8

/** Just the parts of a `File` the account page needs, so specs can pass plain objects. */
export type FileLike = Pick<File, 'name' | 'type' | 'size'>

export interface ActionResult {
  error: string | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * What `loadAccount` found. `ok` means the answer is final (session or no
 * session); `failed` means the read itself broke, so the UI can offer a retry
 * instead of telling a signed-in client they are signed out.
 */
export type AccountLoadResult =
  | { status: 'ok'; account: AccountSnapshot | null }
  | { status: 'failed'; error: string }

/**
 * Everyone who signs in needs a profile row. The trigger in `supabase/schema.sql`
 * creates it at signup, so this only has to read it back.
 */
export async function loadAccount(): Promise<AccountLoadResult> {
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return { status: 'failed', error: sessionError.message }
  }

  const user = data.session?.user

  if (!user) {
    return { status: 'ok', account: null }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { status: 'failed', error: profileError.message }
  }

  return {
    status: 'ok',
    account: {
      userId: user.id,
      email: user.email ?? '',
      profile: (profile as Profile | null) ?? null,
    },
  }
}

/** The page's starting point when auth hands back a session but the profile read lags. */
function sessionOf(session: { user: { id: string; email?: string | null } } | null): AccountSnapshot | null {
  const user = session?.user

  if (!user) {
    return null
  }

  return { userId: user.id, email: user.email ?? '', profile: null }
}

export interface AuthResult extends ActionResult {
  /** The session identity, so the page can sign in immediately without a reload. */
  account: AccountSnapshot | null
}

export async function signUpWithEmail(
  fields: SignUpFields,
): Promise<AuthResult & { needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: fields.email.trim(),
    password: fields.password,
    options: {
      data: { full_name: fields.fullName.trim(), phone: fields.phone.trim() },
    },
  })

  if (error) {
    return { error: describeAuthError(error.message), needsConfirmation: false, account: null }
  }

  // With "Confirm email" switched on, signup returns a user but no session.
  if (!data.session) {
    return { error: null, needsConfirmation: true, account: null }
  }

  return { error: null, needsConfirmation: false, account: sessionOf(data.session) }
}

export async function signInWithEmail(fields: SignInFields): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fields.email.trim(),
    password: fields.password,
  })

  if (error) {
    return { error: describeAuthError(error.message), account: null }
  }

  return { error: null, account: sessionOf(data.session) }
}

export async function signOut(): Promise<ActionResult> {
  const { error } = await supabase.auth.signOut()

  return { error: error ? describeAuthError(error.message) : null }
}

export async function updateProfileDetails(
  userId: string,
  fields: { fullName: string; phone: string },
): Promise<ActionResult> {
  // Only `full_name` and `phone` are granted to signed-in clients, so the
  // verification columns cannot be written from the browser.
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fields.fullName.trim(), phone: fields.phone.trim() })
    .eq('id', userId)

  return { error: error ? describeAuthError(error.message) : null }
}

export async function uploadIdDocument(userId: string, file: FileLike): Promise<ActionResult> {
  const problem = idFileError(file)

  if (problem) {
    return { error: problem }
  }

  const path = idObjectPath(userId, file.name)
  const { error } = await supabase.storage
    .from(ID_BUCKET)
    .upload(path, file as File, { upsert: true })

  if (error) {
    return { error: describeAuthError(error.message) }
  }

  // The RPC is what records the upload against the profile; moving `id_status`
  // is not something a client is allowed to do directly.
  const { error: submission } = await supabase.rpc('submit_id', { p_path: path })

  return { error: submission ? describeAuthError(submission.message) : null }
}

/** Why a chosen file cannot be uploaded, or null when it is fine. */
export function idFileError(file: FileLike): string | null {
  if (!ID_MIME_TYPES.includes(file.type)) {
    return 'Upload a JPG, PNG, WEBP or PDF.'
  }

  if (file.size > MAX_ID_BYTES) {
    return 'That file is larger than 5 MB. Please upload a smaller scan.'
  }

  return null
}

/** `<user id>/id.<ext>` — one folder per client, as the storage policies expect. */
export function idObjectPath(userId: string, fileName: string): string {
  return `${userId}/id.${extensionOf(fileName)}`
}

function extensionOf(fileName: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(fileName)
  return match ? match[1].toLowerCase() : 'jpg'
}

/** The badge and explanation the account page shows for a verification state. */
export function describeIdStatus(status: IdStatus): {
  label: string
  detail: string
  color: 'gray' | 'amber' | 'green' | 'red'
} {
  switch (status) {
    case 'approved':
      return {
        label: 'Verified',
        detail: 'Your ID is verified — you are cleared to book any service.',
        color: 'green',
      }
    case 'pending':
      return {
        label: 'In review',
        detail: 'Your ID is on file and waiting for the studio to review it.',
        color: 'amber',
      }
    case 'rejected':
      return {
        label: 'Needs attention',
        detail: 'We could not read that ID. Please upload a clearer photo.',
        color: 'red',
      }
    default:
      return {
        label: 'Not uploaded',
        detail: 'Upload a government-issued photo ID before your first appointment.',
        color: 'gray',
      }
  }
}

/** Turns Supabase's error strings into something a client can act on. */
export function describeAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'That email and password do not match an account.'
  }

  if (normalized.includes('already registered')) {
    return 'An account with that email already exists — try signing in instead.'
  }

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many attempts just now. Please wait a minute and try again.'
  }

  if (normalized.includes('password')) {
    return `That password is too weak. Use at least ${PASSWORD_MIN_LENGTH} characters.`
  }

  if (normalized.includes('email')) {
    return 'Use an email address that can receive mail.'
  }

  return message
}

export function validateSignUp(fields: SignUpFields): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!fields.fullName.trim()) {
    errors.fullName = 'Tell us the name to put on your file.'
  }

  const email = emailError(fields.email)
  if (email) {
    errors.email = email
  }

  const password = passwordError(fields.password)
  if (password) {
    errors.password = password
  }

  if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Those passwords do not match.'
  }

  return errors
}

export function validateSignIn(fields: SignInFields): Record<string, string> {
  const errors: Record<string, string> = {}

  const email = emailError(fields.email)
  if (email) {
    errors.email = email
  }

  if (!fields.password) {
    errors.password = 'Enter your password.'
  }

  return errors
}

export function emailError(value: string): string | null {
  return EMAIL_PATTERN.test(value.trim()) ? null : 'Enter a valid email address.'
}

export function passwordError(value: string): string | null {
  return value.length < PASSWORD_MIN_LENGTH
    ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
    : null
}


