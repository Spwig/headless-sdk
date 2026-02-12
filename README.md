# Spwig Headless SDK

The official TypeScript SDK for building headless storefronts with [Spwig](https://spwig.com) eCommerce.

Build your storefront with **Next.js**, **Nuxt**, **SvelteKit**, **Remix**, **Astro**, or any framework — Spwig handles everything else: products, orders, payments, shipping, and more.

## Features

- **Zero dependencies** — uses native `fetch` (Node 18+, Deno, Bun, Cloudflare Workers, browsers)
- **Fully typed** — auto-generated TypeScript types from the Spwig OpenAPI schema
- **Modular API** — catalog, cart, checkout, orders, auth, wishlist, loyalty, search, webhooks
- **Error handling** — typed error classes for validation, auth, timeout, and network errors
- **Webhook verification** — built-in HMAC-SHA256 signature verification
- **Multi-language & multi-currency** — first-class i18n and currency switching support

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

// Add to cart
await spwig.cart.add({ product_id: 42, quantity: 1 });

// Checkout
const session = await spwig.checkout.getSession();
await spwig.checkout.setShippingAddress({ name: 'John', address1: '123 Main St', ... });
const order = await spwig.checkout.complete();
```

## Documentation

### Getting Started

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/headless/01-getting-started.md) | Install, configure CORS, make your first API call |
| [Architecture](docs/headless/02-architecture.md) | Data flow, deployment models, SSR vs CSR, caching |
| [SDK Reference](docs/SDK_REFERENCE.md) | Full API reference with code examples for every module |

### Core APIs

| Guide | Description |
|-------|-------------|
| [Authentication](docs/headless/03-authentication.md) | Login, register, social OAuth, token management |
| [Catalog API](docs/headless/04-catalog-api.md) | Products, categories, brands, collections, reviews, stock |
| [Cart & Checkout](docs/headless/05-cart-and-checkout.md) | Cart operations, vouchers, multi-step checkout flow |
| [Orders & Returns](docs/headless/06-orders.md) | Order history, tracking, status flow, return requests |
| [Webhooks](docs/headless/07-webhooks.md) | Event types, signature verification, handler examples |

### Internationalization

| Guide | Description |
|-------|-------------|
| [Multi-Language](docs/headless/08-multi-language.md) | Accept-Language header, RTL support, hreflang SEO |
| [Multi-Currency](docs/headless/09-multi-currency.md) | Currency switching, exchange rates, price formatting |

### Deployment & Operations

| Guide | Description |
|-------|-------------|
| [Proxy Configuration](docs/headless/10-proxy-configuration.md) | NGINX, Caddy, Apache, Traefik (same-domain & subdomain) |
| [Environment Variables](docs/headless/11-environment-variables.md) | All backend env vars for headless deployments |
| [Rate Limits](docs/headless/12-rate-limits.md) | Throttling tiers, 429 handling, retry strategies |
| [Error Handling](docs/headless/13-error-handling.md) | SDK error classes, validation errors, error boundaries |

### Framework Examples

| Framework | Guide |
|-----------|-------|
| Next.js (App Router) | [examples/nextjs-example.md](docs/headless/examples/nextjs-example.md) |
| Nuxt 3 | [examples/nuxt-example.md](docs/headless/examples/nuxt-example.md) |
| SvelteKit | [examples/sveltekit-example.md](docs/headless/examples/sveltekit-example.md) |

### AI Context

Building with an AI assistant? Drop the files from [docs/headless/ai-context/](docs/headless/ai-context/) into your assistant for instant Spwig API knowledge.

## Requirements

- **Node.js 18+** (or any runtime with native `fetch` and `crypto.subtle`)
- **Spwig backend v2.0+** running and accessible

## License

MIT
