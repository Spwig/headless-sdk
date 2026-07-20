# Changelog

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
