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

## Admin API (staff auth required)

Auth header: `Authorization: Bearer <access_token>` (obtained via staff login endpoint).
Response envelope: same `{ "success": true, "data": <payload> }` pattern.
Admin pagination: `{ "pagination": { "page": 1, "page_size": 20, "total_pages": 5, "total_count": 100 } }`.

### Admin Authentication
```
POST /api/admin/auth/login/              — { email, password, device_id, device_name } → { user, tokens } or { pending_token, expires_in }
POST /api/admin/auth/verify-2fa/         — { pending_token, code, device_id } → { user, tokens }
POST /api/admin/auth/refresh/            — { refresh_token } → { tokens }
POST /api/admin/auth/logout/             — { device_id?, logout_all? }
GET  /api/admin/auth/profile/            — → StaffProfile
POST /api/admin/auth/password-reset/     — { email }
POST /api/admin/auth/password-reset/confirm/ — { uid, token, new_password, new_password_confirm }
GET  /api/admin/auth/sso/config/         — → SsoConfig
```

### Admin Analytics
```
GET /api/admin/analytics/dashboard/       — → DashboardAnalytics
GET /api/admin/analytics/quick-stats/     — → QuickStats
GET /api/admin/analytics/sales-kpi/       — ?period=today|7_days|30_days → SalesKPI
GET /api/admin/analytics/top-products/    — ?period&limit → [TopProduct]
GET /api/admin/analytics/sales-comparison/ — ?period → SalesComparison
GET /api/admin/analytics/daily-stats/     — ?period=7_days|30_days|90_days → DailyStats
GET /api/admin/analytics/products/        — ?start_date&end_date&category_id&brand_id&search&ordering&page → ProductAnalyticsResponse
GET /api/admin/analytics/customers/       — ?start_date&end_date&segment&ordering&page → CustomerAnalyticsResponse
GET /api/admin/analytics/categories/      — ?start_date&end_date&ordering → CategoryAnalyticsResponse
GET /api/admin/analytics/brands/          — ?start_date&end_date&ordering → BrandAnalyticsResponse
GET /api/admin/analytics/comparison/      — ?period|start_date&end_date&compare_start_date&compare_end_date → EnhancedComparisonResponse
GET /api/admin/analytics/export/          — ?report_type&format=csv|pdf&start_date&end_date → binary file
```

### Admin Orders
```
GET    /api/admin/orders/                       — ?filter_type&status&search&sort&page → OrderListResponse
GET    /api/admin/orders/counts/                — → OrderCounts
GET    /api/admin/orders/{num}/                 — → AdminOrderDetail
POST   /api/admin/orders/{num}/status/          — { status, tracking_number?, notes? }
POST   /api/admin/orders/{num}/tracking/        — { tracking_number, carrier? }
POST   /api/admin/orders/{num}/cancel/          — { reason?, notify_customer? }
POST   /api/admin/orders/{num}/refund/          — { amount?, reason? }
GET    /api/admin/orders/{num}/notes/           — → OrderNotesResponse
POST   /api/admin/orders/{num}/notes/add/       — { note, is_customer_visible?, notify_customer? }
GET    /api/admin/orders/{num}/invoice/pdf/      — → PDF
GET    /api/admin/orders/{num}/packing-slip/pdf/ — → PDF
GET    /api/admin/orders/{num}/pick-list/pdf/    — → PDF
POST   /api/admin/orders/batch-documents/       — { order_numbers, document_types } → ZIP
```

### Admin Products
```
GET    /api/admin/products/                     — ?status&stock_status&search&category&brand&ordering&page → ProductListResponse
GET    /api/admin/products/counts/              — → ProductCounts
POST   /api/admin/products/create/              — ProductCreateInput → AdminProductDetail
GET    /api/admin/products/{id}/                — → AdminProductDetail
PUT    /api/admin/products/{id}/update/         — ProductUpdateInput
DELETE /api/admin/products/{id}/delete/
PUT    /api/admin/products/{id}/stock/          — { quantity, warehouse_id?, reason? }
PUT    /api/admin/products/{id}/status/         — { status }
POST   /api/admin/products/{id}/images/         — FormData
GET    /api/admin/products/{id}/variants/       — → [AdminProductVariant]
POST   /api/admin/products/{id}/variants/create/
```

### Admin Categories
```
GET    /api/admin/categories/                   — ?page&search&parent_id&is_active&sort → CategoryListResponse
POST   /api/admin/categories/create/            — { name, slug?, parent_id?, sort_order? }
GET    /api/admin/categories/{id}/              — → AdminCategory
PUT    /api/admin/categories/{id}/update/
DELETE /api/admin/categories/{id}/delete/
```

### Admin Brands
```
GET    /api/admin/brands/                       — ?page&search&is_active&sort → BrandListResponse
POST   /api/admin/brands/create/                — { name, slug?, description? }
GET    /api/admin/brands/{id}/                  — → AdminBrand
PUT    /api/admin/brands/{id}/update/
DELETE /api/admin/brands/{id}/delete/
```

### Admin Messages
```
GET  /api/admin/messages/                          — ?source&status&search&page → MessageListResponse
GET  /api/admin/messages/counts/                   — → MessageCounts
GET  /api/admin/messages/unread-count/             — → { count }
GET  /api/admin/messages/{source}/{id}/            — → AdminMessageDetail
PUT  /api/admin/messages/{source}/{id}/status/     — { is_read }
POST /api/admin/messages/contact_form/{id}/reply/  — { message, notify_customer? }
```

### Admin Settings & Branding
```
GET    /api/admin/settings/                     — → AppSettings
GET    /api/admin/settings/languages/           — → LanguagesResponse
GET    /api/admin/settings/devices/             — → [AdminDevice]
POST   /api/admin/settings/devices/register/    — { device_id, device_name, platform?, push_token? }
DELETE /api/admin/settings/devices/{id}/
POST   /api/admin/settings/push-token/          — { push_token }
POST   /api/admin/settings/notifications/       — { notify_new_orders?, notify_low_stock?, ... }
GET    /api/admin/settings/sessions/            — → [AdminSession]
POST   /api/admin/settings/sessions/{id}/revoke/
GET    /api/admin/settings/branding/            — → BrandingSettings
PATCH  /api/admin/settings/branding/update/     — BrandingSettingsUpdateInput
POST   /api/admin/settings/branding/logo/       — FormData → { logo_url }
```

### Admin Wallets
```
GET  /api/wallet/wallets/                       — ?search&is_active → [AdminWallet]
GET  /api/wallet/wallets/{id}/                  — → AdminWalletDetail
POST /api/wallet/wallets/{id}/credit/           — { amount, source?, description }
POST /api/wallet/wallets/{id}/debit/            — { amount, source?, description }
POST /api/wallet/wallets/{id}/freeze/           — toggle freeze
GET  /api/wallet/admin-transactions/            — ?wallet_id&type&source&status&limit&offset → [AdminWalletTransaction]
```

### Admin Staff
```
GET    /api/admin/staff/                        — ?page&search&role_id&is_active&ordering → StaffListResponse
POST   /api/admin/staff/invite/                 — { email, first_name, last_name, group_ids }
PATCH  /api/admin/staff/{id}/                   — { group_ids?, is_active?, first_name?, last_name? }
DELETE /api/admin/staff/{id}/delete/
```

### Admin Roles & Permissions
```
GET    /api/admin/roles/                        — → [StaffRole]
POST   /api/admin/roles/create/                 — { name, description?, permissions }
PATCH  /api/admin/roles/{id}/                   — { name?, description?, permissions? }
DELETE /api/admin/roles/{id}/delete/
GET    /api/admin/permissions/                  — → [PermissionCategory]
```

### Admin Inventory Intelligence
```
GET   /api/admin/inventory/dashboard/           — → InventoryDashboard
GET   /api/admin/inventory/low-stock/           — ?page&severity&category_id&warehouse_id → LowStockListResponse
GET   /api/admin/inventory/velocity/            — ?product_id&variant_id&period=7d|30d|90d → VelocityResponse
GET   /api/admin/inventory/movements/           — ?product_id&variant_id&warehouse_id&movement_type&start_date&end_date&page → MovementListResponse
GET   /api/admin/inventory/reorder-suggestions/ — ?page&urgency&ordering → ReorderSuggestionListResponse
GET   /api/admin/inventory/settings/            — → InventorySettings
PATCH /api/admin/inventory/settings/update/     — InventorySettingsUpdateInput
```

### Admin Bulk Operations
```
POST /api/admin/inventory/bulk/adjust/          — { adjustments, reason, notes? } → BulkOperationResult
POST /api/admin/products/bulk/price/            — { product_ids, update_type, value } → BulkOperationResult
POST /api/admin/products/bulk/assign-category/  — { product_ids, category_id } → BulkOperationResult
POST /api/admin/products/bulk/assign-tags/      — { product_ids, tags, mode } → BulkOperationResult
POST /api/admin/products/bulk/sale/             — { product_ids, sale_type, sale_value?, sale_start_date?, sale_end_date? } → BulkOperationResult
POST /api/admin/orders/bulk/status/             — { order_numbers, status } → BulkOperationResult
POST /api/admin/orders/bulk/fulfill/            — { orders: [{ order_number, tracking_number?, carrier? }], notify_customers? } → BulkOperationResult
```
