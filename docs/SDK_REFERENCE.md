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
