import { defineConfig } from 'vitest/config';

/**
 * Integration (live-server) config. Kept separate from the default vitest
 * config so `npm test` never touches the network: the unit config only globs
 * src/**, this one only globs tests/integration/**.
 *
 * These tests self-skip unless SPWIG_TEST_URL is set, so running them without a
 * server is a no-op rather than a failure.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    // A real server round-trip is slower than a mocked call.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
