// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  SERVICES,
  SERVICE_CATEGORIES,
  SERVICE_OPTION_GROUPS,
  getDefaultServiceOption,
  getServiceOptionValue,
} from './services'
import type { ServiceCategory, ServiceItem } from '../types'

type ExpectedService = {
  category: ServiceCategory
  title: string
  price: string
  variants: Array<[string, string]>
}

/**
 * A literal transcription of the studio's published price list. If a price,
 * label, or range is edited in `services.ts`, this diff fails — which is the
 * whole point, since pricing is the most business-critical content on the site.
 */
const EXPECTED_MENU: ExpectedService[] = [
  {
    category: 'acrylic-sets',
    title: 'Acrylic Full Set',
    price: '$25+',
    variants: [
      ['Short (0–2)', '$25'],
      ['Medium (3–4)', '$35'],
      ['Medium Long (5–7)', '$40'],
      ['Long (8–9)', '$45'],
      ['X Long (10–11)', '$50'],
      ['XX Long (12–14)', '$60'],
    ],
  },
  {
    category: 'fill-ins',
    title: 'Acrylic Fill In',
    price: '$20+',
    variants: [
      ['Short Fill (0–2)', '$20'],
      ['Medium Fill (3–4)', '$30'],
      ['Medium Long Fill (5–7)', '$35'],
      ['Long Fill (8–9)', '$40'],
      ['X Long Fill (10–11)', '$45'],
      ['XX Long Fill (12–14)', '$55'],
    ],
  },
  {
    category: 'gel-manicure',
    title: 'Gel Manicure',
    price: '$25',
    variants: [],
  },
  {
    category: 'press-ons',
    title: 'Custom Press-On Set',
    price: '$10+',
    variants: [
      ['Short', '$10'],
      ['Medium', '$15'],
      ['Long', '$20'],
      ['X Long', '$25'],
    ],
  },
]

const ADD_ON_SERVICES: ExpectedService[] = ['Simple Nail Art', 'French Tip', 'Chrome Finish'].map(
  (title) => ({
    category: 'add-ons' as ServiceCategory,
    title,
    price: '$1 / nail',
    variants: [
      ['Per nail', '$1'],
      ['All 10 nails', '$5'],
    ] as Array<[string, string]>,
  }),
)

EXPECTED_MENU.push(
  ...ADD_ON_SERVICES,
  {
    category: 'add-ons',
    title: 'Nail Charms',
    price: '$1 / nail',
    variants: [
      ['Per nail', '$1'],
      ['All 10 nails', '$5'],
    ],
  },
)

const summarise = (service: ServiceItem) => ({
  category: service.category,
  title: service.title,
  price: service.price,
  variants: (service.variants ?? []).map(
    (variant): [string, string] => [variant.label, variant.price],
  ),
})

const allOptionValues = () =>
  SERVICE_OPTION_GROUPS.flatMap((group) => group.options.map((option) => option.value))

describe('the published menu', () => {
  it('matches the studio price list exactly, in order', () => {
    expect(SERVICES.map(summarise)).toEqual(EXPECTED_MENU)
  })

  it('prices every entry with a dollar amount', () => {
    for (const service of SERVICES) {
      expect(service.price, `${service.title} price`).toMatch(/^\$\d+/)
      for (const variant of service.variants ?? []) {
        expect(variant.price, `${service.title} — ${variant.label}`).toMatch(/^\$\d+/)
      }
    }
  })

  it('prices each acrylic length above the one below it', () => {
    const amount = (price: string) => Number(price.replace(/[^\d]/g, ''))
    const acrylicPrices = (
      SERVICES.find((service) => service.id === 'acrylic-full-set')?.variants ?? []
    ).map((variant) => amount(variant.price))
    const fillPrices = (
      SERVICES.find((service) => service.id === 'acrylic-fill-in')?.variants ?? []
    ).map((variant) => amount(variant.price))

    expect(acrylicPrices).toHaveLength(6)
    expect(fillPrices).toHaveLength(6)

    for (let i = 1; i < acrylicPrices.length; i += 1) {
      expect(acrylicPrices[i], `acrylic length index ${i}`).toBeGreaterThan(acrylicPrices[i - 1])
    }
    for (let i = 1; i < fillPrices.length; i += 1) {
      expect(fillPrices[i], `fill length index ${i}`).toBeGreaterThan(fillPrices[i - 1])
    }

    // A fill must always cost less than the same-length full set.
    for (let i = 0; i < acrylicPrices.length; i += 1) {
      expect(fillPrices[i], `length index ${i}`).toBeLessThan(acrylicPrices[i])
    }
  })
})

describe('service data integrity', () => {
  it('declares unique ids', () => {
    const ids = SERVICES.map((service) => service.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses declared categories', () => {
    const declared = new Set(SERVICE_CATEGORIES.map((category) => category.id))
    for (const service of SERVICES) {
      expect(declared.has(service.category), service.title).toBe(true)
    }
  })

  it('uses unique variant labels within a service', () => {
    for (const service of SERVICES) {
      const labels = (service.variants ?? []).map((variant) => variant.label)
      expect(new Set(labels).size, service.title).toBe(labels.length)
    }
  })

  it('assigns every service to a category that has services', () => {
    for (const category of SERVICE_CATEGORIES) {
      const services = SERVICES.filter((service) => service.category === category.id)
      expect(services.length, category.label).toBeGreaterThan(0)
    }
  })

  it('has unique, non-empty category ids and labels', () => {
    const ids = SERVICE_CATEGORIES.map((category) => category.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const category of SERVICE_CATEGORIES) {
      expect(category.label.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('booking options derived from the menu', () => {
  it('mirrors the service categories in order', () => {
    expect(SERVICE_OPTION_GROUPS.map((group) => group.label)).toEqual(
      SERVICE_CATEGORIES.map((category) => category.label),
    )
  })

  it('exposes every service to the booking form', () => {
    const values = allOptionValues()
    for (const service of SERVICES) {
      expect(values, service.title).toContain(getDefaultServiceOption(service))
    }
  })

  it('never produces a duplicate option value', () => {
    // Duplicate values make Radix `Select` silently select the wrong item.
    const values = allOptionValues()
    expect(new Set(values).size).toBe(values.length)
  })

  it('defaults to the first (entry price) variant of a service', () => {
    for (const service of SERVICES) {
      const [firstVariant] = service.variants ?? []
      expect(getDefaultServiceOption(service), service.title).toBe(
        getServiceOptionValue(service, firstVariant),
      )
    }
  })

  it('includes the price in every option label', () => {
    for (const group of SERVICE_OPTION_GROUPS) {
      expect(group.options.length, group.label).toBeGreaterThan(0)
      for (const option of group.options) {
        expect(option.label, option.value).toMatch(/\(\$\d+/)
      }
    }
  })
})
