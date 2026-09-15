import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'packages/*/tests/**/*.spec.ts',
      'tests/security/**/*.spec.ts',
    ],
    pool: 'forks',
    server: {
      deps: {
        inline: [
          '@deepseek-ai/dsh-client-ui-slots',
        ],
      },
    },
    testTimeout: 10_000,
    hookTimeout: 10_000,
    restoreMocks: true,
    clearMocks: true,
  },
})
