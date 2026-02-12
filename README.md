# @spwig/sdk

Official TypeScript SDK for building headless storefronts with [Spwig](https://spwig.com) eCommerce.

- Zero dependencies — uses native `fetch` (browser, Node 18+, Deno, edge runtimes)
- Auto-generated types from the Spwig OpenAPI schema
- Typed error classes for structured error handling
- Webhook signature verification utility

## Installation

```bash
npm install @spwig/sdk
```

## Quick Start

```typescript
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'https://your-store.com',
  language: 'en',
  currency: 'EUR',
});

// Browse products
const products = await spwig.catalog.products.list({ page: 1 });
console.log(products.results);

// Login
const { user, token } = await spwig.auth.login({
  username: 'customer@example.com',
  password: 'password123',
});
spwig.setToken(token);

// Add to cart
await spwig.cart.add({ product_id: 42, quantity: 1 });

// Get cart
const cart = await spwig.cart.get();
console.log(`${cart.item_count} items — ${cart.currency} ${cart.total}`);
```

## Configuration

```typescript
const spwig = new SpwigClient({
  // Required
  baseUrl: 'https://your-store.com',   // Spwig backend URL (no trailing slash)

  // Optional
  language: 'en',                       // Accept-Language header (default: 'en')
  currency: 'EUR',                      // X-Currency header
  token: 'abc123...',                   // Auth token (can also set later)
  timeout: 15_000,                      // Request timeout in ms (default: 30000)
  fetch: customFetch,                   // Custom fetch implementation
  onUnauthorized: () => {               // Called on 401 responses
    window.location.href = '/login';
  },
});

// Change settings at runtime
spwig.setToken(token);
spwig.setLanguage('fr');
spwig.setCurrency('USD');
```

## API Reference

### Authentication (`spwig.auth`)

```typescript
// Register
const { user, token } = await spwig.auth.register({
  username: 'johndoe',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  password: 'SecurePass123!',
  password_confirm: 'SecurePass123!',
});
spwig.setToken(token);

// Login
const { user, token } = await spwig.auth.login({ username, password });
spwig.setToken(token);

// Logout
await spwig.auth.logout();
spwig.setToken(undefined);

// Password reset
await spwig.auth.requestPasswordReset({ email: 'john@example.com' });
await spwig.auth.confirmPasswordReset(uidb64, resetToken, {
  new_password: 'NewPass456!',
  new_password_confirm: 'NewPass456!',
});

// Social OAuth providers
const providers = await spwig.auth.getSocialProviders();
```

### Catalog (`spwig.catalog`)

```typescript
// Products
const products = await spwig.catalog.products.list({
  page: 1,
  page_size: 20,
  category: 'shoes',
  brand: 'nike',
  search: 'running',
  ordering: '-price',
  min_price: '50',
  max_price: '200',
});
const product = await spwig.catalog.products.get('product-slug');
const stock = await spwig.catalog.products.checkStock(productId);

// Categories
const categories = await spwig.catalog.categories.list();
const category = await spwig.catalog.categories.get('category-slug');

// Brands
const brands = await spwig.catalog.brands.list();

// Collections
const collections = await spwig.catalog.collections.list();

// Reviews
const reviews = await spwig.catalog.reviews.list(productId);
await spwig.catalog.reviews.create(productId, { rating: 5, comment: 'Great!' });

// Recommendations
const recommended = await spwig.catalog.getRecommendations(productId);

// Dynamic filters
const filters = await spwig.catalog.getFilters({ category: 'shoes' });
```

### Cart (`spwig.cart`)

```typescript
const cart = await spwig.cart.get();
await spwig.cart.add({ product_id: 42, variant_id: 5, quantity: 2 });
await spwig.cart.updateItem(itemId, { quantity: 3 });
await spwig.cart.removeItem(itemId);
await spwig.cart.clear();

// Vouchers
await spwig.cart.applyVoucher('SAVE10');
await spwig.cart.removeVoucher('SAVE10');

// Lightweight summary (for header badge)
const summary = await spwig.cart.getSummary();
```

### Checkout (`spwig.checkout`)

Multi-step checkout flow:

```typescript
// 1. Get session
const session = await spwig.checkout.getSession();

// 2. Set shipping address
await spwig.checkout.setShippingAddress({
  name: 'John Doe',
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'US',
});

// 3. Get and select shipping method
const methods = await spwig.checkout.getShippingMethods();
await spwig.checkout.selectShippingMethod(methods[0].id);

// 4. Get and select payment provider
const providers = await spwig.checkout.getPaymentProviders();
await spwig.checkout.selectPaymentMethod(providers[0].slug);

// 5. Validate (optional)
const { is_valid, errors } = await spwig.checkout.validate();

// 6. Complete
const order = await spwig.checkout.complete();
console.log(`Order ${order.order_number} placed!`);
```

### Orders (`spwig.orders`)

```typescript
const orders = await spwig.orders.list({ page: 1, status: 'completed' });
const order = await spwig.orders.get(orderId);

// Returns
await spwig.orders.createReturn(orderId, {
  items: [{ order_item_id: 1, quantity: 1, reason: 'defective' }],
});
```

### Account (`spwig.account`)

```typescript
const profile = await spwig.account.getProfile();
await spwig.account.updateProfile({ first_name: 'Jane', phone: '+1234567890' });

// Addresses
const addresses = await spwig.account.listAddresses();
await spwig.account.createAddress({ name: 'Home', address1: '123 Main St', ... });
await spwig.account.setDefaultAddress(addressId);
await spwig.account.deleteAddress(addressId);
```

### Search (`spwig.search`)

```typescript
const results = await spwig.search.search({ q: 'blue sneakers', page: 1 });
const suggestions = await spwig.search.autocomplete('blue sn');
const trending = await spwig.search.trending();
```

### Store (`spwig.store`)

```typescript
const info = await spwig.store.getInfo();
const currencies = await spwig.store.listActiveCurrencies();
await spwig.store.setCurrency('USD');
const paymentMethods = await spwig.store.getPaymentMethods();
```

### Loyalty (`spwig.loyalty`)

```typescript
const status = await spwig.loyalty.getStatus();
const tiers = await spwig.loyalty.listTiers();
const rewards = await spwig.loyalty.listRewards();
await spwig.loyalty.redeemReward(rewardId, { points: 500 });
```

### Wishlist (`spwig.wishlist`)

```typescript
const items = await spwig.wishlist.list();
await spwig.wishlist.add(productId);
await spwig.wishlist.remove(productId);
```

### Payments (`spwig.payments`)

```typescript
const intent = await spwig.payments.createIntent({ order_id: orderId, provider: 'stripe' });
const saved = await spwig.payments.listMethods();
```

## Error Handling

The SDK provides typed error classes:

```typescript
import {
  SpwigApiError,
  SpwigAuthError,
  SpwigValidationError,
  SpwigTimeoutError,
  SpwigNetworkError,
} from '@spwig/sdk';

try {
  await spwig.auth.login({ username, password });
} catch (err) {
  if (err instanceof SpwigValidationError) {
    // 400 — field-level errors
    console.log(err.fieldErrors);
    // { username: ["This field is required."], password: ["Too short."] }
  } else if (err instanceof SpwigAuthError) {
    // 401 — invalid credentials
  } else if (err instanceof SpwigApiError) {
    // Any other API error (403, 404, 429, 500...)
    console.log(err.status, err.apiMessage);
  } else if (err instanceof SpwigTimeoutError) {
    // Request timed out
  } else if (err instanceof SpwigNetworkError) {
    // No internet connection
  }
}
```

## Webhook Verification

Verify that incoming webhooks are genuinely from your Spwig backend:

```typescript
import { verifyWebhookSignature, WEBHOOK_EVENTS } from '@spwig/sdk/webhooks';

// In your webhook handler (Next.js, Nuxt, SvelteKit, Express, etc.)
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('X-Spwig-Signature')!;

  const valid = await verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET!);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case WEBHOOK_EVENTS.ORDER_CREATED:
      // Handle new order
      break;
    case WEBHOOK_EVENTS.ORDER_PAID:
      // Handle payment confirmation
      break;
  }

  return new Response('OK', { status: 200 });
}
```

## Framework Guides

See the [headless developer guide](../docs/headless/) for complete documentation:

- [Next.js App Router example](../docs/headless/examples/nextjs-example.md)
- [Nuxt 3 example](../docs/headless/examples/nuxt-example.md)
- [SvelteKit example](../docs/headless/examples/sveltekit-example.md)
- [Proxy configuration (NGINX, Caddy, Apache, Traefik)](../docs/headless/10-proxy-configuration.md)

## Regenerating Types

The SDK types are auto-generated from the Spwig OpenAPI schema. To regenerate after API changes:

```bash
cd sdk
npm run generate   # Regenerates src/generated/schema.ts from docs/api/schema.yml
npm run build      # Compile TypeScript
```

## Requirements

- Node.js 18+ (or any runtime with native `fetch` and `crypto.subtle`)
- Spwig backend v2.0+

## License

MIT
