import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HERO_SLIDES } from '../../data/heroSlides'
import type { HeroSlide } from '../../types'
import './HeroCarousel.css'

const AUTOPLAY_MS = 4500

type HeroCarouselProps = {
  slides?: HeroSlide[]
  intervalMs?: number
}

export function HeroCarousel({
  slides = HERO_SLIDES,
  intervalMs = AUTOPLAY_MS,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isTabHidden, setIsTabHidden] = useState(false)
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const slideCount = slides.length
  // Pause the timer while the visitor hovers/focuses the gallery, while the tab
  // is in the background, and entirely when reduced motion is requested.
  const isPaused = isInteracting || isTabHidden || prefersReducedMotion

  const goToNext = useCallback(() => {
    setActiveIndex((previous) => (previous + 1) % Math.max(slideCount, 1))
  }, [slideCount])

  const goToPrevious = useCallback(() => {
    setActiveIndex(
      (previous) => (previous - 1 + Math.max(slideCount, 1)) % Math.max(slideCount, 1),
    )
  }, [slideCount])

  useEffect(() => {
    if (isPaused || slideCount < 2) {
      return undefined
    }

    const timer = window.setInterval(goToNext, intervalMs)
    return () => window.clearInterval(timer)
  }, [goToNext, intervalMs, isPaused, slideCount])

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden)

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  if (slideCount === 0) {
    return null
  }

  const activeSlide = slides[activeIndex]

  return (
    <figure
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Recent nail sets from the studio"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={() => setIsInteracting(false)}
    >
      <div className="hero-carousel-stage">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex

          return (
            <img
              key={slide.src}
              className={`hero-carousel-slide${isActive ? ' is-active' : ''}`}
              src={slide.src}
              alt={slide.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              aria-hidden={isActive ? undefined : true}
            />
          )
        })}
      </div>

      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-prev"
        onClick={goToPrevious}
        aria-label="Show previous photo"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-next"
        onClick={goToNext}
        aria-label="Show next photo"
      >
        <ChevronRight size={18} />
      </button>

      <div className="hero-carousel-controls">
        <div className="hero-carousel-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              className={`hero-carousel-dot${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1} of ${slideCount}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
        <span className="hero-carousel-counter">
          {activeIndex + 1} / {slideCount}
        </span>
      </div>

      <figcaption className="hero-carousel-caption">{activeSlide.caption}</figcaption>

      <span
        className="hero-carousel-progress"
        key={activeIndex}
        style={{
          animationDuration: `${intervalMs}ms`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      />
    </figure>
  )
}