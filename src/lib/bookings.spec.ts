// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccountSnapshot, Profile } from '../types'
import {
  bookingGate,
  bookingServiceFields,
  canBook,
  createBookingRequest,
  describeBookingError,
} from './bookings'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: { from: mocks.from },
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

const account: AccountSnapshot = {
  userId: 'u-1',
  email: 'ashley@example.com',
  profile: profile(),
}

describe('canBook', () => {
  it('unlocks booking once an ID is on file', () => {
    expect(canBook(profile({ id_status: 'pending' }))).toBe(true)
    expect(canBook(profile({ id_status: 'approved' }))).toBe(true)
  })

  it('stays locked without an ID, and for a client with no profile at all', () => {
    expect(canBook(profile({ id_status: 'unverified' }))).toBe(false)
    expect(canBook(profile({ id_status: 'rejected' }))).toBe(false)
    expect(canBook(null)).toBe(false)
  })
})

describe('bookingGate', () => {
  it('waits for the account to load first', () => {
    expect(bookingGate(account, true)).toBe('loading')
  })

  it('asks a visitor to sign in', () => {
    expect(bookingGate(null, false)).toBe('signed-out')
    expect(bookingGate({ ...account, userId: '' }, false)).toBe('signed-out')
  })

  it('asks a signed-in client for an ID before the form', () => {
    expect(bookingGate({ ...account, profile: profile({ id_status: 'unverified' }) }, false)).toBe(
      'needs-id',
    )
  })

  it('opens the form for a client whose ID is already on file', () => {
    expect(bookingGate({ ...account, profile: profile({ id_status: 'pending' }) }, false)).toBe(
      'ready',
    )
  })
})

describe('bookingServiceFields', () => {
  it('resolves a variant option to its menu item', () => {
    expect(bookingServiceFields('Acrylic Full Set — Short (0–2)')).toEqual({
      serviceId: 'acrylic-full-set',
      serviceLabel: 'Acrylic Full Set — Short (0–2)',
    })
  })

  it('resolves a flat-priced service to its menu item', () => {
    expect(bookingServiceFields('Gel Manicure')).toEqual({
      serviceId: 'gel-manicure',
      serviceLabel: 'Gel Manicure',
    })
  })

  it('keeps the label even if the menu no longer offers it', () => {
    expect(bookingServiceFields('Retired Service — Long')).toEqual({
      serviceId: 'Retired Service — Long',
      serviceLabel: 'Retired Service — Long',
    })
  })
})

describe('describeBookingError', () => {
  it('explains the ID requirement behind an RLS rejection', () => {
    expect(describeBookingError({ code: '42501', message: 'new row violates row-level security' }))
      .toBe('Add a photo ID to your account before requesting an appointment.')
  })

  it('falls back to the generic copy for anything else', () => {
    expect(describeBookingError({ code: '23505', message: 'duplicate key value' })).toBe(
      'duplicate key value',
    )
  })
})

describe('createBookingRequest', () => {
  beforeEach(() => {
    mocks.from.mockReset()
    mocks.insert.mockReset()
    mocks.from.mockReturnValue({ insert: mocks.insert })
  })

  it('stores the request against the signed-in client', async () => {
    mocks.insert.mockResolvedValue({ error: null })

    const result = await createBookingRequest(account, {
      serviceOption: 'Acrylic Full Set — Short (0–2)',
      preferredDate: '2026-05-04',
      timeSlot: 'afternoon',
      notes: '  Almond shape  ',
    })

    expect(mocks.from).toHaveBeenCalledWith('bookings')
    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: 'u-1',
      service_id: 'acrylic-full-set',
      service_label: 'Acrylic Full Set — Short (0–2)',
      preferred_date: '2026-05-04',
      time_slot: 'afternoon',
      notes: 'Almond shape',
    })
    expect(result.error).toBeNull()
  })

  it('sends no notes rather than an empty string', async () => {
    mocks.insert.mockResolvedValue({ error: null })

    await createBookingRequest(account, {
      serviceOption: 'Gel Manicure',
      preferredDate: '2026-05-05',
      timeSlot: 'morning',
      notes: '   ',
    })

    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ notes: null }))
  })

  it('reports the friendly reason when the database refuses', async () => {
    mocks.insert.mockResolvedValue({
      error: { code: '42501', message: 'new row violates row-level security policy' },
    })

    const result = await createBookingRequest(account, {
      serviceOption: 'Gel Manicure',
      preferredDate: '2026-05-05',
      timeSlot: 'morning',
      notes: '',
    })

    expect(result.error).toBe(
      'Add a photo ID to your account before requesting an appointment.',
    )
  })
})
