import type { ReactElement } from 'react'
import { render as renderWithTestingLibrary, type RenderResult } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'

// Mirrors the provider set-up in `main.tsx` so tests render the app as users see it.
export function render(ui: ReactElement): RenderResult {
  return renderWithTestingLibrary(
    <Theme accentColor="ruby" grayColor="sand" radius="large" scaling="100%">
      {ui}
    </Theme>,
  )
}

export { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'