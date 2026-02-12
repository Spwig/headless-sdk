# Spwig Checkout Flow — AI Context

You are building a checkout flow for a headless Spwig storefront.
SDK: `import { SpwigClient } from '@spwig/sdk'`

## Cart Operations (before checkout)

```typescript
const spwig = new SpwigClient({ baseUrl: 'https://example.com', token: userToken });

// Add to cart
await spwig.cart.add({ product_id: 42, quantity: 2 });
await spwig.cart.add({ product_id: 99, variant_id: 5, quantity: 1 });

// Get cart
const cart = await spwig.cart.get();
// → { items: [...], item_count: 3, subtotal: "125.00", discount: "0.00", tax: "10.00", total: "135.00", currency: "EUR", voucher: null }

// Update quantity
await spwig.cart.updateItem(cartItemId, { quantity: 3 });

// Remove item
await spwig.cart.removeItem(cartItemId);

// Apply voucher
await spwig.cart.applyVoucher('SUMMER20');
// → Cart with updated discount and total

// Remove voucher
await spwig.cart.removeVoucher('SUMMER20');

// Mini cart for header badge
const summary = await spwig.cart.getSummary();
// → { item_count: 3, subtotal: "125.00", total: "135.00", currency: "EUR" }
```

## Complete Checkout Flow (8 steps)

```typescript
// Step 1: Get checkout session
const session = await spwig.checkout.getSession();
// → { shipping_address: null, billing_address: null, shipping_method: null, payment_method: null, subtotal, shipping_cost, tax, discount, total, currency }

// Step 2: Set shipping address
await spwig.checkout.setShippingAddress({
  name: 'John Doe',
  address1: '123 Main Street',
  address2: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'US',
  phone: '+1-555-0123',
});

// Step 3: Set billing address (optional — defaults to shipping if skipped)
await spwig.checkout.setBillingAddress({
  name: 'John Doe',
  address1: '456 Business Ave',
  city: 'New York',
  state: 'NY',
  postal_code: '10002',
  country: 'US',
});

// Step 4: Get available shipping methods (depends on address)
const shippingMethods = await spwig.checkout.getShippingMethods();
// → [{ id: 1, name: "Standard Shipping", carrier: "DHL", price: "5.99", estimated_days: "3-5" },
//    { id: 2, name: "Express Shipping", carrier: "FedEx", price: "12.99", estimated_days: "1-2" }]

// Step 5: Select shipping method
await spwig.checkout.selectShippingMethod(shippingMethods[0].id);

// Step 6: Get payment providers
const paymentProviders = await spwig.checkout.getPaymentProviders();
// → [{ id: 1, name: "Credit Card", slug: "stripe" },
//    { id: 2, name: "PayPal", slug: "paypal" }]

// Step 7: Select payment method
await spwig.checkout.selectPaymentMethod('stripe');

// Step 8: Validate and complete
const validation = await spwig.checkout.validate();
if (!validation.is_valid) {
  console.error('Checkout errors:', validation.errors);
  // → { shipping_address: ["Required"], payment_method: ["Not selected"] }
  return;
}

const order = await spwig.checkout.complete({
  // Provider-specific payment data (e.g., Stripe payment intent ID)
  payment_intent_id: 'pi_xxx',
});
// → { id: 456, order_number: "ORD-00456", status: "pending", total: "140.99", currency: "EUR", created_at: "..." }
```

## Cart Item Shape
```json
{
  "id": 1,
  "product_id": 42,
  "product_name": "Blue Sneakers",
  "product_slug": "blue-sneakers",
  "product_image": "/media/products/blue-sneakers.jpg",
  "variant_id": null,
  "variant_name": null,
  "sku": "SNKR-BLU-42",
  "quantity": 2,
  "unit_price": "49.99",
  "total_price": "99.98",
  "currency": "EUR"
}
```

## Checkout Error Handling

```typescript
import { SpwigValidationError, SpwigApiError } from '@spwig/sdk';

try {
  const order = await spwig.checkout.complete();
} catch (err) {
  if (err instanceof SpwigValidationError) {
    // Missing required checkout steps
    // err.fieldErrors = { shipping_address: ["Required"], ... }
  }
  if (err instanceof SpwigApiError && err.status === 409) {
    // Stock conflict — item no longer available
  }
}
```

## API Endpoints Reference
```
GET    /api/cart/                         → Cart
POST   /api/cart/add/                     → Cart (body: { product_id, variant_id?, quantity? })
PATCH  /api/cart/items/{id}/              → Cart (body: { quantity })
DELETE /api/cart/items/{id}/              → Cart
POST   /api/cart/clear/                   → void
POST   /api/cart/apply-voucher/           → Cart (body: { code })
DELETE /api/cart/remove-voucher/{code}/   → Cart
GET    /api/cart/summary/                 → CartSummary
GET    /api/checkout/                     → CheckoutSession
POST   /api/checkout/shipping-address/    → Session
POST   /api/checkout/billing-address/     → Session
GET    /api/checkout/shipping-methods/    → [ShippingMethod]
POST   /api/checkout/shipping-method/     → Session (body: { shipping_method_id })
GET    /api/checkout/payment-providers/   → [PaymentProvider]
POST   /api/checkout/payment-method/      → Session (body: { provider })
POST   /api/checkout/validate/            → { is_valid, errors }
POST   /api/checkout/complete/            → CompletedOrder
```
