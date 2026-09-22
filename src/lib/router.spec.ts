// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ACCOUNT_ROUTE, parseRoute, sectionIdFromHash } from './router'

describe('parseRoute', () => {
  it('opens the account page for the account route', () => {
    expect(parseRoute(ACCOUNT_ROUTE)).toBe('account')
  })

  it('accepts a trailing slash and any casing', () => {
    expect(parseRoute('#/Account/')).toBe('account')
  })

  it('keeps everything else on the home page', () => {
    for (const hash of ['', '#', '#services', '#booking', '#/nope']) {
      expect(parseRoute(hash)).toBe('home')
    }
  })
})

describe('sectionIdFromHash', () => {
  it('reads the target of an in-page anchor', () => {
    expect(sectionIdFromHash('#hours')).toBe('hours')
    expect(sectionIdFromHash('#why-us')).toBe('why-us')
  })

  it('ignores routes and anything that is not an element id', () => {
    for (const hash of [ACCOUNT_ROUTE, '', '#', '#2col', '#a b']) {
      expect(sectionIdFromHash(hash)).toBeNull()
    }
  })
})
