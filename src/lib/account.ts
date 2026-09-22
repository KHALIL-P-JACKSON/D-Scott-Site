import { DEFAULT_PRICING_CATALOG } from '../data/services'
import { supabase } from './supabase'
import type {
  AccountSnapshot,
  DayOfWeek,
  IdStatus,
  PricingCatalog,
  Profile,
  SignInFields,
  SignUpFields,
  SiteDayHours,
  SiteHours,
} from '../types'

/** Kept in step with the bucket created in `supabase/schema.sql`. */
export const ID_BUCKET = 'id-documents'
export const MAX_ID_BYTES = 5 * 1024 * 1024
export const ID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const PASSWORD_MIN_LENGTH = 8

export const DEFAULT_SITE_HOURS: SiteHours = {
  mon: { closed: true, open: '09:00', close: '17:00' },
  tue: { closed: true, open: '09:00', close: '17:00' },
  wed: { closed: true, open: '09:00', close: '17:00' },
  thu: { closed: false, open: '17:00', close: '20:00' },
  fri: { closed: false, open: '08:00', close: '17:00' },
  sat: { closed: false, open: '08:00', close: '18:00' },
  sun: { closed: false, open: '08:00', close: '18:00' },
}

const SITE_HOURS_KEY = 'dscott-site-hours'
const SITE_HOURS_UPDATED_EVENT = 'dscott-site-hours-updated'
const PRICING_KEY = 'dscott-pricing-catalog'
const PRICING_UPDATED_EVENT = 'dscott-pricing-updated'
const SITE_HOURS_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

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

export function readSiteHours(): SiteHours {
  const fallback = DEFAULT_SITE_HOURS

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(SITE_HOURS_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<SiteHours>
    return normalizeSiteHours(parsed)
  } catch {
    return fallback
  }
}

function normalizePricingCatalog(catalog: Partial<PricingCatalog> | null | undefined): PricingCatalog {
  const fallback = DEFAULT_PRICING_CATALOG

  if (!catalog || typeof catalog !== 'object') {
    return fallback
  }

  const categories = Array.isArray(catalog.categories) && catalog.categories.length > 0
    ? (catalog.categories as PricingCatalog['categories'])
    : fallback.categories

  const services = Array.isArray(catalog.services) && catalog.services.length > 0
    ? (catalog.services as PricingCatalog['services'])
    : fallback.services

  return { categories, services }
}

export function readPricingCatalog(): PricingCatalog {
  const fallback = DEFAULT_PRICING_CATALOG

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(PRICING_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<PricingCatalog>
    return normalizePricingCatalog(parsed)
  } catch {
    return fallback
  }
}

export async function loadPricingCatalog(): Promise<PricingCatalog> {
  const fallback = readPricingCatalog()

  try {
    const { data, error } = await supabase
      .from('pricing')
      .select('catalog')
      .eq('id', 'service-menu')
      .maybeSingle()

    if (!error && data?.catalog) {
      const next = normalizePricingCatalog(data.catalog as Partial<PricingCatalog>)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PRICING_KEY, JSON.stringify(next))
      }

      return next
    }

    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      return fallback
    }
  } catch {
    // Keep the current catalog when the table is missing or the database is not ready.
  }

  return fallback
}

export function notifyPricingUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PRICING_UPDATED_EVENT))
  }
}

export async function updatePricingCatalog(catalog: PricingCatalog): Promise<ActionResult> {
  const normalized = normalizePricingCatalog(catalog)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRICING_KEY, JSON.stringify(normalized))
    notifyPricingUpdated()
  }

  try {
    const { error } = await supabase
      .from('pricing')
      .upsert({ id: 'service-menu', catalog: normalized }, { onConflict: 'id' })

    if (error && error.code !== '42P01') {
      return { error: error.message }
    }
  } catch {
    // The data remains in localStorage so the site continues to render while the
    // remote table is being created or the admin is working offline.
  }

  return { error: null }
}

export async function loadSiteHours(): Promise<SiteHours> {
  const fallback = readSiteHours()

  try {
    const { data, error } = await supabase
      .from('site_hours')
      .select('hours')
      .eq('id', 'studio-hours')
      .maybeSingle()

    if (!error && data?.hours) {
      const next = normalizeSiteHours(data.hours as Partial<SiteHours>)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SITE_HOURS_KEY, JSON.stringify(next))
      }

      return next
    }

    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      return fallback
    }
  } catch {
    // If the table is missing or the client is offline, keep using the browser
    // value and the built-in default schedule until the database is ready.
  }

  return fallback
}

export function notifySiteHoursUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SITE_HOURS_UPDATED_EVENT))
  }
}

export async function updateSiteHours(hours: SiteHours): Promise<ActionResult> {
  const normalized = normalizeSiteHours(hours)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SITE_HOURS_KEY, JSON.stringify(normalized))
    notifySiteHoursUpdated()
  }

  try {
    const { error } = await supabase
      .from('site_hours')
      .upsert({ id: 'studio-hours', hours: normalized }, { onConflict: 'id' })

    if (error && error.code !== '42P01') {
      return { error: error.message }
    }
  } catch {
    // The editor may not have a matching table yet. The browser-local storage
    // backup still keeps the hours live for the current site session.
  }

  return { error: null }
}

export function formatDayHours(day: SiteDayHours): string {
  if (day.closed) {
    return 'Closed'
  }

  return `${formatTime(day.open)} – ${formatTime(day.close)}`
}

export function siteHoursRows(hours: SiteHours): Array<{ day: string; label: string; value: string }> {
  const rows: Array<{ day: string; label: string; value: string }> = []
  let index = 0

  while (index < SITE_HOURS_ORDER.length) {
    const firstDay = SITE_HOURS_ORDER[index]
    const firstHours = hours[firstDay]
    let lastDay = firstDay
    let cursor = index + 1

    while (cursor < SITE_HOURS_ORDER.length) {
      const nextDay = SITE_HOURS_ORDER[cursor]
      const nextHours = hours[nextDay]

      if (!sameScheduleBlock(firstHours, nextHours)) {
        break
      }

      if (isConsecutiveDay(lastDay, nextDay)) {
        lastDay = nextDay
        cursor += 1
        continue
      }

      break
    }

    const label = formatRowLabel(firstDay, lastDay)

    rows.push({
      day: `${firstDay}-${lastDay}`,
      label,
      value: firstHours.closed ? 'Closed' : `${formatTime(firstHours.open)} – ${formatTime(firstHours.close)}`,
    })

    index = cursor
  }

  return rows
}

export function siteHoursSummary(hours: SiteHours): string {
  const rows = siteHoursRows(hours)
  const openRows = rows.filter((row) => row.value !== 'Closed')

  if (openRows.length === 0) {
    return 'Closed every day'
  }

  const first = openRows[0].label
  const last = openRows[openRows.length - 1].label
  const closedRows = rows.filter((row) => row.value === 'Closed')
  const closedLabel = closedRows.length > 0 ? ` · Closed ${closedRows[0].label}` : ''

  return `${first}–${last}${closedLabel}`
}

function normalizeSiteHours(hours: Partial<SiteHours> | null | undefined): SiteHours {
  return {
    mon: normalizeDayHours(hours?.mon ?? DEFAULT_SITE_HOURS.mon),
    tue: normalizeDayHours(hours?.tue ?? DEFAULT_SITE_HOURS.tue),
    wed: normalizeDayHours(hours?.wed ?? DEFAULT_SITE_HOURS.wed),
    thu: normalizeDayHours(hours?.thu ?? DEFAULT_SITE_HOURS.thu),
    fri: normalizeDayHours(hours?.fri ?? DEFAULT_SITE_HOURS.fri),
    sat: normalizeDayHours(hours?.sat ?? DEFAULT_SITE_HOURS.sat),
    sun: normalizeDayHours(hours?.sun ?? DEFAULT_SITE_HOURS.sun),
  }
}

function normalizeDayHours(day: Partial<SiteDayHours> | undefined): SiteDayHours {
  const fallback = DEFAULT_SITE_HOURS.mon
  return {
    closed: Boolean(day?.closed ?? fallback.closed),
    open: typeof day?.open === 'string' ? day.open : fallback.open,
    close: typeof day?.close === 'string' ? day.close : fallback.close,
  }
}

function sameScheduleBlock(left: SiteDayHours, right: SiteDayHours): boolean {
  if (left.closed !== right.closed) {
    return false
  }

  if (left.closed) {
    return true
  }

  return left.open === right.open && left.close === right.close
}

function formatRowLabel(firstDay: DayOfWeek, lastDay: DayOfWeek): string {
  if (firstDay === lastDay) {
    return longDayName(firstDay)
  }

  return `${dayName(firstDay)} - ${dayName(lastDay)}`
}

function dayName(day: DayOfWeek): string {
  switch (day) {
    case 'mon':
      return 'Mon'
    case 'tue':
      return 'Tue'
    case 'wed':
      return 'Wed'
    case 'thu':
      return 'Thu'
    case 'fri':
      return 'Fri'
    case 'sat':
      return 'Sat'
    default:
      return 'Sun'
  }
}

function longDayName(day: DayOfWeek): string {
  switch (day) {
    case 'mon':
      return 'Monday'
    case 'tue':
      return 'Tuesday'
    case 'wed':
      return 'Wednesday'
    case 'thu':
      return 'Thursday'
    case 'fri':
      return 'Friday'
    case 'sat':
      return 'Saturday'
    default:
      return 'Sunday'
  }
}

function isConsecutiveDay(previous: DayOfWeek, current: DayOfWeek): boolean {
  const order = SITE_HOURS_ORDER
  return order.indexOf(current) === order.indexOf(previous) + 1
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
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


