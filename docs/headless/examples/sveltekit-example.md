# SvelteKit Example

Complete examples for building a headless Spwig storefront with SvelteKit.

## Setup

```bash
npx sv create my-store
cd my-store
npm install @spwig/sdk
```

## Environment Variables

```bash
# .env
PUBLIC_SPWIG_URL=https://example.com
SPWIG_URL=https://example.com            # Internal URL for server-side
WEBHOOK_SECRET=your-webhook-secret
PUBLIC_STRIPE_KEY=pk_live_...             # Stripe publishable key (if using Stripe)
STRIPE_SECRET_KEY=sk_live_...            # Stripe secret key (server-side only)
```

## SDK Setup

### Server-side (`src/lib/server/spwig.ts`)

```typescript
import { SpwigClient } from '@spwig/sdk';
import { SPWIG_URL } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

export function getSpwig(cookies: Cookies) {
  const token = cookies.get('spwig_token');
  return new SpwigClient({
    baseUrl: SPWIG_URL,
    token: token ?? undefined,
  });
}
```

### Client-side (`src/lib/spwig.ts`)

```typescript
import { SpwigClient } from '@spwig/sdk';
import { PUBLIC_SPWIG_URL } from '$env/static/public';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

let client: SpwigClient | null = null;

export function getSpwigClient(): SpwigClient {
  if (!client) {
    client = new SpwigClient({
      baseUrl: PUBLIC_SPWIG_URL,
      token: browser ? (localStorage.getItem('spwig_token') ?? undefined) : undefined,
      onUnauthorized: () => {
        if (browser) {
          localStorage.removeItem('spwig_token');
          goto('/login');
        }
      },
    });
  }
  return client;
}
```

## Product Listing Page

```typescript
// src/routes/products/+page.server.ts
import { getSpwig } from '$lib/server/spwig';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const spwig = getSpwig(cookies);
  const page = Number(url.searchParams.get('page')) || 1;
  const category = url.searchParams.get('category') ?? undefined;

  const products = await spwig.catalog.products.list({ page, category });

  return { products, page };
};
```

```svelte
<!-- src/routes/products/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<h1>Products</h1>

<div class="grid">
  {#each data.products.results as product (product.id)}
    <a href="/products/{product.slug}" class="product-card">
      {#if product.images?.[0]}
        <img src={product.images[0].url} alt={product.name} />
      {/if}
      <h2>{product.name}</h2>
      <p>{product.currency} {product.price}</p>
    </a>
  {/each}
</div>

<nav>
  {#if data.products.previous}
    <a href="/products?page={data.page - 1}">Previous</a>
  {/if}
  {#if data.products.next}
    <a href="/products?page={data.page + 1}">Next</a>
  {/if}
</nav>
```

## Product Detail Page

```typescript
// src/routes/products/[slug]/+page.server.ts
import { getSpwig } from '$lib/server/spwig';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
  const spwig = getSpwig(cookies);

  try {
    const product = await spwig.catalog.products.get(params.slug);
    return { product };
  } catch {
    error(404, 'Product not found');
  }
};
```

```svelte
<!-- src/routes/products/[slug]/+page.svelte -->
<script lang="ts">
  import { getSpwigClient } from '$lib/spwig';
  import { SpwigValidationError } from '@spwig/sdk';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let loading = $state(false);
  let errorMsg = $state('');
  let added = $state(false);

  async function addToCart() {
    loading = true;
    errorMsg = '';
    try {
      const spwig = getSpwigClient();
      await spwig.cart.add({ product_id: data.product.id, quantity: 1 });
      added = true;
      setTimeout(() => (added = false), 3000);
    } catch (err) {
      if (err instanceof SpwigValidationError) {
        errorMsg = Object.values(err.fieldErrors).flat().join(', ');
      } else {
        errorMsg = 'Failed to add to cart';
      }
    } finally {
      loading = false;
    }
  }
</script>

<h1>{data.product.name}</h1>
<p class="price">{data.product.currency} {data.product.price}</p>
<div>{@html data.product.description}</div>

<button onclick={addToCart} disabled={loading}>
  {#if loading}Adding...{:else if added}Added!{:else}Add to Cart{/if}
</button>
{#if errorMsg}<p class="error">{errorMsg}</p>{/if}
```

## SEO Metadata

### Product Page SEO (`src/routes/products/[slug]/+page.svelte`)

Add `<svelte:head>` to the product detail page for title, description, Open Graph tags, and JSON-LD structured data:

```svelte
<!-- src/routes/products/[slug]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  import { getSpwigClient } from '$lib/spwig';
  import { formatPrice } from '$lib/format';
  import { SpwigValidationError } from '@spwig/sdk';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const product = $derived(data.product);
  const primaryImage = $derived(product.images?.find((i) => i.is_primary) ?? product.images?.[0]);
  const canonicalUrl = $derived(`${page.url.origin}/products/${product.slug}`);

  const jsonLd = $derived(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, '').slice(0, 300),
    image: primaryImage?.image,
    sku: product.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: product.currency,
      price: product.price,
      availability: product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }));

  // ... addToCart logic from above
</script>

<svelte:head>
  <title>{product.name} | My Store</title>
  <meta name="description" content={product.description?.replace(/<[^>]*>/g, '').slice(0, 160)} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content={product.name} />
  <meta property="og:description" content={product.description?.replace(/<[^>]*>/g, '').slice(0, 200)} />
  {#if primaryImage}
    <meta property="og:image" content={primaryImage.image} />
    <meta property="og:image:alt" content={primaryImage.alt_text || product.name} />
  {/if}
  <meta property="og:url" content={canonicalUrl} />
  <meta property="product:price:amount" content={product.price} />
  <meta property="product:price:currency" content={product.currency} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={product.name} />

  <!-- JSON-LD Structured Data -->
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<!-- ... rest of template -->
```

### Category Page SEO (`src/routes/categories/[slug]/+page.svelte`)

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.category.name} | My Store</title>
  <meta name="description" content={`Browse ${data.category.product_count} products in ${data.category.name}`} />
  {#if data.category.image}
    <meta property="og:image" content={data.category.image} />
  {/if}
</svelte:head>
```

### Sitemap Generation (`src/routes/sitemap.xml/+server.ts`)

```typescript
// src/routes/sitemap.xml/+server.ts
import { getSpwig } from '$lib/server/spwig';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const spwig = getSpwig(cookies);
  const origin = url.origin;

  // Fetch all products and categories (paginate if needed)
  const [products, categories] = await Promise.all([
    spwig.catalog.products.list({ page: 1, page_size: 1000 }),
    spwig.catalog.categories.list({ page: 1, page_size: 200 }),
  ]);

  const urls: Array<{ loc: string; priority: string; changefreq: string }> = [
    { loc: origin, priority: '1.0', changefreq: 'daily' },
    { loc: `${origin}/products`, priority: '0.9', changefreq: 'daily' },
  ];

  for (const product of products.results) {
    urls.push({
      loc: `${origin}/products/${product.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  for (const category of categories.results) {
    urls.push({
      loc: `${origin}/categories/${category.slug}`,
      priority: '0.7',
      changefreq: 'weekly',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600',
    },
  });
};
```

## Image Optimization

### Responsive Product Image Component (`src/lib/components/ProductImage.svelte`)

Spwig serves images at their original resolution. Build a responsive component that uses `srcset` for appropriate sizing, lazy loading, and the `decoding` attribute for non-blocking rendering:

```svelte
<!-- src/lib/components/ProductImage.svelte -->
<script lang="ts">
  import type { ProductImage as ProductImageType } from '@spwig/sdk';

  interface Props {
    image: ProductImageType;
    sizes?: string;
    class?: string;
    eager?: boolean;
    widths?: number[];
  }

  let {
    image,
    sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
    class: className = '',
    eager = false,
    widths = [320, 640, 960, 1280],
  }: Props = $props();

  // Build srcset from Spwig media URL with width parameter
  // Assumes Spwig serves resized images via ?w=<width> query param
  const srcset = $derived(
    widths.map((w) => `${image.image}?w=${w}&format=webp ${w}w`).join(', ')
  );
</script>

<img
  src={`${image.image}?w=640&format=webp`}
  {srcset}
  {sizes}
  alt={image.alt_text || ''}
  loading={eager ? 'eager' : 'lazy'}
  decoding={eager ? 'sync' : 'async'}
  class={className}
/>
```

Usage in a product grid:

```svelte
<script lang="ts">
  import ProductImage from '$lib/components/ProductImage.svelte';
</script>

{#each data.products.results as product (product.id)}
  <a href="/products/{product.slug}" class="product-card">
    {#if product.images?.[0]}
      <ProductImage
        image={product.images[0]}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      />
    {/if}
    <h2>{product.name}</h2>
  </a>
{/each}
```

### Vite Image Configuration (`vite.config.ts`)

If you use `@sveltejs/enhanced-img` for local assets (e.g., banners, logos), configure it alongside Spwig remote images:

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [enhancedImages(), sveltekit()],
  build: {
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
  },
});
```

> **Note:** `@sveltejs/enhanced-img` only processes local/static images at build time. For Spwig product images served from your backend, use the `ProductImage` component above with `srcset` and the `?w=` query parameter.

## Cart Page

```svelte
<!-- src/routes/cart/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getSpwigClient } from '$lib/spwig';
  import type { Cart } from '@spwig/sdk';

  const spwig = getSpwigClient();
  let cart = $state<Cart | null>(null);

  onMount(async () => {
    cart = await spwig.cart.get();
  });

  async function updateQuantity(itemId: number, quantity: number) {
    if (quantity < 1) return;
    cart = await spwig.cart.updateItem(itemId, { quantity });
  }

  async function removeItem(itemId: number) {
    cart = await spwig.cart.removeItem(itemId);
  }
</script>

<h1>Shopping Cart</h1>

{#if !cart}
  <p>Loading...</p>
{:else if cart.items.length === 0}
  <p>Your cart is empty.</p>
{:else}
  {#each cart.items as item (item.id)}
    <div class="cart-item">
      <div>
        <p class="font-bold">{item.product_name}</p>
        <p>{item.currency} {item.unit_price} x {item.quantity}</p>
      </div>
      <div class="controls">
        <button onclick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
        <span>{item.quantity}</span>
        <button onclick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
        <button onclick={() => removeItem(item.id)} class="remove">Remove</button>
      </div>
    </div>
  {/each}

  <p class="total">Total: {cart.currency} {cart.total}</p>
  <a href="/checkout" class="checkout-btn">Checkout</a>
{/if}
```

## Loading States

### Navigation Progress Indicator (`src/lib/components/NavigationProgress.svelte`)

Use SvelteKit's `navigating` store to show a progress bar during page transitions:

```svelte
<!-- src/lib/components/NavigationProgress.svelte -->
<script lang="ts">
  import { navigating } from '$app/stores';
</script>

{#if $navigating}
  <div class="nav-progress" aria-hidden="true">
    <div class="nav-progress-bar"></div>
  </div>
{/if}

<style>
  .nav-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
  }
  .nav-progress-bar {
    height: 100%;
    background: var(--color-primary, #3b82f6);
    animation: progress 1s ease-in-out infinite;
  }
  @keyframes progress {
    0% { width: 0; margin-left: 0; }
    50% { width: 70%; margin-left: 10%; }
    100% { width: 0; margin-left: 100%; }
  }
</style>
```

Add it to your root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import NavigationProgress from '$lib/components/NavigationProgress.svelte';
  let { children } = $props();
</script>

<NavigationProgress />
{@render children()}
```

### Skeleton Product Card (`src/lib/components/ProductCardSkeleton.svelte`)

```svelte
<!-- src/lib/components/ProductCardSkeleton.svelte -->
<div class="skeleton-card" aria-busy="true">
  <div class="skeleton-image"></div>
  <div class="skeleton-text" style="width: 70%"></div>
  <div class="skeleton-text" style="width: 40%"></div>
</div>

<style>
  .skeleton-card { padding: 1rem; }
  .skeleton-image {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  .skeleton-text {
    height: 1rem;
    margin-top: 0.75rem;
    border-radius: 4px;
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }
</style>
```

### Await Block Pattern with Skeletons

Use `{#await}` for inline data fetching with skeleton fallbacks:

```svelte
<script lang="ts">
  import { getSpwigClient } from '$lib/spwig';
  import ProductCardSkeleton from '$lib/components/ProductCardSkeleton.svelte';

  const spwig = getSpwigClient();
  const recommendations = spwig.catalog.getRecommendations();
</script>

<h2>Recommended for you</h2>

{#await recommendations}
  <div class="grid">
    {#each Array(4) as _}
      <ProductCardSkeleton />
    {/each}
  </div>
{:then products}
  <div class="grid">
    {#each products as product (product.id)}
      <a href="/products/{product.slug}" class="product-card">
        <h3>{product.name}</h3>
        <p>{product.currency} {product.price}</p>
      </a>
    {/each}
  </div>
{:catch}
  <p>Failed to load recommendations.</p>
{/await}
```

### Optimistic Cart Updates

Update the UI immediately before the server responds, then reconcile:

```svelte
<script lang="ts">
  import { getSpwigClient } from '$lib/spwig';
  import type { Cart } from '@spwig/sdk';

  const spwig = getSpwigClient();
  let cart = $state<Cart | null>(null);

  async function optimisticUpdateQuantity(itemId: number, newQuantity: number) {
    if (!cart || newQuantity < 1) return;

    // Snapshot for rollback
    const previousCart = structuredClone(cart);

    // Optimistic update
    const item = cart.items.find((i) => i.id === itemId);
    if (item) {
      item.quantity = newQuantity;
    }

    try {
      cart = await spwig.cart.updateItem(itemId, { quantity: newQuantity });
    } catch {
      // Rollback on failure
      cart = previousCart;
    }
  }
</script>
```

## Authentication

```typescript
// src/routes/login/+page.server.ts
import { SpwigClient, SpwigAuthError, SpwigValidationError } from '@spwig/sdk';
import { SPWIG_URL } from '$env/static/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ cookies, request }) => {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const spwig = new SpwigClient({ baseUrl: SPWIG_URL });

    try {
      const { token } = await spwig.auth.login({ username, password });

      cookies.set('spwig_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } catch (err) {
      if (err instanceof SpwigAuthError) {
        return fail(401, { error: 'Invalid username or password.' });
      }
      if (err instanceof SpwigValidationError) {
        return fail(400, { fieldErrors: err.fieldErrors });
      }
      return fail(500, { error: 'Something went wrong.' });
    }

    redirect(303, '/account');
  },
};
```

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<h1>Login</h1>

<form method="POST" use:enhance>
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}

  <label>
    Username
    <input name="username" required />
    {#if form?.fieldErrors?.username}
      <p class="error">{form.fieldErrors.username[0]}</p>
    {/if}
  </label>

  <label>
    Password
    <input name="password" type="password" required />
    {#if form?.fieldErrors?.password}
      <p class="error">{form.fieldErrors.password[0]}</p>
    {/if}
  </label>

  <button type="submit">Login</button>
</form>
```

## Search with Autocomplete

```svelte
<!-- src/lib/components/SearchBar.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { getSpwigClient } from '$lib/spwig';
  import type { AutocompleteSuggestion } from '@spwig/sdk';

  const spwig = getSpwigClient();
  let query = $state('');
  let suggestions = $state<AutocompleteSuggestion[]>([]);
  let timer: ReturnType<typeof setTimeout>;

  function handleInput() {
    clearTimeout(timer);
    if (query.length < 2) {
      suggestions = [];
      return;
    }
    timer = setTimeout(async () => {
      suggestions = await spwig.search.autocomplete(query);
    }, 300);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      goto(`/search?q=${query}`);
      suggestions = [];
    }
  }
</script>

<div class="search-wrapper">
  <input
    bind:value={query}
    oninput={handleInput}
    onkeydown={handleKeydown}
    placeholder="Search products..."
  />
  {#if suggestions.length > 0}
    <ul class="suggestions">
      {#each suggestions as s, i (i)}
        <li>
          <button onclick={() => { goto(`/products/${s.slug}`); suggestions = []; }}>
            {s.name}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

## Checkout Flow

```svelte
<!-- src/routes/checkout/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getSpwigClient } from '$lib/spwig';
  import type { CheckoutSession, ShippingMethod, PaymentProvider } from '@spwig/sdk';

  const spwig = getSpwigClient();

  let step = $state<'address' | 'shipping' | 'payment' | 'review'>('address');
  let session = $state<CheckoutSession | null>(null);
  let shippingMethods = $state<ShippingMethod[]>([]);
  let paymentProviders = $state<PaymentProvider[]>([]);

  let address = $state({
    name: '', address1: '', city: '', state: '', postal_code: '', country: '',
  });

  onMount(async () => {
    session = await spwig.checkout.getSession();
  });

  async function submitAddress() {
    session = await spwig.checkout.setShippingAddress(address);
    shippingMethods = await spwig.checkout.getShippingMethods();
    step = 'shipping';
  }

  async function selectShipping(methodId: number) {
    session = await spwig.checkout.selectShippingMethod(methodId);
    paymentProviders = await spwig.checkout.getPaymentProviders();
    step = 'payment';
  }

  async function selectPayment(slug: string) {
    session = await spwig.checkout.selectPaymentMethod(slug);
    step = 'review';
  }

  async function completeOrder() {
    const order = await spwig.checkout.complete();
    goto(`/order-confirmation/${order.order_number}`);
  }
</script>

<h1>Checkout</h1>

{#if step === 'address'}
  <form onsubmit={(e) => { e.preventDefault(); submitAddress(); }}>
    <input bind:value={address.name} placeholder="Full name" required />
    <input bind:value={address.address1} placeholder="Address" required />
    <input bind:value={address.city} placeholder="City" required />
    <input bind:value={address.state} placeholder="State" required />
    <input bind:value={address.postal_code} placeholder="Postal code" required />
    <input bind:value={address.country} placeholder="Country (US, GB...)" required />
    <button type="submit">Continue to shipping</button>
  </form>
{/if}

{#if step === 'shipping'}
  <h2>Select shipping method</h2>
  {#each shippingMethods as method (method.id)}
    <button onclick={() => selectShipping(method.id)}>
      {method.name} — {session?.currency} {method.price}
      {#if method.estimated_days}({method.estimated_days} days){/if}
    </button>
  {/each}
{/if}

{#if step === 'payment'}
  <h2>Select payment method</h2>
  {#each paymentProviders as provider (provider.id)}
    <button onclick={() => selectPayment(provider.slug)}>
      {provider.name}
    </button>
  {/each}
{/if}

{#if step === 'review' && session}
  <h2>Review order</h2>
  <p>Subtotal: {session.currency} {session.subtotal}</p>
  <p>Shipping: {session.currency} {session.shipping_cost}</p>
  <p>Tax: {session.currency} {session.tax}</p>
  <p><strong>Total: {session.currency} {session.total}</strong></p>
  <button onclick={completeOrder}>Place order</button>
{/if}
```

## Stripe Payment Integration

For stores using Stripe as a payment provider, integrate Stripe Elements into the checkout flow. This involves creating a payment intent via the Spwig SDK, mounting Stripe Elements, and confirming the payment.

### Stripe Payment Component (`src/lib/components/StripePayment.svelte`)

```svelte
<!-- src/lib/components/StripePayment.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_STRIPE_KEY } from '$env/static/public';
  import { getSpwigClient } from '$lib/spwig';
  import type { CheckoutSession } from '@spwig/sdk';

  interface Props {
    session: CheckoutSession;
    onSuccess: (orderNumber: string) => void;
    onError: (message: string) => void;
  }

  let { session, onSuccess, onError }: Props = $props();

  let stripe: any = null;
  let elements: any = null;
  let paymentElement: any = null;
  let processing = $state(false);
  let mounted = $state(false);
  let cardContainer: HTMLDivElement;

  onMount(async () => {
    // Dynamically load Stripe.js
    const stripeModule = await import('@stripe/stripe-js');
    stripe = await stripeModule.loadStripe(PUBLIC_STRIPE_KEY);

    if (!stripe) {
      onError('Failed to load Stripe');
      return;
    }

    // Create a payment intent via Spwig SDK
    const spwig = getSpwigClient();
    const intent = await spwig.payments.createIntent({
      amount: session.total,
      currency: session.currency,
      provider: 'stripe',
    });

    if (!intent.client_secret) {
      onError('Failed to create payment intent');
      return;
    }

    // Mount Stripe Payment Element
    elements = stripe.elements({
      clientSecret: intent.client_secret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3b82f6',
          borderRadius: '8px',
        },
      },
    });

    paymentElement = elements.create('payment');
    paymentElement.mount(cardContainer);
    mounted = true;
  });

  async function handleSubmit() {
    if (!stripe || !elements || processing) return;

    processing = true;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirm`,
      },
      redirect: 'if_required', // Only redirect for 3DS
    });

    if (error) {
      // Card declined, expired, or other payment error
      onError(error.message ?? 'Payment failed');
      processing = false;
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Complete the order via Spwig
      try {
        const spwig = getSpwigClient();
        const order = await spwig.checkout.complete({
          payment_intent_id: paymentIntent.id,
        });
        onSuccess(order.order_number);
      } catch {
        onError('Payment succeeded but order creation failed. Contact support.');
      }
    }

    processing = false;
  }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  <div bind:this={cardContainer}></div>

  {#if mounted}
    <button type="submit" disabled={processing}>
      {#if processing}Processing...{:else}Pay {session.currency} {session.total}{/if}
    </button>
  {/if}
</form>
```

### Handling 3DS Redirect (`src/routes/checkout/confirm/+page.server.ts`)

When Stripe requires 3D Secure authentication, the customer is redirected. Handle the return:

```typescript
// src/routes/checkout/confirm/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { getSpwig } from '$lib/server/spwig';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const paymentIntentId = url.searchParams.get('payment_intent');
  const redirectStatus = url.searchParams.get('redirect_status');

  if (redirectStatus !== 'succeeded' || !paymentIntentId) {
    return { error: 'Payment was not completed. Please try again.' };
  }

  // Complete the order server-side
  const spwig = getSpwig(cookies);
  try {
    const order = await spwig.checkout.complete({
      payment_intent_id: paymentIntentId,
    });
    redirect(303, `/order-confirmation/${order.order_number}`);
  } catch {
    return { error: 'Payment succeeded but order could not be created. Contact support.' };
  }
};
```

### Using StripePayment in the Checkout

Replace the review step's "Place order" button with the Stripe component when Stripe is selected:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import StripePayment from '$lib/components/StripePayment.svelte';

  // ... checkout state from above

  let paymentError = $state('');
  const isStripe = $derived(session?.payment_method === 'stripe');
</script>

{#if step === 'review' && session}
  <h2>Review order</h2>
  <p>Total: <strong>{session.currency} {session.total}</strong></p>

  {#if paymentError}
    <p class="error">{paymentError}</p>
  {/if}

  {#if isStripe}
    <StripePayment
      {session}
      onSuccess={(orderNumber) => goto(`/order-confirmation/${orderNumber}`)}
      onError={(msg) => (paymentError = msg)}
    />
  {:else}
    <button onclick={completeOrder}>Place order</button>
  {/if}
{/if}
```

## Error Handling

### Route-level Error Page (`src/routes/+error.svelte`)

SvelteKit displays this component when a load function throws or calls `error()`:

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>Error {page.status} | My Store</title>
</svelte:head>

<div class="error-page">
  <h1>{page.status}</h1>

  {#if page.status === 404}
    <p>The page you are looking for does not exist.</p>
    <a href="/">Go to homepage</a>
  {:else if page.status === 500}
    <p>Something went wrong on our end. Please try again later.</p>
  {:else}
    <p>{page.error?.message ?? 'An unexpected error occurred.'}</p>
  {/if}

  <a href="/">Back to store</a>
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    gap: 1rem;
  }
  h1 { font-size: 4rem; margin: 0; }
</style>
```

### Server Error Hook (`src/hooks.server.ts`)

Log errors and sanitize what is exposed to the client:

```typescript
// src/hooks.server.ts
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { SpwigApiError, SpwigNetworkError, SpwigTimeoutError } from '@spwig/sdk';

const protectedPaths = ['/account', '/orders', '/checkout'];

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('spwig_token');
  const isProtected = protectedPaths.some((p) => event.url.pathname.startsWith(p));

  if (isProtected && !token) {
    redirect(303, `/login?redirect=${event.url.pathname}`);
  }

  return resolve(event);
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  // Log the full error server-side
  const requestId = crypto.randomUUID();
  console.error(`[${requestId}] Error on ${event.url.pathname}:`, error);

  // Provide specific messages for known Spwig errors
  if (error instanceof SpwigNetworkError) {
    return {
      message: 'Unable to reach the store backend. Please try again.',
      requestId,
    };
  }
  if (error instanceof SpwigTimeoutError) {
    return {
      message: 'The request timed out. Please try again.',
      requestId,
    };
  }
  if (error instanceof SpwigApiError) {
    return {
      message: error.apiMessage ?? 'An error occurred while processing your request.',
      requestId,
    };
  }

  // Generic fallback -- never leak internal details to the client
  return {
    message: 'An unexpected error occurred.',
    requestId,
  };
};
```

### Toast Notification Store (`src/lib/stores/toast.ts`)

A lightweight store for client-side error and success notifications:

```typescript
// src/lib/stores/toast.ts
import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(type: Toast['type'], message: string, duration = 5000) {
    const id = crypto.randomUUID();
    update((toasts) => [...toasts, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }

  function dismiss(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    success: (msg: string) => add('success', msg),
    error: (msg: string) => add('error', msg, 8000),
    info: (msg: string) => add('info', msg),
    dismiss,
  };
}

export const toasts = createToastStore();
```

### Toast Container Component (`src/lib/components/ToastContainer.svelte`)

```svelte
<!-- src/lib/components/ToastContainer.svelte -->
<script lang="ts">
  import { toasts } from '$lib/stores/toast';
</script>

<div class="toast-container" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}" role="alert">
      <span>{toast.message}</span>
      <button onclick={() => toasts.dismiss(toast.id)} aria-label="Dismiss">&times;</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 9999;
    max-width: 400px;
  }
  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.2s ease-out;
  }
  .toast-success { background: #16a34a; }
  .toast-error { background: #dc2626; }
  .toast-info { background: #2563eb; }
  .toast button {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    margin-left: 1rem;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>
```

Usage with cart actions:

```svelte
<script lang="ts">
  import { toasts } from '$lib/stores/toast';
  import { SpwigApiError } from '@spwig/sdk';

  async function addToCart() {
    try {
      await spwig.cart.add({ product_id: data.product.id, quantity: 1 });
      toasts.success('Added to cart!');
    } catch (err) {
      if (err instanceof SpwigApiError) {
        toasts.error(err.apiMessage ?? 'Could not add to cart.');
      } else {
        toasts.error('Something went wrong. Please try again.');
      }
    }
  }
</script>
```

## Webhook Handler

```typescript
// src/routes/api/webhooks/spwig/+server.ts
import { verifyWebhookSignature, WEBHOOK_EVENTS } from '@spwig/sdk/webhooks';
import { WEBHOOK_SECRET } from '$env/static/private';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('X-Spwig-Signature');

  if (!signature) {
    error(400, 'Missing signature');
  }

  const valid = await verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
  if (!valid) {
    error(401, 'Invalid signature');
  }

  const payload = JSON.parse(body);

  switch (payload.event) {
    case WEBHOOK_EVENTS.ORDER_CREATED:
      console.log('New order:', payload.data.order_number);
      break;
    case WEBHOOK_EVENTS.ORDER_PAID:
      console.log('Payment received:', payload.data.order_number);
      break;
  }

  return json({ received: true });
};
```

## Auth Guard (Hook)

```typescript
// src/hooks.server.ts
import { redirect, type Handle } from '@sveltejs/kit';

const protectedPaths = ['/account', '/orders', '/checkout'];

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('spwig_token');
  const isProtected = protectedPaths.some((p) => event.url.pathname.startsWith(p));

  if (isProtected && !token) {
    redirect(303, `/login?redirect=${event.url.pathname}`);
  }

  return resolve(event);
};
```

> **Note:** The Error Handling section above shows a more complete `hooks.server.ts` that combines auth guard with `handleError`. In production, merge both into a single file.

## Currency Switcher

```svelte
<!-- src/lib/components/CurrencySwitcher.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { getSpwigClient } from '$lib/spwig';
  import type { Currency } from '@spwig/sdk';

  const spwig = getSpwigClient();
  let currencies = $state<Currency[]>([]);
  let current = $state('');

  onMount(async () => {
    currencies = await spwig.store.listActiveCurrencies();
    current = localStorage.getItem('preferred_currency') ?? currencies[0]?.code ?? 'EUR';
    spwig.setCurrency(current);
  });

  function handleChange(e: Event) {
    const code = (e.target as HTMLSelectElement).value;
    current = code;
    spwig.setCurrency(code);
    localStorage.setItem('preferred_currency', code);
    invalidateAll(); // Re-run load functions
  }
</script>

<select value={current} onchange={handleChange}>
  {#each currencies as c (c.code)}
    <option value={c.code}>{c.symbol} {c.code}</option>
  {/each}
</select>
```

## Price Formatting Helper

```typescript
// src/lib/format.ts
export function formatPrice(amount: string, currency: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(parseFloat(amount));
}

// Usage: formatPrice("86.39", "USD") → "$86.39"
// Usage: formatPrice("79.99", "EUR", "de") → "79,99 €"
```

## Deployment

### Vercel

Use `@sveltejs/adapter-vercel` for serverless deployment with edge functions:

```bash
npm install -D @sveltejs/adapter-vercel
```

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x',
    }),
  },
};
```

Set `PUBLIC_SPWIG_URL`, `SPWIG_URL`, `WEBHOOK_SECRET`, and `PUBLIC_STRIPE_KEY` in the Vercel dashboard under Environment Variables.

### Node.js with Docker

Use `@sveltejs/adapter-node` for self-hosted deployment:

```bash
npm install -D @sveltejs/adapter-node
```

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build',
    }),
  },
};
```

```dockerfile
# Dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
```

Run with environment variables:

```bash
docker build -t my-store .
docker run -p 3000:3000 \
  -e PUBLIC_SPWIG_URL=https://shop.example.com \
  -e SPWIG_URL=http://spwig-backend:8000 \
  -e WEBHOOK_SECRET=whsec_... \
  my-store
```

### Static Site (Prerendered)

Use `@sveltejs/adapter-static` for fully prerendered pages. Best for catalog-only sites without dynamic cart/checkout:

```bash
npm install -D @sveltejs/adapter-static
```

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: true,
    }),
    prerender: {
      entries: ['*'],
    },
  },
};
```

Mark dynamic routes (cart, checkout, account) as non-prerendered:

```typescript
// src/routes/cart/+page.ts
export const prerender = false;
export const ssr = false;
```

> **Tip:** Static prerendering works well for product listing and detail pages. Cart, checkout, and account pages should remain client-rendered or use `adapter-node`/`adapter-vercel` for SSR.
