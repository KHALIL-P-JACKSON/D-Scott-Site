/**
 * The site is one static page on GitHub Pages, so routes live in the URL hash:
 * `#/account` opens the account page, and every plain `#services`-style hash
 * stays an in-page anchor on the home page.
 */
export type Route = 'home' | 'account'

export const ACCOUNT_ROUTE = '#/account'

/** The route a hash points at. Anything that is not the account path is home. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '').toLowerCase()
  return path === '/account' ? 'account' : 'home'
}

/** The element id an in-page anchor points at, or null for a route like `#/account`. */
export function sectionIdFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, '')
  return /^[A-Za-z][\w-]*$/.test(id) ? id : null
}
