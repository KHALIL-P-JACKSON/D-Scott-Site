import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { installMatchMedia, resetMediaQueries } from './matchMedia'

// jsdom ships no ResizeObserver, but Radix UI's floating elements need one.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

// The rest of the shims are DOM-only, so pure data specs can run under the
// lighter `node` environment without pulling in a document.
const hasDom = typeof document !== 'undefined'

if (hasDom) {
  installMatchMedia()

  // jsdom ships no scrollIntoView, and `App` calls it when a service is selected.
  Element.prototype.scrollIntoView = () => {}

  // jsdom ships no pointer capture, and Radix `Select` calls it when opening.
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}

afterEach(async () => {
  if (hasDom) {
    const { cleanup } = await import('@testing-library/react')
    cleanup()
  }
  resetMediaQueries()
})