# Error Handling

## Response Envelope

```json
// Success
{ "success": true, "data": { ... }, "message": "Optional message" }

// Error
{ "success": false, "message": "What went wrong" }

// Validation error (field-level details)
{ "success": false, "message": "Validation error", "username": ["Already taken."], "email": ["Invalid."] }
```

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST that creates a resource |
| 400 | Bad Request | Validation errors, missing required fields |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected backend error |

## SDK Error Classes

```typescript
import {
  SpwigApiError,         // Any non-2xx response
  SpwigAuthError,        // 401 Unauthorized
  SpwigValidationError,  // 400 Bad Request with field errors
  SpwigTimeoutError,     // Request timed out
  SpwigNetworkError,     // No response (offline, DNS failure)
} from '@spwig/sdk';
```

## Error Handling Patterns

### Basic Try/Catch

```typescript
try {
  const order = await spwig.checkout.complete();
} catch (err) {
  if (err instanceof SpwigValidationError) {
    for (const [field, messages] of Object.entries(err.fieldErrors)) {
      console.log(`${field}: ${messages.join(', ')}`);
    }
  } else if (err instanceof SpwigAuthError) {
    router.push('/login');
  } else if (err instanceof SpwigApiError) {
    console.log(`Error ${err.status}: ${err.apiMessage}`);
  } else if (err instanceof SpwigTimeoutError) {
    showToast('Request timed out. Please try again.');
  } else if (err instanceof SpwigNetworkError) {
    showToast('No internet connection.');
  }
}
```

### Global 401 Handler

```typescript
const spwig = new SpwigClient({
  baseUrl: 'https://example.com',
  onUnauthorized: () => {
    localStorage.removeItem('spwig_token');
    window.location.href = '/login?reason=session_expired';
  },
});
```

### Form Validation Errors

```typescript
try {
  await spwig.auth.register(formData);
} catch (err) {
  if (err instanceof SpwigValidationError) {
    // err.fieldErrors = { username: ["Already taken."], password: ["Too short."] }
    setFormErrors(err.fieldErrors);
  }
}
```

### Timeout and Cancellation

```typescript
const spwig = new SpwigClient({ baseUrl: 'https://example.com', timeout: 15_000 });

const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
try {
  await spwig.catalog.products.list({ search: 'shoes' }, { signal: controller.signal });
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') { /* cancelled */ }
}
```

## Error Boundary Patterns

### Next.js (App Router)

Create `error.tsx` in any route segment to catch errors, and `not-found.tsx` for 404s:

```tsx
// app/products/error.tsx
'use client';
export default function ProductsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/products/[slug]/page.tsx -- trigger notFound() on 404
import { notFound } from 'next/navigation';
export default async function ProductPage({ params }: { params: { slug: string } }) {
  try {
    return <ProductDetail product={await spwig.catalog.products.get(params.slug)} />;
  } catch (err) {
    if (err instanceof SpwigApiError && err.status === 404) notFound();
    throw err; // Re-throw so error.tsx catches it
  }
}
```

### Nuxt

```vue
<!-- error.vue (project root) -->
<script setup lang="ts">
defineProps<{ error: { statusCode: number; message: string } }>();
</script>
<template>
  <h1 v-if="error.statusCode === 404">Page not found</h1>
  <h1 v-else>Something went wrong</h1>
  <button @click="clearError({ redirect: '/' })">Go home</button>
</template>

<!-- Component-level: wrap with NuxtErrorBoundary -->
<NuxtErrorBoundary>
  <ProductGrid />
  <template #error="{ error, clearError }">
    <p>Failed to load products. <button @click="clearError">Retry</button></p>
  </template>
</NuxtErrorBoundary>
```

### SvelteKit

Create `+error.svelte` in any route directory. Use `handleError` in `hooks.server.ts` to sanitize errors:

```svelte
<!-- src/routes/products/+error.svelte -->
<script>import { page } from '$app/stores';</script>
{#if $page.status === 404}
  <h2>Product not found</h2><a href="/products">Browse all products</a>
{:else}
  <h2>Something went wrong</h2>
  <button on:click={() => location.reload()}>Try again</button>
{/if}
```

```typescript
// src/hooks.server.ts -- sanitize errors before they reach the page
export const handleError: HandleServerError = ({ error }) => {
  console.error(error); return { message: 'An unexpected error occurred.' };
};
```

## Toast Notifications for Transient Errors

Network issues, rate limits, and timeouts should show auto-dismissing toasts rather than full-page errors:

```typescript
// lib/toast.ts
type ToastType = 'error' | 'warning' | 'info' | 'success';
interface Toast { id: string; type: ToastType; message: string }
let toasts: Toast[] = [];
const subs: Array<(t: Toast[]) => void> = [];
const notify = () => subs.forEach((fn) => fn([...toasts]));

export function showToast(message: string, type: ToastType = 'error', ms = 5000) {
  const id = crypto.randomUUID();
  toasts.push({ id, type, message });
  notify();
  if (ms > 0) setTimeout(() => dismissToast(id), ms);
}
export function dismissToast(id: string) { toasts = toasts.filter((t) => t.id !== id); notify(); }
export function subscribeToasts(fn: (t: Toast[]) => void) {
  subs.push(fn);
  return () => void subs.splice(subs.indexOf(fn), 1);
}
```

Route transient errors to toasts automatically:

```typescript
export function handleTransientError(err: unknown): boolean {
  if (err instanceof SpwigNetworkError)
    return showToast('Network error. Check your connection.', 'error'), true;
  if (err instanceof SpwigTimeoutError)
    return showToast('Request timed out. Please try again.', 'warning'), true;
  if (err instanceof SpwigApiError && err.status === 429)
    return showToast('Too many requests. Please wait a moment.', 'warning'), true;
  if (err instanceof SpwigApiError && err.status >= 500)
    return showToast('Server error. Our team has been notified.', 'error'), true;
  return false;
}
```

## Logging Errors

Show friendly messages in the UI but send full details to your logging service (Sentry, LogRocket, Datadog):

```typescript
import * as Sentry from '@sentry/browser';
export function logError(err: unknown, context?: Record<string, unknown>) {
  if (err instanceof SpwigValidationError) return; // User mistake, not a bug
  const extra = err instanceof SpwigApiError
    ? { apiMessage: err.apiMessage, ...context } : context;
  const tags = err instanceof SpwigApiError ? { 'spwig.status': err.status } : {};
  Sentry.captureException(err, { tags, extra });
}
```

## Offline Detection

Use `navigator.onLine` and the `online`/`offline` events to detect connectivity changes and queue retries:

```typescript
// React hook for connectivity status
import { useSyncExternalStore } from 'react';
function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
}
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

// Offline banner
export function OfflineBanner() {
  if (useOnlineStatus()) return null;
  return <div role="alert" style={{ background: '#fef2f2', padding: 12, textAlign: 'center' }}>
    You are offline. Some features may be unavailable.
  </div>;
}

// Queue actions for retry when connectivity returns
const queue: Array<() => Promise<void>> = [];
export function enqueueOfflineAction(action: () => Promise<void>) { queue.push(action); }
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    while (queue.length) { try { await queue[0](); queue.shift(); } catch { break; } }
  });
}
```

## Error Recovery Recipes

### Cart Item Out of Stock at Checkout

```typescript
try {
  await spwig.checkout.complete();
} catch (err) {
  if (err instanceof SpwigValidationError && err.fieldErrors['out_of_stock_items']) {
    for (const id of err.fieldErrors['out_of_stock_items']) await spwig.cart.remove(id);
    const cart = await spwig.cart.get();
    setCart(cart);
    showToast('Some items were out of stock and have been removed.', 'warning', 8000);
    if (cart.item_count === 0) router.push('/products');
  }
}
```

### Token Expired Mid-Session

Redirect to login with a return URL so the customer comes back to where they were:

```typescript
// In SpwigClient config:
onUnauthorized: () => {
  localStorage.removeItem('spwig_token');
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?return=${returnUrl}&reason=expired`;
},

// On the login page, restore the return URL after login:
async function handleLogin(credentials: { username: string; password: string }) {
  const { token } = await spwig.auth.login(credentials);
  spwig.setToken(token);
  localStorage.setItem('spwig_token', token);
  router.push(decodeURIComponent(new URLSearchParams(location.search).get('return') ?? '/'));
}
```

### Payment Failed

Map provider error codes to user-friendly messages and let the customer retry:

```typescript
try {
  const order = await spwig.checkout.complete();
  router.push(`/orders/${order.id}/confirmation`);
} catch (err) {
  if (err instanceof SpwigApiError && err.status === 400) {
    const msgs: Record<string, string> = {
      card_declined: 'Your card was declined. Try a different payment method.',
      insufficient_funds: 'Insufficient funds. Try a different card.',
      expired_card: 'Your card has expired. Update your payment details.',
      '3ds_failed': 'Authentication failed. Try again or use a different card.',
    };
    const code = err.fieldErrors?.['payment_error_code']?.[0];
    setPaymentError(msgs[code] ?? 'Payment failed. Please try again.');
    setPaymentStep('retry');
  } else { throw err; }
}
```

### Network Error During Checkout

Do not blindly retry -- the order may have been created server-side. Check order status first:

```typescript
try {
  await spwig.checkout.complete();
} catch (err) {
  if (err instanceof SpwigNetworkError || err instanceof SpwigTimeoutError) {
    showToast('Connection lost. Checking order status...', 'warning', 0);
    try {
      const { results } = await spwig.orders.list({ page_size: 1, ordering: '-created_at' });
      if (results[0] && Date.now() - new Date(results[0].created_at).getTime() < 60_000) {
        showToast('Order placed successfully.', 'success');
        return router.push(`/orders/${results[0].id}/confirmation`);
      }
    } catch { /* still offline */ }
    showToast('Could not complete checkout. Check your connection.', 'error', 0);
  }
}
```
