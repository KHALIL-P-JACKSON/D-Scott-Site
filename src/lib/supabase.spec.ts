// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientSpy } = vi.hoisted(() => ({ createClientSpy: vi.fn() }))

// The SDK is mocked so this spec proves the wiring — which project the app
// connects to — instead of re-testing Supabase, and it never opens a socket.
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientSpy }))

describe('the Supabase client', () => {
  beforeEach(() => {
    // Reset by hand: the suite's `restoreMocks` covers spies, not a module mock
    // that is hoisted above its hooks.
    createClientSpy.mockReset()

    // Each spec re-imports the module, so the client is built from the
    // environment that spec just stubbed.
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('connects to the project named by the VITE_ environment variables', async () => {
    const client = { from: vi.fn() }
    createClientSpy.mockReturnValue(client)

    const { supabase } = await import('./supabase')

    expect(createClientSpy).toHaveBeenCalledTimes(1)
    expect(createClientSpy).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_example',
    )
    expect(supabase).toBe(client)
  })

  it('reads the project from the environment instead of hardcoding it', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://other-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_other')
    createClientSpy.mockReturnValue({ from: vi.fn() })

    await import('./supabase')

    expect(createClientSpy).toHaveBeenCalledTimes(1)
    expect(createClientSpy).toHaveBeenCalledWith(
      'https://other-project.supabase.co',
      'sb_publishable_other',
    )
  })
})
