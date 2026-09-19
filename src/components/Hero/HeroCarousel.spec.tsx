import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '../../test/render'
import { HeroCarousel } from './HeroCarousel'
import { HERO_SLIDES } from '../../data/heroSlides'
import { PREFERS_REDUCED_MOTION, setMediaQueryMatches } from '../../test/matchMedia'
import type { HeroSlide } from '../../types'

const slides: HeroSlide[] = [
  { src: './one.JPEG', alt: 'First example photo of a finished nail set', caption: 'First set' },
  { src: './two.JPEG', alt: 'Second example photo of a finished nail set', caption: 'Second set' },
  { src: './three.JPEG', alt: 'Third example photo of a finished nail set', caption: 'Third set' },
]

const INTERVAL_MS = 1000

function setup(customSlides: HeroSlide[] = slides) {
  const view = render(<HeroCarousel slides={customSlides} intervalMs={INTERVAL_MS} />)

  const images = () => Array.from(view.container.querySelectorAll('img'))
  const activeIndex = () =>
    images().findIndex((image) => image.getAttribute('aria-hidden') === null)
  const figure = () => view.container.querySelector('figure')

  const tick = (count = 1) =>
    act(() => {
      vi.advanceTimersByTime(INTERVAL_MS * count)
    })

  return { ...view, images, activeIndex, figure, tick }
}

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens on the first photo', () => {
    const { activeIndex, images } = setup()

    expect(images()).toHaveLength(slides.length)
    expect(activeIndex()).toBe(0)
    expect(images()[1]).toHaveAttribute('aria-hidden', 'true')
    expect(images()[2]).toHaveAttribute('aria-hidden', 'true')
  })

  it('advances to the next photo on a timer', () => {
    const { activeIndex, tick } = setup()

    tick()
    expect(activeIndex()).toBe(1)

    tick()
    expect(activeIndex()).toBe(2)
  })

  it('wraps back to the first photo after the last one', () => {
    const { activeIndex, tick } = setup()

    tick(slides.length)
    expect(activeIndex()).toBe(0)
  })

  it('keeps the caption in step with the active photo', () => {
    const { tick } = setup()

    expect(screen.getByText('First set')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    tick()

    expect(screen.getByText('Second set')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('pauses while the visitor is looking at it, then resumes', () => {
    const { activeIndex, figure, tick } = setup()

    tick()
    expect(activeIndex()).toBe(1)

    fireEvent.mouseOver(figure() as Element)
    tick(3)
    expect(activeIndex()).toBe(1)

    fireEvent.mouseOut(figure() as Element)
    tick()
    expect(activeIndex()).toBe(2)
  })

  it('steps forward and back with the arrows', () => {
    const { activeIndex } = setup()

    fireEvent.click(screen.getByRole('button', { name: /show next photo/i }))
    expect(activeIndex()).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: /show previous photo/i }))
    expect(activeIndex()).toBe(0)

    // The previous arrow should wrap around from the first photo.
    fireEvent.click(screen.getByRole('button', { name: /show previous photo/i }))
    expect(activeIndex()).toBe(2)
  })

  it('jumps to the photo whose dot is chosen', () => {
    const { activeIndex } = setup()

    fireEvent.click(screen.getByRole('button', { name: /show photo 3 of 3/i }))

    expect(activeIndex()).toBe(2)
  })

  it('does not auto-advance when reduced motion is requested', () => {
    setMediaQueryMatches(PREFERS_REDUCED_MOTION, true)
    const { activeIndex, tick } = setup()

    tick(5)

    expect(activeIndex()).toBe(0)
  })

  it('still responds to the arrows when reduced motion is requested', () => {
    setMediaQueryMatches(PREFERS_REDUCED_MOTION, true)
    const { activeIndex } = setup()

    fireEvent.click(screen.getByRole('button', { name: /show next photo/i }))

    expect(activeIndex()).toBe(1)
  })

  it('renders nothing when there are no photos', () => {
    const { container } = setup([])

    expect(container.querySelector('figure')).not.toBeInTheDocument()
  })

  it('shows the published studio photos by default', () => {
    const { images } = setup(HERO_SLIDES)

    expect(images()).toHaveLength(HERO_SLIDES.length)
    expect(images()[0].getAttribute('src')).toContain('IMG_2100.JPEG')
  })
})