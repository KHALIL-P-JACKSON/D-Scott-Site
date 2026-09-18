import type {
  ServiceCategoryMeta,
  ServiceItem,
  ServiceOptionGroup,
  ServiceVariant,
} from '../types'

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  { id: 'acrylic-sets', label: 'Acrylic Sets', color: 'ruby' },
  { id: 'fill-ins', label: 'Fill Ins', color: 'amber' },
  { id: 'gel-manicure', label: 'Gel Manicure', color: 'purple' },
  { id: 'press-ons', label: 'Press-Ons', color: 'blue' },
  { id: 'add-ons', label: 'Add-Ons', color: 'green' },
]

// Every add-on is priced per nail, or $5 when applied to all ten nails.
const addOnVariants = (): ServiceVariant[] => [
  { label: 'Per nail', price: '$1' },
  { label: 'All 10 nails', price: '$5' },
]

export const SERVICES: ServiceItem[] = [
  // Acrylic Sets
  {
    id: 'acrylic-full-set',
    category: 'acrylic-sets',
    title: 'Acrylic Full Set',
    price: '$25+',
    duration: '90 min',
    desc: 'Sculpted acrylic extensions in your choice of shape and length. Price is based on the length you select.',
    variants: [
      { label: 'Short (0–2)', price: '$25' },
      { label: 'Medium (3–4)', price: '$35' },
      { label: 'Medium Long (5–7)', price: '$40' },
      { label: 'Long (8–9)', price: '$45' },
      { label: 'X Long (10–11)', price: '$50' },
      { label: 'XX Long (12–14)', price: '$60' },
    ],
  },

  // Fill Ins
  {
    id: 'acrylic-fill-in',
    category: 'fill-ins',
    title: 'Acrylic Fill In',
    price: '$20+',
    duration: '60 min',
    desc: 'Rebalance your existing acrylic set with fresh product at the cuticle and a fully refreshed finish.',
    variants: [
      { label: 'Short Fill (0–2)', price: '$20' },
      { label: 'Medium Fill (3–4)', price: '$30' },
      { label: 'Medium Long Fill (5–7)', price: '$35' },
      { label: 'Long Fill (8–9)', price: '$40' },
      { label: 'X Long Fill (10–11)', price: '$45' },
      { label: 'XX Long Fill (12–14)', price: '$55' },
    ],
  },

  // Gel Manicure
  {
    id: 'gel-manicure',
    category: 'gel-manicure',
    title: 'Gel Manicure',
    price: '$25',
    duration: '45 min',
    desc: 'Detailed cuticle care, shaping, and long-lasting gel polish on your natural nails.',
  },

  // Press-Ons
  {
    id: 'custom-press-ons',
    category: 'press-ons',
    title: 'Custom Press-On Set',
    price: '$10+',
    duration: '30 min',
    desc: 'Handmade press-on sets sized to your nails — wear them out of the studio or take them home.',
    variants: [
      { label: 'Short', price: '$10' },
      { label: 'Medium', price: '$15' },
      { label: 'Long', price: '$20' },
      { label: 'X Long', price: '$25' },
    ],
  },

  // Add-Ons
  {
    id: 'add-on-simple-art',
    category: 'add-ons',
    title: 'Simple Nail Art',
    price: '$1 / nail',
    duration: '5–10 min',
    desc: 'Hand-painted minimal art — dots, lines, swirls, or abstract accents. Add to any set.',
    variants: addOnVariants(),
  },
  {
    id: 'add-on-french-tip',
    category: 'add-ons',
    title: 'French Tip',
    price: '$1 / nail',
    duration: '5–10 min',
    desc: 'Classic crisp white tips or a colored micro-French to match your set. Add to any set.',
    variants: addOnVariants(),
  },
  {
    id: 'add-on-chrome',
    category: 'add-ons',
    title: 'Chrome Finish',
    price: '$1 / nail',
    duration: '5–10 min',
    desc: 'Mirror chrome powder over your chosen base color for a high-shine metallic finish. Add to any set.',
    variants: addOnVariants(),
  },
  {
    id: 'add-on-charms',
    category: 'add-ons',
    title: 'Nail Charms',
    price: '$1 / nail',
    duration: '5–10 min',
    desc: '3D charms, gems, and rhinestones hand-placed and sealed onto your set. Add to any set.',
    variants: addOnVariants(),
  },
]

export function getServiceOptionValue(service: ServiceItem, variant?: ServiceVariant): string {
  return variant ? `${service.title} — ${variant.label}` : service.title
}

export function getDefaultServiceOption(service: ServiceItem): string {
  const [firstVariant] = service.variants ?? []
  return getServiceOptionValue(service, firstVariant)
}

// Booking form options are generated from the menu so pricing never drifts out of sync.
export const SERVICE_OPTION_GROUPS: ServiceOptionGroup[] = SERVICE_CATEGORIES.map((category) => ({
  label: category.label,
  options: SERVICES.filter((service) => service.category === category.id).flatMap((service) => {
    if (!service.variants) {
      return [{ value: service.title, label: `${service.title} (${service.price})` }]
    }

    return service.variants.map((variant) => {
      const value = getServiceOptionValue(service, variant)
      return { value, label: `${value} (${variant.price})` }
    })
  }),
}))
