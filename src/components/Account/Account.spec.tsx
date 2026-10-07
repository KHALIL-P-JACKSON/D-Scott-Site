import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '../../test/render'
import type { AccountSnapshot, Profile } from '../../types'
import {
  loadAccount,
  readSiteHours,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateProfileDetails,
  updateSiteHours,
  uploadIdDocument,
} from '../../lib/account'
import { Account } from './Account'

/**
 * Nothing here should reach the network. The Supabase client is replaced outright
 * (so CI needs no env variables) and the data layer is stubbed per test; the pure
 * rules — validation, ID status copy, file checks — run for real.
 */
vi.mock('../../lib/supabase', () => ({ supabase: {} }))

vi.mock('../../lib/account', async () => {
  const actual = await vi.importActual<typeof import('../../lib/account')>('../../lib/account')

  return {
    ...actual,
    loadAccount: vi.fn(),
    readSiteHours: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
    updateProfileDetails: vi.fn(),
    updateSiteHours: vi.fn(),
    uploadIdDocument: vi.fn(),
  }
})

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'u-1',
    full_name: 'Ashley Davis',
    phone: '(555) 111-2222',
    is_admin: false,
    id_status: 'unverified',
    id_path: null,
    id_uploaded_at: null,
    id_review_notes: null,
    ...overrides,
  }
}

const approvedAccount: AccountSnapshot = {
  userId: 'u-1',
  email: 'ashley@example.com',
  profile: profile({ id_status: 'approved', id_path: 'u-1/id.png' }),
}

const unverifiedAccount: AccountSnapshot = {
  userId: 'u-1',
  email: 'ashley@example.com',
  profile: profile(),
}

/** Renders the page and waits for the session check to settle. */
async function renderAccount(account: AccountSnapshot | null) {
  vi.mocked(loadAccount).mockResolvedValue({ status: 'ok', account })
  render(<Account />)

  await screen.findByRole('heading', {
    name: account ? 'Your account' : 'Create an account',
  })
}

/** jsdom does not submit a form for a button click, so submit it directly. */
function submitFormNamed(name: RegExp) {
  const form = screen.getByRole('button', { name }).closest('form')

  if (!form) {
    throw new Error('That button is not inside a form')
  }

  fireEvent.submit(form)
}

beforeEach(() => {
  vi.mocked(loadAccount).mockReset()
  vi.mocked(readSiteHours).mockReset()
  vi.mocked(signUpWithEmail).mockReset()
  vi.mocked(signInWithEmail).mockReset()
  vi.mocked(signOut).mockReset()
  vi.mocked(updateProfileDetails).mockReset()
  vi.mocked(updateSiteHours).mockReset()
  vi.mocked(uploadIdDocument).mockReset()
})

describe('a visitor with no account', () => {
  it('offers both ways in', async () => {
    await renderAccount(null)

    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('refuses an incomplete signup without calling the API', async () => {
    await renderAccount(null)
    submitFormNamed(/create account/i)

    expect(screen.getByText('Tell us the name to put on your file.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(signUpWithEmail).not.toHaveBeenCalled()
  })

  /** The signup and signin cards share labels, so scope each query to its card. */
  function signUpCard(): HTMLElement {
    const heading = screen.getByRole('heading', { name: 'Create an account' })
    const card = heading.closest('.account-card')

    if (!card) {
      throw new Error('The signup card did not render')
    }

    return card as HTMLElement
  }

  function fillSignUp(card: HTMLElement) {
    fireEvent.change(within(card).getByLabelText(/full name/i), {
      target: { value: 'Ashley Davis' },
    })
    fireEvent.change(within(card).getByLabelText(/email address/i), {
      target: { value: 'ashley@example.com' },
    })
    fireEvent.change(within(card).getByLabelText(/^password \*/i), {
      target: { value: 'supersecret1' },
    })
    fireEvent.change(within(card).getByLabelText(/confirm password/i), {
      target: { value: 'supersecret1' },
    })
  }

  function submitCard(card: HTMLElement, name: RegExp) {
    const form = within(card).getByRole('button', { name }).closest('form')

    if (!form) {
      throw new Error('That button is not inside a form')
    }

    fireEvent.submit(form)
  }

  it('asks a new client to confirm email when no session comes back', async () => {
    await renderAccount(null)
    vi.mocked(signUpWithEmail).mockResolvedValue({
      error: null,
      needsConfirmation: true,
      account: null,
    })
    const card = signUpCard()

    fillSignUp(card)
    submitCard(card, /create account/i)

    expect(await screen.findByText(/confirm your email address/i)).toBeInTheDocument()
    expect(signUpWithEmail).toHaveBeenCalledWith({
      fullName: 'Ashley Davis',
      email: 'ashley@example.com',
      password: 'supersecret1',
      confirmPassword: 'supersecret1',
      phone: '',
    })
  })

  it('explains a signup the studio refused', async () => {
    await renderAccount(null)
    vi.mocked(signUpWithEmail).mockResolvedValue({
      error: 'An account with that email already exists — try signing in instead.',
      needsConfirmation: false,
      account: null,
    })
    const card = signUpCard()

    fillSignUp(card)
    submitCard(card, /create account/i)

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })

  it('signs in and shows the account it just loaded', async () => {
    vi.mocked(loadAccount).mockReset()
    vi.mocked(loadAccount)
      .mockResolvedValueOnce({ status: 'ok', account: null })
      .mockResolvedValueOnce({ status: 'ok', account: approvedAccount })
    vi.mocked(signInWithEmail).mockResolvedValue({ error: null, account: approvedAccount })
    render(<Account />)
    await screen.findByRole('heading', { name: 'Create an account' })
    const heading = screen.getByRole('heading', { name: 'Sign in' })
    const card = heading.closest('.account-card') as HTMLElement | null

    if (!card) {
      throw new Error('The sign-in card did not render')
    }

    fireEvent.change(within(card).getByLabelText(/email address/i), {
      target: { value: 'ashley@example.com' },
    })
    fireEvent.change(within(card).getByLabelText(/password/i), {
      target: { value: 'supersecret1' },
    })
    const form = within(card).getByRole('button', { name: /^sign in$/i }).closest('form')

    if (!form) {
      throw new Error('The sign-in button is not inside a form')
    }

    fireEvent.submit(form)

    expect(await screen.findByText(/signed in as/i)).toBeInTheDocument()
    expect(screen.getByText('ashley@example.com')).toBeInTheDocument()
  })
})

describe('a signed-in client', () => {
  it('shows their ID status and offers sign out', async () => {
    await renderAccount(unverifiedAccount)

    expect(screen.getByRole('heading', { name: 'Your account' })).toBeInTheDocument()
    expect(screen.getByText(/not uploaded/i)).toBeInTheDocument()

    vi.mocked(signOut).mockResolvedValue({ error: null })
    vi.mocked(loadAccount).mockResolvedValue({ status: 'ok', account: null })
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(await screen.findByRole('heading', { name: 'Create an account' })).toBeInTheDocument()
  })

  it('saves their profile details', async () => {
    await renderAccount(unverifiedAccount)
    vi.mocked(updateProfileDetails).mockResolvedValue({ error: null })

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ashley D' } })
    submitFormNamed(/save details/i)

    expect(await screen.findByText(/we will use these details/i)).toBeInTheDocument()
    expect(updateProfileDetails).toHaveBeenCalledWith('u-1', {
      fullName: 'Ashley D',
      phone: '(555) 111-2222',
    })
  })

  it('shows an admin hours editor and saves the updated schedule', async () => {
    const adminAccount: AccountSnapshot = {
      userId: 'admin-1',
      email: 'studio@dscott.com',
      profile: profile({ id: 'admin-1', is_admin: true, full_name: 'Studio Admin' }),
    }

    vi.mocked(readSiteHours).mockReturnValue({
      mon: { closed: true, open: '09:00', close: '17:00' },
      tue: { closed: true, open: '09:00', close: '17:00' },
      wed: { closed: true, open: '09:00', close: '17:00' },
      thu: { closed: false, open: '17:00', close: '20:00' },
      fri: { closed: false, open: '08:00', close: '17:00' },
      sat: { closed: false, open: '08:00', close: '18:00' },
      sun: { closed: false, open: '08:00', close: '18:00' },
    })
    vi.mocked(updateSiteHours).mockResolvedValue({ error: null })

    await renderAccount(adminAccount)

    expect(screen.getByRole('heading', { name: /studio hours/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/thursday open/i), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText(/thursday close/i), { target: { value: '21:00' } })
    fireEvent.click(screen.getByRole('button', { name: /save studio hours/i }))

    expect(await screen.findByText(/saved the studio hours/i)).toBeInTheDocument()
    expect(updateSiteHours).toHaveBeenCalledWith(expect.objectContaining({
      thu: expect.objectContaining({ open: '18:00', close: '21:00' }),
    }))
  })

  it('reports an ID the profile check turned down', async () => {
    await renderAccount(unverifiedAccount)
    vi.mocked(uploadIdDocument).mockResolvedValue({
      error: 'That ID belongs to a different account. Sign in again.',
    })

    const file = new File(['id'], 'id.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/upload an id/i), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload id/i }))

    expect(await screen.findByText(/different account/i)).toBeInTheDocument()
  })

  it('renders retry feedback when loadAccount fails and allows retrying', async () => {
    vi.mocked(loadAccount).mockResolvedValueOnce({
      status: 'failed',
      error: 'Network connection error',
    })

    render(<Account />)

    expect(await screen.findByText('Network connection error')).toBeInTheDocument()
    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()

    vi.mocked(loadAccount).mockResolvedValueOnce({
      status: 'ok',
      account: approvedAccount,
    })

    fireEvent.click(retryButton)

    expect(await screen.findByRole('heading', { name: 'Your account' })).toBeInTheDocument()
  })
})
