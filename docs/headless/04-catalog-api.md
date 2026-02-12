# Catalog API

The catalog API is public (no authentication required) and provides access to products, categories, brands, collections, and reviews. This chapter covers response shapes, variant handling, image renditions, filtering, search, and patterns for building product listing pages.

---

## Product Detail Response Shape

Every product returned by the API conforms to this structure:

```typescript
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  compare_at_price: string | null;
  currency: string;
  sku: string;
  barcode: string | null;
  weight: string | null;
  is_available: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';
  product_type: 'simple' | 'variable' | 'bundle' | 'digital' | 'gift_card';
  category: { id: number; name: string; slug: string } | null;
  brand: { id: number; name: string; slug: string; logo: string | null } | null;
  tags: string[];
  images: ProductImage[];
  variants: Variant[];
  attributes: Record<string, string>;
  seo_title: string;
  seo_description: string;
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

---

## Image Structure

Each image includes the original URL and preset renditions for different display contexts:

```typescript
interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  renditions: {
    thumbnail: string;  // 150x150, cropped
    small: string;      // 300x300, cropped
    medium: string;     // 600x600, contained
    large: string;      // 1200x1200, contained
  };
}
```

### Building Responsive Images

Use renditions to build a `srcSet` that reduces bandwidth on mobile:

```typescript
function buildProductImage(image: ProductImage) {
  return {
    src: image.renditions.medium,
    srcSet: `${image.renditions.small} 300w, ${image.renditions.medium} 600w, ${image.renditions.large} 1200w`,
    sizes: '(max-width: 640px) 300px, (max-width: 1024px) 600px, 1200px',
    alt: image.alt_text || '',
  };
}
// <img src={img.src} srcSet={img.srcSet} sizes={img.sizes} alt={img.alt} loading="lazy" />
```

For product cards in a grid, use `small` directly:

```typescript
const thumbnailUrl = product.images[0]?.renditions.small ?? '/placeholder.png';
```

---

## Variants

Variable products have one or more variants, each with its own SKU, price, stock, and attributes. Other product types return an empty `variants` array.

```typescript
interface Variant {
  id: number;
  sku: string;
  name: string;
  price: string;
  compare_at_price: string | null;
  currency: string;
  is_available: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';
  attributes: Record<string, string>;  // e.g. { Size: "M", Color: "Navy" }
  image: ProductImage | null;
}
```

### Building a Variant Selector

Extract option names/values, then find the matching variant when a user picks options:

```typescript
function getVariantOptions(product: Product) {
  const optionMap = new Map<string, Set<string>>();
  for (const variant of product.variants) {
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (!optionMap.has(key)) optionMap.set(key, new Set());
      optionMap.get(key)!.add(value);
    }
  }
  return Array.from(optionMap.entries()).map(([name, values]) => ({
    name, values: Array.from(values),
  }));
}

function findVariant(variants: Variant[], selected: Record<string, string>) {
  return variants.find((v) =>
    Object.entries(selected).every(([key, val]) => v.attributes[key] === val),
  );
}

// Usage:
const options = getVariantOptions(product);
// [{ name: "Size", values: ["S","M","L","XL"] }, { name: "Color", values: ["Black","Navy"] }]

const variant = findVariant(product.variants, { Size: 'M', Color: 'Navy' });
if (variant) {
  console.log(variant.price);        // "69.99"
  console.log(variant.is_available); // true
}
```

When adding a variable product to the cart, always include the `variant_id`:

```typescript
await spwig.cart.add({ product_id: product.id, variant_id: variant.id, quantity: 1 });
```

---

## List Products

```typescript
const products = await spwig.catalog.products.list({
  page: 1, page_size: 12, ordering: '-created_at',
  search: 'sneakers', category: 'shoes', brand: 'nike',
  min_price: 50, max_price: 200,
});
console.log(products.count);    // Total matching products
console.log(products.results);  // Array of Product objects
console.log(products.next);     // URL for next page (or null)
```

**API:** `GET /api/catalog/products/`

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `page_size` | number | Items per page (default: 20, max: 100) |
| `ordering` | string | Sort: `name`, `price`, `created_at`, `popularity`. Prefix `-` for descending |
| `search` | string | Full-text search in name, description, SKU |
| `category` | string | Filter by category slug |
| `brand` | string | Filter by brand slug |
| `collection` | string | Filter by collection slug |
| `min_price` / `max_price` | number | Price range filter |
| `is_available` | boolean | Filter by stock availability |
| `product_type` | string | `simple`, `variable`, `bundle`, `digital`, `gift_card` |
| `tag` | string | Filter by tag slug |
| `attr_{name}` | string | Filter by attribute value (e.g., `attr_color=red`) |

## Get Single Product

```typescript
const product = await spwig.catalog.products.get('blue-sneakers');
console.log(product.name);          // "Blue Sneakers"
console.log(product.price);         // "79.99"
console.log(product.product_type);  // "variable"
console.log(product.variants);      // [{ sku: "BLU-42", price: "79.99", attributes: { size: "42" } }]
```

**API:** `GET /api/catalog/products/{slug}/`

---

## Attribute Filtering

The filters endpoint returns available facets for the current product set. Use it to build dynamic filter sidebars that reflect what is actually in stock.

```typescript
const filters = await spwig.catalog.getFilters();
```

**Response shape:**

```typescript
interface FilterResponse {
  categories: { slug: string; name: string; count: number }[];
  brands: { slug: string; name: string; count: number }[];
  price_range: { min: number; max: number };
  attributes: {
    name: string;
    slug: string;
    values: { slug: string; name: string; count: number }[];
  }[];
}
```

### Applying Filters

Pass filter selections directly to `products.list()`. Attribute filters use the `attr_` prefix:

```typescript
const products = await spwig.catalog.products.list({
  category: 'shoes',
  brand: 'nike',
  min_price: 50,
  max_price: 150,
  attr_color: 'black',
  ordering: 'price',
});
```

After loading filtered results, re-fetch filters in parallel to update facet counts:

```typescript
const [products, filters] = await Promise.all([
  spwig.catalog.products.list(params),
  spwig.catalog.getFilters(params),
]);
```

---

## Building a Product Listing Page

This reusable loader combines pagination, filtering, sorting, and search:

```typescript
import { SpwigClient } from '@spwig/sdk';

async function loadProductListing(spwig: SpwigClient, params: {
  page?: number; pageSize?: number; search?: string; category?: string;
  brand?: string; minPrice?: number; maxPrice?: number;
  ordering?: string; attributes?: Record<string, string>;
} = {}) {
  const pageSize = params.pageSize ?? 24;
  const query: Record<string, any> = { page: params.page ?? 1, page_size: pageSize };

  if (params.search) query.search = params.search;
  if (params.category) query.category = params.category;
  if (params.brand) query.brand = params.brand;
  if (params.minPrice != null) query.min_price = params.minPrice;
  if (params.maxPrice != null) query.max_price = params.maxPrice;
  if (params.ordering) query.ordering = params.ordering;
  for (const [name, value] of Object.entries(params.attributes ?? {})) {
    query[`attr_${name}`] = value;
  }

  const [response, filters] = await Promise.all([
    spwig.catalog.products.list(query),
    spwig.catalog.getFilters(query),
  ]);

  return {
    products: response.results,
    filters,
    totalCount: response.count,
    totalPages: Math.ceil(response.count / pageSize),
    currentPage: query.page,
    hasNext: response.next !== null,
    hasPrevious: response.previous !== null,
  };
}

// Usage:
const listing = await loadProductListing(spwig, {
  category: 'shoes', ordering: '-price', pageSize: 12, attributes: { color: 'black' },
});
console.log(`${listing.totalCount} products across ${listing.totalPages} pages`);
```

---

## Category Tree

### List and Get Categories

```typescript
const categories = await spwig.catalog.categories.list();

const shoes = await spwig.catalog.categories.get('shoes');
console.log(shoes.children);       // Sub-categories
console.log(shoes.product_count);  // Number of products
```

**API:** `GET /api/catalog/categories/`, `GET /api/catalog/categories/{slug}/`

### Category Structure

Categories form a tree with `parent`, `children`, and `breadcrumbs` fields:

```typescript
interface Category {
  id: number; name: string; slug: string; description: string;
  image: string | null;
  parent: { id: number; name: string; slug: string } | null;
  children: { id: number; name: string; slug: string }[];
  product_count: number;
  breadcrumbs: { id: number; name: string; slug: string }[];
}
```

### Building Breadcrumbs

```typescript
const category = await spwig.catalog.categories.get('running-shoes');
// category.breadcrumbs = [
//   { id: 1, name: "Shoes", slug: "shoes" },
//   { id: 5, name: "Athletic", slug: "athletic" },
//   { id: 12, name: "Running Shoes", slug: "running-shoes" },
// ]
const crumbs = category.breadcrumbs.map((crumb, i, arr) => ({
  label: crumb.name, href: `/category/${crumb.slug}`, isLast: i === arr.length - 1,
}));
```

### Rendering a Sidebar Navigation

Build a recursive tree from the top-level categories list:

```typescript
function buildNavTree(categories: Category[]) {
  return categories.map((cat) => ({
    label: cat.name,
    href: `/category/${cat.slug}`,
    count: cat.product_count,
    children: cat.children.length > 0 ? buildNavTree(cat.children as Category[]) : [],
  }));
}
```

---

## Brands, Collections, and Reviews

```typescript
const brands = await spwig.catalog.brands.list();
const nike = await spwig.catalog.brands.get('nike');

const collections = await spwig.catalog.collections.list();
const summer = await spwig.catalog.collections.get('summer-sale');

// List reviews for a product
const reviews = await spwig.catalog.reviews.list({ product: 42 });

// Submit a review (requires auth)
await spwig.catalog.reviews.create({
  product: 42, rating: 5, title: 'Great shoes!', comment: 'Very comfortable.',
});
```

---

## Search Integration

The search API provides autocomplete, full search, and trending queries.

### Autocomplete with Debounce

```typescript
const results = await spwig.search.autocomplete('sneak');
// { products: [{ name: "Blue Sneakers", slug: "blue-sneakers", ... }],
//   categories: [{ name: "Sneakers", slug: "sneakers" }],
//   brands: [] }
```

Debounced implementation for an input field:

```typescript
let timer: ReturnType<typeof setTimeout>;

function debouncedAutocomplete(query: string) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (query.length < 2) return;
    const results = await spwig.search.autocomplete(query);
    renderSuggestions(results);
  }, 300);
}

inputElement.addEventListener('input', (e) => debouncedAutocomplete(e.target.value));
```

### Full Search

```typescript
const results = await spwig.search.search({
  q: 'running shoes',
  page: 1,
  page_size: 24,
  ordering: 'relevance',
});
// Same paginated shape as products.list()
```

### Trending Searches

```typescript
const trending = await spwig.search.trending();
// ["sneakers", "summer dress", "laptop bag", "gift card"]
```

---

## Stock Availability

```typescript
const stock = await spwig.catalog.products.checkStock('blue-sneakers');
// { is_available: true, quantity: 15, locations: [{ warehouse_name: "Main", quantity: 10 }, ...] }

const avail = await spwig.catalog.products.availability('blue-sneakers');
// { is_available: true, quantity: 15 }

// Subscribe for back-in-stock notification
await spwig.catalog.products.notifyMe('sold-out-product', 'user@example.com');
```

---

## Product Type Badges

Use `product_type` to render badges and adjust the product detail layout:

| Type | Badge | UI Notes |
|------|-------|----------|
| `simple` | None | Standard add-to-cart |
| `variable` | None | Show variant selector (size, color, etc.) |
| `bundle` | "Bundle" | Show list of included products |
| `digital` | "Digital" | Hide shipping estimate, show download info |
| `gift_card` | "Gift Card" | Show denomination picker, hide shipping |

```typescript
function getProductTypeHints(type: Product['product_type']) {
  return {
    showVariantSelector: type === 'variable',
    showBundleContents: type === 'bundle',
    showDownloadInfo: type === 'digital',
    showDenominationPicker: type === 'gift_card',
    requiresShipping: type !== 'digital' && type !== 'gift_card',
  };
}

const hints = getProductTypeHints(product.product_type);
if (!hints.requiresShipping) { /* hide shipping estimate */ }
```

---

## Recommendations and Gift Cards

```typescript
const recommended = await spwig.catalog.getRecommendations();
// Returns products based on browsing/purchase history

const balance = await spwig.catalog.checkGiftCardBalance('GIFT-ABC-123');
// { balance: "50.00", currency: "EUR" }
```

---

## Raw API Reference

All endpoints use `/api/` with no language prefix.

| Method | Endpoint |
|--------|----------|
| GET | `/api/catalog/products/` |
| GET | `/api/catalog/products/{slug}/` |
| GET | `/api/catalog/products/{slug}/stock/` |
| GET | `/api/catalog/products/{slug}/availability/` |
| POST | `/api/catalog/products/{slug}/notify-me/` |
| GET | `/api/catalog/categories/` |
| GET | `/api/catalog/categories/{slug}/` |
| GET | `/api/catalog/brands/` |
| GET | `/api/catalog/brands/{slug}/` |
| GET | `/api/catalog/collections/` |
| GET | `/api/catalog/collections/{slug}/` |
| GET | `/api/catalog/reviews/` |
| POST | `/api/catalog/reviews/` |
| GET | `/api/catalog/filters/` |
| GET | `/api/catalog/recommendations/` |
| POST | `/api/catalog/gift-cards/check-balance/` |
| GET | `/api/search/autocomplete/` |
| GET | `/api/search/` |
| GET | `/api/search/trending/` |
