import { supabase } from './supabase'
import { describeAuthError } from './account'
import { getServiceByOptionValue } from '../data/services'
import type { AccountSnapshot, BookingRequestInput, Profile } from '../types'

/** What the booking form is allowed to show right now. */
export type BookingGate = 'loading' | 'signed-out' | 'needs-id' | 'ready'

/**
 * The rule the database also enforces: an ID on file, awaiting review or already
 * approved, is what unlocks booking.
 */
export function canBook(profile: Profile | null): boolean {
  return profile?.id_status === 'pending' || profile?.id_status === 'approved'
}

export function bookingGate(account: AccountSnapshot | null, loading: boolean): BookingGate {
  if (loading) {
    return 'loading'
  }

  if (!account?.userId) {
    return 'signed-out'
  }

  return canBook(account.profile) ? 'ready' : 'needs-id'
}

/**
 * A booking stores both the menu id (for reporting) and the exact label the
 * client picked (as the price list read at the time).
 */
export function bookingServiceFields(serviceOption: string): {
  serviceId: string
  serviceLabel: string
} {
  const service = getServiceByOptionValue(serviceOption)

  return { serviceId: service?.id ?? serviceOption, serviceLabel: serviceOption }
}

/** 42501 is PostgREST's RLS rejection, which is how the ID rule comes back. */
export function describeBookingError(error: { code?: string; message: string }): string {
  if (error.code === '42501') {
    return 'Add a photo ID to your account before requesting an appointment.'
  }

  return describeAuthError(error.message)
}

export async function createBookingRequest(
  account: AccountSnapshot,
  input: BookingRequestInput,
): Promise<{ error: string | null }> {
  const { serviceId, serviceLabel } = bookingServiceFields(input.serviceOption)

  const { error } = await supabase.from('bookings').insert({
    user_id: account.userId,
    service_id: serviceId,
    service_label: serviceLabel,
    preferred_date: input.preferredDate,
    time_slot: input.timeSlot,
    notes: input.notes.trim() || null,
  })

  return { error: error ? describeBookingError(error) : null }
}
