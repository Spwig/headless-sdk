# Changelog

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
