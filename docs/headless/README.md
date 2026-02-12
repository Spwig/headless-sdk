# Spwig Headless Developer Guide

## What is Headless Spwig?

Spwig is a self-hosted eCommerce platform. In **headless mode**, you decouple the storefront from the backend: Spwig handles products, orders, payments, and shipping through its REST API, while you build the customer-facing frontend with any framework you choose (Next.js, Nuxt, SvelteKit, Remix, Astro, etc.).

The Spwig admin backend continues to run at `/en/admin/` where merchants manage their store. Your frontend talks to the API at `/api/...` endpoints, which never require a language prefix.

## Benefits of Headless Architecture

- **Full design control** -- build pixel-perfect storefronts with your preferred framework and component library.
- **Performance** -- static generation (SSG), incremental regeneration (ISR), and edge rendering are all possible when you own the frontend.
- **Multi-channel** -- one Spwig backend can power a website, a mobile app, a kiosk, and an in-store display simultaneously.
- **Developer experience** -- use TypeScript, React Server Components, or whatever tooling your team already knows.
- **Independent deployment** -- ship frontend changes without touching the backend and vice versa.

## What's Included in This Guide

Thirteen chapters covering everything from your first API call through production deployment.

## Table of Contents

| # | Chapter | Description |
|---|---------|-------------|
| 1 | [Getting Started](01-getting-started.md) | Install the SDK, configure CORS, make your first API call |
| 2 | [Architecture](02-architecture.md) | Data flow, deployment models, SSR/CSR, caching, sessions |
| 3 | [Authentication](03-authentication.md) | Login, register, social OAuth, token storage, password reset |
| 4 | [Catalog API](04-catalog-api.md) | Products, categories, brands, collections, reviews, stock |
| 5 | [Cart & Checkout](05-cart-and-checkout.md) | Cart operations, vouchers, multi-step checkout flow |
| 6 | [Orders & Returns](06-orders.md) | Order history, tracking, status flow, return requests |
| 7 | [Webhooks](07-webhooks.md) | Event types, signature verification, handler examples |
| 8 | [Multi-Language](08-multi-language.md) | Accept-Language header, RTL support, hreflang SEO |
| 9 | [Multi-Currency](09-multi-currency.md) | Currency switching, exchange rates, price formatting |
| 10 | [Proxy Configuration](10-proxy-configuration.md) | NGINX, Caddy, Apache, Traefik (same-domain & subdomain) |
| 11 | [Environment Variables](11-environment-variables.md) | All backend env vars for headless deployments |
| 12 | [Rate Limits](12-rate-limits.md) | Throttling tiers, 429 handling, retry strategies |
| 13 | [Error Handling](13-error-handling.md) | SDK error classes, validation errors, error boundaries |

### Framework Examples

| Framework | Guide |
|-----------|-------|
| Next.js (App Router) | [examples/nextjs-example.md](examples/nextjs-example.md) |
| Nuxt 3 | [examples/nuxt-example.md](examples/nuxt-example.md) |
| SvelteKit | [examples/sveltekit-example.md](examples/sveltekit-example.md) |

### AI Context Documents

Drop these into your AI assistant for instant Spwig API knowledge: [ai-context/](ai-context/)

## Quick Links

- **SDK reference**: [`SDK_REFERENCE.md`](../SDK_REFERENCE.md) — full API reference with code examples
- **SDK install**: `npm install @spwig/sdk`
- **Interactive API docs** (when running locally): `http://localhost:8000/admin/api/swagger/`
- **ReDoc reference**: `http://localhost:8000/admin/api/docs/`
- **OpenAPI schema download**: `http://localhost:8000/admin/api/schema/`
- **AI context documents**: [`ai-context/`](ai-context/) — paste these into your AI assistant for instant API knowledge
- **Framework examples**: [`examples/`](examples/)

## Prerequisites

- **Node.js 18+** and npm (or pnpm / yarn)
- **Spwig backend running** and accessible (default: `http://localhost:8000`)
- Backend environment variables configured for CORS (see [Getting Started](01-getting-started.md))
- A Spwig admin account for managing products, settings, and API keys

## API Conventions at a Glance

All API endpoints live under `/api/...` with **no language prefix**. They return a consistent JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

Error responses follow the same shape:

```json
{
  "success": false,
  "message": "What went wrong",
  "errors": { "field_name": ["Specific error"] }
}
```

Authentication uses DRF Token auth. Include the token in every authenticated request:

```
Authorization: Token abc123def456
```

Pagination on list endpoints uses `page` and `page_size` query parameters, with a default page size of 20.

Multi-language content is served based on the `Accept-Language` header.
