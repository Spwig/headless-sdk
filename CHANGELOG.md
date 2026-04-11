# Changelog

## [1.3.8] - 2026-04-11

### Added — Consumes backend fixes for headless analytics gaps

Pairs with backend changes in `shop-dev` that close the two gaps identified
in v1.3.7. Both the SDK and backend must be at this version for the
headless funnel and guest share tracking to work.

#### Social
- **`social.trackShareAnonymous()`** — New method for guest share tracking.
  Wraps the new backend endpoint `POST /api/social/track/anonymous/`
  (rate-limited to 20 req/hr per IP). Does NOT require authentication.
  Use this for the vast majority of storefront share events, which come
  from guest visitors. The existing `trackShare()` remains for
  authenticated users.

#### Search
- **`SearchResultsResponse.search_query_id`** is now reliably populated by
  the backend on normal search responses. Previously documented as
  optional-with-caveats; the backend gap has been closed so TypeScript
  callers can treat it as present for non-redirect, non-empty queries.
- **`trackClick()`** — Backend now accepts a bare model name for
  `content_type` (e.g. `'product'` instead of `'catalog.product'`).
  Either form still works. JSDoc updated to recommend the bare form.

## [1.3.7] - 2026-04-10

### Added — Analytics & Funnel Tracking for Headless Storefronts

Fills the gaps identified while wiring the Cocos Botanica headless storefront
to Spwig's native analytics. No new backend endpoints — every change aligns
the SDK with endpoints that already exist in the shop backend.

#### Catalog
- **`catalog.products.trackView(slug)`** — New method wrapping
  `POST /api/catalog/products/{slug}/track_view/`. Use this on PDP mount from
  client components so every visitor's view counts even when the page is
  cached (Next.js ISR, CDN edge, etc.). Without this, `Product.views_count`
  gets diluted to one increment per cache window.

#### GeoIP
- **`geoip.resolve({ page })`** — New optional `page` parameter on the
  existing `resolve()` method. When provided, the backend records a
  `PageView`, updates `VisitorLocation`, captures UTM params, and detects
  device/bot. Hitting this on every Next.js route change gives the admin
  shop dashboard's visitor analytics, traffic sources, geography, and
  conversion funnel their full data feed from a headless frontend.
- New `ResolveOptions` interface extending `RequestOptions` with `page?`.

#### Search — Breaking type changes
- **`search.search()` return type** changed from `PaginatedResponse<SearchResult>`
  to the new `SearchResultsResponse` interface. The backend never returned a
  standard paginated envelope — it uses `{ query, language, results,
  total_count, page, per_page, total_pages, facets, applied_synonyms,
  response_time_ms }`. The old SDK type was simply wrong.
- **`SearchResult` fields updated** to match the backend
  `SearchResultItemSerializer`: field is `thumbnail` not `image`, `name`
  is optional (blog posts use `title`), added `name_base` / `title_base`
  for untranslated fallbacks, `in_stock`, `description`, `excerpt`,
  `product_count`, etc.
- **`search.trackClick()` signature changed** from
  `{ query, result_id, result_type }` to
  `{ search_query_id, content_type, object_id, position }` — the old shape
  did not match the backend `TrackClickRequestSerializer` and silently
  failed validation.
- New `TrackClickInput` interface exported.
- **Known gap (backend-side):** `SearchResultsResponse.search_query_id` is
  typed as optional because the current backend does not yet return it in
  the search results response, even though it creates the `SearchQuery`
  record server-side. Until the backend is updated, calling `trackClick()`
  is only possible if the caller has the ID from elsewhere. A
  shop-dev-side fix is tracked separately.

#### Social
- **`social.trackShare()`** — JSDoc updated to document that the backend
  endpoint requires `IsAuthenticated`. Anonymous visitors cannot track
  shares. For guest sharing in headless storefronts, either only call this
  for logged-in users or wait for a backend fix that exposes an anonymous
  variant.

### `@spwig/react` hooks
- **`useTrackProductView`** — Mutation hook wrapping
  `catalog.products.trackView()`. Fires once on PDP mount to bypass ISR.
- **`useTrackPageView`** — Mutation hook wrapping
  `geoip.resolve({ page })`. Fires on every navigation to feed
  `VisitorLocation` / `PageView` from a headless frontend.
- **`useTrackSearchClick`** updated to use the new `TrackClickInput` type.
- **`useSearch`** return type updated to `SearchResultsResponse`.

## [1.3.0] - 2026-03-20

### Added

#### New Admin Modules
- **Staff Management** (`admin.staff`) — List, invite, update, and delete staff members (4 endpoints)
- **Roles & Permissions** (`admin.roles`) — CRUD roles, list available permissions (5 endpoints)
- **Inventory Intelligence** (`admin.inventory`) — Dashboard, low stock, velocity analysis, stock movements, reorder suggestions, settings (7 endpoints)
- **Bulk Operations** (`admin.bulk`) — Stock adjustments, price updates, category/tag assignment, sale updates, order status, order fulfillment (7 endpoints)

#### Extended Existing Modules
- **Analytics** (`admin.analytics`) — 6 new advanced analytics methods:
  - `getProductAnalytics()` — Product-level performance with revenue, units, returns
  - `getCustomerAnalytics()` — Customer segmentation, geo breakdown, LTV distribution
  - `getCategoryAnalytics()` — Revenue per category with percentage breakdown
  - `getBrandAnalytics()` — Revenue per brand with percentage breakdown
  - `getComparison()` — Enhanced sales comparison with daily breakdown for charts
  - `exportReport()` — Export analytics as CSV or PDF file download
- **Orders** (`admin.orders`) — 4 new document generation methods:
  - `getInvoicePdf()` — Download order invoice as PDF
  - `getPackingSlipPdf()` — Download packing slip as PDF
  - `getPickListPdf()` — Download warehouse pick list as PDF
  - `getBatchDocuments()` — Batch generate documents for multiple orders as ZIP
- **Settings** (`admin.settings`) — 3 new branding methods:
  - `getBranding()` — Get store branding settings
  - `updateBranding()` — Update branding (colors, footer text, address, etc.)
  - `uploadLogo()` — Upload store logo via FormData

#### Infrastructure
- **`BlobResponse`** type for binary file downloads (PDF, CSV, ZIP)
- **`HttpClient.fetchBlob()`** method — Binary file download with auth, timeout, Content-Disposition filename extraction

### Summary
- 4 new admin modules, 3 existing modules extended
- 36 new endpoints total (staff: 4, roles: 5, inventory: 7, bulk: 7, analytics: 6, orders: 4, settings: 3)
- Full TypeScript types for all request inputs and response shapes

## [1.2.0] - 2026-03-14

Initial release with 28 modules covering storefront and admin APIs.
