#!/usr/bin/env node
/**
 * Endpoint coverage audit for @spwig/sdk.
 *
 * Answers "does the SDK wrap every endpoint in the API contract, and does it
 * only call endpoints that exist?" — statically, with no running server.
 *
 * Source of truth for the contract is the COMMITTED generated types
 * (`src/generated/schema.ts`), which openapi-typescript writes with one key
 * per path. That file is regenerated from `api-schema.yml` via
 * `npm run generate`, so the audit always reflects the same contract the types
 * were built from — no sibling backend checkout required, which is what makes
 * this runnable in CI.
 *
 * Two directions:
 *   - `missing`: a path is in the contract but no SDK module calls it.
 *   - `extra`:   an SDK module calls a path the contract doesn't define
 *                (a backend `drf-spectacular` gap, or a stale/typo'd path).
 *
 * Known, reviewed gaps live in `coverage-allowlist.mjs`. The audit is GREEN
 * when every gap is accounted for there; a NEW gap (e.g. a freshly added
 * endpoint nobody wrapped) turns it RED. That is the point: no silent drift.
 *
 * Run directly for a full report:  node scripts/coverage.mjs
 * Consumed by the gate test:       src/coverage.test.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const SCHEMA_FILE = join(ROOT, 'src/generated/schema.ts');
const MODULE_DIR = join(ROOT, 'src/modules');

/** Collapse both `{schema_param}` and `${templateLiteral}` to a single `{}` so
 *  the two path vocabularies compare, and normalise the trailing slash. */
export function normalizePath(p) {
  return p
    .replace(/\$\{[^}]*\}/g, '{}')
    .replace(/\{[^}]*\}/g, '{}')
    .replace(/\/+$/, '') + '/';
}

/** Every path key in the committed generated schema. */
export function schemaPaths(file = SCHEMA_FILE) {
  const text = readFileSync(file, 'utf8');
  const out = new Set();
  // openapi-typescript indents top-level path keys with exactly 4 spaces.
  const re = /^ {4}"(\/api\/[^"]*)":\s*\{/gm;
  let m;
  while ((m = re.exec(text))) out.add(normalizePath(m[1]));
  return out;
}

/** Strip block and line comments so a path merely *mentioned* in a doc comment
 *  (e.g. "⚠️ Uncontracted: `/api/address/*`") is not mistaken for a call the
 *  SDK actually makes. Safe here because real call-paths are `/api/...` string
 *  literals, none of which contain `//`. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Every `/api/...` literal referenced in actual code (comments excluded). */
export function sdkPaths(dir = MODULE_DIR) {
  const out = new Set();
  for (const f of walk(dir)) {
    const text = stripComments(readFileSync(f, 'utf8'));
    const re = /['`](\/api\/[^'`]*)['`]/g;
    let m;
    while ((m = re.exec(text))) out.add(normalizePath(m[1]));
  }
  return out;
}

function walk(dir) {
  let files = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) files = files.concat(walk(p));
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts')) files.push(p);
  }
  return files;
}

/** Compute the raw coverage diff (before allowlisting). */
export function computeCoverage() {
  const schema = schemaPaths();
  const sdk = sdkPaths();
  const missing = [...schema].filter((p) => !sdk.has(p)).sort();
  const extra = [...sdk].filter((p) => !schema.has(p)).sort();
  return { schema, sdk, missing, extra };
}

// --- CLI ------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { schema, sdk, missing, extra } = computeCoverage();
  console.log(`contract paths:        ${schema.size}`);
  console.log(`sdk-referenced paths:  ${sdk.size}`);
  console.log(`\n=== IN CONTRACT, NOT WRAPPED (${missing.length}) ===`);
  for (const p of missing) console.log('  ' + p);
  console.log(`\n=== CALLED BY SDK, NOT IN CONTRACT (${extra.length}) ===`);
  for (const p of extra) console.log('  ' + p);
}
