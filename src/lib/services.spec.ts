// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getCtaLabel } from './services'
import type { ServiceItem } from '../types'

const service = (overrides: Partial<ServiceItem>): ServiceItem => ({
  id: 'service',
  category: 'gel-manicure',
  title: 'Gel Manicure',
  price: '$25',
  duration: '45 min',
  desc: 'A service.',
  ...overrides,
})

describe('getCtaLabel', () => {
  it('advertises the entry price of the first variant', () => {
    const pressOns = service({
      id: 'custom-press-ons',
      category: 'press-ons',
      title: 'Custom Press-On Set',
      price: '$10+',
      variants: [
        { label: 'Short', price: '$10' },
        { label: 'X Long', price: '$25' },
      ],
    })

    expect(getCtaLabel(pressOns)).toBe('Book from $10')
  })

  it('falls back to a plain label when a service is a single flat price', () => {
    expect(getCtaLabel(service({}))).toBe('Book This Service')
  })

  it('asks to add on rather than book, for every add-on', () => {
    expect(
      getCtaLabel(
        service({
          id: 'add-on-chrome',
          category: 'add-ons',
          title: 'Chrome Finish',
          price: '$1 / nail',
          variants: [
            { label: 'Per nail', price: '$1' },
            { label: 'All 10 nails', price: '$5' },
          ],
        }),
      ),
    ).toBe('Add To Appointment')
  })
})