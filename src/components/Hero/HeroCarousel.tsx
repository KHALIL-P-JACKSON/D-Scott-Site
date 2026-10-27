import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { HERO_SLIDES } from '../../data/heroSlides'
import type { HeroSlide } from '../../types'
import './HeroCarousel.css'

const AUTOPLAY_MS = 4500
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type HeroCarouselProps = {
  slides?: HeroSlide[]
  intervalMs?: number
}

export function HeroCarousel({
  slides = HERO_SLIDES,
  intervalMs = AUTOPLAY_MS,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const galleryRef = useRef<HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [playback, setPlayback] = useState<'auto' | 'playing' | 'paused'>('auto')
  const [isOffscreen, setIsOffscreen] = useState(false)
  const [isTabHidden, setIsTabHidden] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
  )

  const slideCount = slides.length
  // An explicit Play request takes effect even while its control has focus.
  // A new hover/focus interaction returns to the normal automatic pause policy.
  const isInteractionPaused = playback !== 'playing' && (isHovered || isFocused)
  const isPaused = playback === 'paused' || isInteractionPaused || isOffscreen || isTabHidden || prefersReducedMotion

  const resumeAutomaticPausing = () => {
    setPlayback((current) => current === 'playing' ? 'auto' : current)
  }

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
  }, [activeIndex, goToNext, intervalMs, isPaused, slideCount])

  useEffect(() => {
    if (!galleryRef.current || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      setIsOffscreen(!entry.isIntersecting)
    }, { threshold: 0.1 })

    observer.observe(galleryRef.current)
    return () => observer.disconnect()
  }, [slideCount])

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden)

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    // The lazy initializer above reads the query value at mount; this listener
    // keeps the state in sync when the preference changes at runtime.
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (slideCount === 0) {
    return null
  }

  const activeSlide = slides[activeIndex]

  return (
    <figure
      ref={galleryRef}
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Recent nail sets from the studio"
      onMouseEnter={() => {
        setIsHovered(true)
        resumeAutomaticPausing()
      }}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => {
        setIsFocused(true)
        resumeAutomaticPausing()
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false)
      }}
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
        {!prefersReducedMotion && slideCount > 1 && (
          <button
            type="button"
            className="hero-carousel-playback"
            onClick={() => setPlayback((current) => current === 'paused' ? 'playing' : 'paused')}
            aria-label={playback === 'paused' ? 'Play slideshow' : 'Pause slideshow'}
          >
            {playback === 'paused' ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}
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

      <figcaption key={activeSlide.src} className="hero-carousel-caption">{activeSlide.caption}</figcaption>

      <span
        className="hero-carousel-progress"
        key={`${activeIndex}-${isPaused}`}
        style={{
          animationDuration: `${intervalMs}ms`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      />
    </figure>
  )
}
