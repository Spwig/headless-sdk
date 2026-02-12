# Cart and Checkout

This chapter covers the full shopping experience: managing the cart, applying vouchers, and completing checkout through the Spwig API.

---

## Cart Operations

The cart API is session-based. Anonymous users get a cart tied to their session cookie. Authenticated users get a persistent cart tied to their account.

### Get Current Cart

Retrieve the full cart with all items, totals, and any applied voucher.

```typescript
const cart = await spwig.cart.get();
console.log(cart.item_count);  // 3
console.log(cart.total);       // "89.97"
console.log(cart.currency);    // "EUR"
```

**Response shape:**

```typescript
interface Cart {
  items: CartItem[];
  item_count: number;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  currency: string;
  voucher: AppliedVoucher | null;
}

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_id: number | null;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  currency: string;
}
```

### Add Item to Cart

```typescript
const cart = await spwig.cart.add({
  product_id: 42,
  quantity: 2,
});
// cart now contains the updated state
```

For products with variants, include the `variant_id`:

```typescript
const cart = await spwig.cart.add({
  product_id: 42,
  variant_id: 105,
  quantity: 1,
});
```

### Update Item Quantity

Use the `id` from the `CartItem` (not the product ID):

```typescript
const cart = await spwig.cart.updateItem(itemId, { quantity: 5 });
```

### Remove Item

```typescript
const cart = await spwig.cart.removeItem(itemId);
```

### Clear Cart

Remove all items at once:

```typescript
await spwig.cart.clear();
```

---

## Vouchers

### Apply a Voucher Code

```typescript
try {
  const cart = await spwig.cart.applyVoucher('SUMMER20');
  console.log(cart.voucher);
  // { code: "SUMMER20", discount_type: "percentage", discount_value: "20.00", discount_amount: "17.99" }
} catch (err) {
  if (err instanceof SpwigValidationError) {
    console.log(err.fieldErrors.code); // ["This voucher code is not valid."]
  }
}
```

### Remove an Applied Voucher

```typescript
const cart = await spwig.cart.removeVoucher('SUMMER20');
// cart.voucher is now null
```

---

## Cart Summary (Header Badge)

For displaying a lightweight cart count in a header badge, use the summary endpoint. It avoids fetching full item details.

```typescript
const summary = await spwig.cart.getSummary();
// { item_count: 3, subtotal: "89.97", total: "89.97", currency: "EUR" }
```

This is the endpoint you should poll or call after navigation to keep the header badge accurate.

---

## Checkout Flow

Spwig checkout is a multi-step process. Each step builds on the previous one. The SDK provides a `CheckoutModule` that mirrors this flow exactly.

### Overview of Steps

| Step | Endpoint | SDK Method |
|------|----------|------------|
| 1. Get session | `GET /api/checkout/` | `spwig.checkout.getSession()` |
| 2. Set shipping address | `POST /api/checkout/shipping-address/` | `spwig.checkout.setShippingAddress(address)` |
| 3. Set billing address | `POST /api/checkout/billing-address/` | `spwig.checkout.setBillingAddress(address)` |
| 4. Get shipping methods | `GET /api/checkout/shipping-methods/` | `spwig.checkout.getShippingMethods()` |
| 5. Select shipping method | `POST /api/checkout/shipping-method/` | `spwig.checkout.selectShippingMethod(id)` |
| 6. Get payment providers | `GET /api/checkout/payment-providers/` | `spwig.checkout.getPaymentProviders()` |
| 7. Select payment method | `POST /api/checkout/payment-method/` | `spwig.checkout.selectPaymentMethod(slug)` |
| 8. Validate and complete | `POST /api/checkout/validate/` then `POST /api/checkout/complete/` | `spwig.checkout.validate()` then `spwig.checkout.complete()` |

### Step 1: Get Checkout Session

Start by retrieving the current checkout state. This returns whatever has been set so far.

```typescript
const session = await spwig.checkout.getSession();
```

**Response shape:**

```typescript
interface CheckoutSession {
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_method: ShippingMethod | null;
  payment_method: string | null;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
}
```

### Step 2: Set Shipping Address

```typescript
const session = await spwig.checkout.setShippingAddress({
  name: 'Jane Doe',
  address1: '123 Main Street',
  address2: 'Apt 4B',
  city: 'Berlin',
  state: 'Berlin',
  postal_code: '10115',
  country: 'DE',
  phone: '+49 30 1234567',
});
```

The `country` field uses ISO 3166-1 alpha-2 codes (e.g., `DE`, `US`, `GB`, `FR`).

### Step 3: Set Billing Address (Optional)

If the billing address differs from the shipping address, set it explicitly. If you skip this step, the shipping address is used as the billing address.

```typescript
const session = await spwig.checkout.setBillingAddress({
  name: 'Jane Doe',
  company: 'ACME GmbH',
  address1: '456 Business Park',
  city: 'Munich',
  state: 'Bavaria',
  postal_code: '80331',
  country: 'DE',
});
```

### Step 4: Get Available Shipping Methods

After setting the shipping address, fetch the available shipping methods. Methods vary based on the destination country/region and cart contents.

```typescript
const methods = await spwig.checkout.getShippingMethods();
// [
//   { id: 1, name: "Standard Shipping", carrier: "DHL", price: "4.99", currency: "EUR", estimated_days: "3-5" },
//   { id: 2, name: "Express Shipping", carrier: "DHL Express", price: "12.99", currency: "EUR", estimated_days: "1-2" },
// ]
```

### Step 5: Select Shipping Method

```typescript
const session = await spwig.checkout.selectShippingMethod(1);
// session.shipping_cost is now "4.99"
```

### Step 6: Get Payment Providers

```typescript
const providers = await spwig.checkout.getPaymentProviders();
// [
//   { id: 1, name: "Stripe", slug: "stripe", logo: "/media/payment/stripe.svg" },
//   { id: 2, name: "PayPal", slug: "paypal", logo: "/media/payment/paypal.svg" },
// ]
```

### Step 7: Select Payment Method

```typescript
const session = await spwig.checkout.selectPaymentMethod('stripe');
```

### Step 8: Validate and Complete

Always validate before completing. This catches any issues before the order is created.

```typescript
const validation = await spwig.checkout.validate();
// { is_valid: true, errors: {} }

if (validation.is_valid) {
  const order = await spwig.checkout.complete({
    // Payment-specific data (e.g., Stripe payment intent ID)
    payment_intent_id: 'pi_abc123',
  });
  console.log(order.order_number); // "ORD-00042"
  console.log(order.status);       // "pending"
}
```

If validation fails:

```typescript
const validation = await spwig.checkout.validate();
// {
//   is_valid: false,
//   errors: {
//     shipping_method: ["Please select a shipping method."],
//     payment_method: ["Please select a payment method."]
//   }
// }
```

---

## Full Working Checkout Example

Here is a complete checkout flow from cart to order confirmation:

```typescript
import { SpwigClient, SpwigValidationError } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'https://mystore.example.com',
  language: 'en',
  currency: 'EUR',
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});

// Assume user is logged in
spwig.setToken(userToken);

async function processCheckout(formData: CheckoutFormData) {
  try {
    // Step 1: Get current session state
    const session = await spwig.checkout.getSession();

    // Step 2: Set shipping address
    await spwig.checkout.setShippingAddress({
      name: formData.shippingName,
      address1: formData.shippingAddress1,
      address2: formData.shippingAddress2,
      city: formData.shippingCity,
      state: formData.shippingState,
      postal_code: formData.shippingPostalCode,
      country: formData.shippingCountry,
      phone: formData.shippingPhone,
    });

    // Step 3: Set billing address if different
    if (formData.differentBillingAddress) {
      await spwig.checkout.setBillingAddress({
        name: formData.billingName,
        address1: formData.billingAddress1,
        city: formData.billingCity,
        state: formData.billingState,
        postal_code: formData.billingPostalCode,
        country: formData.billingCountry,
      });
    }

    // Step 4: Get shipping options for this address
    const shippingMethods = await spwig.checkout.getShippingMethods();

    // Step 5: Select shipping method (use first one, or from user selection)
    const selectedMethod = shippingMethods.find(m => m.id === formData.shippingMethodId)
      ?? shippingMethods[0];
    await spwig.checkout.selectShippingMethod(selectedMethod.id);

    // Step 6: Get payment providers
    const providers = await spwig.checkout.getPaymentProviders();

    // Step 7: Select payment provider
    await spwig.checkout.selectPaymentMethod(formData.paymentProvider);

    // Step 8: Validate
    const validation = await spwig.checkout.validate();
    if (!validation.is_valid) {
      return { success: false, errors: validation.errors };
    }

    // Step 8b: Complete the order
    const order = await spwig.checkout.complete({
      payment_intent_id: formData.paymentIntentId,
    });

    return {
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
    };

  } catch (error) {
    if (error instanceof SpwigValidationError) {
      return { success: false, errors: error.fieldErrors };
    }
    throw error;
  }
}
```

---

## Error Handling During Checkout

Each checkout step can return validation errors. Common scenarios:

**Invalid address:**
```typescript
try {
  await spwig.checkout.setShippingAddress(address);
} catch (err) {
  if (err instanceof SpwigValidationError) {
    // err.fieldErrors = { postal_code: ["Enter a valid postal code."], country: ["This field is required."] }
  }
}
```

**Shipping method no longer available:**
```typescript
try {
  await spwig.checkout.selectShippingMethod(methodId);
} catch (err) {
  if (err instanceof SpwigApiError && err.status === 400) {
    // Re-fetch shipping methods and let user re-select
    const methods = await spwig.checkout.getShippingMethods();
  }
}
```

**Cart changed during checkout:**

If the cart changes between validation and completion (stock reservation expired, price changed), the `complete` call will return an error. Always handle this gracefully:

```typescript
try {
  const order = await spwig.checkout.complete(paymentData);
} catch (err) {
  if (err instanceof SpwigApiError) {
    // Show the error message to the user
    showError(err.apiMessage ?? 'Checkout failed. Please try again.');
    // Re-fetch the checkout session to get updated totals
    const session = await spwig.checkout.getSession();
  }
}
```

---

## Raw API Reference

If you are not using the SDK, here are the raw endpoints. All endpoints are prefixed with `/api/` and do not use a language prefix.

| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/cart/` | - |
| POST | `/api/cart/add/` | `{ product_id, variant_id?, quantity? }` |
| PATCH | `/api/cart/items/{item_id}/` | `{ quantity }` |
| DELETE | `/api/cart/items/{item_id}/` | - |
| POST | `/api/cart/clear/` | - |
| POST | `/api/cart/apply-voucher/` | `{ code }` |
| DELETE | `/api/cart/remove-voucher/{code}/` | - |
| GET | `/api/cart/summary/` | - |
| GET | `/api/checkout/` | - |
| POST | `/api/checkout/shipping-address/` | Address object |
| POST | `/api/checkout/billing-address/` | Address object |
| GET | `/api/checkout/shipping-methods/` | - |
| POST | `/api/checkout/shipping-method/` | `{ shipping_method_id }` |
| GET | `/api/checkout/payment-providers/` | - |
| POST | `/api/checkout/payment-method/` | `{ provider }` |
| POST | `/api/checkout/validate/` | - |
| POST | `/api/checkout/complete/` | Payment-specific data |
