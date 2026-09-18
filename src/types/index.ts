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

export interface BookingFormData {
  name: string
  phone: string
  email: string
  service: string
  date: string
  time: string
  notes: string
}
