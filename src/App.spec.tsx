import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from './test/render'
import type { AccountSnapshot } from './types'
import { loadAccount } from './lib/account'
import App from './App'

/**
 * `App` mounts the booking form, which waits on the account check. Sign these
 * page specs in as a verified client so they exercise the form, not the gate —
 * the gate itself is covered in `Booking.spec.tsx`.
 */
vi.mock('./lib/account', async () => {
  const actual = await vi.importActual<typeof import('./lib/account')>('./lib/account')

  return { ...actual, loadAccount: vi.fn() }
})

vi.mock('./lib/bookings', async () => {
  const actual = await vi.importActual<typeof import('./lib/bookings')>('./lib/bookings')

  return { ...actual, createBookingRequest: vi.fn() }
})

const verifiedAccount: AccountSnapshot = {
  userId: 'u-1',
  email: 'ashley@example.com',
  profile: {
    id: 'u-1',
    full_name: 'Ashley Davis',
    phone: '(555) 111-2222',
    is_admin: false,
    id_status: 'approved',
    id_path: 'u-1/id.png',
    id_uploaded_at: null,
    id_review_notes: null,
  },
}

beforeEach(() => {
  vi.mocked(loadAccount).mockReset()
  vi.mocked(loadAccount).mockResolvedValue({ status: 'ok', account: verifiedAccount })
})

describe('the page as a whole', () => {
  it('renders every section a visitor is promised', () => {
    render(<App />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Acrylics, Gel/i)
    expect(
      screen.getByRole('heading', { name: /acrylic, gel & nail artistry/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /visit d'luxe beauty studio/i })).toBeInTheDocument()
    expect(screen.getByText(/GLOW15/)).toBeInTheDocument()
  })

  it('carries a chosen service straight into the booking form', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)
    await screen.findByLabelText(/full name/i)

    fireEvent.click(screen.getByRole('button', { name: /book from \$25/i }))

    expect(scrollIntoView).toHaveBeenCalled()
    expect(screen.getByRole('combobox', { name: /select service/i })).toHaveTextContent(
      'Acrylic Full Set — Short (0–2)',
    )

    // Handing the choice to the booking form must not upset React.
    const warnings = errorSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((message) =>
        /controlled|validateDOMNesting|cannot contain a nested|unique "key"/i.test(message),
      )

    expect(warnings).toEqual([])
  })

  it('points every in-page link at a section that exists', async () => {
    const { container } = render(<App />)
    await screen.findByLabelText(/full name/i)

    // `#/account` is the account route, not an in-page anchor, so it is checked
    // separately from the `#services`-style links.
    const links = Array.from(container.querySelectorAll('a[href^="#"]')).filter(
      (link) => !(link.getAttribute('href') ?? '').startsWith('#/'),
    )
    expect(links.length).toBeGreaterThan(0)

    const hrefs = links.map((link) => link.getAttribute('href') ?? '')

    // Deliberate placeholders, not dead links: the brand link and the two
    // footer legal links. Update this count when a real page replaces them.
    expect(hrefs.filter((href) => href === '#')).toHaveLength(3)

    for (const href of hrefs) {
      if (href === '#') continue
      expect(container.querySelector(href), `dead in-page link: ${href}`).toBeTruthy()
    }
  })
})