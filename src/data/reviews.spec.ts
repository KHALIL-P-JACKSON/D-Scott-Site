// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { REVIEWS } from './reviews'

describe('client reviews', () => {
  it('shows at least three reviews', () => {
    expect(REVIEWS.length).toBeGreaterThanOrEqual(3)
  })

  it('declares unique ids', () => {
    const ids = REVIEWS.map((review) => review.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('rates every review between 1 and 5 stars', () => {
    for (const review of REVIEWS) {
      expect(Number.isInteger(review.rating), review.name).toBe(true)
      expect(review.rating, review.name).toBeGreaterThanOrEqual(1)
      expect(review.rating, review.name).toBeLessThanOrEqual(5)
    }
  })

  it('gives every reviewer a name, initials, and service credit', () => {
    for (const review of REVIEWS) {
      expect(review.name.trim().length, review.id).toBeGreaterThan(0)
      expect(review.initials, review.id).toMatch(/^[A-Z]{1,2}$/)
      expect(review.service.trim().length, review.id).toBeGreaterThan(0)
    }
  })

  it('quotes each reviewer', () => {
    for (const review of REVIEWS) {
      expect(review.text.trim().length, review.name).toBeGreaterThan(40)
    }
  })
})