# Getting Started

Build a custom storefront powered by the Spwig REST API. By the end of this guide you will have the SDK installed, a working connection to your Spwig backend, and your first products displayed in the console.

**What you will build:** A small script that connects to Spwig, fetches the store name, lists products with prices, and authenticates a customer -- all in under 30 lines of code.

## Prerequisites

- **Node.js 18+** (required for native `fetch` support and top-level `await`)
- **A running Spwig backend** (default: `http://localhost:8000`)
- **npm**, **pnpm**, or **yarn** for package management

Verify your Node version before continuing:

```bash
node --version   # must be v18.0.0 or higher
```

## 1. Install the SDK

```bash
npm install @spwig/sdk
```

The SDK is a lightweight TypeScript client that wraps the Spwig REST API. It handles authentication headers, response envelope unwrapping, timeout management, and provides full type definitions for every endpoint.

## 2. Configure the Spwig Backend

Before your frontend can talk to the API, the Spwig backend needs to allow cross-origin requests. Set these environment variables (or add them to your Spwig `.env` file):

```bash
# Your frontend's origin (where Next.js / Nuxt / SvelteKit runs)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-store.com

# Allow the frontend origin to pass CSRF tokens
SPWIG_CSRF_TRUSTED_ORIGINS=http://localhost:3000,https://your-store.com

# Include the frontend's hostname in Django's allowed hosts
SPWIG_ALLOWED_HOSTS=localhost,127.0.0.1,your-store.com,your-spwig-backend.com
```

Then restart the Spwig backend so the new settings take effect.

If you are running both the Spwig backend and your frontend on the same machine during development, a typical setup is:

| Service              | URL                      |
| -------------------- | ------------------------ |
| Spwig backend        | `http://localhost:8000`  |
| Frontend dev server  | `http://localhost:3000`  |

## 3. Initialize the Client

```typescript
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'http://localhost:8000',
  language: 'en',
  currency: 'EUR',
});
```

### Configuration Options

| Option            | Type       | Default            | Description                                                   |
| ----------------- | ---------- | ------------------ | ------------------------------------------------------------- |
| `baseUrl`         | `string`   | *(required)*       | Root URL of your Spwig backend (no trailing slash)            |
| `language`        | `string`   | `'en'`             | ISO language code sent as `Accept-Language` header            |
| `currency`        | `string`   | `undefined`        | ISO currency code sent as `X-Currency` header                 |
| `token`           | `string`   | `undefined`        | Auth token to include immediately (can be set later)          |
| `timeout`         | `number`   | `30000`            | Request timeout in milliseconds                               |
| `fetch`           | `function` | `globalThis.fetch` | Custom fetch implementation (useful for SSR or testing)       |
| `onUnauthorized`  | `function` | `undefined`        | Callback fired on 401 responses (e.g. redirect to login page) |

## 4. Verify the Connection

Create a file called `test-connection.mjs` and run it to confirm everything works:

```javascript
// test-connection.mjs  (ESM, top-level await)
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'http://localhost:8000',
  language: 'en',
});

const store = await spwig.store.getInfo();
console.log(`Connected to "${store.name}"`);
console.log(`Currency: ${store.currency.code} (${store.currency.symbol})`);
console.log(`Contact:  ${store.contact.email}`);
```

```bash
node test-connection.mjs
# Connected to "My Awesome Store"
# Currency: EUR (€)
# Contact:  hello@example.com
```

If this works, your backend, CORS, and SDK are all configured correctly.

## 5. Fetch Store Info

The SDK automatically unwraps the API response envelope (`{ success, data, message }`), so you access fields directly on the returned object:

```typescript
const store = await spwig.store.getInfo();

console.log(store.name);              // "My Awesome Store"
console.log(store.currency.code);     // "EUR"
console.log(store.contact.email);     // "hello@example.com"
console.log(store.social.instagram);  // "https://instagram.com/mystore"
console.log(store.payment_methods);   // ["stripe", "paypal"]
```

This calls `GET /api/store/` and returns the store's name, description, logo, contact info, social links, currency settings, and payment methods in a single request.

## 6. Login and Set the Token

```typescript
const { user, token } = await spwig.auth.login({
  username: 'customer@example.com',
  password: 's3cureP@ss',
});

// Store the token so all future requests are authenticated
spwig.setToken(token);

console.log(user.email);      // "customer@example.com"
console.log(user.full_name);  // "Jane Doe"
```

After calling `setToken()`, the SDK automatically includes `Authorization: Token <value>` on all subsequent requests. You can also restore a previously saved token (e.g. from localStorage) without logging in again:

```typescript
spwig.setToken('abc123def456');
```

## 7. Fetch Products

```typescript
const products = await spwig.catalog.products.list({
  page: 1,
  page_size: 12,
  ordering: '-created_at',
});

console.log(`${products.count} products available`);

for (const product of products.results) {
  console.log(`${product.name} -- ${product.currency} ${product.price}`);
}
```

This calls `GET /api/catalog/products/?page=1&page_size=12&ordering=-created_at` and returns a paginated response with the shape:

```typescript
{
  count: number;       // total products matching the query
  next: string | null; // URL for the next page, or null
  previous: string | null;
  results: Product[];  // array of products for this page
}
```

Each `Product` includes `name`, `slug`, `price`, `currency`, `compare_at_price`, `images`, `category`, `brand`, `is_available`, `stock_status`, `variants`, and more.

## Full Working Example

Save this as `demo.mjs` and run with `node demo.mjs`:

```javascript
// demo.mjs  (ESM, top-level await, Node 18+)
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'http://localhost:8000',
  language: 'en',
  currency: 'EUR',
});

// 1. Store info
const store = await spwig.store.getInfo();
console.log(`Welcome to ${store.name}\n`);

// 2. Browse products
const products = await spwig.catalog.products.list({ page: 1, page_size: 5 });
console.log(`${products.count} products available:`);
for (const p of products.results) {
  const sale = p.compare_at_price ? ` (was ${p.compare_at_price})` : '';
  console.log(`  ${p.name} -- ${p.currency} ${p.price}${sale}`);
}

// 3. Add first product to cart
const cart = await spwig.cart.add({ product_id: products.results[0].id, quantity: 1 });
console.log(`\nCart: ${cart.item_count} item(s), total: ${cart.currency} ${cart.total}`);
```

## Using Plain fetch Instead of the SDK

Every endpoint is a standard REST call. The Spwig API wraps responses in an envelope:

```json
{ "success": true, "data": { ... }, "message": "" }
```

The SDK unwraps this automatically, but if you use plain `fetch` you need to extract `.data` yourself:

```typescript
// Fetch products without the SDK
const res = await fetch('http://localhost:8000/api/catalog/products/?page=1', {
  headers: {
    'Accept': 'application/json',
    'Accept-Language': 'en',
  },
});
const json = await res.json();
const products = json.data;  // unwrap the envelope
console.log(products.results);
```

For authenticated requests, add the `Authorization` header:

```typescript
const res = await fetch('http://localhost:8000/api/accounts/profile/', {
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Token abc123def456',
  },
});
```

## API Documentation

Your Spwig backend ships with interactive API docs. While the backend is running, open these in your browser:

| Tool    | URL                                   | Description                          |
| ------- | ------------------------------------- | ------------------------------------ |
| OpenAPI | `http://localhost:8000/admin/api/docs/`    | Browsable API documentation          |
| Swagger | `http://localhost:8000/admin/api/swagger/` | Swagger UI with "Try it out" support |

These are useful for exploring endpoints, seeing request/response schemas, and testing calls interactively.

## SDK Modules Reference

The `SpwigClient` exposes these modules:

| Module                    | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `spwig.auth`              | Login, register, logout, password reset, OAuth, SMS verification, guest conversion |
| `spwig.catalog`           | Products, categories, brands, collections, reviews, bookings, licenses   |
| `spwig.cart`              | Cart items, vouchers, summary                                            |
| `spwig.checkout`          | Addresses, shipping, payment, order completion                           |
| `spwig.orders`            | Order history, details, tracking, returns                                |
| `spwig.account`           | Customer profile, addresses, communication preferences, GDPR export      |
| `spwig.search`            | Autocomplete, search results, trending, engines, settings                |
| `spwig.store`             | Store info, currencies, payment methods, shipping                        |
| `spwig.loyalty`           | Tiers, rewards, redemptions, progress                                    |
| `spwig.wishlist`          | Wishlist management                                                      |
| `spwig.payments`          | Payment intents, saved payment methods                                   |
| `spwig.blog`              | Posts, categories, tags, subscriptions, settings                         |
| `spwig.announcements`     | Active store announcements                                               |
| `spwig.pages`             | Legal pages, page by type or slug                                        |
| `spwig.forms`             | Form retrieval, submission, partial save, file upload                    |
| `spwig.social`            | Share tracking, share counts, user shares                                |
| `spwig.messages`          | Contact form, subjects, message history                                  |
| `spwig.subscriptions`     | Subscription plans, customer subscriptions, cancellation                 |
| `spwig.geoip`             | Location resolve, preferences, suggestions, countries                    |
| `spwig.recentlyViewed`    | Product view history                                                     |
| `spwig.customizer`        | Product customization, designs, clipart, fonts, pricing                  |
| `spwig.customer`          | Dashboard, stats, insights, digital products, licenses                   |
| `spwig.addressService`    | Address autocomplete, normalize, validate, geocode                       |
| `spwig.referrals`         | Referral program, click tracking, dashboard, rewards                     |
| `spwig.affiliate`         | Affiliate programs, links, commissions, payouts                          |
| `spwig.webhooks`          | Webhook endpoint CRUD, deliveries, events                                |

## Environment Variable Reference

These are the backend-side variables you need to configure for headless mode:

| Variable                      | Required | Example                   | Description                                       |
| ----------------------------- | -------- | ------------------------- | ------------------------------------------------- |
| `CORS_ALLOWED_ORIGINS`        | Yes      | `http://localhost:3000`   | Comma-separated list of allowed frontend origins   |
| `SPWIG_CSRF_TRUSTED_ORIGINS`  | Yes      | `http://localhost:3000`   | Origins trusted for CSRF (must include scheme)     |
| `SPWIG_ALLOWED_HOSTS`         | Yes      | `localhost,your-store.com`| Django's allowed hosts list                        |
| `SECRET_KEY`                  | Yes      | *(auto-generated)*        | Django secret key -- keep this private             |
| `DEBUG`                       | No       | `False`                   | Set to `False` in production                       |

## Troubleshooting

### CORS errors in the browser console

```
Access to fetch has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Cause:** Your frontend origin is not listed in `CORS_ALLOWED_ORIGINS` on the backend.

**Fix:** Add your frontend URL (including scheme and port) to `CORS_ALLOWED_ORIGINS` in the Spwig `.env` file and restart the backend. Make sure there are no trailing slashes -- use `http://localhost:3000`, not `http://localhost:3000/`.

### Connection refused (ECONNREFUSED)

```
SpwigNetworkError: fetch failed
```

**Cause:** The Spwig backend is not running, or the `baseUrl` is wrong.

**Fix:** Verify the backend is running (`curl http://localhost:8000/api/store/` should return JSON). Check that `baseUrl` in your `SpwigClient` config matches the actual backend URL.

### 401 Unauthorized on every request

**Cause:** The auth token is missing, expired, or was never set after login.

**Fix:** Make sure you call `spwig.setToken(token)` after a successful login. Tokens do not persist across page reloads by default -- save the token to `localStorage` or a cookie and restore it on initialization:

```typescript
const savedToken = localStorage.getItem('spwig_token');
const spwig = new SpwigClient({
  baseUrl: 'http://localhost:8000',
  token: savedToken ?? undefined,
});
```

### 400 Validation errors

The SDK throws a `SpwigValidationError` with per-field error messages:

```typescript
import { SpwigValidationError } from '@spwig/sdk';

try {
  await spwig.auth.register({ username: '', email: '', password: 'x', password_confirm: 'y' });
} catch (err) {
  if (err instanceof SpwigValidationError) {
    console.log(err.fieldErrors);
    // { username: ["This field may not be blank."], password_confirm: ["Passwords do not match."] }
  }
}
```

## Next Steps

- [Architecture](02-architecture.md) -- understand how data flows between your frontend and Spwig
- [Authentication](03-authentication.md) -- registration, social login, password reset
- [Catalog API](04-catalog-api.md) -- products, categories, brands, search, reviews
- [Cart and Checkout](05-cart-and-checkout.md) -- add to cart, vouchers, checkout flow
- [Error Handling](13-error-handling.md) -- SDK error classes and retry strategies
