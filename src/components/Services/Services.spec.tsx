import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, userEvent, within } from '../../test/render'
import { Services } from './Services'
import { SERVICES, SERVICE_CATEGORIES } from '../../data/services'

function setup() {
  const onSelectService = vi.fn()
  render(<Services onSelectService={onSelectService} />)
  return { onSelectService }
}

const serviceCards = () => screen.getAllByRole('heading', { level: 3 })

/**
 * Radix renders every tab label twice (a visible span and a mirrored hidden
 * one), so the accessible name is repeated and must be matched loosely.
 */
const getTab = (label: string) => screen.getByRole('tab', { name: new RegExp(label, 'i') })

/** Radix `Card` is the container each service is rendered inside. */
function cardFor(title: string) {
  const heading = screen.getByRole('heading', { name: title })
  const card = heading.closest('.rt-Card')

  if (!card) {
    throw new Error(`No service card found for "${title}"`)
  }

  return within(card as HTMLElement)
}

/** The published price list, transcribed independently of `src/data/services.ts`. */
const ACRYLIC_PRICES: Array<[string, string]> = [
  ['Short (0–2)', '$25'],
  ['Medium (3–4)', '$35'],
  ['Medium Long (5–7)', '$40'],
  ['Long (8–9)', '$45'],
  ['X Long (10–11)', '$50'],
  ['XX Long (12–14)', '$60'],
]

const FILL_PRICES: Array<[string, string]> = [
  ['Short Fill (0–2)', '$20'],
  ['Medium Fill (3–4)', '$30'],
  ['Medium Long Fill (5–7)', '$35'],
  ['Long Fill (8–9)', '$40'],
  ['X Long Fill (10–11)', '$45'],
  ['XX Long Fill (12–14)', '$55'],
]

const PRESS_ON_PRICES: Array<[string, string]> = [
  ['Short', '$10'],
  ['Medium', '$15'],
  ['Long', '$20'],
  ['X Long', '$25'],
]

describe('Services', () => {
  it('offers a tab for every category plus an overview', () => {
    setup()

    expect(screen.getAllByRole('tab')).toHaveLength(SERVICE_CATEGORIES.length + 1)
    expect(getTab('All Services')).toBeInTheDocument()

    for (const category of SERVICE_CATEGORIES) {
      expect(getTab(category.label)).toBeInTheDocument()
    }
  })

  it('lists every service in the menu on first load', () => {
    setup()

    expect(serviceCards()).toHaveLength(SERVICES.length)
    expect(screen.getByRole('heading', { name: 'Acrylic Full Set' })).toBeInTheDocument()
  })

  it('publishes the length-based acrylic set prices', () => {
    setup()
    const acrylic = cardFor('Acrylic Full Set')

    for (const [label, price] of ACRYLIC_PRICES) {
      expect(acrylic.getByText(label)).toBeInTheDocument()
      expect(acrylic.getByText(price)).toBeInTheDocument()
    }
  })

  it('publishes the fill in prices', () => {
    setup()
    const fillIns = cardFor('Acrylic Fill In')

    for (const [label, price] of FILL_PRICES) {
      expect(fillIns.getByText(label)).toBeInTheDocument()
      expect(fillIns.getByText(price)).toBeInTheDocument()
    }
  })

  it('publishes the press-on prices', () => {
    setup()
    const pressOns = cardFor('Custom Press-On Set')

    for (const [label, price] of PRESS_ON_PRICES) {
      expect(pressOns.getByText(label)).toBeInTheDocument()
      expect(pressOns.getByText(price)).toBeInTheDocument()
    }
  })

  it('publishes a single flat price for a gel manicure', () => {
    setup()
    const gel = cardFor('Gel Manicure')

    expect(gel.getByText('$25')).toBeInTheDocument()
    // A flat-priced service offers no length or per-nail options.
    expect(gel.queryByText('Short (0–2)')).not.toBeInTheDocument()
    expect(gel.queryByText('Per nail')).not.toBeInTheDocument()
  })

  it('prices every add-on per nail or for all ten', () => {
    setup()

    for (const title of ['Simple Nail Art', 'French Tip', 'Chrome Finish', 'Nail Charms']) {
      const addOn = cardFor(title)
      expect(addOn.getByText('Per nail')).toBeInTheDocument()
      expect(addOn.getByText('$1')).toBeInTheDocument()
      expect(addOn.getByText('All 10 nails')).toBeInTheDocument()
      expect(addOn.getByText('$5')).toBeInTheDocument()
    }
  })

  it('filters the menu down to a single category', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(getTab('Fill Ins'))

    expect(serviceCards()).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Acrylic Fill In' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Acrylic Full Set' })).not.toBeInTheDocument()
  })

  it('books the entry length when an acrylic set is chosen', () => {
    const { onSelectService } = setup()

    fireEvent.click(screen.getByRole('button', { name: /book from \$25/i }))

    expect(onSelectService).toHaveBeenCalledWith('Acrylic Full Set — Short (0–2)')
  })

  it('books a flat-priced service without a length', () => {
    const { onSelectService } = setup()

    fireEvent.click(screen.getByRole('button', { name: /book this service/i }))

    expect(onSelectService).toHaveBeenCalledWith('Gel Manicure')
  })

  it('adds every add-on to an appointment instead of booking it', () => {
    const { onSelectService } = setup()

    const addOnButtons = screen.getAllByRole('button', { name: /add to appointment/i })
    expect(addOnButtons).toHaveLength(4)

    fireEvent.click(addOnButtons[0])

    expect(onSelectService).toHaveBeenCalledWith('Simple Nail Art — Per nail')
  })
})