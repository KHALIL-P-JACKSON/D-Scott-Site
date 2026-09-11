export interface ServiceItem {
  id: string
  category: 'hair' | 'nails' | 'packages'
  title: string
  price: string
  duration: string
  desc: string
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
