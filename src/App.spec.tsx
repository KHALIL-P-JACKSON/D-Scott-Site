import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from './test/render'
import App from './App'

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

  it('carries a chosen service straight into the booking form', () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<App />)

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

  it('points every in-page link at a section that exists', () => {
    const { container } = render(<App />)

    const links = Array.from(container.querySelectorAll('a[href^="#"]'))
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