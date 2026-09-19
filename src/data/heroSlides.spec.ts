// @vitest-environment node
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HERO_SLIDES } from './heroSlides'

// Vitest runs with the project root as the working directory. `import.meta.url`
// is not a file: URL under the jsdom environment, so it cannot be used here.
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')

/** Slides live in `public/`, so a typo here is a silently broken hero image. */
const resolveFromPublic = (src: string) => path.join(PUBLIC_DIR, src.replace(/^\.\//, ''))

describe('hero slides', () => {
  it('has at least one slide to show', () => {
    expect(HERO_SLIDES.length).toBeGreaterThan(0)
  })

  it('references each photo relative to the document URL', () => {
    for (const slide of HERO_SLIDES) {
      expect(slide.src, slide.src).toMatch(/^\.\/[^/]+\.(jpe?g|png|webp|avif)$/i)
    }
  })

  it('points at photos that actually exist in public/', () => {
    for (const slide of HERO_SLIDES) {
      expect(existsSync(resolveFromPublic(slide.src)), `missing file for "${slide.src}"`).toBe(true)
    }
  })

  it('keeps every hero photo under a 1.5 MB budget', () => {
    const budget = 1_500_000
    for (const slide of HERO_SLIDES) {
      const { size } = statSync(resolveFromPublic(slide.src))
      expect(size, `${slide.src} is ${size} bytes`).toBeLessThan(budget)
    }
  })

  it('uses each photo only once', () => {
    const sources = HERO_SLIDES.map((slide) => slide.src)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('describes every photo for screen readers', () => {
    for (const slide of HERO_SLIDES) {
      expect(slide.alt.trim().length, `alt for ${slide.src}`).toBeGreaterThan(20)
      expect(slide.caption.trim().length, `caption for ${slide.src}`).toBeGreaterThan(0)
    }
  })

  it('uses unique captions so the carousel never looks stuck', () => {
    const captions = HERO_SLIDES.map((slide) => slide.caption)
    expect(new Set(captions).size).toBe(captions.length)
  })
})