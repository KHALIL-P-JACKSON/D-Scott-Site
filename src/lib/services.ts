import type { ServiceItem } from '../types'

/**
 * Label for the call-to-action button on a service card. Add-ons are booked on
 * top of a set, everything else advertises the entry price of its first variant.
 */
export function getCtaLabel(service: ServiceItem): string {
  if (service.category === 'add-ons') {
    return 'Add To Appointment'
  }

  const [firstVariant] = service.variants ?? []
  return firstVariant ? `Book from ${firstVariant.price}` : 'Book This Service'
}