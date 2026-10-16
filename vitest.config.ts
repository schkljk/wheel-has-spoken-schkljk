import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
    // parity suites run thousands of seeded fights
    testTimeout: 120_000,
  },
});
