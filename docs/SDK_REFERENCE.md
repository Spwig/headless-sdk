# @spwig/sdk

Official TypeScript SDK for building headless storefronts with [Spwig](https://spwig.com) eCommerce.

- Zero dependencies — uses native `fetch` (browser, Node 18+, Deno, edge runtimes)
- Auto-generated types from the Spwig OpenAPI schema
- Typed error classes for structured error handling
- Webhook signature verification utility

## Installation

```bash
npm install @spwig/sdk
```

## Quick Start

```typescript
import { SpwigClient } from '@spwig/sdk';

const spwig = new SpwigClient({
  baseUrl: 'https://your-store.com',
  language: 'en',
  currency: 'EUR',
});

// Browse products
const products = await spwig.catalog.products.list({ page: 1 });
console.log(products.results);

// Login
const { user, token } = await spwig.auth.login({
  username: 'customer@example.com',
  password: 'password123',
});
spwig.setToken(token);

// Add to cart
await spwig.cart.add({ product_id: 42, quantity: 1 });

// Get cart
const cart = await spwig.cart.get();
console.log(`${cart.item_count} items — ${cart.currency} ${cart.total}`);
```

## Configuration

```typescript
const spwig = new SpwigClient({
  // Required
  baseUrl: 'https://your-store.com',   // Spwig backend URL (no trailing slash)

  // Optional
  language: 'en',                       // Accept-Language header (default: 'en')
  currency: 'EUR',                      // X-Currency header
  token: 'abc123...',                   // Auth token (can also set later)
  timeout: 15_000,                      // Request timeout in ms (default: 30000)
  fetch: customFetch,                   // Custom fetch implementation
  onUnauthorized: () => {               // Called on 401 responses
    window.location.href = '/login';
  },
});

// Change settings at runtime
spwig.setToken(token);
spwig.setLanguage('fr');
spwig.setCurrency('USD');
```

## API Reference

### Authentication (`spwig.auth`)

```typescript
// Register
const { user, token } = await spwig.auth.register({
  username: 'johndoe',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  password: 'SecurePass123!',
  password_confirm: 'SecurePass123!',
});
spwig.setToken(token);

// Login
const { user, token } = await spwig.auth.login({ username, password });
spwig.setToken(token);

// Logout
await spwig.auth.logout();
spwig.setToken(undefined);

// Password reset
await spwig.auth.requestPasswordReset({ email: 'john@example.com' });
await spwig.auth.confirmPasswordReset(uidb64, resetToken, {
  new_password: 'NewPass456!',
  new_password_confirm: 'NewPass456!',
});

// Social OAuth providers
const providers = await spwig.auth.getSocialProviders();

// SMS verification (TCPA double opt-in)
await spwig.auth.sendSmsVerification({ phone_number: '+1234567890' });
await spwig.auth.verifySmsCode({ phone_number: '+1234567890', code: '123456' });
await spwig.auth.resendSmsVerification({ phone_number: '+1234567890' });

// Guest conversion (convert guest checkout to registered account)
const { user, token } = await spwig.auth.convertGuest({ password: 'NewPass!' });
spwig.setToken(token);

// Account creation context (password requirements, available providers)
const ctx = await spwig.auth.getCreationContext();
// { requires_email_verification, password_min_length, social_providers }
```

### Catalog (`spwig.catalog`)

```typescript
// Products
const products = await spwig.catalog.products.list({
  page: 1,
  page_size: 20,
  category: 'shoes',
  brand: 'nike',
  min_price: 50,
  max_price: 200,
});
const product = await spwig.catalog.products.get('product-slug');
const stock = await spwig.catalog.products.checkStock('product-slug');
const avail = await spwig.catalog.products.availability('product-slug');
await spwig.catalog.products.notifyMe('product-slug', 'user@example.com');

// Categories
const categories = await spwig.catalog.categories.list();
const category = await spwig.catalog.categories.get('category-slug');

// Brands
const brands = await spwig.catalog.brands.list();

// Collections
const collections = await spwig.catalog.collections.list();

// Reviews
const reviews = await spwig.catalog.reviews.list({ product: 42 });
await spwig.catalog.reviews.create({ product: 42, rating: 5, comment: 'Great!' });

// Recommendations
const recommended = await spwig.catalog.getRecommendations();

// Dynamic filters
const filters = await spwig.catalog.getFilters();

// Catalog stats
const stats = await spwig.catalog.getStats();

// Pickup locations
const locations = await spwig.catalog.getPickupLocations();

// Gift card balance
const balance = await spwig.catalog.checkGiftCardBalance('GIFT-CODE');
```

#### Bookings (`spwig.catalog.bookings`)

For bookable/appointment products:

```typescript
// Check availability
const availability = await spwig.catalog.bookings.getAvailability('spa-treatment');

// Get time slots for a date
const slots = await spwig.catalog.bookings.getSlots('spa-treatment', { date: '2026-03-20' });

// Check a specific slot
const check = await spwig.catalog.bookings.check('spa-treatment', {
  date: '2026-03-20',
  start_time: '10:00',
  end_time: '11:00',
  resource_id: 1,
});

// Resources
const resources = await spwig.catalog.bookings.getResourceAvailability('spa-treatment');
const resource = await spwig.catalog.bookings.getResource('spa-treatment', 1);

// iCal feed
const ical = await spwig.catalog.bookings.getIcal('spa-treatment', bookingUid);

// Waitlist
await spwig.catalog.bookings.joinWaitlist('spa-treatment', {
  email: 'user@example.com',
  date: '2026-03-20',
});

// Customer bookings (requires auth)
const myBookings = await spwig.catalog.bookings.myBookings();
const booking = await spwig.catalog.bookings.get(bookingId);
await spwig.catalog.bookings.cancel(bookingId);
await spwig.catalog.bookings.reschedule(bookingId, {
  date: '2026-03-21',
  start_time: '14:00',
});
```

#### Licenses (`spwig.catalog.licenses`)

For digital products with license keys:

```typescript
const info = await spwig.catalog.licenses.validate('LICENSE-KEY');
const activated = await spwig.catalog.licenses.activate({ key: 'LICENSE-KEY', device_name: 'My PC' });
const deactivated = await spwig.catalog.licenses.deactivate({ key: 'LICENSE-KEY', device_id: 'abc' });
const licenseInfo = await spwig.catalog.licenses.getInfo('LICENSE-KEY');
```

### Cart (`spwig.cart`)

```typescript
const cart = await spwig.cart.get();
await spwig.cart.add({ product_id: 42, variant_id: 5, quantity: 2 });
await spwig.cart.updateItem(itemId, { quantity: 3 });
await spwig.cart.removeItem(itemId);
await spwig.cart.clear();

// Vouchers
await spwig.cart.applyVoucher('SAVE10');
await spwig.cart.removeVoucher('SAVE10');

// Lightweight summary (for header badge)
const summary = await spwig.cart.getSummary();
```

### Checkout (`spwig.checkout`)

Multi-step checkout flow:

```typescript
// 1. Get session
const session = await spwig.checkout.getSession();

// 2. Set shipping address
await spwig.checkout.setShippingAddress({
  name: 'John Doe',
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'US',
});

// 3. Get and select shipping method
const methods = await spwig.checkout.getShippingMethods();
await spwig.checkout.selectShippingMethod(methods[0].id);

// 4. Get and select payment provider
const providers = await spwig.checkout.getPaymentProviders();
await spwig.checkout.selectPaymentMethod(providers[0].slug);

// 5. Validate (optional)
const { is_valid, errors } = await spwig.checkout.validate();

// 6. Complete
const order = await spwig.checkout.complete();
console.log(`Order ${order.order_number} placed!`);
```

### Orders (`spwig.orders`)

```typescript
const orders = await spwig.orders.list({ page: 1, status: 'completed' });
const order = await spwig.orders.get(orderId);

// Returns
await spwig.orders.createReturn(orderId, {
  items: [{ order_item_id: 1, quantity: 1, reason: 'defective' }],
});
```

### Account (`spwig.account`)

```typescript
const profile = await spwig.account.getProfile();
await spwig.account.updateProfile({ first_name: 'Jane', phone: '+1234567890' });
await spwig.account.updatePreferences({ dashboard_layout: 'grid', show_wishlist: true });
await spwig.account.refreshMetrics();

// Addresses
const addresses = await spwig.account.listAddresses();
await spwig.account.createAddress({ name: 'Home', address1: '123 Main St', city: 'NY', state: 'NY', postal_code: '10001', country: 'US' });
const addr = await spwig.account.getAddress(addressId);
await spwig.account.updateAddress(addressId, { city: 'Brooklyn' });
await spwig.account.deleteAddress(addressId);

// Communication preferences
const prefs = await spwig.account.getCommunicationPreferences();
await spwig.account.updateCommunicationPreference({
  channel: 'email',
  message_type: 'marketing',
  enabled: false,
});
await spwig.account.bulkUpdateCommunicationPreferences([
  { channel: 'email', message_type: 'marketing', enabled: false },
  { channel: 'sms', message_type: 'transactional', enabled: true },
]);
await spwig.account.unsubscribeAll();

// GDPR data export
const exportData = await spwig.account.exportPreferences();
```

### Search (`spwig.search`)

```typescript
const results = await spwig.search.search({ q: 'blue sneakers', page: 1 });
const suggestions = await spwig.search.autocomplete('blue sn');
const trending = await spwig.search.trending();
await spwig.search.trackClick({ query: 'blue', result_id: 42, result_type: 'product' });
const corrections = await spwig.search.suggestCorrections('bleu sneakrs');

// Search configuration
const engines = await spwig.search.getEngines();
const settings = await spwig.search.getSettings();
```

### Store (`spwig.store`)

```typescript
const info = await spwig.store.getInfo();
const currencies = await spwig.store.listActiveCurrencies();
await spwig.store.setCurrency('USD');
const paymentMethods = await spwig.store.getPaymentMethods();
```

### Loyalty (`spwig.loyalty`)

```typescript
const status = await spwig.loyalty.getStatus();
const tiers = await spwig.loyalty.listTiers();
const rewards = await spwig.loyalty.listRewards();
await spwig.loyalty.redeemReward(rewardId, { points: 500 });
```

### Wishlist (`spwig.wishlist`)

```typescript
const items = await spwig.wishlist.list();
await spwig.wishlist.add(productId);       // sends { product_id }
await spwig.wishlist.remove(itemId);
```

### Payments (`spwig.payments`)

```typescript
const intent = await spwig.payments.createIntent({ order_id: orderId, provider: 'stripe' });
const saved = await spwig.payments.listMethods();
```

### Blog (`spwig.blog`)

```typescript
// Posts
const posts = await spwig.blog.posts.list({ page: 1, category: 'news', tag: 'featured' });
const post = await spwig.blog.posts.get(postId);

// Categories
const categories = await spwig.blog.categories.list();
const category = await spwig.blog.categories.get(categoryId);

// Tags
const tags = await spwig.blog.tags.list();
const tag = await spwig.blog.tags.get(tagId);

// Subscriptions
const sub = await spwig.blog.subscribe('user@example.com');
await spwig.blog.verifySubscription(token);
await spwig.blog.unsubscribe(token);
const prefs = await spwig.blog.getPreferences(token);

// Settings
const settings = await spwig.blog.getSettings();
```

### Announcements (`spwig.announcements`)

```typescript
const active = await spwig.announcements.getActive();
const announcement = await spwig.announcements.get(announcementId);
```

### Pages (`spwig.pages`)

```typescript
// Legal pages (terms, privacy, returns, shipping)
const legal = await spwig.pages.getLegal();

// Get page by type or slug
const termsPage = await spwig.pages.getByType('terms');
const customPage = await spwig.pages.getBySlug('about-us');
```

### Forms (`spwig.forms`)

```typescript
// Get form definition
const form = await spwig.forms.get('contact-form');

// Submit
const result = await spwig.forms.submit('contact-form', { name: 'Jane', email: 'jane@example.com', message: 'Hello' });

// Multi-step: save partial progress
const partial = await spwig.forms.savePartial('application-form', { step: 1, name: 'Jane' });

// File upload
const upload = await spwig.forms.uploadFile('application-form', file, 'resume');
```

### Social (`spwig.social`)

```typescript
// Track a share event
await spwig.social.trackShare({
  content_type: 'product',
  object_id: 42,
  platform: 'facebook',
  url: 'https://store.com/product/42',
});

// Get share counts for a product
const counts = await spwig.social.getShareCounts('product', 42);
// { facebook: 10, twitter: 5, total: 25, ... }

// Get authenticated user's share history
const myShares = await spwig.social.getUserShares();
```

### Messages (`spwig.messages`)

```typescript
// Public contact form
await spwig.messages.submitContactForm({
  name: 'Jane',
  email: 'jane@example.com',
  subject: 'Order question',
  message: 'Where is my order?',
  message_type: 'order',
  order_number: 'ORD-001',
});

// Get available subjects
const subjects = await spwig.messages.getContactSubjects();

// Authenticated message history
const messages = await spwig.messages.list({ page: 1 });
const message = await spwig.messages.get(messageId);
```

### Subscriptions (`spwig.subscriptions`)

```typescript
// Browse plans
const plans = await spwig.subscriptions.listPlans();
const plan = await spwig.subscriptions.getPlan(planId);  // UUID string

// Manage subscriptions (requires auth)
const subs = await spwig.subscriptions.list();
const sub = await spwig.subscriptions.get(subscriptionId);  // UUID string
const newSub = await spwig.subscriptions.create({ plan_id: 'uuid-string' });
await spwig.subscriptions.cancel(subscriptionId, { reason: 'Too expensive' });  // POST, not DELETE
```

### GeoIP (`spwig.geoip`)

```typescript
// Resolve visitor location
const location = await spwig.geoip.resolve();
// { ip, country, country_name, city, currency, language, timezone, is_eu, ... }

// Set session preferences
await spwig.geoip.setPreference({ currency: 'USD', language: 'en' });

// Get suggestions based on location
const currency = await spwig.geoip.suggestCurrency();
const language = await spwig.geoip.suggestLanguage();

// List countries
const countries = await spwig.geoip.listCountries();

// Report a location correction
await spwig.geoip.reportCorrection({ actual_country: 'DE', feedback: 'Detected wrong country' });
```

### Recently Viewed (`spwig.recentlyViewed`)

```typescript
const viewed = await spwig.recentlyViewed.list({ page: 1 });
// Each item: { id, product, viewed_at, view_count }
```

### Customizer (`spwig.customizer`)

For products with custom design options:

```typescript
// Get customization config for a product
const config = await spwig.customizer.getConfig(productId);
// { surfaces, clipart_categories, fonts, templates, pricing }

// Upload design image
const { url, thumbnail } = await spwig.customizer.uploadImage(file);

// Assets
const clipart = await spwig.customizer.getClipart();
const fonts = await spwig.customizer.getFonts();
const templates = await spwig.customizer.getTemplates(productId);

// Saved designs (requires auth)
const designs = await spwig.customizer.listDesigns();
const saved = await spwig.customizer.saveDesign({
  name: 'My Design',
  product_id: 42,
  design_data: { /* canvas JSON */ },
});
const design = await spwig.customizer.getDesign(designId);
await spwig.customizer.deleteDesign(designId);

// Pricing
const price = await spwig.customizer.calculatePrice({ product_id: 42, surfaces: [/*...*/] });

// Prepare for cart
const { design_token, pricing } = await spwig.customizer.prepareForCart({
  product_id: 42,
  design_data: { /* canvas JSON */ },
});
```

### Customer (`spwig.customer`)

All endpoints require authentication.

```typescript
// Dashboard overview
const dashboard = await spwig.customer.getDashboard();
// { name, total_orders, total_spent, loyalty_points, recent_orders, ... }

// Stats
const stats = await spwig.customer.getStats();
// { total_orders, average_order_value, purchase_frequency_category, return_rate, ... }

// Insights
const insights = await spwig.customer.getInsights();
// { total_lifetime_spent, monthly_spending, top_categories, top_brands, ... }

// Additional metrics
const ltv = await spwig.customer.getLifetimeValue();
const loyalty = await spwig.customer.getLoyaltyStatus();
const savings = await spwig.customer.getSavings();
const favorites = await spwig.customer.getFavorites();
const recs = await spwig.customer.getRecommendations();

// Digital products
const products = await spwig.customer.getDigitalProducts();
const link = await spwig.customer.getDownloadLink(assetId);
// { download_url, expires_in_seconds, filename, file_size, downloads_remaining }

// License management
const licenses = await spwig.customer.getLicenses();
const activated = await spwig.customer.activateLicense(licenseId, {
  device_identifier: 'abc-123',
  device_name: 'My Laptop',
});
const deactivated = await spwig.customer.deactivateLicense(licenseId, {
  device_identifier: 'abc-123',
});
```

### Address Service (`spwig.addressService`)

```typescript
// Autocomplete
const { suggestions } = await spwig.addressService.autocomplete('123 Main', {
  country: 'US',
  limit: 5,
});

// Normalize a freeform address string
const normalized = await spwig.addressService.normalize('123 main st, new york, ny');

// Validate a structured address
const validation = await spwig.addressService.validate({
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postal_code: '10001',
  country: 'US',
});
// { valid: true, enhanced: { ... }, errors: [] }

// Enhance with additional data (requires auth)
const { enhanced } = await spwig.addressService.enhance({ address: { ... } });

// Reverse geocode
const address = await spwig.addressService.reverseGeocode(40.7128, -74.0060);

// Health check
const health = await spwig.addressService.health();
```

### Referrals (`spwig.referrals`)

```typescript
// Get referral program details
const program = await spwig.referrals.getProgram();
// { name, status, reward_config, terms_and_conditions }

// Track a referral click
await spwig.referrals.trackClick(referralToken);

// Dashboard (requires auth)
const dashboard = await spwig.referrals.getMyReferrals();
// { referral_link, total_clicks, total_conversions, total_rewards_earned, ... }

// Rewards (requires auth)
const rewards = await spwig.referrals.listRewards();
```

### Affiliate (`spwig.affiliate`)

```typescript
// Browse programs
const programs = await spwig.affiliate.listPrograms();
const program = await spwig.affiliate.getProgram(programId);

// Join a program (requires auth)
const affiliate = await spwig.affiliate.join({
  program: programId,
  payment_email: 'affiliate@example.com',
  website: 'https://myblog.com',
});

// Get affiliate details
const me = await spwig.affiliate.getAffiliate(affiliateId);

// Links
const links = await spwig.affiliate.listLinks();
const link = await spwig.affiliate.createLink({
  program: programId,
  destination_url: 'https://store.com/product/shoes',
  label: 'Spring sale',
});
const linkDetail = await spwig.affiliate.getLink(linkId);

// Commissions
const commissions = await spwig.affiliate.listCommissions();
const commission = await spwig.affiliate.getCommission(commissionId);

// Payouts
const payouts = await spwig.affiliate.listPayouts();
const payout = await spwig.affiliate.getPayout(payoutId);
```

### Webhooks (`spwig.webhooks`)

Programmatic webhook management (requires admin auth):

```typescript
// Endpoint CRUD
const endpoints = await spwig.webhooks.listEndpoints();
const endpoint = await spwig.webhooks.createEndpoint({
  name: 'Order Handler',
  url: 'https://myapp.com/webhooks/spwig',
  events: ['order.created', 'order.paid'],
});
// Save endpoint.secret -- only returned on creation

const detail = await spwig.webhooks.getEndpoint(endpointId);
await spwig.webhooks.updateEndpoint(endpointId, { events: ['*'] });
await spwig.webhooks.deleteEndpoint(endpointId);

// Operations
await spwig.webhooks.testEndpoint(endpointId);
const { secret } = await spwig.webhooks.rotateSecret(endpointId);
await spwig.webhooks.resetFailures(endpointId);
const stats = await spwig.webhooks.getEndpointStats(endpointId);

// Delivery tracking
const deliveries = await spwig.webhooks.listDeliveries({ endpoint: endpointId, status: 'failed' });
const delivery = await spwig.webhooks.getDelivery(deliveryId);
await spwig.webhooks.retryDelivery(deliveryId);

// Event types
const events = await spwig.webhooks.listEvents();
const docs = await spwig.webhooks.getDocs();
```

## Admin API (`spwig.admin`)

The admin API provides full merchant management capabilities. It uses a separate authentication system (`Bearer` tokens) from the storefront (`Token` auth).

Import admin types from `@spwig/sdk/admin` or from the main `@spwig/sdk` entry point.

### Admin Auth (`spwig.admin.auth`)

```typescript
// Staff login (may return 2FA challenge)
const result = await spwig.admin.auth.login({
  email: 'staff@example.com',
  password: 'secret',
  device_id: 'device-123',
  device_name: 'iPhone 15 Pro',
});

if ('tokens' in result) {
  // Successful login
  spwig.setToken(result.tokens.access_token);
} else {
  // 2FA required
  const login = await spwig.admin.auth.verify2fa({
    pending_token: result.pending_token,
    code: '123456',
    device_id: 'device-123',
  });
  spwig.setToken(login.tokens.access_token);
}

// Token refresh
const { tokens } = await spwig.admin.auth.refreshToken({
  refresh_token: 'refresh-token-here',
});

// Logout
await spwig.admin.auth.logout({ device_id: 'device-123' });

// Profile
const profile = await spwig.admin.auth.getProfile();

// Password reset
await spwig.admin.auth.requestPasswordReset({ email: 'staff@example.com' });
await spwig.admin.auth.confirmPasswordReset({
  uid: 'uid', token: 'token',
  new_password: 'NewPass!', new_password_confirm: 'NewPass!',
});

// SSO
const ssoConfig = await spwig.admin.auth.getSsoConfig();
```

### Admin Analytics (`spwig.admin.analytics`)

```typescript
// Dashboard
const dashboard = await spwig.admin.analytics.getDashboard();
const quickStats = await spwig.admin.analytics.getQuickStats();

// Sales KPIs
const kpi = await spwig.admin.analytics.getSalesKpi('7_days');

// Top products
const topProducts = await spwig.admin.analytics.getTopProducts({ period: 'today', limit: 10 });

// Sales comparison
const comparison = await spwig.admin.analytics.getSalesComparison('7_days');

// Daily stats (for charts)
const daily = await spwig.admin.analytics.getDailyStats('30_days');

// Advanced: Product analytics
const productAnalytics = await spwig.admin.analytics.getProductAnalytics({
  start_date: '2026-01-01',
  end_date: '2026-03-20',
  category_id: 5,
  ordering: '-revenue',
});

// Advanced: Customer analytics
const customerAnalytics = await spwig.admin.analytics.getCustomerAnalytics({
  start_date: '2026-01-01',
  end_date: '2026-03-20',
  segment: 'returning',
});

// Advanced: Category & brand analytics
const categoryAnalytics = await spwig.admin.analytics.getCategoryAnalytics({
  start_date: '2026-01-01', end_date: '2026-03-20',
});
const brandAnalytics = await spwig.admin.analytics.getBrandAnalytics({
  start_date: '2026-01-01', end_date: '2026-03-20',
});

// Enhanced comparison with daily breakdown
const enhanced = await spwig.admin.analytics.getComparison({
  start_date: '2026-03-01', end_date: '2026-03-20',
  compare_start_date: '2026-02-01', compare_end_date: '2026-02-20',
});

// Export report (returns binary file)
const report = await spwig.admin.analytics.exportReport({
  report_type: 'products',
  format: 'csv',
  start_date: '2026-01-01',
  end_date: '2026-03-20',
});
// report.blob — Blob, report.filename — string | null
```

### Admin Orders (`spwig.admin.orders`)

```typescript
// List orders
const orders = await spwig.admin.orders.list({
  filter_type: 'open',
  search: 'john',
  sort: '-created_at',
});

// Order counts by status
const counts = await spwig.admin.orders.getCounts();

// Order detail
const order = await spwig.admin.orders.get('ORD-001');

// Status management
await spwig.admin.orders.updateStatus('ORD-001', {
  status: 'shipped', tracking_number: 'UPS123', notes: 'Shipped via UPS',
});
await spwig.admin.orders.cancel('ORD-001', { reason: 'Customer request', notify_customer: true });
await spwig.admin.orders.refund('ORD-001', { amount: '25.00', reason: 'Partial refund' });

// Tracking
await spwig.admin.orders.updateTracking('ORD-001', { tracking_number: 'UPS123', carrier: 'UPS' });

// Notes
const notes = await spwig.admin.orders.getNotes('ORD-001');
await spwig.admin.orders.addNote('ORD-001', {
  note: 'Customer called about delivery', is_customer_visible: false,
});

// Document generation (returns BlobResponse)
const invoice = await spwig.admin.orders.getInvoicePdf('ORD-001');
const packingSlip = await spwig.admin.orders.getPackingSlipPdf('ORD-001');
const pickList = await spwig.admin.orders.getPickListPdf('ORD-001');

// Batch documents (ZIP of multiple orders)
const batch = await spwig.admin.orders.getBatchDocuments({
  order_numbers: ['ORD-001', 'ORD-002'],
  document_types: ['invoice', 'packing_slip'],
});
```

### Admin Products (`spwig.admin.products`)

```typescript
// List products
const products = await spwig.admin.products.products.list({
  status: 'published', stock_status: 'low_stock', page: 1,
});

// Product counts
const productCounts = await spwig.admin.products.products.getCounts();

// CRUD
const newProduct = await spwig.admin.products.products.create({
  name: 'Blue Sneakers', price: '99.99', sku: 'SNEAK-001',
});
const detail = await spwig.admin.products.products.get(42);
await spwig.admin.products.products.update(42, { price: '89.99' });
await spwig.admin.products.products.delete(42);

// Stock & status
await spwig.admin.products.products.adjustStock(42, { quantity: 50, reason: 'Restock' });
await spwig.admin.products.products.updateStatus(42, { status: 'published' });

// Images
const image = await spwig.admin.products.images.upload(42, formData);
await spwig.admin.products.images.setPrimary(42, imageId);
await spwig.admin.products.images.reorder(42, { image_ids: [3, 1, 2] });
await spwig.admin.products.images.delete(42, imageId);

// Variants
const variants = await spwig.admin.products.variants.list(42);
const variant = await spwig.admin.products.variants.create(42, {
  name: 'Size 10', sku: 'SNEAK-001-10', price: '99.99',
});
await spwig.admin.products.variants.update(42, variantId, { price: '89.99' });
await spwig.admin.products.variants.delete(42, variantId);

// Attributes
const attrs = await spwig.admin.products.attributes.list();
await spwig.admin.products.attributes.create({ name: 'Material', values: ['Cotton', 'Polyester'] });
await spwig.admin.products.attributes.assign(42, {
  attributes: [{ attribute_id: 1, values: ['Cotton'] }],
});
```

### Admin Categories (`spwig.admin.categories`)

```typescript
const categories = await spwig.admin.categories.list({ is_active: 'true' });
const category = await spwig.admin.categories.get(5);
const newCat = await spwig.admin.categories.create({ name: 'Shoes', parent_id: 1 });
await spwig.admin.categories.update(5, { name: 'Footwear' });
await spwig.admin.categories.delete(5);

// Images & banners
await spwig.admin.categories.uploadImage(5, formData);
await spwig.admin.categories.deleteImage(5);
await spwig.admin.categories.uploadBanner(5, formData);
await spwig.admin.categories.deleteBanner(5);
```

### Admin Brands (`spwig.admin.brands`)

```typescript
const brands = await spwig.admin.brands.list({ search: 'nike' });
const brand = await spwig.admin.brands.get(3);
const newBrand = await spwig.admin.brands.create({ name: 'Nike' });
await spwig.admin.brands.update(3, { description: 'Just do it' });
await spwig.admin.brands.delete(3);
```

### Admin Messages (`spwig.admin.messages`)

```typescript
// Unified inbox
const messages = await spwig.admin.messages.list({ source: 'contact_form', status: 'unread' });
const messageCounts = await spwig.admin.messages.getCounts();
const unread = await spwig.admin.messages.getUnreadCount();

// Detail & actions
const msg = await spwig.admin.messages.get('contact_form', 42);
await spwig.admin.messages.updateStatus('contact_form', 42, { is_read: true });
await spwig.admin.messages.reply(42, { message: 'Thanks for reaching out!', notify_customer: true });
```

### Admin Settings (`spwig.admin.settings`)

```typescript
// App settings
const settings = await spwig.admin.settings.getSettings();
const languages = await spwig.admin.settings.getLanguages();

// Devices
const devices = await spwig.admin.settings.listDevices();
await spwig.admin.settings.registerDevice({
  device_id: 'abc-123', device_name: 'iPhone 15', platform: 'ios',
});
await spwig.admin.settings.unregisterDevice('abc-123');
await spwig.admin.settings.updatePushToken({ push_token: 'fcm-token' });

// Notifications
await spwig.admin.settings.updateNotifications({ notify_new_orders: true, notify_low_stock: true });

// Sessions
const sessions = await spwig.admin.settings.getSessions();
await spwig.admin.settings.revokeSession('device-456');

// Branding
const branding = await spwig.admin.settings.getBranding();
await spwig.admin.settings.updateBranding({
  store_name: 'My Store',
  primary_color: '#ff6600',
  tax_id: 'US123456789',
  business_address: { line1: '123 Main St', city: 'NYC', state: 'NY', postal_code: '10001', country: 'US' },
});
await spwig.admin.settings.uploadLogo(formData); // FormData with 'image' field
```

### Admin Wallets (`spwig.admin.wallets`)

```typescript
const wallets = await spwig.admin.wallets.list({ search: 'john@example.com' });
const wallet = await spwig.admin.wallets.get(1);

// Credit & debit
await spwig.admin.wallets.credit(1, { amount: '50.00', source: 'promotion', description: 'Welcome bonus' });
await spwig.admin.wallets.debit(1, { amount: '10.00', source: 'manual', description: 'Adjustment' });

// Freeze/unfreeze
await spwig.admin.wallets.freeze(1);

// Transactions
const transactions = await spwig.admin.wallets.listTransactions({ wallet_id: 1, type: 'credit' });
const tx = await spwig.admin.wallets.getTransaction(42);
```

### Admin Staff (`spwig.admin.staff`)

```typescript
// List staff
const staffList = await spwig.admin.staff.list({ search: 'jane', is_active: true });

// Invite
const invited = await spwig.admin.staff.invite({
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  group_ids: [2, 3],
});

// Update roles/status
await spwig.admin.staff.update(staffId, { group_ids: [1], is_active: true });

// Delete (deactivate + revoke tokens)
await spwig.admin.staff.delete(staffId);
```

### Admin Roles (`spwig.admin.roles`)

```typescript
// List roles
const roles = await spwig.admin.roles.list();

// Create custom role
const role = await spwig.admin.roles.create({
  name: 'Warehouse Manager',
  description: 'Manages inventory and fulfillment',
  permissions: { orders: 'read', products: 'write', inventory: 'write' },
});

// Update
await spwig.admin.roles.update(roleId, { permissions: { orders: 'write' } });

// Delete custom role
await spwig.admin.roles.delete(roleId);

// List available permission categories
const permissions = await spwig.admin.roles.listPermissions();
// [{ key: 'orders', display_name: 'Orders', access_levels: ['none','read','write'] }, ...]
```

### Admin Inventory (`spwig.admin.inventory`)

```typescript
// Dashboard overview
const invDashboard = await spwig.admin.inventory.getDashboard();
// { total_products, total_stock_value, low_stock_count, out_of_stock_count, top_velocity_products, ... }

// Low stock products with severity
const lowStock = await spwig.admin.inventory.getLowStock({
  severity: 'critical', category_id: 5, ordering: 'available_stock',
});

// Stock velocity analysis
const velocity = await spwig.admin.inventory.getVelocity({
  product_id: 42, period: '30d',
});
// { velocity, trend, days_of_supply_remaining, projected_stockout_date, daily_sales }

// Stock movement history
const movements = await spwig.admin.inventory.getMovements({
  product_id: 42, movement_type: 'sale', start_date: '2026-01-01',
});

// Reorder suggestions
const reorder = await spwig.admin.inventory.getReorderSuggestions({ urgency: 'immediate' });
// { suggestions: [{ suggested_reorder_quantity, urgency, projected_stockout_date, ... }] }

// Inventory settings
const invSettings = await spwig.admin.inventory.getSettings();
await spwig.admin.inventory.updateSettings({
  default_low_stock_threshold: 10,
  low_stock_alerts_enabled: true,
  low_stock_alert_frequency: 'daily',
});
```

### Admin Bulk Operations (`spwig.admin.bulk`)

```typescript
// Bulk stock adjustment
const stockResult = await spwig.admin.bulk.stock.adjust({
  adjustments: [
    { product_id: 1, quantity: 50, adjustment_type: 'set' },
    { product_id: 2, variant_id: 5, quantity: -3, adjustment_type: 'adjust' },
  ],
  reason: 'Inventory count',
});
// { total: 2, succeeded: 2, failed: 0, results: [...] }

// Bulk price update
await spwig.admin.bulk.products.updatePrices({
  product_ids: [1, 2, 3],
  update_type: 'percentage',
  value: '-10', // 10% off
});

// Bulk category assignment
await spwig.admin.bulk.products.assignCategory({ product_ids: [1, 2, 3], category_id: 5 });

// Bulk tag management
await spwig.admin.bulk.products.assignTags({
  product_ids: [1, 2, 3],
  tags: ['summer', 'sale'],
  mode: 'add', // 'add' | 'replace' | 'remove'
});

// Bulk sale update
await spwig.admin.bulk.products.updateSale({
  product_ids: [1, 2, 3],
  sale_type: 'percentage_off',
  sale_value: '20',
  sale_start_date: '2026-06-01',
  sale_end_date: '2026-06-30',
});

// Bulk order status update
await spwig.admin.bulk.orders.updateStatus({
  order_numbers: ['ORD-001', 'ORD-002'],
  status: 'shipped',
});

// Bulk order fulfillment
await spwig.admin.bulk.orders.fulfill({
  orders: [
    { order_number: 'ORD-001', tracking_number: 'UPS123', carrier: 'UPS' },
    { order_number: 'ORD-002', tracking_number: 'FDX456', carrier: 'FedEx' },
  ],
  notify_customers: true,
});
```

## Error Handling

The SDK provides typed error classes:

```typescript
import {
  SpwigApiError,
  SpwigAuthError,
  SpwigValidationError,
  SpwigTimeoutError,
  SpwigNetworkError,
} from '@spwig/sdk';

try {
  await spwig.auth.login({ username, password });
} catch (err) {
  if (err instanceof SpwigValidationError) {
    // 400 — field-level errors
    console.log(err.fieldErrors);
    // { username: ["This field is required."], password: ["Too short."] }
  } else if (err instanceof SpwigAuthError) {
    // 401 — invalid credentials
  } else if (err instanceof SpwigApiError) {
    // Any other API error (403, 404, 429, 500...)
    console.log(err.status, err.apiMessage);
  } else if (err instanceof SpwigTimeoutError) {
    // Request timed out
  } else if (err instanceof SpwigNetworkError) {
    // No internet connection
  }
}
```

## Webhook Verification

Verify that incoming webhooks are genuinely from your Spwig backend:

```typescript
import { verifyWebhookSignature, WEBHOOK_EVENTS } from '@spwig/sdk/webhooks';

// In your webhook handler (Next.js, Nuxt, SvelteKit, Express, etc.)
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('X-Spwig-Signature')!;

  const valid = await verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET!);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case WEBHOOK_EVENTS.ORDER_CREATED:
      // Handle new order
      break;
    case WEBHOOK_EVENTS.ORDER_PAID:
      // Handle payment confirmation
      break;
  }

  return new Response('OK', { status: 200 });
}
```

## Vouchers & Gift Cards (`spwig.vouchers`)

Validate discount codes, check gift card balances, and view applied vouchers.

```typescript
// Validate a voucher code
const result = await spwig.vouchers.validate('SUMMER20', '99.00');
if (result.valid) {
  console.log(`Discount: ${result.discount_amount}`);
}

// Check gift card balance
const balance = await spwig.vouchers.giftCards.checkBalance('GC-ABCDEF');
console.log(`${balance.currency} ${balance.balance}`);

// List gift cards
const cards = await spwig.vouchers.giftCards.list();

// Check eligibility for current cart
const eligible = await spwig.vouchers.checkEligibility(42);
```

## Shipping & Tracking (`spwig.shipping`)

Track shipments and view carrier information.

```typescript
// List shipments for the logged-in customer
const shipments = await spwig.shipping.list({ page: 1 });

// Get shipments for a specific order
const orderShipments = await spwig.shipping.getByOrder(1234);

// Get tracking events for a shipment
const events = await spwig.shipping.getTracking(shipmentId);
events.forEach(e => console.log(`${e.occurred_at}: ${e.status} — ${e.description}`));

// List available carriers
const carriers = await spwig.shipping.getCarriers();
```

## Tax (`spwig.tax`)

Tax rates, presets, and real-time tax calculation.

```typescript
// Calculate tax for items
const tax = await spwig.tax.calculate({
  country: 'DE',
  state: 'BY',
  items: [
    { product_id: 42, quantity: 2, price: '29.99' },
  ],
  shipping_cost: '5.00',
});
console.log(`Tax: ${tax.total_tax}`);

// List tax presets (e.g. EU VAT, US Sales Tax)
const presets = await spwig.tax.getPresets();

// Get rates by country
const byCountry = await spwig.tax.getByCountry();
```

## Health (`spwig.health`)

Backend availability and Kubernetes probes.

```typescript
// Basic health check
const status = await spwig.health.check();

// Detailed (staff only — shows database, cache, celery, storage)
const detailed = await spwig.health.detailed();

// Kubernetes probes
await spwig.health.live();
await spwig.health.ready();
```

## POS API (`spwig.pos`)

Complete Point of Sale API for in-store terminal applications. Import standalone:

```typescript
import { PosModule } from '@spwig/sdk/pos';
```

Or use via the main client:

```typescript
const spwig = new SpwigClient({ baseUrl: 'https://store.example.com' });
```

### POS Authentication

```typescript
// Staff login for POS terminal
const auth = await spwig.pos.auth.login({
  email: 'cashier@store.com',
  password: 'secret',
  terminal_id: 'POS-001',
});
spwig.setToken(auth.access_token);

// Refresh token
await spwig.pos.auth.refresh({ refresh_token: auth.refresh_token });
```

### Terminal Management

```typescript
// Register a new terminal
const terminal = await spwig.pos.terminals.register({
  name: 'Register 1',
  device_id: 'DEVICE-ABC',
});

// Get terminal config
const config = await spwig.pos.terminals.getConfig();

// Manager unlock with PIN
const unlock = await spwig.pos.terminals.verifyUnlockPin('1234');
```

### POS Catalog & Barcode Scanning

```typescript
// Browse products
const products = await spwig.pos.catalog.listProducts({ category: 5 });

// Barcode lookup
const product = await spwig.pos.catalog.lookupBarcode('1234567890123');

// Categories
const categories = await spwig.pos.catalog.listCategories();
```

### POS Cart

```typescript
// Add item (by ID or barcode)
await spwig.pos.cart.addItem({ product_id: 42, quantity: 1 });

// Apply voucher
await spwig.pos.cart.applyVoucher('STAFF10');

// Apply manual discount (requires manager approval)
await spwig.pos.cart.discounts.applyCartDiscount({ type: 'percentage', value: '10', reason: 'Loyalty' });

// Park cart for later
await spwig.pos.cart.parked.park({ customer_name: 'John' });

// Restore parked cart
await spwig.pos.cart.parked.restore(parkedCartId);
```

### POS Checkout

```typescript
// Cash payment
const result = await spwig.pos.checkout.cash({ amount_tendered: '50.00' });
console.log(`Change: ${result.change_given}`);

// Card via integrated terminal
const cardResult = await spwig.pos.checkout.terminalCard();

// Split tender (cash + gift card)
const splitResult = await spwig.pos.checkout.splitTender([
  { method: 'cash', amount: '30.00', amount_tendered: '30.00' },
  { method: 'gift_card', amount: '20.00', gift_card_code: 'GC-123' },
]);

// Terminal provider (Stripe Terminal, etc.)
const intent = await spwig.pos.checkout.terminal.createPaymentIntent({ amount: '42.00' });
await spwig.pos.checkout.terminal.capture(intent.payment_intent_id);
```

### POS Inventory

```typescript
// Check stock at current location
const stock = await spwig.pos.inventory.get(42);
console.log(`Available: ${stock.available}`);

// Check stock across all warehouses
const allLocations = await spwig.pos.inventory.getAllLocations(42);

// Adjust stock (e.g. damage, receive, recount)
await spwig.pos.inventory.adjust({
  product_id: 42,
  adjustment_type: 'damage',
  quantity: 1,
  reason: 'Dropped by customer',
});
```

### POS Orders & Receipts

```typescript
// List today's orders
const orders = await spwig.pos.orders.list({ date_from: '2026-03-31' });

// Get receipt for printing
const receipt = await spwig.pos.orders.getReceipt(orderId);

// Send digital receipt
await spwig.pos.orders.sendReceipt(orderId, { email: 'customer@email.com' });

// Process refund
await spwig.pos.orders.refund(orderId, { reason: 'Customer request' });
```

### POS Shifts

```typescript
// Open shift
const shift = await spwig.pos.shifts.open('200.00');

// Record cash movement
await spwig.pos.shifts.cashMovement({ movement_type: 'out', amount: '50.00', reason: 'Bank drop' });

// Close shift
const closed = await spwig.pos.shifts.close('180.50', 'Normal close');

// Daily report
const report = await spwig.pos.shifts.reports.daily({ date: '2026-03-31' });
```

### POS Offline Sync

```typescript
// Upload offline transactions
await spwig.pos.sync.uploadOfflineTransactions([{
  local_id: 'offline-001',
  items: [{ product_id: 42, quantity: 1, unit_price: '29.99' }],
  payments: [{ method: 'cash', amount: '30.00' }],
  total: '29.99',
  created_at: '2026-03-31T10:00:00Z',
}]);

// Check sync status
const syncStatus = await spwig.pos.sync.getStatus();
```

## Framework Guides

See the [headless developer guide](../docs/headless/) for complete documentation:

- [Next.js App Router example](../docs/headless/examples/nextjs-example.md)
- [Nuxt 3 example](../docs/headless/examples/nuxt-example.md)
- [SvelteKit example](../docs/headless/examples/sveltekit-example.md)
- [Proxy configuration (NGINX, Caddy, Apache, Traefik)](../docs/headless/10-proxy-configuration.md)

## Regenerating Types

The SDK types are auto-generated from the Spwig OpenAPI schema. To regenerate after API changes:

```bash
cd sdk
npm run generate   # Regenerates src/generated/schema.ts from docs/api/schema.yml
npm run build      # Compile TypeScript
```

## Requirements

- Node.js 18+ (or any runtime with native `fetch` and `crypto.subtle`)
- Spwig backend v2.0+

## License

MIT
