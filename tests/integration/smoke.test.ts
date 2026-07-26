import { describe, it, expect, beforeAll } from 'vitest';
import { SpwigClient } from '../../src/index.js';

/**
 * Live-server smoke suite. The unit tests and coverage gate prove the SDK
 * *builds the right requests*; this proves those endpoints *actually respond*
 * on a running Spwig — routing, auth, and serializers included. It exercises
 * the critical spine, not all 649 paths.
 *
 * Runs only when pointed at an instance:
 *   SPWIG_TEST_URL=https://your-dev-store.example \
 *   SPWIG_TEST_TOKEN=<merchant api token> \        # optional, unlocks admin
 *   npm run test:integration
 *
 * With no SPWIG_TEST_URL the whole suite self-skips (green no-op), so it is
 * safe to leave in CI until credentials are wired in.
 */
const BASE_URL = process.env.SPWIG_TEST_URL;
const TOKEN = process.env.SPWIG_TEST_TOKEN; // merchant API token, for /api/admin/*
const hasServer = Boolean(BASE_URL);
const hasAdmin = Boolean(BASE_URL && TOKEN);

if (!hasServer) {
  // eslint-disable-next-line no-console
  console.warn('[integration] SPWIG_TEST_URL not set — skipping live smoke suite.');
}

let client: SpwigClient;

beforeAll(() => {
  if (!hasServer) return;
  client = new SpwigClient({ baseUrl: BASE_URL!.replace(/\/+$/, ''), token: TOKEN });
});

describe.skipIf(!hasServer)('storefront smoke', () => {
  it('health endpoint responds', async () => {
    const health = await client.health.check();
    expect(health).toBeTruthy();
  });

  it('store exposes a currency', async () => {
    const currency = await client.store.getCurrency();
    expect(currency).toBeTruthy();
  });

  it('product list returns a paginated shape', async () => {
    const page = await client.catalog.products.list({ page_size: 5 } as Record<string, unknown>);
    expect(page).toHaveProperty('results');
    expect(Array.isArray(page.results)).toBe(true);
  });

  it('a listed product can be fetched by slug', async () => {
    const page = await client.catalog.products.list({ page_size: 1 } as Record<string, unknown>);
    if (!page.results.length) {
      console.warn('[integration] no products in catalogue — skipping product-detail check.');
      return;
    }
    const slug = (page.results[0] as { slug: string }).slug;
    const product = await client.catalog.products.get(slug);
    expect(product).toMatchObject({ slug });
  });

  it('cart is retrievable', async () => {
    const cart = await client.cart.get();
    expect(cart).toHaveProperty('items');
  });

  it('checkout session and tender state are retrievable', async () => {
    await client.checkout.getSession();
    const tenders = await client.checkout.listTenders();
    // amount_due is the contract's canonical "what to charge" field.
    expect(tenders).toHaveProperty('amount_due');
  });
});

describe.skipIf(!hasAdmin)('admin smoke (requires SPWIG_TEST_TOKEN)', () => {
  it('traffic analytics responds and is unwrapped from its envelope', async () => {
    const traffic = await client.admin.analytics.getTraffic({ period: '7_days' });
    // getTraffic() must return the inner payload, not { success, data }.
    expect(traffic).toHaveProperty('overview');
    expect(traffic).not.toHaveProperty('data');
  });
});
