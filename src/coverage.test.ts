import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain ESM helpers, no type declarations needed for a test.
import { computeCoverage } from '../scripts/coverage.mjs';
// @ts-expect-error — see above.
import { UNWRAPPED, SCHEMA_MISSING } from '../scripts/coverage-allowlist.mjs';

/**
 * Endpoint coverage gate.
 *
 * This does not test that endpoints *work* (that's the mocked unit tests and
 * the live integration smoke). It guarantees there are no *silent* coverage
 * gaps: every contract path is either wrapped by a module or explicitly listed
 * in coverage-allowlist.mjs, and every path the SDK calls exists in the
 * contract or is a documented backend-schema gap.
 *
 * A failure here means someone added/renamed an endpoint without wrapping it
 * (or without recording the decision not to). Fix by wrapping it, or by adding
 * it to the right section of coverage-allowlist.mjs with a reason.
 */
describe('endpoint coverage', () => {
  const { missing, extra, schema, sdk } = computeCoverage() as {
    missing: string[];
    extra: string[];
    schema: Set<string>;
    sdk: Set<string>;
  };

  it('parses a plausible contract and SDK surface', () => {
    // Guards against the audit silently matching nothing (e.g. schema.ts moved
    // or the path regex broke) and reporting a false all-clear.
    expect(schema.size).toBeGreaterThan(500);
    expect(sdk.size).toBeGreaterThan(300);
  });

  it('has no UNlisted contract endpoints without a wrapper', () => {
    const unexpected = missing.filter((p) => !UNWRAPPED.has(p));
    expect(unexpected, `New contract endpoints with no SDK wrapper and not in coverage-allowlist.mjs:\n${unexpected.join('\n')}`).toEqual([]);
  });

  it('has no UNlisted SDK calls to endpoints outside the contract', () => {
    const unexpected = extra.filter((p) => !SCHEMA_MISSING.has(p));
    expect(unexpected, `SDK calls a path not in the contract and not in coverage-allowlist.mjs (typo, stale route, or new backend-schema gap):\n${unexpected.join('\n')}`).toEqual([]);
  });

  it('has no STALE allowlist entries (gaps since closed)', () => {
    // Not a hard failure elsewhere, but keeps the debt registry honest: if you
    // wrapped an endpoint, its allowlist line should be removed.
    const staleUnwrapped = [...UNWRAPPED].filter((p) => !missing.includes(p as string));
    const staleSchemaMissing = [...SCHEMA_MISSING].filter((p) => !extra.includes(p as string));
    expect(staleUnwrapped, `Remove these now-wrapped paths from UNWRAPPED in coverage-allowlist.mjs:\n${staleUnwrapped.join('\n')}`).toEqual([]);
    expect(staleSchemaMissing, `Remove these now-in-contract paths from SCHEMA_MISSING in coverage-allowlist.mjs:\n${staleSchemaMissing.join('\n')}`).toEqual([]);
  });
});
