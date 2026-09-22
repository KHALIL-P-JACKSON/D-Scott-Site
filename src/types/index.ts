export type ServiceCategory =
  | 'acrylic-sets'
  | 'fill-ins'
  | 'gel-manicure'
  | 'press-ons'
  | 'add-ons'

export interface ServiceVariant {
  label: string
  price: string
}

export interface ServiceItem {
  id: string
  category: ServiceCategory
  title: string
  price: string
  duration: string
  desc: string
  variants?: ServiceVariant[]
}

export interface ServiceCategoryMeta {
  id: ServiceCategory
  label: string
  color: 'ruby' | 'amber' | 'purple' | 'blue' | 'green'
}

export interface ServiceOption {
  value: string
  label: string
}

export interface ServiceOptionGroup {
  label: string
  options: ServiceOption[]
}

export interface ReviewItem {
  id: string
  name: string
  initials: string
  service: string
  rating: number
  text: string
}

export interface HeroSlide {
  src: string
  alt: string
  caption: string
}

export interface BookingFormData {
  name: string
  phone: string
  email: string
  date: string
  time: string
  notes: string
}

/**
 * Verification state of a client's ID. Stored by Postgres as `public.id_status`,
 * so the literals must stay in step with `supabase/schema.sql`.
 */
export type IdStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

/** Matches the `booking_time_slot` enum, and the booking form's own options. */
export type BookingTimeSlot = 'morning' | 'afternoon' | 'evening'

/** A row of `public.profiles`, snake_case exactly as Postgres returns it. */
export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  is_admin: boolean
  id_status: IdStatus
  id_path: string | null
  id_uploaded_at: string | null
  id_review_notes: string | null
}

/** The signed-in visitor: the session plus the profile row that goes with it. */
export interface AccountSnapshot {
  userId: string
  email: string
  profile: Profile | null
}

export interface SignUpFields {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

export interface SignInFields {
  email: string
  password: string
}

export interface BookingRequestInput {
  serviceOption: string
  preferredDate: string
  timeSlot: BookingTimeSlot
  notes: string
}
