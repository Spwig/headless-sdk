# Architecture

## How Headless Spwig Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Browser    │────▶│  Frontend    │────▶│  Spwig API   │────▶│ Database │
│              │◀────│  (Next.js)   │◀────│  (Django)    │◀────│ (Postgres)│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────┘
                          │                     │
                     @spwig/sdk            /api/* endpoints
                     (TypeScript)          (DRF + OpenAPI)
```

Your frontend calls Spwig's REST API through the SDK. The API returns JSON. The frontend renders it however you choose.

## URL Ownership

When frontend and backend share a domain, the reverse proxy routes by path:

| Path | Owner | Description |
|------|-------|-------------|
| `/api/*` | **Spwig** | REST APIs (no language prefix) |
| `/webhooks/*` | **Spwig** | Payment/shipping provider callbacks |
| `/static/*` | **Spwig** | CSS, JS, images (Nginx serves directly) |
| `/media/*` | **Spwig** | Uploaded files (Nginx serves directly) |
| `/pos/*` | **Spwig** | POS terminal (React SPA) |
| `/{lang}/admin/*` | **Spwig** | Django admin (17 language codes) |
| `/accounts/*` | **Spwig** | OAuth callbacks |
| `/health/*` | **Spwig** | Health checks |
| `/download/*` | **Spwig** | Digital product downloads |
| `/receipt/*` | **Spwig** | POS receipts |
| Everything else | **Frontend** | Your storefront pages |

## API Response Envelope

All API responses use a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

The SDK automatically unwraps this -- you always receive the `data` payload directly.

## Paginated Responses

List endpoints return DRF pagination:

```json
{
  "count": 142,
  "next": "https://example.com/api/catalog/products/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

## Authentication Flow

```
1. Frontend calls spwig.auth.login({ username, password })
2. Backend validates credentials, returns { user, token }
3. SDK stores token internally
4. All subsequent requests include: Authorization: Token <token>
5. On 401, SDK calls onUnauthorized() callback
```

## Webhook Data Flow

```
┌──────────┐    event occurs    ┌──────────┐    HTTP POST     ┌──────────────┐
│  Spwig   │──────────────────▶│  Celery  │──────────────────▶│  Your Server │
│ Backend  │                    │  Worker  │                    │  (webhook    │
│          │                    │          │                    │   handler)   │
└──────────┘                    └──────────┘                    └──────────────┘
                                     │                               │
                                     │  X-Spwig-Signature header     │
                                     │  HMAC-SHA256 signed           │
                                     │                               │
                                     └── retries on failure ─────────┘
                                         (5x with exponential backoff)
```

## Request Lifecycle

When you call `spwig.catalog.products.list({ page: 1 })`:

1. SDK builds URL: `GET {baseUrl}/api/catalog/products/?page=1`
2. SDK adds headers: `Accept-Language: en`, `Authorization: Token xxx`
3. SDK sends fetch request with timeout
4. Server processes request, returns JSON envelope
5. SDK checks response status (throws on 4xx/5xx)
6. SDK unwraps `{ success, data }` envelope
7. Returns typed `PaginatedResponse<Product>` to your code

---

## Same-Domain vs Subdomain Deployment

There are two ways to deploy a headless storefront. The choice affects cookies, CORS, proxy complexity, and SDK configuration.

### Same-Domain

Both services share a single origin (e.g. `https://example.com`). A reverse proxy routes by URL path.

```
Browser ──▶ https://example.com
               ├── /api/*          ──▶ Spwig (port 8000)
               ├── /media/*        ──▶ Nginx disk
               └── everything else ──▶ Frontend (port 3000)
```

```typescript
const spwig = new SpwigClient({ baseUrl: 'https://example.com' });
```

### Subdomain

Frontend and Spwig live on separate subdomains. Each has its own simple proxy.

```
Browser ──▶ https://www.example.com  ──▶ Frontend (port 3000)
Browser ──▶ https://api.example.com  ──▶ Spwig (port 8000)
```

```typescript
const spwig = new SpwigClient({ baseUrl: 'https://api.example.com' });
```

Spwig env vars must include both origins:

```bash
SPWIG_ALLOWED_HOSTS=api.example.com,localhost
SPWIG_CSRF_TRUSTED_ORIGINS=https://api.example.com,https://www.example.com
CORS_ALLOWED_ORIGINS=https://www.example.com
```

### Comparison

| Concern | Same-Domain | Subdomain |
|---------|-------------|-----------|
| Proxy complexity | Higher -- path-based routing | Lower -- one upstream per subdomain |
| CORS | Not needed (same origin) | Required (cross-origin) |
| Cookies | Shared automatically | Requires `SESSION_COOKIE_DOMAIN=.example.com` |
| TLS certificates | One | Two (or wildcard `*.example.com`) |
| CDN / static files | Serve from disk at `/media/` | Easy to add `static.example.com` CDN |
| Development setup | Needs proxy locally | Frontend and API run independently |
| Recommended for | Most deployments | Large teams needing separate scaling |

**Same-domain is recommended** for most projects. See [Proxy Configuration](10-proxy-configuration.md) for production configs.

## Session and Cookie Handling

Spwig uses session cookies for anonymous visitors and token-based auth for logged-in customers.

### Anonymous Sessions (Cart)

When an anonymous visitor adds an item to their cart, Spwig creates a Django session and returns a `sessionid` cookie. This tracks cart contents until login or session expiry.

- The cookie is set on the first mutating API call (e.g. `POST /api/cart/items/`).
- **Same-domain**: the browser sends this cookie automatically.
- **Subdomain**: you must configure `credentials: 'include'` (see below).

### Token-Based Auth (Logged-in Users)

After login, Spwig returns `{ user, token }`. The SDK stores the token in memory and attaches `Authorization: Token <value>` to every request. You must persist the token between page loads.

| Frontend Type | Storage Strategy |
|---------------|------------------|
| SPA (React, Vue) | `localStorage` -- read on startup, pass to `new SpwigClient({ token })` |
| SSR (Next.js, Nuxt) | `httpOnly` cookie -- set by your server, read in server-side data fetching |
| Hybrid | Cookie for SSR, localStorage for client-side navigation |

```typescript
// Server-side: read token from cookie
const token = cookies().get('spwig_token')?.value;
const spwig = new SpwigClient({ baseUrl: process.env.SPWIG_BACKEND_URL, token });

// Client-side: read token from localStorage
const spwig = new SpwigClient({
  baseUrl: '',
  token: localStorage.getItem('spwig_token') || undefined,
  onUnauthorized: () => router.push('/login'),
});
```

### Cookie Domain for Subdomain Deployments

Set `SESSION_COOKIE_DOMAIN=.example.com` in Spwig env and pass a custom fetch with credentials:

```typescript
const spwig = new SpwigClient({
  baseUrl: 'https://api.example.com',
  fetch: (url, init) => globalThis.fetch(url, { ...init, credentials: 'include' }),
});
```

---

## Server-Side Rendering (SSR) vs Client-Side

Use **SSR for SEO-critical pages** and **CSR for interactive, user-specific pages**.

| Page Type | Rendering | Reason |
|-----------|-----------|--------|
| Product pages | SSR | Search engines index titles, descriptions, structured data |
| Category / collection | SSR | Crawlable listings drive organic traffic |
| Blog posts | SSR | Content marketing depends on indexing |
| Store info (about, policies) | SSR | Static content, rarely changes |
| Cart | CSR | User-specific, no SEO value |
| Checkout | CSR | Private, multi-step, interactive |
| Account / orders | CSR | Private, user-specific |
| Search results | CSR | Triggered by user input |

### Hybrid Pattern

Most product pages combine both: the shell and product data are server-rendered for SEO, while "Add to Cart" and stock status are hydrated client-side.

```
┌─────────────────────────────────────────────────┐
│  Product Page                                   │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  Image       │  │  Title, price, reviews   │  │
│  │  (SSR)       │  │  (SSR -- SEO visible)    │  │
│  └─────────────┘  └──────────────────────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │  Add to Cart, qty, stock                 │   │
│  │  (CSR -- hydrated on client)             │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Server Client vs Browser Client

Create two SDK instances -- one for your server, one for the browser:

```typescript
// lib/spwig-server.ts -- runs in getServerSideProps / loader / +page.server.ts
export function createServerClient(token?: string) {
  return new SpwigClient({
    baseUrl: process.env.SPWIG_INTERNAL_URL || 'http://localhost:8000',
    token,
  });
}

// lib/spwig-browser.ts -- runs in components and event handlers
export const spwig = new SpwigClient({
  baseUrl: process.env.NEXT_PUBLIC_SPWIG_URL || '',
  language: document.documentElement.lang || 'en',
  onUnauthorized: () => window.location.href = '/login',
});
```

The server client can use an internal URL (`http://localhost:8000`) to skip the proxy. The browser client uses the public URL.

## Image and Media URLs

Spwig serves uploaded files under `/media/`. How you reference these depends on deployment model.

**Same-domain** -- image paths work as-is:

```html
<img src="/media/products/shoe_abc123.jpg" alt="Running Shoe" />
```

**Subdomain** -- prefix with the backend URL:

```typescript
function mediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SPWIG_URL}${path}`;
  // "https://api.example.com/media/products/shoe_abc123.jpg"
}
```

### Image Presets and Responsive Images

Spwig's media library generates responsive sizes via configurable presets. The API returns available renditions per image:

```json
{
  "original": "/media/products/shoe.jpg",
  "presets": {
    "thumbnail": "/media/cache/products/shoe_150x150.webp",
    "small":     "/media/cache/products/shoe_400x400.webp",
    "medium":    "/media/cache/products/shoe_800x800.webp",
    "large":     "/media/cache/products/shoe_1200x1200.webp"
  }
}
```

Build an optimized `<img>` tag:

```tsx
function ProductImage({ image, alt }: { image: ProductImage; alt: string }) {
  const base = process.env.NEXT_PUBLIC_MEDIA_URL || '';
  return (
    <img
      src={`${base}${image.presets.medium}`}
      srcSet={`${base}${image.presets.small} 400w, ${base}${image.presets.medium} 800w, ${base}${image.presets.large} 1200w`}
      sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px"
      alt={alt}
      loading="lazy"
    />
  );
}
```

---

## Caching Strategy

| Data | Cache Duration | Strategy | Reason |
|------|---------------|----------|--------|
| Store info | 5-10 min | Aggressive | Rarely changes |
| Category tree | 2-5 min | SWR | Changes occasionally |
| Product listings | 1-2 min | SWR | Prices/stock may update |
| Product detail | 1-2 min | SWR | Same as listings |
| Search results | 10-30 sec | Debounce + short cache | User-driven |
| Cart / Checkout | Never | No cache | User-specific, real-time |
| Account / Orders | Never | No cache | Private |

### Framework Patterns

**Next.js (App Router):**

```typescript
async function ProductsPage() {
  const products = await createServerClient().catalog.products.list({ page: 1 });
  return <ProductGrid products={products.results} />;
}
export const revalidate = 60;  // ISR: regenerate every 60s
```

**Nuxt 3:**

```typescript
const { data } = await useAsyncData('products',
  () => spwig.catalog.products.list({ page: 1 }),
  { getCachedData: (key, app) => app.payload.data[key] }
);
```

**SvelteKit:**

```typescript
export const config = { isr: { expiration: 60 } };
export async function load() {
  return { products: await createServerClient().catalog.products.list({ page: 1 }) };
}
```

**SWR (any framework):**

```typescript
const { data } = useSWR(['products', page],
  () => spwig.catalog.products.list({ page }),
  { revalidateOnFocus: false, dedupingInterval: 60_000 }
);
```

---

## API Conventions Reference

### Dates and Times

All date/time values are **ISO 8601 strings in UTC**: `"2025-03-15T14:30:00Z"`. Convert to the user's timezone in the frontend.

### Prices and Monetary Values

Prices are **string decimals**, never floats. This avoids JS precision errors (`0.1 + 0.2 !== 0.3`).

```json
{ "price": "29.99", "compare_at_price": "39.99", "tax_amount": "5.25" }
```

Use `Intl.NumberFormat` for display. Send strings when writing prices back to the API.

### Slugs

URL-friendly identifiers are used alongside numeric IDs:

```
GET /api/catalog/products/organic-cotton-tee/
GET /api/catalog/categories/mens-clothing/
```

Slugs are lowercase, hyphen-separated, and unique within their resource type.

### Pagination

| Parameter | Default | Max | Notes |
|-----------|---------|-----|-------|
| `page` | 1 | -- | 1-indexed |
| `page_size` | 20 | 100 | Query parameter |

### Null, Empty, and Missing Fields

| Scenario | Representation | Example |
|----------|---------------|---------|
| List with no items | `[]` | `"tags": []` |
| Optional field not set | `null` | `"compare_at_price": null` |
| Field not applicable | Omitted | Variant fields on simple products |
| Booleans | Always present | `"is_active": true` |

Empty arrays are never `null` -- you can always safely call `.map()` or `.length`.

### Language and Currency Headers

| Header | Example | Purpose |
|--------|---------|---------|
| `Accept-Language` | `en`, `fr` | Controls which translation is returned |
| `X-Currency` | `EUR`, `USD` | Controls price currency (converted via exchange rates) |
| `Authorization` | `Token a1b2c3...` | Identifies logged-in customer |

```typescript
const spwig = new SpwigClient({ baseUrl: '...', language: 'en', currency: 'EUR' });
spwig.setLanguage('fr');  // change without recreating client
spwig.setCurrency('USD');
```

### Error Responses

| Error Class | Status | When |
|-------------|--------|------|
| `SpwigValidationError` | 400 | Invalid input -- `.fieldErrors` has per-field messages |
| `SpwigAuthError` | 401 | Token expired/invalid -- triggers `onUnauthorized` |
| `SpwigApiError` | 403, 404, 500 | General error -- `.status` and `.body` available |
| `SpwigTimeoutError` | -- | Exceeded timeout (default 30s) |
| `SpwigNetworkError` | -- | No response (offline, DNS failure) |

```typescript
try {
  await spwig.auth.register({ email, password });
} catch (err) {
  if (err instanceof SpwigValidationError) {
    setErrors(err.fieldErrors);  // { email: ["Already registered"] }
  } else if (err instanceof SpwigAuthError) {
    router.push('/login');
  } else {
    showToast('Something went wrong. Please try again.');
  }
}
```
