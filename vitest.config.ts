import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tools/parity/global-setup.ts'],
    // parity suites run thousands of seeded fights
    testTimeout: 120_000,
  },
});
