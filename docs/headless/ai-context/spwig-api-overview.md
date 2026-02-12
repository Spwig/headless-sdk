# Spwig eCommerce API — Complete Reference for AI Assistants

You are building a headless frontend for Spwig, a self-hosted eCommerce platform.
Base URL: configured per installation. All API paths start with `/api/`.
Auth header: `Authorization: Token <token>` (obtained via login endpoint).
Response envelope: `{ "success": true, "data": <payload>, "message": "..." }`.
Pagination: `{ "count": N, "next": "url", "previous": "url", "results": [...] }`.
Language: Set `Accept-Language: fr` header. Supported: en, es, fr, de, pt, zh-hans, zh-hant, ja, ar, ru, hi, id, ko, tr, vi, it, th.
SDK: `import { SpwigClient } from '@spwig/sdk'`

## Authentication
```
POST /api/accounts/api/register/     — { username, email, password, password_confirm } → { user, token }
POST /api/accounts/api/login/        — { username, password } → { user, token }
POST /api/accounts/api/logout/       — (auth required) → void
POST /api/accounts/api/password-reset/ — { email } → void
GET  /api/accounts/social/providers/ — → [{ provider, name, is_configured }]
```

## Customer Account (auth required)
```
GET   /api/accounts/api/profile/           — → CustomerProfile
PATCH /api/accounts/api/profile/update/    — { first_name, last_name, phone, ... }
PATCH /api/accounts/api/preferences/       — { dashboard_layout, show_wishlist, ... }
GET   /api/accounts/api/addresses/         — → [Address]
POST  /api/accounts/api/addresses/         — { name, address1, city, state, postal_code, country }
PATCH /api/accounts/api/addresses/{id}/    — partial update
DELETE /api/accounts/api/addresses/{id}/   — delete
POST  /api/accounts/api/addresses/{id}/set-default/ — set as default
```

## Catalog (public, no auth)
```
GET /api/catalog/products/              — ?page=1&search=&category=&brand=&ordering=-created_at → paginated
GET /api/catalog/products/{slug}/       — → Product detail
GET /api/catalog/products/{slug}/check-stock/ — → { is_available, quantity, locations }
GET /api/catalog/products/{slug}/availability/ — → { is_available, quantity }
POST /api/catalog/products/{slug}/notify-me/ — { email }
GET /api/catalog/categories/            — → paginated categories (tree)
GET /api/catalog/categories/{id}/       — → Category
GET /api/catalog/brands/                — → paginated brands
GET /api/catalog/collections/           — → paginated collections
GET /api/catalog/reviews/               — ?product=123 → paginated reviews
POST /api/catalog/reviews/              — { product, rating, title, comment } (auth required)
GET /api/catalog/recommendations/       — → [Product]
GET /api/catalog/filters/               — → available filter options
GET /api/catalog/gift-cards/check-balance/ — POST { code } → { balance, currency }
```

## Cart (session or auth)
```
GET  /api/cart/                — → Cart { items, subtotal, discount, tax, total, currency, voucher }
POST /api/cart/add/            — { product_id, variant_id?, quantity? } → Cart
PATCH /api/cart/items/{id}/    — { quantity } → Cart
DELETE /api/cart/items/{id}/   — → Cart
POST /api/cart/clear/          — → void
POST /api/cart/apply-voucher/  — { code } → Cart
DELETE /api/cart/remove-voucher/{code}/ — → Cart
GET  /api/cart/summary/        — → { item_count, subtotal, total, currency }
```

## Checkout (session or auth)
```
GET  /api/checkout/                  — → CheckoutSession
POST /api/checkout/shipping-address/ — { name, address1, city, state, postal_code, country } → Session
POST /api/checkout/billing-address/  — same shape → Session
GET  /api/checkout/shipping-methods/ — → [ShippingMethod { id, name, carrier, price }]
POST /api/checkout/shipping-method/  — { shipping_method_id } → Session
GET  /api/checkout/payment-providers/ — → [PaymentProvider { id, name, slug }]
POST /api/checkout/payment-method/   — { provider } → Session
POST /api/checkout/validate/         — → { is_valid, errors }
POST /api/checkout/complete/         — → CompletedOrder { order_number, status, total }
```

## Orders (auth required)
```
GET /api/orders/              — ?page=1&status= → paginated orders
GET /api/orders/{id}/         — → Order detail with items, addresses, tracking
GET /api/return-requests/     — → paginated returns
POST /api/return-requests/    — { order, reason, items: [{ order_item, quantity }] }
```

## Payments (auth required)
```
POST /api/payments/intents/              — { amount, currency, provider } → PaymentIntent
GET  /api/payments/intents/{uuid}/       — → PaymentIntent
POST /api/payments/intents/{uuid}/confirm/ — → PaymentIntent
POST /api/payments/intents/{uuid}/cancel/  — → PaymentIntent
GET  /api/payments/methods/              — → [SavedPaymentMethod]
POST /api/payments/methods/              — create
DELETE /api/payments/methods/{uuid}/     — delete
POST /api/payments/methods/{uuid}/set-default/ — set default
```

## Search (public)
```
GET /api/search/results/          — ?q=shoes&page=1 → paginated SearchResults
GET /api/search/autocomplete/     — ?q=sho → [{ text, type, url }]
GET /api/search/trending/         — → [{ query, count }]
POST /api/search/click/           — { query, result_id, result_type }
GET /api/search/suggest-corrections/ — ?q=shoez → ["shoes"]
```

## Store Info (public)
```
GET /api/store/           — → full store info (cached 5min)
GET /api/store/info/      — → { name, description }
GET /api/store/contact/   — → { email, phone, address }
GET /api/store/social/    — → { facebook, instagram, twitter, ... }
GET /api/store/currency/  — → { code, symbol, name, decimal_places }
GET /api/store/currencies/ — → [Currency]
POST /api/store/set-currency/   — { currency: "USD" }
```

## Loyalty (auth required)
```
GET  /api/loyalty/status/       — → { points, tier, next_tier, lifetime_points }
GET  /api/loyalty/progress/     — → { current_points, progress_percentage, points_to_next_tier }
GET  /api/loyalty/tiers/        — → [Tier]
GET  /api/loyalty/rewards/      — → [Reward]
POST /api/loyalty/redemptions/  — { reward: id } → Redemption
GET  /api/loyalty/history/      — → paginated point transactions
GET  /api/loyalty/earning-rules/ — → [{ action, points, description }]
GET  /api/loyalty/badges/       — → [Badge]
```

## Wishlist (auth required)
```
GET    /api/wishlists/      — → paginated wishlist items
POST   /api/wishlists/      — { product: id }
DELETE /api/wishlists/{id}/ — remove
```

## Webhooks (auth required, admin)
```
GET  /api/webhooks/events/                 — → available event types
POST /api/webhooks/endpoints/              — { url, events: ["order.created"], secret }
GET  /api/webhooks/endpoints/              — → list
POST /api/webhooks/endpoints/{uuid}/test/  — send test webhook
POST /api/webhooks/endpoints/{uuid}/rotate-secret/ — new secret
GET  /api/webhooks/deliveries/             — → delivery logs
POST /api/webhooks/deliveries/{uuid}/retry/ — retry failed

Signature header: X-Spwig-Signature: t=<unix_ts>,v1=<hmac_hex>
Algorithm: HMAC-SHA256(secret, "<timestamp>.<json_body>")
```

## Social Sharing (public)
```
POST /api/social/track/                        — { content_type, object_id, platform }
GET  /api/social/counts/{content_type}/{id}/   — → share counts
```

## Forms (public)
```
GET  /api/form-builder/forms/{slug}/        — → form definition
POST /api/form-builder/forms/{slug}/submit/ — → submission result
```

## Contact Messages
```
POST /api/messages/contact/          — { name, email, subject, message }
GET  /api/messages/contact/subjects/ — → available subjects
```

## SDK Quick Start
```typescript
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({ baseUrl: 'https://example.com', language: 'en' });

// Login
const { user, token } = await spwig.auth.login({ username: 'john', password: 'pass' });
spwig.setToken(token);

// Browse
const products = await spwig.catalog.products.list({ page: 1, category: 'shoes' });
const product = await spwig.catalog.products.get('blue-sneakers');

// Cart & Checkout
await spwig.cart.add({ product_id: product.id, quantity: 1 });
await spwig.checkout.setShippingAddress({ name: 'John', address1: '123 Main St', city: 'NYC', state: 'NY', postal_code: '10001', country: 'US' });
const methods = await spwig.checkout.getShippingMethods();
await spwig.checkout.selectShippingMethod(methods[0].id);
const providers = await spwig.checkout.getPaymentProviders();
await spwig.checkout.selectPaymentMethod(providers[0].slug);
const order = await spwig.checkout.complete();
```
