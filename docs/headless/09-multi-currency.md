# Multi-Currency

Spwig supports multiple currencies with automatic exchange rate conversion. This guide covers how currency conversion works under the hood, how to switch currencies in your headless frontend, and how to build robust price display components.

## How Exchange Rates Work

Merchants configure one or more exchange rate providers (e.g., European Central Bank, Open Exchange Rates) through the Spwig admin. Rates are fetched automatically on a configurable schedule and cached in the database. When a rate provider is unavailable, Spwig falls back to the next configured provider in the chain.

Product prices are always **stored in the base currency** and converted on the fly when a request specifies a different display currency. The conversion uses the most recently fetched rate, with a six-decimal-place precision internally to minimize rounding drift.

## Base Currency vs Display Currency

The **base currency** is set during initial store setup and cannot be changed afterward -- it is the canonical price stored on every product, variant, and shipping rate. Think of it as the source of truth.

**Display currencies** are the currencies your customers browse and pay in. When a visitor requests prices in USD but the store's base currency is EUR, the API multiplies the EUR price by the current EUR-to-USD exchange rate and returns the result.

Key rules:

- Product `price` fields in the database are always in the base currency
- The API converts prices at request time using the latest cached rate
- When an order is placed, the exchange rate is **locked** into an `ExchangeRateHistory` record -- the customer pays exactly what they saw at checkout, even if the rate shifts a moment later
- Order records store the display currency and the locked rate for auditing

## Rounding Behavior

All prices returned by the API are **string decimals**, never floating-point numbers. This avoids IEEE 754 precision issues that plague float-based money handling.

The number of decimal places is per-currency:

| Currency | Decimal Places | Example     |
|----------|---------------|-------------|
| USD      | 2             | `"86.39"`   |
| EUR      | 2             | `"79.99"`   |
| GBP      | 2             | `"68.50"`   |
| JPY      | 0             | `"9450"`    |
| BHD      | 3             | `"32.648"`  |

Rounding is handled server-side before the response is sent. Your frontend should display the string as-is or parse it through `Intl.NumberFormat` for locale-aware formatting (see below) -- never round it yourself.

## List Available Currencies

```typescript
const currencies = await spwig.store.listActiveCurrencies();
// [
//   { code: "EUR", name: "Euro", symbol: "\u20ac", exchange_rate: "1.00", decimal_places: 2 },
//   { code: "USD", name: "US Dollar", symbol: "$", exchange_rate: "1.08", decimal_places: 2 },
//   { code: "GBP", name: "British Pound", symbol: "\u00a3", exchange_rate: "0.86", decimal_places: 2 },
//   { code: "JPY", name: "Japanese Yen", symbol: "\u00a5", exchange_rate: "162.35", decimal_places: 0 },
// ]
```

**API:** `GET /api/store/currencies/`

## Switch Currency

### Via SDK

```typescript
// Set default currency for all subsequent requests
spwig.setCurrency('USD');

// Products now return prices in USD
const products = await spwig.catalog.products.list();
// product.price = "86.39", product.currency = "USD"
```

### Per-Request Override

```typescript
// Fetch this product in GBP without changing the session default
const product = await spwig.catalog.products.get('blue-sneakers', {
  currency: 'GBP',
});
```

### Via API (session-based)

```typescript
await spwig.store.setCurrency('USD');
```

**API:** `POST /api/store/set-currency/` with body `{ "currency": "USD" }`

## Get Current Currency Settings

```typescript
const currency = await spwig.store.getCurrency();
// { code: "EUR", symbol: "\u20ac", name: "Euro", decimal_places: 2 }
```

## Currency in Cart and Checkout

Cart totals, shipping costs, and order totals are all returned in the active currency:

```typescript
spwig.setCurrency('USD');

const cart = await spwig.cart.get();
// cart.subtotal = "172.78"
// cart.currency = "USD"

const methods = await spwig.checkout.getShippingMethods();
// method.price = "10.80"  (converted to USD)
```

**When the currency changes, the cart recalculates.** If a customer adds items while browsing in EUR, then switches to USD, the cart re-converts every line item, the subtotal, tax, and shipping at the current exchange rate. No manual refresh is needed -- the next `cart.get()` call returns everything in the new currency.

**At checkout completion, the rate is locked.** When the order is placed, Spwig snapshots the exchange rate into an `ExchangeRateHistory` record linked to that order. This means the customer pays exactly what they saw on the checkout page, and the merchant has a permanent audit trail of the conversion rate used.

### Complete Currency-Aware Checkout Flow

```typescript
// 1. Detect or restore the customer's preferred currency
const saved = localStorage.getItem('preferred_currency');
if (saved) spwig.setCurrency(saved);

// 2. Browse and add to cart -- prices are in the active currency
const product = await spwig.catalog.products.get('premium-headphones');
await spwig.cart.add({ product_id: product.id, quantity: 1 });

// 3. Get cart with converted totals
const cart = await spwig.cart.get();
console.log(`${cart.item_count} items, total: ${cart.currency} ${cart.total}`);

// 4. Start checkout -- shipping methods are also converted
const session = await spwig.checkout.getSession();
const methods = await spwig.checkout.getShippingMethods();
await spwig.checkout.setShippingMethod({ method_id: methods[0].id });

// 5. Complete -- the exchange rate is locked at this moment
const order = await spwig.checkout.complete();
// order.currency = "USD"
// order.exchange_rate = "1.081234"  (locked rate for audit)
// order.total = "182.58"
```

## Building a Currency Switcher

```typescript
const currencies = await spwig.store.listActiveCurrencies();

function switchCurrency(code: string) {
  spwig.setCurrency(code);
  localStorage.setItem('preferred_currency', code);
  // Re-fetch page data to show updated prices
}

// On app load, restore preference
const saved = localStorage.getItem('preferred_currency');
if (saved) spwig.setCurrency(saved);
```

## Price Display Component

### The `formatPrice` Utility

The SDK returns prices as strings. Use `Intl.NumberFormat` for locale-aware formatting:

```typescript
function formatPrice(
  amount: string,
  currency: string,
  locale: string = 'en',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(parseFloat(amount));
}

// formatPrice("86.39", "USD")        -> "$86.39"
// formatPrice("79.99", "EUR", "de")  -> "79,99 \u20ac"
// formatPrice("68.50", "GBP")        -> "\u00a368.50"
// formatPrice("9450", "JPY", "ja")   -> "\uffe59,450"
```

`Intl.NumberFormat` automatically applies the correct number of decimal places for each currency, so you do not need to handle JPY zero-decimals or BHD three-decimals yourself.

### React `<Price>` Component

```tsx
import { useMemo } from 'react';

interface PriceProps {
  amount: string;
  currency: string;
  locale?: string;
  className?: string;
}

export function Price({ amount, currency, locale = 'en', className }: PriceProps) {
  const formatted = useMemo(() => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(parseFloat(amount));
  }, [amount, currency, locale]);

  return <span className={className}>{formatted}</span>;
}

// Usage:
// <Price amount={product.price} currency={product.currency} locale="de" />
// Renders: <span>79,99 \u20ac</span>
```

## Compare-at Price (Sale Display)

When a product is on sale, the API returns both `price` (the current selling price) and `compare_at_price` (the original price). If the product is not on sale, `compare_at_price` is `null`.

```typescript
const product = await spwig.catalog.products.get('winter-jacket');
// product.price = "59.99"
// product.compare_at_price = "89.99"  (or null if not on sale)
// product.currency = "EUR"
```

### React Sale Price Component

```tsx
interface SalePriceProps {
  price: string;
  compareAtPrice: string | null;
  currency: string;
  locale?: string;
}

export function SalePrice({ price, compareAtPrice, currency, locale = 'en' }: SalePriceProps) {
  const fmt = (amount: string) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(parseFloat(amount));

  const isOnSale = compareAtPrice !== null && compareAtPrice !== price;

  return (
    <div className="price-display">
      {isOnSale && (
        <span className="price-original" style={{ textDecoration: 'line-through', opacity: 0.6 }}>
          {fmt(compareAtPrice)}
        </span>
      )}
      <span className={isOnSale ? 'price-sale' : 'price-regular'}>
        {fmt(price)}
      </span>
    </div>
  );
}

// Usage:
// <SalePrice
//   price={product.price}
//   compareAtPrice={product.compare_at_price}
//   currency={product.currency}
//   locale="en"
// />
```

## GeoIP Currency Suggestion

Spwig includes a GeoIP system that can suggest a currency based on the visitor's IP address. Use this to auto-detect the most appropriate currency on first visit, then let the customer override it.

**API:** `GET /api/geoip/v1/suggest/currency/`

```typescript
// Auto-detect currency on first visit
async function detectCurrency(): Promise<string> {
  const saved = localStorage.getItem('preferred_currency');
  if (saved) return saved;

  const response = await fetch(`${BASE_URL}/api/geoip/v1/suggest/currency/`);
  const suggestion = await response.json();
  // { default: "USD", accepted: ["USD", "CAD"], symbol: "$" }

  // Check if the suggested currency is available in the store
  const available = await spwig.store.listActiveCurrencies();
  const codes = available.map((c) => c.code);

  if (codes.includes(suggestion.default)) {
    return suggestion.default;
  }

  // Fall back to first accepted currency that the store supports
  const match = suggestion.accepted.find((c: string) => codes.includes(c));
  return match ?? available[0].code;
}

// On app initialization
const currency = await detectCurrency();
spwig.setCurrency(currency);
```

You can also pass an explicit country code: `GET /api/geoip/v1/suggest/currency/?country=JP` returns `{ "default": "JPY", "accepted": ["JPY"], "symbol": "\u00a5" }`.

## Multi-Currency SEO

Search engine crawlers typically see prices in the store's default (base) currency since they do not send currency preference headers. If you need currency-specific structured data:

- Generate locale-specific static pages (e.g., `/en-us/products/...` with USD prices, `/de/products/...` with EUR prices) and use `hreflang` tags to link them
- Include the correct `priceCurrency` in your JSON-LD Product schema per locale:

```json
{
  "@type": "Product",
  "name": "Premium Headphones",
  "offers": {
    "@type": "Offer",
    "price": "86.39",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

- For single-locale sites, the base currency in structured data is sufficient -- search engines do not penalize for showing prices in one currency

## API Reference Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/store/currencies/` | GET | List all active currencies with exchange rates |
| `/api/store/currency/` | GET | Get the current session currency |
| `/api/store/set-currency/` | POST | Set the session currency |
| `/api/geoip/v1/suggest/currency/` | GET | Suggest currency based on visitor IP |
| `/api/geoip/v1/resolve/` | GET | Full location resolve (includes currency) |

---

Next: [Multi-Language](08-multi-language.md) | [Webhooks](07-webhooks.md) | [Back to index](README.md)
