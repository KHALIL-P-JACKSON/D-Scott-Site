/**
 * jsdom does not implement `matchMedia`, which `HeroCarousel` calls to honour
 * `prefers-reduced-motion`. Tests can control any query with
 * `setMediaQueryMatches()` before rendering.
 */
const mediaQueryMatches = new Map<string, boolean>()

export function setMediaQueryMatches(query: string, matches: boolean): void {
  mediaQueryMatches.set(query, matches)
}

export function resetMediaQueries(): void {
  mediaQueryMatches.clear()
}

export function installMatchMedia(): void {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: mediaQueryMatches.get(query) ?? false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })
}

export const PREFERS_REDUCED_MOTION = '(prefers-reduced-motion: reduce)'