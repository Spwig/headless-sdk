# Changelog

## 2.2.0 (2026-08-06)

Catches the SDK up to Spwig **1.7.1** (sale-aware pricing, region availability,
AVIF `<picture>` sources, subscription card→token capture).

**⚠️ This minor carries breaking changes.** By SemVer it would be a major, but
it is released as a minor deliberately: the only consumers today are Spwig's own
installations, and the breaks below are cheaper to absorb in-house now than to
carry a 3.0.0 boundary for a handful of first-party sites. Read the Breaking and
Migration sections before upgrading.

### ⚠️ Breaking

- **`CreatePaymentIntentInput.checkout_session_id` is now `number`, not `string`.**
  The backend keys `CheckoutSession` by integer PK; the old `uuid` typing/docs
  were wrong. Pass the numeric session id (you rarely need to pass it at all —
  it defaults to the active cart's session).
- **`Product.compare_at_price_amount` changed meaning.** It is no longer a stored
  MSRP; it is the struck-through *regular* price and is `null` unless the product
  is on sale. Render price from the new `effective_price_amount` + `is_on_sale`
  and only strike through `compare_at_price_amount` when `is_on_sale`. Same field
  name and type, so this will **not** raise a compile error — audit price display
  code by hand.
- **`Product.is_in_stock` now returns `true` for pre-order / backorder products**,
  not only in-stock ones. Gate "buyable" UI on this; use `products.availability()`
  for the pre-order/backorder distinction.
- **`admin` `AttributeAssignInput` reshaped** to
  `{ assignments: [{ attribute_id, value_ids: number[], sort_order? }] }` (was
  `{ attributes: [{ attribute_id, values: string[] }] }`). The backend now
  enforces the new shape; the old one was already incorrect.
- **`admin` `BrandingSettingsUpdateInput` no longer accepts `primary_color`** —
  the backend never persisted it (silent no-op). It is still returned on the
  read type `BrandingSettings` (sourced from theme tokens).
- **`admin` `BulkPriceUpdateInput`/`BulkSaleUpdateInput` validation tightened**:
  `round_to` max is now the currency precision (2, was 4); price `value` must be
  `>= 0` (absolute) / `>= -100` (percentage); sale `sale_value` must be `> 0`
  (0 is rejected).
- **`admin` `AdminOrder.item_count` now excludes bundle child lines**, so the
  value can differ for orders containing bundles.

### Added

- **`store.setRegion(country)`** → `POST /api/store/set-region/`. Sets the
  shopper's ship-to region from an ISO-3166 country the store ships to; drives
  `Product.ships_to_region` / regional stock and may switch the active currency.
  New `SetRegionResult` type.
- **`subscriptions.beginTokenSetup(providerAccountId)`** →
  `POST /api/subscriptions/tokens/begin-setup/`. Provider-agnostic setup for a
  reusable subscription payment method; returns a `SubscriptionSetupBundle`.
- **`cart.attachSubscriptionToken(itemId, paymentTokenId)`** →
  `POST /api/cart/items/{id}/attach-subscription-token/`. Binds a reusable
  PaymentToken to a subscription line so the first cycle and renewals can be
  charged (card capture is deferred to checkout).
- **`Product` / `ProductList` sale + region fields**: `effective_price_amount`,
  `is_on_sale`, `ships_to_region`.
- **AVIF `<picture>` support**: new `PictureSources` type and `image_sources`
  on `ProductImage`, `ProductVariant`, `Category` (+ `banner_image_sources`),
  plus `primary_image.image_sources`. Emitted alongside the existing URL fields.
- **`CartItem`** subscription + sale fields: `is_on_sale`, `regular_total`,
  `pricing_tier_details`, `subscription_billing_display`, `subscription_unit_price`.
- **`AddToCartInput`** subscription fields: `is_subscription`,
  `subscription_plan_id`, `pricing_tier_id`, optional `payment_token_id`
  (attach later via `attachSubscriptionToken()`; subscription add-to-cart
  requires an authenticated shopper).
- **`SearchResult`** `regular_price` and `is_on_sale`; `price` is now the
  sale-aware display price.
- **`admin` analytics**: `SalesComparison` gains `current_order_count`,
  `previous_order_count`, `daily_breakdown`; `DashboardAnalytics` gains
  `custom_range`.
- **`admin` `MessageReplyResponse`** type; `messages.reply()` is now typed with
  it (includes `email_error` when the reply saved but the email failed to send).
- SVG store logos are now accepted by `admin` `settings.uploadLogo()`
  (sanitised server-side); no request-shape change.

### Fixed

- Regenerated `src/generated/schema.ts` from the 1.7.1 `api-schema.yml`
  (3 new endpoints, 4 new component schemas, 14 changed). The committed types
  were a release behind the contract.

### Migration

Consumers are Spwig's own installations. Do the following, in order:

1. Switch product price rendering to `effective_price_amount` + `is_on_sale`;
   treat `compare_at_price_amount` as the strike-through value (null off-sale).
2. If you pass `checkout_session_id` to `payments.createIntent()`, pass a number.
3. Update any `admin` attribute-assign call to the `assignments` / `value_ids`
   shape and drop `primary_color` from branding updates.
4. Re-check `is_in_stock` usage where pre-orders should be treated differently.

## 2.1.0 (2026-07-26)

Catches the SDK up to the rest of the Spwig **1.7.0** release. Additive —
nothing that worked in 2.0.0 changes.

### Added

- **`checkout.setContact({ email, first_name?, last_name?, password? })`** →
  `POST /api/checkout/contact/`. Records the customer's email/name on the
  session, and — when a `password` is supplied — creates an account and signs
  them in (the password is never stored or echoed back). This is the only
  place a no-shipping guest's email is captured before payment, so
  digital-only and booking-only carts (which skip the shipping step) must call
  it before `complete()`.
- **`admin.analytics.getTraffic({ period?, start_date?, end_date? })`** →
  `GET /api/admin/analytics/traffic/`. Visitor overview, daily trends, top
  pages, geographic distribution, and referrers. Reachable by a merchant API
  token holding the `analytics.traffic` scope. New `TrafficAnalytics` and
  related types.

### Removed

- `admin.media.getUploadProgress()` — `/api/media/upload-progress/` is a
  non-functional stub that returns a hardcoded `progress: 100`; the binding was
  dead.
- `admin.auth.ssoMobileCallback()` — `/api/admin/auth/sso/mobile/callback/` is a
  browser-driven OIDC redirect (returns a 302 to the app's custom scheme),
  invoked by the identity provider, not a JSON API the SDK calls. The mobile SSO
  flow is `ssoMobileAuthorize()` → OS-handled redirect → `ssoMobileToken()`.

### Changed

- `referrals.getMyReferrals()` now calls the versioned DRF endpoint
  `/api/referrals/identities/me/` (a superset of `ReferralDashboard`) instead of
  the uncontracted legacy `/api/referrals/me/` aggregation view. Same return
  type; no consumer change.
- Marked the `addressService`, `customizer`, and `admin.currencies` modules as
  **⚠️ Uncontracted** in their doc comments: they reach Spwig's storefront/admin
  UI backends, which are deliberately not part of `api-schema.yml` and may change
  without a contract bump. This is a reviewed decision, not an omission — see the
  coverage-allowlist `SCHEMA_MISSING` notes.

### Fixed

- Regenerated types from the corrected `api-schema.yml`. The 2.0.0 contract
  was generated with the HQ apps installed, leaking **37 non-merchant paths**
  (`/api/hq/*`, `/api/license-checkout/*`, `/api/marketplace/*`,
  `/api/hosting-events/`) into a merchant SDK. They are gone. Agentic Commerce
  paths (`/api/agentic/ucp/*`, ACP feed) now appear in the generated types;
  they are agent-facing and intentionally have no client wrappers.

## 2.0.0 (2026-07-20)

Gift cards moved from cart discounts to **payment tenders** across Spwig R2,
and this release re-points the SDK at the surfaces that actually exist. It is
a breaking release, but note what it breaks: mostly calls that have returned
404 or 405 since they shipped.

### Removed

- `cart.applyGiftCard()` / `cart.removeGiftCard()` — the endpoints were never
  routed server-side; both calls have 404'd since 1.0. Gift cards are applied
  at **checkout**, as payment: see `checkout.addGiftCardTender()`.
- `Cart.applied_gift_cards`, `Cart.gift_card_discount_amount`, and the
  `AppliedGiftCard` type — the server no longer emits them. A gift card never
  reduces cart totals; it settles the bill.
- `pos.cart.applyGiftCard()` — `POST /api/pos/cart/gift-card/` was deleted:
  it wrote a cart discount that never debited the card, losing the merchant
  the discounted amount on every sale. POS takes gift cards at payment
  (`pos.checkout.giftCard()`, split tender).
- `vouchers.giftCards.redeem()` — wrapped a legacy float-arithmetic endpoint
  on the vestigial vouchers gift card model; the endpoint is gone.

### Changed

- **`loyalty.redeemReward(uuid: string)`** — takes the reward's `uuid` and
  calls `POST /api/loyalty/rewards/{uuid}/redeem/`. The 1.x signature POSTed
  a read-only viewset and returned **405 on every call since it shipped**.
  Fixed-value rewards now credit the customer's wallet; percentage rewards
  issue a single-use voucher bound to the customer.

### Added

- **Checkout tenders**: `checkout.listTenders()`,
  `checkout.addGiftCardTender(code)`, `checkout.addWalletTender()`,
  `checkout.removeTender(id)`, with `CheckoutTenders` / `CheckoutTenderHold`
  types. `amount_due` — not `total_amount` — is what a payment provider
  should be asked to charge; when tenders cover the order it is `"0.00"` and
  `checkout.complete()` settles without any gateway involvement. Recreate any
  payment intent after a tender change: an intent made for the old amount_due
  charges the wrong figure.
- `AddToCartInput.gift_card_data` — recipient details, optional denomination
  `amount`, message (≤500 chars, no markup), and offset-aware
  `scheduled_send_at`, matching the server's validator exactly. Required when
  buying gift card products.
- Generated types now come from the **versioned** contract
  (`shop-dev/api-schema.yml`, 676 paths). The previous source was a
  gitignored local file 168 paths behind the code.

### Migration

Consumers are Spwig's own demo sites; no external adopters exist yet.
Replace any `cart.applyGiftCard` call with `checkout.addGiftCardTender` and
pass reward `uuid`s (from `listRewards()`) to `redeemReward`.
