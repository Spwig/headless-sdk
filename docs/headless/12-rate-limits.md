# Rate Limits

Spwig enforces rate limits to protect against abuse. Your headless frontend should handle rate-limited responses gracefully and use the response headers to adapt request patterns in real time.

## Rate Limit Tiers

| Tier | Burst | Sustained | Who |
|------|-------|-----------|-----|
| Anonymous | 60/minute | 1,000/hour | Unauthenticated requests |
| Authenticated | 120/minute | 5,000/hour | Requests with valid token |
| Public Writes | 20/hour | — | Anonymous POST/PUT/PATCH (e.g. contact form) |
| Voucher Validation | 10/minute | — | Prevent discount code enumeration |
| Referral Tracking | 30/hour | — | Prevent referral token abuse |
| Social Tracking | 50/hour | — | Share event tracking |
| GeoIP | 100/hour | — | Location/currency suggestion |
| Admin API | 300/minute | — | Mobile admin app |
| Admin Sensitive | 30/minute | — | Admin data exports, bulk ops |
| Admin Login | 5/minute | — | Brute force protection |

## Rate Limit Response Headers

Every API response includes headers that tell you where you stand:

| Header | Example | Description |
|--------|---------|-------------|
| `X-RateLimit-Limit` | `120` | Maximum requests allowed in the current window |
| `X-RateLimit-Remaining` | `87` | Requests remaining before throttling begins |
| `X-RateLimit-Reset` | `1700000000` | Unix timestamp when the window resets |
| `Retry-After` | `23` | Seconds to wait before retrying (only on 429 responses) |

## When You Hit a Rate Limit

The API returns **HTTP 429 Too Many Requests** with a `Retry-After` header:

```json
{
  "detail": "Request was throttled. Expected available in 23 seconds."
}
```

Parse the `Retry-After` header to know exactly how long to wait:

```typescript
import { SpwigApiError } from '@spwig/sdk';

try {
  const products = await spwig.catalog.products.list();
} catch (err) {
  if (err instanceof SpwigApiError && err.status === 429) {
    const retryAfter = err.headers?.get('Retry-After');
    const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 30;
    setTimeout(() => retryRequest(), waitSeconds * 1000);
  }
}
```

## Retry with Exponential Backoff

For production frontends, use a retry utility that respects `Retry-After` when present and falls back to exponential backoff with random jitter:

```typescript
import { SpwigApiError, SpwigNetworkError } from '@spwig/sdk';

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, baseDelayMs = 1000 }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;

      const isRetryable =
        (err instanceof SpwigApiError && (err.status === 429 || err.status >= 500)) ||
        err instanceof SpwigNetworkError;
      if (!isRetryable) throw err;

      // Prefer Retry-After header, fall back to exponential backoff (1s, 2s, 4s, 8s)
      let delayMs: number;
      if (err instanceof SpwigApiError && err.status === 429) {
        const retryAfter = err.headers?.get('Retry-After');
        delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : baseDelayMs * 2 ** attempt;
      } else {
        delayMs = baseDelayMs * 2 ** attempt;
      }

      // Add random jitter (0-25%) to avoid thundering herd
      delayMs += delayMs * Math.random() * 0.25;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Retry failed');
}

// Usage
const products = await retryWithBackoff(() => spwig.catalog.products.list({ page: 1 }));
```

## Framework-Specific Retry Patterns

### SWR / TanStack Query (React)

```typescript
// SWR
const { data } = useSWR('products', () => spwig.catalog.products.list(), {
  onErrorRetry(err, _key, _config, revalidate, { retryCount }) {
    if (retryCount >= 3) return;
    if (err instanceof SpwigApiError && err.status === 429) {
      const wait = parseInt(err.headers?.get('Retry-After') ?? '5', 10);
      setTimeout(() => revalidate({ retryCount }), wait * 1000);
      return;
    }
    setTimeout(() => revalidate({ retryCount }), 2 ** retryCount * 1000);
  },
});

// TanStack Query
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => spwig.catalog.products.list(),
  retry: 3,
  retryDelay: (attempt, error) => {
    if (error instanceof SpwigApiError && error.status === 429) {
      return parseInt(error.headers?.get('Retry-After') ?? '5', 10) * 1000;
    }
    return Math.min(1000 * 2 ** attempt, 16000);
  },
});
```

### Nuxt useAsyncData

```typescript
const { data, error, refresh } = await useAsyncData('products',
  () => $fetch('/api/proxy/catalog/products/'),
  { retry: 2, retryDelay: 2000 },
);

watch(error, async (err) => {
  if (err?.statusCode === 429) {
    const wait = parseInt(err.data?.detail?.match(/\d+/)?.[0] ?? '5', 10);
    await new Promise((r) => setTimeout(r, wait * 1000));
    refresh();
  }
});
```

## Avoiding Rate Limits

1. **Cache responses** -- Use your framework's caching (SWR, TanStack Query, Nuxt `useAsyncData`) instead of fetching the same data on every navigation.

2. **Stale-while-revalidate** -- Serve cached data immediately and refresh in the background. This cuts visible loading and reduces API calls.

3. **Deduplicate requests** -- If multiple components request the same data at once, ensure only one network call fires. SWR and TanStack Query do this automatically. For custom fetch layers:
   ```typescript
   const pending = new Map<string, Promise<any>>();
   function deduplicatedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
     if (pending.has(key)) return pending.get(key)!;
     const promise = fn().finally(() => pending.delete(key));
     pending.set(key, promise);
     return promise;
   }
   ```

4. **Debounce search** -- Autocomplete should be debounced (300ms+) to avoid flooding `/api/search/autocomplete/`.

5. **Use pagination** -- Don't fetch all products at once. Use `page` and `page_size`.

6. **Batch operations** -- The cart API accepts multiple items in a single request. Prefer `cart.addMultiple()` over individual `cart.add()` calls.

7. **Authenticate users** -- Authenticated requests get 2x the rate limit.

8. **Server-side rendering** -- SSR requests count as a single origin. Use caching headers or a CDN to avoid per-visitor API calls.
