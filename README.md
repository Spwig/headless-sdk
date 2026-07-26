# Spwig Headless SDK

[![Installs](https://spwig.com/badges/installs.svg)](https://spwig.com)
[![Live stores](https://spwig.com/badges/stores.svg)](https://spwig.com)
[![Clones (14d)](https://spwig.com/badges/clones.svg)](https://github.com/Spwig/commerce)

The official TypeScript SDK for building headless storefronts with [Spwig](https://spwig.com) eCommerce.

Build your storefront with **Next.js**, **Nuxt**, **SvelteKit**, **Remix**, **Astro**, or any framework — Spwig handles everything else: products, orders, payments, shipping, and more.

## Features

- **Zero dependencies** — uses native `fetch` (Node 18+, Deno, Bun, Cloudflare Workers, browsers)
- **Fully typed** — auto-generated TypeScript types from the Spwig OpenAPI schema
- **Modular API** — catalog, cart, checkout, orders, auth, wishlist, loyalty, search, webhooks, admin, POS
- **Error handling** — typed error classes for validation, auth, timeout, and network errors
- **Webhook verification** — built-in HMAC-SHA256 signature verification
- **Multi-language & multi-currency** — first-class i18n and currency switching support
- **POS support** — complete Point of Sale API for in-store terminals

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

## Package Exports

| Export | Import Path | Description |
|--------|-------------|-------------|
| Main | `@spwig/sdk` | SpwigClient with all storefront + admin + POS modules |
| Webhooks | `@spwig/sdk/webhooks` | Webhook utilities (verifySignature, parseHeaders) |
| Admin | `@spwig/sdk/admin` | AdminModule only (for admin-focused apps) |
| POS | `@spwig/sdk/pos` | PosModule only (for POS terminal apps) |

## Module Overview

### Storefront Modules (31)

| Module | Access | Description |
|--------|--------|-------------|
| `auth` | `spwig.auth` | Login, register, logout, OAuth, SMS verification |
| `catalog` | `spwig.catalog` | Products, categories, brands, collections, reviews, bookings, licenses |
| `cart` | `spwig.cart` | Cart items, vouchers, summary |
| `checkout` | `spwig.checkout` | Addresses, shipping, payment, order completion |
| `orders` | `spwig.orders` | Order history, details, returns |
| `account` | `spwig.account` | Profile, addresses, preferences, GDPR export |
| `search` | `spwig.search` | Autocomplete, results, trending, click tracking |
| `store` | `spwig.store` | Store info, currencies, payment methods |
| `loyalty` | `spwig.loyalty` | Tiers, rewards, redemptions, badges |
| `wishlist` | `spwig.wishlist` | Saved items management |
| `payments` | `spwig.payments` | Payment intents, saved payment methods |
| `webhooks` | `spwig.webhooks` | Endpoints, deliveries, event types |
| `blog` | `spwig.blog` | Posts, categories, tags, subscriptions |
| `announcements` | `spwig.announcements` | Active store banners |
| `pages` | `spwig.pages` | Public pages, legal pages |
| `forms` | `spwig.forms` | Form viewing and submission |
| `social` | `spwig.social` | Share tracking and counts |
| `messages` | `spwig.messages` | Contact form, messaging |
| `subscriptions` | `spwig.subscriptions` | Recurring billing plans |
| `geoip` | `spwig.geoip` | Location detection, currency/language suggestions |
| `recentlyViewed` | `spwig.recentlyViewed` | Product view tracking |
| `customizer` | `spwig.customizer` | Product customization editor |
| `customer` | `spwig.customer` | Dashboard, digital products, insights |
| `addressService` | `spwig.addressService` | Autocomplete, validation, geocoding |
| `referrals` | `spwig.referrals` | Referral program, tracking, rewards |
| `affiliate` | `spwig.affiliate` | Affiliate links, commissions, payouts |
| `wallet` | `spwig.wallet` | Balance and transaction history |
| `vouchers` | `spwig.vouchers` | Voucher validation, gift cards, applied discounts |
| `shipping` | `spwig.shipping` | Shipment tracking, carriers, tracking events |
| `tax` | `spwig.tax` | Tax rates, presets, tax calculation |
| `health` | `spwig.health` | Backend availability, liveness/readiness probes |

### Admin Modules (19)

| Module | Access | Description |
|--------|--------|-------------|
| `auth` | `spwig.admin.auth` | Staff login, 2FA, SSO, password reset |
| `analytics` | `spwig.admin.analytics` | Dashboard KPIs, sales data, advanced analytics |
| `orders` | `spwig.admin.orders` | Order management, status, refunds, documents |
| `products` | `spwig.admin.products` | Product CRUD, images, variants, attributes |
| `categories` | `spwig.admin.categories` | Category CRUD, banners |
| `brands` | `spwig.admin.brands` | Brand CRUD |
| `messages` | `spwig.admin.messages` | Inbox, replies, status |
| `settings` | `spwig.admin.settings` | App config, devices, push, sessions, branding |
| `wallets` | `spwig.admin.wallets` | Credit/debit, freeze, transactions |
| `staff` | `spwig.admin.staff` | Staff management, invitations |
| `roles` | `spwig.admin.roles` | Role & permission management |
| `inventory` | `spwig.admin.inventory` | Dashboard, low stock, velocity, reorder |
| `bulk` | `spwig.admin.bulk` | Bulk stock, pricing, order operations |
| `vouchers` | `spwig.admin.vouchers` | Voucher CRUD, gift cards, usage, restrictions |
| `shipping` | `spwig.admin.shipping` | Carriers, shipments, providers, documents |
| `pages` | `spwig.admin.pages` | Page builder, elements, versions, translations |
| `media` | `spwig.admin.media` | Media library, folders, tags, processing |
| `menus` | `spwig.admin.menus` | Menu CRUD, items, reorder, preview |
| `currencies` | `spwig.admin.currencies` | Activate/deactivate, reorder, display settings |

### POS Modules (10)

| Module | Access | Description |
|--------|--------|-------------|
| `auth` | `spwig.pos.auth` | Staff login, JWT tokens |
| `terminals` | `spwig.pos.terminals` | Registration, config, heartbeat, security |
| `catalog` | `spwig.pos.catalog` | Products, barcode lookup, categories |
| `cart` | `spwig.pos.cart` | Items, vouchers, gift cards, discounts, parking |
| `checkout` | `spwig.pos.checkout` | Cash, card, terminal, gift card, split tender |
| `inventory` | `spwig.pos.inventory` | Stock levels, adjustments, cross-location |
| `orders` | `spwig.pos.orders` | List, receipts, refunds, voids |
| `shifts` | `spwig.pos.shifts` | Open/close, cash movements, daily reports |
| `sync` | `spwig.pos.sync` | Offline data synchronization |
| `customers` | `spwig.pos.customers` | Search, create, loyalty lookup |

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

### Admin & POS API

| Guide | Description |
|-------|-------------|
| [Admin API Reference](docs/SDK_REFERENCE.md#admin-api-spwigadmin) | Staff auth, analytics, orders, products, inventory, bulk ops, vouchers, shipping, pages, media, menus, currencies |
| [POS API Reference](docs/SDK_REFERENCE.md#pos-api-spwigpos) | Terminal management, in-store checkout, shifts, offline sync |

### AI Context

Building with an AI assistant? Drop the files from [docs/headless/ai-context/](docs/headless/ai-context/) into your assistant for instant Spwig API knowledge.

## What's New in v1.3.6

### New Storefront Modules
- **Vouchers** — Validate voucher codes, check gift card balances, view applied discounts
- **Shipping** — Track shipments, view carriers, get tracking events
- **Tax** — Tax rates, presets, and real-time tax calculation
- **Health** — Backend health checks, Kubernetes liveness/readiness probes

### New Admin Modules
- **Vouchers** — Full voucher & gift card CRUD, usage tracking, bulk generation
- **Shipping** — Carrier management, shipment creation, provider accounts, shipping documents
- **Pages** — Page builder management, element CRUD, versioning, translations
- **Media** — Media library with assets, folders, tags, processing jobs
- **Menus** — Menu management with drag-and-drop reorder, mega menus, translations
- **Currencies** — Activate/deactivate currencies, reorder, display settings

### POS Module (New!)
Complete Point of Sale API for building in-store terminal applications:
- Terminal registration, configuration, and security (PIN/card unlock)
- Product catalog with barcode scanning
- Cart management with discounts, vouchers, and gift cards
- Multiple checkout methods: cash, card, terminal, gift card, split tender
- Inventory management with cross-location stock lookup
- Order management with receipt printing and digital receipts
- Shift management with cash movements
- Offline sync for disconnected operation
- Customer lookup and loyalty integration

## Requirements

- **Node.js 18+** (or any runtime with native `fetch` and `crypto.subtle`)
- **Spwig backend v2.0+** running and accessible

## Testing

Three layers, each answering a different question:

| Command | What it checks | Needs a server? |
|---------|----------------|-----------------|
| `npm test` | Unit tests (mocked HTTP) — each module builds the right request and unwraps the response — **plus** the coverage gate | No |
| `npm run audit:coverage` | Prints every contract endpoint with no wrapper, and every SDK call to a path outside the contract | No |
| `npm run test:integration` | Live smoke of the critical spine against a real Spwig | Yes |

**Coverage gate.** `src/coverage.test.ts` fails the build if any endpoint in the
generated contract (`src/generated/schema.ts`) has no wrapper, or the SDK calls
a path the contract doesn't define — unless the gap is recorded in
`scripts/coverage-allowlist.mjs`. That file is the reviewed registry of known
gaps; adding an endpoint without wrapping it (or recording the decision) turns
the build red. Regenerate the raw lists with `npm run audit:coverage`.

**Integration smoke** self-skips unless pointed at an instance:

```bash
SPWIG_TEST_URL=https://your-dev-store.example \
SPWIG_TEST_TOKEN=<merchant api token> \   # optional; unlocks the /api/admin/* checks
npm run test:integration
```

## License

MIT
