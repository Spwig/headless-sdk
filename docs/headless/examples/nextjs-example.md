# Next.js App Router Example

Complete examples for building a headless Spwig storefront with Next.js 14+ (App Router).

## Setup

```bash
npx create-next-app@latest my-store --typescript --app
cd my-store
npm install @spwig/sdk
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SPWIG_URL=https://example.com   # Used in client components
SPWIG_URL=https://example.com               # Used in server components (can be internal URL)
SPWIG_WEBHOOK_SECRET=whsec_...              # Webhook signature verification
STRIPE_SECRET_KEY=sk_live_...               # Stripe server-side key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # Stripe client-side key
```

### Environment Variable Validation (`lib/env.ts`)

Validate required environment variables at startup rather than discovering missing
values at runtime in production. This module throws immediately if a required
variable is absent, and provides a type-safe accessor for the rest of your code.

```typescript
// lib/env.ts

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env.local (development) or your hosting provider's env config (production).`
    );
  }
  return value;
}

/** Server-only environment variables. Never import this file from client components. */
export const env = {
  get SPWIG_URL() { return requireEnv('SPWIG_URL'); },
  get SPWIG_WEBHOOK_SECRET() { return requireEnv('SPWIG_WEBHOOK_SECRET'); },
  get STRIPE_SECRET_KEY() { return requireEnv('STRIPE_SECRET_KEY'); },
} as const;

/** Client-safe environment variables (NEXT_PUBLIC_ prefix). */
export const clientEnv = {
  get SPWIG_URL() { return requireEnv('NEXT_PUBLIC_SPWIG_URL'); },
  get STRIPE_PUBLISHABLE_KEY() { return requireEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'); },
} as const;
```

Use `env.SPWIG_URL` in server components and `clientEnv.SPWIG_URL` in client
components. Any typo or missing variable surfaces immediately with a clear message.

## SDK Client

### Server-side client (`lib/spwig-server.ts`)

```typescript
import { SpwigClient } from '@spwig/sdk';
import { cookies } from 'next/headers';

export async function getSpwig() {
  const cookieStore = await cookies();
  const token = cookieStore.get('spwig_token')?.value;
  const lang = cookieStore.get('NEXT_LOCALE')?.value ?? 'en';

  return new SpwigClient({
    baseUrl: process.env.SPWIG_URL!,
    token,
    language: lang,
  });
}
```

### Client-side client (`lib/spwig-client.ts`)

```typescript
'use client';

import { SpwigClient } from '@spwig/sdk';

let client: SpwigClient | null = null;

export function getSpwigClient(): SpwigClient {
  if (!client) {
    client = new SpwigClient({
      baseUrl: process.env.NEXT_PUBLIC_SPWIG_URL!,
      token: typeof window !== 'undefined'
        ? localStorage.getItem('spwig_token') ?? undefined
        : undefined,
      onUnauthorized: () => {
        localStorage.removeItem('spwig_token');
        window.location.href = '/login';
      },
    });
  }
  return client;
}
```

## Product Listing (Server Component)

```typescript
// app/products/page.tsx
import { getSpwig } from '@/lib/spwig-server';
import Link from 'next/link';
import { SpwigImage } from '@/components/spwig-image';

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const spwig = await getSpwig();
  const products = await spwig.catalog.products.list({
    page: Number(params.page) || 1,
    category: params.category,
  });

  return (
    <div>
      <h1>Products</h1>
      <div className="grid grid-cols-3 gap-4">
        {products.results.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <div className="border rounded p-4">
              {product.images?.[0] && (
                <SpwigImage
                  src={product.images[0].image}
                  alt={product.images[0].alt_text || product.name}
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
              <h2>{product.name}</h2>
              <p>{product.currency} {product.price}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        {products.previous && (
          <Link href={`/products?page=${Number(params.page || 2) - 1}`}>
            Previous
          </Link>
        )}
        {products.next && (
          <Link href={`/products?page=${Number(params.page || 1) + 1}`}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
```

## Image Optimization

Spwig serves product and media images from the backend domain. Configure Next.js
to allow optimized loading of these remote images, then use `next/image` throughout
your storefront for automatic format conversion, resizing, and lazy loading.

### `next.config.ts` remote patterns

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const SPWIG_HOSTNAME = new URL(process.env.SPWIG_URL ?? process.env.NEXT_PUBLIC_SPWIG_URL ?? 'http://localhost:8000').hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SPWIG_HOSTNAME,
        pathname: '/media/**',
      },
    ],
  },
  // For Docker deployments:
  // output: 'standalone',
};

export default nextConfig;
```

### Reusable product image component (`components/spwig-image.tsx`)

```typescript
// components/spwig-image.tsx
import Image from 'next/image';

interface SpwigImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Wraps next/image for Spwig media URLs. Handles relative paths
 * by prepending the backend URL, and provides sensible defaults.
 */
export function SpwigImage({ src, alt, width, height, sizes, priority, className }: SpwigImageProps) {
  // Spwig image URLs may be absolute or relative (/media/...)
  const resolvedSrc = src.startsWith('http')
    ? src
    : `${process.env.NEXT_PUBLIC_SPWIG_URL}${src}`;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      priority={priority}
      className={className}
      placeholder="empty"
    />
  );
}
```

### Blur-up placeholder pattern

For above-the-fold hero images or featured products, generate a tiny base64
placeholder at build time. This shows a blurred preview while the full image loads.

```typescript
// lib/image-placeholder.ts

/** Fetch a tiny version of the image and return a base64 data URI for blur-up. */
export async function getBlurPlaceholder(imageUrl: string): Promise<string> {
  const url = imageUrl.startsWith('http')
    ? imageUrl
    : `${process.env.SPWIG_URL}${imageUrl}`;

  const res = await fetch(`${url}?w=20&q=10`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}
```

```typescript
// In a server component:
import Image from 'next/image';
import { getBlurPlaceholder } from '@/lib/image-placeholder';

const blurDataURL = await getBlurPlaceholder(product.images[0].image);

<Image
  src={`${process.env.NEXT_PUBLIC_SPWIG_URL}${product.images[0].image}`}
  alt={product.name}
  width={800}
  height={800}
  placeholder="blur"
  blurDataURL={blurDataURL}
  priority
/>
```

## Product Detail (Server Component + Client Actions)

```typescript
// app/products/[slug]/page.tsx
import { getSpwig } from '@/lib/spwig-server';
import { AddToCartButton } from './add-to-cart-button';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spwig = await getSpwig();
  const product = await spwig.catalog.products.get(slug);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.currency} {product.price}</p>
      <div dangerouslySetInnerHTML={{ __html: product.description }} />
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

```typescript
// app/products/[slug]/add-to-cart-button.tsx
'use client';

import { useState } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import { SpwigValidationError } from '@spwig/sdk';

export function AddToCartButton({ productId }: { productId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleAddToCart() {
    setLoading(true);
    setError(undefined);
    try {
      const spwig = getSpwigClient();
      await spwig.cart.add({ product_id: productId, quantity: 1 });
      // Optionally trigger a cart count refresh
    } catch (err) {
      if (err instanceof SpwigValidationError) {
        setError(Object.values(err.fieldErrors).flat().join(', '));
      } else {
        setError('Failed to add to cart');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleAddToCart} disabled={loading}>
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

## SEO Metadata

### Product page metadata (`app/products/[slug]/page.tsx`)

Add a `generateMetadata` export to the product detail page. Next.js calls this
function at request time and merges the result into the page's `<head>`.

```typescript
// app/products/[slug]/page.tsx (add alongside the default export)
import type { Metadata } from 'next';
import { getSpwig } from '@/lib/spwig-server';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const spwig = await getSpwig();
  const product = await spwig.catalog.products.get(slug);

  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage
    ? (primaryImage.image.startsWith('http')
        ? primaryImage.image
        : `${process.env.NEXT_PUBLIC_SPWIG_URL}${primaryImage.image}`)
    : undefined;

  return {
    title: product.name,
    description: product.description.replace(/<[^>]*>/g, '').slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.replace(/<[^>]*>/g, '').slice(0, 160),
      images: imageUrl ? [{ url: imageUrl, alt: primaryImage!.alt_text || product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}
```

### JSON-LD structured data

Embed schema.org `Product` markup so search engines can display rich results
(price, availability, reviews).

```typescript
// components/product-jsonld.tsx
import type { Product } from '@spwig/sdk';

export function ProductJsonLd({ product, storeUrl }: { product: Product; storeUrl: string }) {
  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage
    ? (primaryImage.image.startsWith('http') ? primaryImage.image : `${storeUrl}${primaryImage.image}`)
    : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description.replace(/<[^>]*>/g, ''),
    sku: product.sku,
    image: imageUrl,
    url: `${storeUrl}/products/${product.slug}`,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${storeUrl}/products/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

Use it in the product page:

```typescript
// Inside app/products/[slug]/page.tsx default export:
<ProductJsonLd product={product} storeUrl={process.env.NEXT_PUBLIC_SPWIG_URL!} />
```

### Category page metadata

```typescript
// app/categories/[slug]/page.tsx
import type { Metadata } from 'next';
import { getSpwig } from '@/lib/spwig-server';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const spwig = await getSpwig();
  const category = await spwig.catalog.categories.get(slug);

  const imageUrl = category.image
    ? (category.image.startsWith('http') ? category.image : `${process.env.NEXT_PUBLIC_SPWIG_URL}${category.image}`)
    : undefined;

  return {
    title: `${category.name} — Shop`,
    description: category.description?.replace(/<[^>]*>/g, '').slice(0, 160)
      || `Browse ${category.product_count} products in ${category.name}.`,
    openGraph: {
      title: category.name,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}
```

### `robots.txt` route handler

```typescript
// app/robots.txt/route.ts
export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SPWIG_URL ?? 'https://example.com';

  const body = `User-agent: *
Allow: /
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

### `sitemap.xml` route handler

Dynamically generates a sitemap by fetching all products and categories from Spwig.

```typescript
// app/sitemap.xml/route.ts
import { SpwigClient } from '@spwig/sdk';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SPWIG_URL ?? 'https://example.com';
  const spwig = new SpwigClient({ baseUrl: process.env.SPWIG_URL! });

  // Fetch all products (paginate through all pages)
  const productUrls: string[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const products = await spwig.catalog.products.list({ page, is_available: true });
    for (const p of products.results) {
      productUrls.push(`${siteUrl}/products/${p.slug}`);
    }
    hasNext = !!products.next;
    page++;
  }

  // Fetch all categories
  const categories = await spwig.catalog.categories.list({ page_size: 200 });
  const categoryUrls = categories.results.map(
    (c) => `${siteUrl}/categories/${c.slug}`
  );

  const urls = [
    siteUrl,
    `${siteUrl}/products`,
    ...categoryUrls,
    ...productUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

## Cart Page

```typescript
// app/cart/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import type { Cart } from '@spwig/sdk';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const spwig = getSpwigClient();

  useEffect(() => {
    spwig.cart.get().then(setCart);
  }, []);

  async function updateQuantity(itemId: number, quantity: number) {
    const updated = await spwig.cart.updateItem(itemId, { quantity });
    setCart(updated);
  }

  async function removeItem(itemId: number) {
    const updated = await spwig.cart.removeItem(itemId);
    setCart(updated);
  }

  if (!cart) return <p>Loading cart...</p>;
  if (cart.items.length === 0) return <p>Your cart is empty.</p>;

  return (
    <div>
      <h1>Cart ({cart.item_count} items)</h1>
      {cart.items.map((item) => (
        <div key={item.id} className="flex justify-between py-2 border-b">
          <div>
            <p>{item.product_name}</p>
            <p>{item.currency} {item.unit_price} x {item.quantity}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </div>
        </div>
      ))}
      <p className="mt-4 text-xl">Total: {cart.currency} {cart.total}</p>
    </div>
  );
}
```

## Loading States and Error Boundaries

### Product listing skeleton (`app/products/loading.tsx`)

Next.js automatically shows `loading.tsx` while the server component in the same
route segment is streaming. Use a skeleton that mirrors the product grid layout.

```typescript
// app/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border rounded p-4 space-y-3">
            <div className="aspect-square bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Product page error boundary (`app/products/[slug]/error.tsx`)

If fetching a product fails (404, network error, etc.), this boundary catches the
error and shows a recovery UI without crashing the entire app.

```typescript
// app/products/[slug]/error.tsx
'use client';

import { useEffect } from 'react';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an error reporting service
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-gray-600">
        We could not load this product. It may have been removed or is temporarily unavailable.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  );
}
```

### Suspense boundaries for client components

Wrap client-side interactive sections in `<Suspense>` to prevent them from
blocking the initial HTML stream.

```typescript
// app/products/[slug]/page.tsx (server component)
import { Suspense } from 'react';
import { AddToCartButton } from './add-to-cart-button';
import { ProductReviews } from './product-reviews';

// Inside the return:
<Suspense fallback={<div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />}>
  <AddToCartButton productId={product.id} />
</Suspense>

<Suspense fallback={<p>Loading reviews...</p>}>
  <ProductReviews productId={product.id} />
</Suspense>
```

### Optimistic cart updates

Update the UI immediately when the customer changes cart quantities, then revert
if the server request fails. This makes the cart feel instant.

```typescript
// hooks/use-optimistic-cart.ts
'use client';

import { useState, useCallback } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import type { Cart } from '@spwig/sdk';

export function useOptimisticCart(initialCart: Cart) {
  const [cart, setCart] = useState<Cart>(initialCart);
  const spwig = getSpwigClient();

  const updateQuantity = useCallback(async (itemId: number, newQuantity: number) => {
    // Snapshot current state for rollback
    const previousCart = cart;

    // Optimistic update: change quantity in local state immediately
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ),
    }));

    try {
      const serverCart = await spwig.cart.updateItem(itemId, { quantity: newQuantity });
      setCart(serverCart); // Replace with authoritative server state
    } catch {
      setCart(previousCart); // Revert on failure
    }
  }, [cart, spwig]);

  const removeItem = useCallback(async (itemId: number) => {
    const previousCart = cart;

    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
      item_count: prev.item_count - 1,
    }));

    try {
      const serverCart = await spwig.cart.removeItem(itemId);
      setCart(serverCart);
    } catch {
      setCart(previousCart);
    }
  }, [cart, spwig]);

  return { cart, setCart, updateQuantity, removeItem };
}
```

## Authentication (Server Action)

```typescript
// app/login/actions.ts
'use server';

import { SpwigClient, SpwigAuthError, SpwigValidationError } from '@spwig/sdk';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(_prev: unknown, formData: FormData) {
  const spwig = new SpwigClient({ baseUrl: process.env.SPWIG_URL! });

  try {
    const { token } = await spwig.auth.login({
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    });

    const cookieStore = await cookies();
    cookieStore.set('spwig_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch (err) {
    if (err instanceof SpwigAuthError) {
      return { error: 'Invalid username or password.' };
    }
    if (err instanceof SpwigValidationError) {
      return { errors: err.fieldErrors };
    }
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/account');
}
```

```typescript
// app/login/page.tsx
'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action}>
      <h1>Login</h1>
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <input name="username" placeholder="Username" required />
      {state?.errors?.username && <p className="text-red-500">{state.errors.username[0]}</p>}
      <input name="password" type="password" placeholder="Password" required />
      {state?.errors?.password && <p className="text-red-500">{state.errors.password[0]}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Search with Autocomplete

```typescript
// app/search/search-input.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import type { AutocompleteSuggestion } from '@spwig/sdk';
import { useRouter } from 'next/navigation';

export function SearchInput() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const spwig = getSpwigClient();
      const results = await spwig.search.autocomplete(query);
      setSuggestions(results);
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${query}`)}
        placeholder="Search products..."
      />
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-white border shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => router.push(`/products/${s.slug}`)}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Checkout Flow

```typescript
// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import type { CheckoutSession, ShippingMethod, PaymentProvider } from '@spwig/sdk';

type Step = 'address' | 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const spwig = getSpwigClient();
  const [step, setStep] = useState<Step>('address');
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);

  useEffect(() => {
    spwig.checkout.getSession().then(setSession);
  }, []);

  async function submitAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updated = await spwig.checkout.setShippingAddress({
      name: form.get('name') as string,
      address1: form.get('address1') as string,
      city: form.get('city') as string,
      state: form.get('state') as string,
      postal_code: form.get('postal_code') as string,
      country: form.get('country') as string,
    });
    setSession(updated);
    const methods = await spwig.checkout.getShippingMethods();
    setShippingMethods(methods);
    setStep('shipping');
  }

  async function selectShipping(methodId: number) {
    const updated = await spwig.checkout.selectShippingMethod(methodId);
    setSession(updated);
    const providers = await spwig.checkout.getPaymentProviders();
    setPaymentProviders(providers);
    setStep('payment');
  }

  async function selectPayment(providerSlug: string) {
    const updated = await spwig.checkout.selectPaymentMethod(providerSlug);
    setSession(updated);
    setStep('review');
  }

  async function completeOrder() {
    const order = await spwig.checkout.complete();
    window.location.href = `/order-confirmation/${order.order_number}`;
  }

  return (
    <div>
      <h1>Checkout</h1>

      {step === 'address' && (
        <form onSubmit={submitAddress}>
          <input name="name" placeholder="Full name" required />
          <input name="address1" placeholder="Address" required />
          <input name="city" placeholder="City" required />
          <input name="state" placeholder="State" required />
          <input name="postal_code" placeholder="Postal code" required />
          <input name="country" placeholder="Country code (US, GB...)" required />
          <button type="submit">Continue to shipping</button>
        </form>
      )}

      {step === 'shipping' && (
        <div>
          <h2>Select shipping method</h2>
          {shippingMethods.map((m) => (
            <button key={m.id} onClick={() => selectShipping(m.id)}>
              {m.name} — {session?.currency} {m.price}
              {m.estimated_days && ` (${m.estimated_days} days)`}
            </button>
          ))}
        </div>
      )}

      {step === 'payment' && (
        <div>
          <h2>Select payment method</h2>
          {paymentProviders.map((p) => (
            <button key={p.id} onClick={() => selectPayment(p.slug)}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {step === 'review' && session && (
        <div>
          <h2>Review order</h2>
          <p>Subtotal: {session.currency} {session.subtotal}</p>
          <p>Shipping: {session.currency} {session.shipping_cost}</p>
          <p>Tax: {session.currency} {session.tax}</p>
          <p><strong>Total: {session.currency} {session.total}</strong></p>
          <button onClick={completeOrder}>Place order</button>
        </div>
      )}
    </div>
  );
}
```

### Stripe Payment Integration

When the merchant uses Stripe as a payment provider, integrate Stripe Elements to
collect card details securely. The flow is:

1. Customer selects Stripe as payment provider
2. Your frontend creates a PaymentIntent via the Spwig SDK
3. Stripe Elements collects card details (PCI-compliant, card data never touches your server)
4. On successful payment, complete the checkout

**Install Stripe packages:**

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

**Stripe provider wrapper (`components/stripe-provider.tsx`):**

```typescript
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { ReactNode } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeProviderProps {
  clientSecret: string;
  children: ReactNode;
}

export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#000000' },
        },
      }}
    >
      {children}
    </Elements>
  );
}
```

**Payment form (`components/stripe-payment-form.tsx`):**

```typescript
'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  returnUrl: string;
}

export function StripePaymentForm({ onSuccess, onError, returnUrl }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? 'Payment failed. Please try again.');
      setProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-4 w-full py-3 bg-black text-white rounded disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}
```

**Integrating into the checkout flow:**

```typescript
// In your checkout page, when the customer selects Stripe as the payment provider:
'use client';

import { useState } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import { StripeProvider } from '@/components/stripe-provider';
import { StripePaymentForm } from '@/components/stripe-payment-form';

function PaymentStep({ session }: { session: CheckoutSession }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const spwig = getSpwigClient();

  async function initStripePayment() {
    // Create a PaymentIntent via the Spwig SDK
    const intent = await spwig.payments.createIntent({
      amount: session.total,
      currency: session.currency,
      provider: 'stripe',
    });

    if (intent.client_secret) {
      setClientSecret(intent.client_secret);
    }
  }

  async function handlePaymentSuccess() {
    // Payment confirmed by Stripe — now complete the order in Spwig
    const order = await spwig.checkout.complete({ provider: 'stripe' });
    window.location.href = `/order-confirmation/${order.order_number}`;
  }

  if (!clientSecret) {
    return (
      <div>
        <button onClick={initStripePayment}>Pay with card</button>
      </div>
    );
  }

  return (
    <StripeProvider clientSecret={clientSecret}>
      <StripePaymentForm
        onSuccess={handlePaymentSuccess}
        onError={(msg) => setError(msg)}
        returnUrl={`${window.location.origin}/checkout/payment-return`}
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </StripeProvider>
  );
}
```

**Handling Stripe redirect returns (`app/checkout/payment-return/page.tsx`):**

Some payment methods (3D Secure, bank redirects) redirect the customer away from
your site. Handle the return:

```typescript
// app/checkout/payment-return/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSpwigClient } from '@/lib/spwig-client';

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    if (!paymentIntentId) {
      setStatus('failed');
      return;
    }

    const spwig = getSpwigClient();
    spwig.payments.getIntent(paymentIntentId).then((intent) => {
      if (intent.status === 'succeeded') {
        spwig.checkout.complete({ provider: 'stripe' }).then((order) => {
          window.location.href = `/order-confirmation/${order.order_number}`;
        });
      } else {
        setStatus('failed');
      }
    });
  }, [searchParams]);

  if (status === 'loading') return <p>Confirming your payment...</p>;
  if (status === 'failed') return <p>Payment failed. <a href="/checkout">Try again</a></p>;
  return null;
}
```

## Webhook Handler (Route Handler)

```typescript
// app/api/webhooks/spwig/route.ts
import { verifyWebhookSignature, WEBHOOK_EVENTS } from '@spwig/sdk/webhooks';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('X-Spwig-Signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const valid = await verifyWebhookSignature(body, signature, process.env.SPWIG_WEBHOOK_SECRET!);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case WEBHOOK_EVENTS.ORDER_CREATED:
      // Send confirmation email, update analytics, etc.
      console.log('New order:', event.data.order_number);
      break;
    case WEBHOOK_EVENTS.ORDER_PAID:
      console.log('Payment received for:', event.data.order_number);
      break;
    case WEBHOOK_EVENTS.INVENTORY_LOW_STOCK:
      // Alert the team
      break;
  }

  return NextResponse.json({ received: true });
}
```

## Currency Switcher

```typescript
// components/currency-switcher.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSpwigClient } from '@/lib/spwig-client';
import { useRouter } from 'next/navigation';
import type { Currency } from '@spwig/sdk';

export function CurrencySwitcher() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [current, setCurrent] = useState('');
  const router = useRouter();
  const spwig = getSpwigClient();

  useEffect(() => {
    spwig.store.listActiveCurrencies().then((list) => {
      setCurrencies(list);
      setCurrent(localStorage.getItem('preferred_currency') ?? list[0]?.code ?? 'EUR');
    });
  }, []);

  function handleChange(code: string) {
    setCurrent(code);
    spwig.setCurrency(code);
    localStorage.setItem('preferred_currency', code);
    router.refresh(); // Refresh server components with new currency
  }

  return (
    <select value={current} onChange={(e) => handleChange(e.target.value)}>
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );
}
```

## Middleware (Auth Protection)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/account', '/orders', '/checkout'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('spwig_token')?.value;
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/orders/:path*', '/checkout/:path*'],
};
```

## Deployment Notes

### Vercel

Set environment variables in the Vercel dashboard under **Settings > Environment Variables**.

| Variable | Server/Client | Notes |
|---|---|---|
| `SPWIG_URL` | Server only | Can be an internal/private network URL for faster server-to-server calls |
| `NEXT_PUBLIC_SPWIG_URL` | Client + Server | The public URL customers use to reach the Spwig backend |
| `SPWIG_WEBHOOK_SECRET` | Server only | From Spwig admin > Webhooks |
| `STRIPE_SECRET_KEY` | Server only | Stripe dashboard secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client + Server | Stripe dashboard publishable key |

No special build configuration is needed. Vercel detects Next.js automatically.

### Docker

Use `output: 'standalone'` in `next.config.ts` to produce a minimal self-contained
build (no `node_modules` in production). Here is a multi-stage Dockerfile:

```dockerfile
# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (NEXT_PUBLIC_ only — baked into the JS bundle)
ARG NEXT_PUBLIC_SPWIG_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SPWIG_URL=$NEXT_PUBLIC_SPWIG_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SPWIG_URL=https://shop.example.com \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  -t my-storefront .

docker run -p 3000:3000 \
  -e SPWIG_URL=http://spwig-backend:8000 \
  -e SPWIG_WEBHOOK_SECRET=whsec_... \
  -e STRIPE_SECRET_KEY=sk_live_... \
  my-storefront
```

Note that `NEXT_PUBLIC_*` variables are baked in at **build time** (they are
inlined into the JavaScript bundle). Server-only variables like `SPWIG_URL` are
read at **runtime** and can be passed via `docker run -e`.

### Key `next.config.ts` settings

```typescript
// next.config.ts — production-ready configuration
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Docker standalone builds
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_SPWIG_URL ?? 'https://example.com').hostname,
        pathname: '/media/**',
      },
    ],
  },

  // Recommended: strict React mode for catching bugs early
  reactStrictMode: true,

  // Optional: custom headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```
