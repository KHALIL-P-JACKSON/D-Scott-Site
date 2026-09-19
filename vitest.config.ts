import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Tests reuse the app's Vite pipeline, so anything the build resolves (the React
// plugin, asset handling) resolves the same way under test.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.spec.{ts,tsx}'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // Only the content and pure-logic layers carry thresholds. Presentational
        // components are covered behaviorally instead of by line count.
        include: ['src/data/**/*.ts', 'src/lib/**/*.ts'],
        exclude: ['src/**/*.spec.{ts,tsx}'],
        thresholds: {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
      },
    },
  }),
)
