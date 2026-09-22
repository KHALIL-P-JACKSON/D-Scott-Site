// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile, SignUpFields } from '../types'
import {
  DEFAULT_SITE_HOURS,
  ID_BUCKET,
  describeAuthError,
  describeIdStatus,
  emailError,
  formatDayHours,
  idFileError,
  idObjectPath,
  loadAccount,
  loadPricingCatalog,
  loadSiteHours,
  notifyPricingUpdated,
  notifySiteHoursUpdated,
  passwordError,
  readPricingCatalog,
  readSiteHours,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  siteHoursRows,
  siteHoursSummary,
  updatePricingCatalog,
  updateProfileDetails,
  updateSiteHours,
  uploadIdDocument,
  validateSignIn,
  validateSignUp,
} from './account'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
    from: mocks.from,
    storage: { from: mocks.storageFrom },
    rpc: mocks.rpc,
  },
}))

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

/** The `select ... eq ... maybeSingle` chain `loadAccount` walks. */
function profileRowFor(row: Profile | null) {
  mocks.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }),
  })
}

function signedInAs(email: string | null) {
  mocks.getSession.mockResolvedValue({
    data: { session: { user: { id: 'u-1', email } } },
    error: null,
  })
}

const signUpFields: SignUpFields = {
  fullName: '  Ashley Davis  ',
  email: '  ashley@example.com ',
  password: 'supersecret1',
  confirmPassword: 'supersecret1',
  phone: ' (555) 111-2222 ',
}

describe('loadAccount', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
  })

  it('reports nobody signed in when there is no session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })

    expect(await loadAccount()).toEqual({ status: 'ok', account: null })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('propagates getSession errors instead of treating as signed-out', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Network error reaching auth' },
    })

    expect(await loadAccount()).toEqual({
      status: 'failed',
      error: 'Network error reaching auth',
    })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('propagates profile query errors instead of treating as missing profile', async () => {
    signedInAs('ashley@example.com')
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { message: 'Failed to fetch profile' },
          }),
        }),
      }),
    })

    expect(await loadAccount()).toEqual({
      status: 'failed',
      error: 'Failed to fetch profile',
    })
  })

  it('returns the session together with the profile row', async () => {
    signedInAs('ashley@example.com')
    profileRowFor(profile({ id_status: 'approved' }))

    expect(await loadAccount()).toEqual({
      status: 'ok',
      account: {
        userId: 'u-1',
        email: 'ashley@example.com',
        profile: profile({ id_status: 'approved' }),
      },
    })
    expect(mocks.from).toHaveBeenCalledWith('profiles')
  })

  it('survives a profile row that the trigger has not created yet', async () => {
    signedInAs(null)
    profileRowFor(null)

    expect(await loadAccount()).toEqual({
      status: 'ok',
      account: { userId: 'u-1', email: '', profile: null },
    })
  })
})

describe('signUpWithEmail', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
  })

  it('creates the account and trims the details onto the profile', async () => {
    mocks.signUp.mockResolvedValue({ data: { session: { user: { id: 'u-1' } } }, error: null })

    expect(await signUpWithEmail(signUpFields)).toEqual({
      error: null,
      needsConfirmation: false,
      account: { userId: 'u-1', email: '', profile: null },
    })
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'ashley@example.com',
      password: 'supersecret1',
      options: { data: { full_name: 'Ashley Davis', phone: '(555) 111-2222' } },
    })
  })

  it('asks the client to confirm their email when no session comes back', async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null })

    expect(await signUpWithEmail(signUpFields)).toEqual({
      error: null,
      needsConfirmation: true,
      account: null,
    })
  })

  it('explains a signup the database refused', async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null },
      error: { message: 'User already registered' },
    })

    expect(await signUpWithEmail(signUpFields)).toEqual({
      error: 'An account with that email already exists — try signing in instead.',
      needsConfirmation: false,
      account: null,
    })
  })
})

describe('signInWithEmail', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
  })

  it('signs in with the trimmed email', async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null })

    expect(await signInWithEmail({ email: ' ashley@example.com ', password: 'supersecret1' }))
      .toEqual({ error: null, account: null })
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'ashley@example.com',
      password: 'supersecret1',
    })
  })

  it('rewrites a rejected password', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    })

    expect(await signInWithEmail({ email: 'ashley@example.com', password: 'nope' })).toEqual({
      error: 'That email and password do not match an account.',
      account: null,
    })
  })
})

describe('loadSiteHours', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
  })

  it('prefers the live hours row from Supabase when it is available', async () => {
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              hours: {
                mon: { closed: true, open: '09:00', close: '17:00' },
                tue: { closed: true, open: '09:00', close: '17:00' },
                wed: { closed: true, open: '09:00', close: '17:00' },
                thu: { closed: false, open: '17:00', close: '20:00' },
                fri: { closed: false, open: '08:00', close: '17:00' },
                sat: { closed: false, open: '08:00', close: '18:00' },
                sun: { closed: false, open: '08:00', close: '18:00' },
              },
            },
            error: null,
          }),
        }),
      }),
    })

    expect(await loadSiteHours()).toMatchObject({
      thu: { open: '17:00', close: '20:00' },
    })
    expect(mocks.from).toHaveBeenCalledWith('site_hours')
  })
})

describe('signOut', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
  })

  it('signs the client out', async () => {
    mocks.signOut.mockResolvedValue({ error: null })

    expect(await signOut()).toEqual({ error: null })
  })

  it('reports a sign-out that failed', async () => {
    mocks.signOut.mockResolvedValue({ error: { message: 'Auth session missing!' } })

    expect(await signOut()).toEqual({ error: 'Auth session missing!' })
  })
})

describe('updateProfileDetails', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }
  })

  it('saves the two columns a client is allowed to change', async () => {
    const eq = vi.fn(async () => ({ error: null }))
    const update = vi.fn(() => ({ eq }))
    mocks.from.mockReturnValue({ update })

    expect(await updateProfileDetails('u-1', { fullName: ' Ashley ', phone: ' 555 ' })).toEqual({
      error: null,
    })
    expect(mocks.from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith({ full_name: 'Ashley', phone: '555' })
    expect(eq).toHaveBeenCalledWith('id', 'u-1')
  })

  it('reports a refused update', async () => {
    mocks.from.mockReturnValue({
      update: () => ({ eq: async () => ({ error: { message: 'permission denied' } }) }),
    })

    expect(await updateProfileDetails('u-1', { fullName: 'Ashley', phone: '' })).toEqual({
      error: 'permission denied',
    })
  })
})

describe('uploadIdDocument', () => {
  const idFile = { name: 'licence.png', type: 'image/png', size: 1024 }

  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset()
    }

    mocks.storageFrom.mockReturnValue({ upload: mocks.upload })
  })

  it('never reaches storage when the file is the wrong type', async () => {
    const result = await uploadIdDocument('u-1', {
      name: 'licence.txt',
      type: 'text/plain',
      size: 10,
    })

    expect(result.error).toBe('Upload a JPG, PNG, WEBP or PDF.')
    expect(mocks.storageFrom).not.toHaveBeenCalled()
  })

  it('uploads into the client folder and records it on the profile', async () => {
    mocks.upload.mockResolvedValue({ error: null })
    mocks.rpc.mockResolvedValue({ error: null })

    expect(await uploadIdDocument('u-1', idFile)).toEqual({ error: null })
    expect(mocks.storageFrom).toHaveBeenCalledWith(ID_BUCKET)
    expect(mocks.upload).toHaveBeenCalledWith('u-1/id.png', idFile, { upsert: true })
    expect(mocks.rpc).toHaveBeenCalledWith('submit_id', { p_path: 'u-1/id.png' })
  })

  it('reports a rejected upload and leaves the profile alone', async () => {
    mocks.upload.mockResolvedValue({
      error: { message: 'new row violates row-level security policy' },
    })

    expect((await uploadIdDocument('u-1', idFile)).error).toBe(
      'new row violates row-level security policy',
    )
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('reports a submission the database turned down', async () => {
    mocks.upload.mockResolvedValue({ error: null })
    mocks.rpc.mockResolvedValue({ error: { message: 'ID must live in your own folder' } })

    expect((await uploadIdDocument('u-1', idFile)).error).toBe('ID must live in your own folder')
  })
})

describe('idFileError', () => {
  it('accepts the formats the bucket allows, up to 5 MB', () => {
    expect(idFileError({ name: 'a.png', type: 'image/png', size: 1024 })).toBeNull()
    expect(idFileError({ name: 'a.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 })).toBeNull()
  })

  it('turns down a type the bucket would reject', () => {
    expect(idFileError({ name: 'a.txt', type: 'text/plain', size: 1024 })).toBe(
      'Upload a JPG, PNG, WEBP or PDF.',
    )
  })

  it('turns down a file the bucket would refuse for its size', () => {
    expect(idFileError({ name: 'a.png', type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toBe(
      'That file is larger than 5 MB. Please upload a smaller scan.',
    )
  })
})

describe('idObjectPath', () => {
  it('names the object after the client folder and the uploaded extension', () => {
    expect(idObjectPath('u-1', 'ID Scan.JPEG')).toBe('u-1/id.jpeg')
  })

  it('falls back to .jpg when the upload has no extension', () => {
    expect(idObjectPath('u-1', 'scan')).toBe('u-1/id.jpg')
  })
})

describe('describeIdStatus', () => {
  it('explains every verification state', () => {
    expect(describeIdStatus('approved')).toMatchObject({ label: 'Verified', color: 'green' })
    expect(describeIdStatus('pending')).toMatchObject({ label: 'In review', color: 'amber' })
    expect(describeIdStatus('rejected')).toMatchObject({ label: 'Needs attention', color: 'red' })
    expect(describeIdStatus('unverified')).toMatchObject({ label: 'Not uploaded', color: 'gray' })
  })
})

describe('describeAuthError', () => {
  it('rewrites the messages a client can act on', () => {
    expect(describeAuthError('Invalid login credentials')).toBe(
      'That email and password do not match an account.',
    )
    expect(describeAuthError('User already registered')).toBe(
      'An account with that email already exists — try signing in instead.',
    )
    expect(describeAuthError('Email rate limit exceeded')).toBe(
      'Too many attempts just now. Please wait a minute and try again.',
    )
    expect(describeAuthError('Password should be at least 6 characters')).toBe(
      'That password is too weak. Use at least 8 characters.',
    )
    expect(describeAuthError('Unable to validate email address: invalid format')).toBe(
      'Use an email address that can receive mail.',
    )
  })

  it('passes anything it does not recognise straight through', () => {
    expect(describeAuthError('Network request failed')).toBe('Network request failed')
  })
})

describe('validateSignUp', () => {
  it('accepts a complete form', () => {
    expect(validateSignUp(signUpFields)).toEqual({})
  })

  it('names every field that needs attention', () => {
    expect(
      validateSignUp({
        fullName: '   ',
        email: 'not-an-email',
        password: 'short',
        confirmPassword: 'different',
        phone: '',
      }),
    ).toEqual({
      fullName: 'Tell us the name to put on your file.',
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
      confirmPassword: 'Those passwords do not match.',
    })
  })
})

describe('validateSignIn', () => {
  it('accepts a complete form', () => {
    expect(validateSignIn({ email: 'ashley@example.com', password: 'supersecret1' })).toEqual({})
  })

  it('asks for an email and a password', () => {
    expect(validateSignIn({ email: '', password: '' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Enter your password.',
    })
  })
})

describe('pricing catalog persistence and updates', () => {
  function stubWindowWithStorage() {
    const store = new Map<string, string>()
    const dispatch = vi.fn()

    vi.stubGlobal('Event', class {
      type: string

      constructor(type: string) {
        this.type = type
      }
    })

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
        clear: () => {
          store.clear()
        },
      },
      dispatchEvent: dispatch,
    })

    return { store, dispatch }
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads a stored pricing catalog and falls back on bad data', () => {
    const { store } = stubWindowWithStorage()

    store.set('dscott-pricing-catalog', JSON.stringify({
      categories: [{ id: 'acrylic-sets', label: 'Acrylic Sets', color: 'ruby' }],
      services: [{
        id: 'acrylic-full-set',
        category: 'acrylic-sets',
        title: 'Acrylic Full Set',
        price: '$25',
        duration: '90 min',
        desc: 'Sculpted acrylic extensions.',
        variants: [{ label: 'Short', price: '$25' }],
      }],
    }))

    expect(readPricingCatalog()).toMatchObject({
      categories: [{ id: 'acrylic-sets', label: 'Acrylic Sets', color: 'ruby' }],
      services: [{ title: 'Acrylic Full Set' }],
    })

    store.set('dscott-pricing-catalog', 'not json')
    expect(readPricingCatalog()).toEqual(expect.objectContaining({
      categories: expect.any(Array),
      services: expect.any(Array),
    }))
  })

  it('loads the remote pricing catalog when present and saves it locally', async () => {
    stubWindowWithStorage()
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              catalog: {
                categories: [{ id: 'fill-ins', label: 'Fill Ins', color: 'amber' }],
                services: [{
                  id: 'acrylic-fill-in',
                  category: 'fill-ins',
                  title: 'Acrylic Fill In',
                  price: '$20',
                  duration: '60 min',
                  desc: 'Refresh your set.',
                }],
              },
            },
            error: null,
          }),
        }),
      }),
    })

    expect(await loadPricingCatalog()).toMatchObject({
      categories: [{ id: 'fill-ins', label: 'Fill Ins', color: 'amber' }],
      services: [{ title: 'Acrylic Fill In' }],
    })
  })

  it('uses the browser catalog when the remote pricing table is missing', async () => {
    const { store } = stubWindowWithStorage()
    store.set('dscott-pricing-catalog', JSON.stringify({
      categories: [{ id: 'press-ons', label: 'Press-Ons', color: 'blue' }],
      services: [{
        id: 'custom-press-ons',
        category: 'press-ons',
        title: 'Custom Press-On Set',
        price: '$10',
        duration: '30 min',
        desc: 'Handmade press-ons.',
      }],
    }))

    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { code: '42P01', message: 'relation "public.pricing" does not exist' },
          }),
        }),
      }),
    })

    expect(await loadPricingCatalog()).toMatchObject({
      categories: [{ id: 'press-ons', label: 'Press-Ons', color: 'blue' }],
      services: [{ title: 'Custom Press-On Set' }],
    })
  })

  it('updates the catalog locally and notifies listeners', async () => {
    const { dispatch, store } = stubWindowWithStorage()
    const catalog = {
      categories: DEFAULT_SITE_HOURS ? [{ id: 'gel-manicure', label: 'Gel Manicure', color: 'purple' }] : [],
      services: [{
        id: 'gel-manicure',
        category: 'gel-manicure',
        title: 'Gel Manicure',
        price: '$25',
        duration: '45 min',
        desc: 'Detailed cuticle care.',
      }],
    }

    mocks.from.mockReturnValue({
      upsert: vi.fn(async () => ({ error: null })),
    })

    await expect(updatePricingCatalog(catalog)).resolves.toEqual({ error: null })
    expect(JSON.parse(store.get('dscott-pricing-catalog') ?? '{}')).toMatchObject({ services: catalog.services })
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0][0].type).toBe('dscott-pricing-updated')
  })

  it('dispatches the pricing event even without a live database', () => {
    const { dispatch } = stubWindowWithStorage()

    notifyPricingUpdated()

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0][0].type).toBe('dscott-pricing-updated')
  })
})

describe('site-hours persistence and formatting', () => {
  function stubWindowWithStorage() {
    const store = new Map<string, string>()
    const dispatch = vi.fn()

    vi.stubGlobal('Event', class {
      type: string

      constructor(type: string) {
        this.type = type
      }
    })

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
        clear: () => {
          store.clear()
        },
      },
      dispatchEvent: dispatch,
    })

    return { store, dispatch }
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the saved site-hours schedule and keeps the defaults if storage is invalid', () => {
    const { store } = stubWindowWithStorage()
    const custom = { ...DEFAULT_SITE_HOURS, mon: { closed: false, open: '10:00', close: '15:00' } }

    store.set('dscott-site-hours', JSON.stringify(custom))
    expect(readSiteHours()).toMatchObject({ mon: { open: '10:00', close: '15:00', closed: false } })

    store.set('dscott-site-hours', 'not valid json')
    expect(readSiteHours()).toEqual(DEFAULT_SITE_HOURS)
  })

  it('loads the live site-hours row and falls back to the browser copy when missing', async () => {
    const { store } = stubWindowWithStorage()
    const saved = { ...DEFAULT_SITE_HOURS, fri: { closed: false, open: '09:00', close: '18:00' } }
    store.set('dscott-site-hours', JSON.stringify(saved))

    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { hours: { ...DEFAULT_SITE_HOURS, sat: { closed: false, open: '08:30', close: '17:30' } } },
            error: null,
          }),
        }),
      }),
    })

    expect(await loadSiteHours()).toMatchObject({ sat: { open: '08:30', close: '17:30' } })

    store.set('dscott-site-hours', JSON.stringify(saved))

    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { code: 'PGRST116', message: 'not found' },
          }),
        }),
      }),
    })

    expect(await loadSiteHours()).toEqual(saved)
  })

  it('updates site hours locally and dispatches the refresh event', async () => {
    const { dispatch, store } = stubWindowWithStorage()
    const hours = { ...DEFAULT_SITE_HOURS, sun: { closed: false, open: '09:00', close: '16:00' } }

    mocks.from.mockReturnValue({
      upsert: vi.fn(async () => ({ error: null })),
    })

    await expect(updateSiteHours(hours)).resolves.toEqual({ error: null })
    expect(JSON.parse(store.get('dscott-site-hours') ?? '{}')).toMatchObject({ sun: { open: '09:00', close: '16:00' } })
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0][0].type).toBe('dscott-site-hours-updated')
  })

  it('formats contiguous ranges and summarizes closed schedules', () => {
    const allClosed = {
      mon: { closed: true, open: '09:00', close: '17:00' },
      tue: { closed: true, open: '09:00', close: '17:00' },
      wed: { closed: true, open: '09:00', close: '17:00' },
      thu: { closed: true, open: '09:00', close: '17:00' },
      fri: { closed: true, open: '09:00', close: '17:00' },
      sat: { closed: true, open: '09:00', close: '17:00' },
      sun: { closed: true, open: '09:00', close: '17:00' },
    }

    const mixed = {
      ...allClosed,
      mon: { closed: true, open: '09:00', close: '17:00' },
      tue: { closed: true, open: '09:00', close: '17:00' },
      wed: { closed: false, open: '09:00', close: '17:00' },
      thu: { closed: false, open: '09:00', close: '17:00' },
      fri: { closed: false, open: '09:00', close: '17:00' },
      sat: { closed: false, open: '10:00', close: '18:00' },
      sun: { closed: false, open: '10:00', close: '18:00' },
    }

    expect(formatDayHours({ closed: true, open: '09:00', close: '17:00' })).toBe('Closed')
    expect(formatDayHours({ closed: false, open: '09:00', close: '17:00' })).toBe('9:00 AM – 5:00 PM')
    expect(siteHoursRows(allClosed)).toEqual([
      { day: 'mon-sun', label: 'Mon - Sun', value: 'Closed' },
    ])
    expect(siteHoursSummary(allClosed)).toBe('Closed every day')
    expect(siteHoursRows(mixed)).toHaveLength(3)
    expect(siteHoursSummary(mixed)).toContain('Closed')
  })

  it('dispatches the site-hours update event directly', () => {
    const { dispatch } = stubWindowWithStorage()

    notifySiteHoursUpdated()

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0][0].type).toBe('dscott-site-hours-updated')
  })
})

describe('emailError and passwordError', () => {
  it('measure the two fields the same way everywhere', () => {
    expect(emailError(' ashley@example.com ')).toBeNull()
    expect(emailError('ashley@example')).toBe('Enter a valid email address.')
    expect(passwordError('supersecret1')).toBeNull()
    expect(passwordError('short')).toBe('Use at least 8 characters.')
  })
})
