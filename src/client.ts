import { type SpwigConfig, resolveConfig } from './config.js';
import { HttpClient } from './utils/fetch.js';
import { AuthModule } from './modules/auth.js';
import { CatalogModule } from './modules/catalog.js';
import { CartModule } from './modules/cart.js';
import { CheckoutModule } from './modules/checkout.js';
import { OrdersModule } from './modules/orders.js';
import { AccountModule } from './modules/account.js';
import { SearchModule } from './modules/search.js';
import { StoreModule } from './modules/store.js';
import { LoyaltyModule } from './modules/loyalty.js';
import { WishlistModule } from './modules/wishlist.js';
import { PaymentsModule } from './modules/payments.js';
import { WebhooksModule } from './modules/webhooks.js';
import { BlogModule } from './modules/blog.js';
import { AnnouncementsModule } from './modules/announcements.js';
import { PagesModule } from './modules/pages.js';
import { FormsModule } from './modules/forms.js';
import { SocialModule } from './modules/social.js';
import { MessagesModule } from './modules/messages.js';
import { SubscriptionsModule } from './modules/subscriptions.js';
import { GeoipModule } from './modules/geoip.js';
import { RecentlyViewedModule } from './modules/recentlyViewed.js';
import { CustomizerModule } from './modules/customizer.js';
import { CustomerModule } from './modules/customer.js';
import { AddressServiceModule } from './modules/address.js';
import { ReferralsModule } from './modules/referrals.js';
import { AffiliateModule } from './modules/affiliate.js';

/**
 * Main Spwig SDK client.
 *
 * @example
 * ```typescript
 * const spwig = new SpwigClient({
 *   baseUrl: 'https://example.com',
 *   language: 'en',
 *   currency: 'EUR',
 * });
 *
 * // Login
 * const { user, token } = await spwig.auth.login({ username: 'john', password: 'secret' });
 * spwig.setToken(token);
 *
 * // Browse products
 * const products = await spwig.catalog.products.list({ page: 1 });
 *
 * // Add to cart
 * await spwig.cart.add({ product_id: 123, quantity: 1 });
 * ```
 */
export class SpwigClient {
  private readonly http: HttpClient;

  /** Authentication: login, register, logout, password reset, SMS verification. */
  readonly auth: AuthModule;
  /** Product catalog: products, categories, brands, collections, reviews, bookings, licenses. */
  readonly catalog: CatalogModule;
  /** Shopping cart: items, vouchers, summary. */
  readonly cart: CartModule;
  /** Checkout flow: addresses, shipping, payment, completion. */
  readonly checkout: CheckoutModule;
  /** Order history: list, details, tracking, returns. */
  readonly orders: OrdersModule;
  /** Customer account: profile, addresses, preferences, GDPR. */
  readonly account: AccountModule;
  /** Search: autocomplete, results, trending, engines. */
  readonly search: SearchModule;
  /** Store info: details, currencies, payment methods, shipping. */
  readonly store: StoreModule;
  /** Loyalty program: tiers, rewards, redemptions, progress. */
  readonly loyalty: LoyaltyModule;
  /** Wishlist management. */
  readonly wishlist: WishlistModule;
  /** Payment intents and saved payment methods. */
  readonly payments: PaymentsModule;
  /** Webhook management: endpoints, deliveries, event types. */
  readonly webhooks: WebhooksModule;
  /** Blog: posts, categories, tags, subscriptions. */
  readonly blog: BlogModule;
  /** Announcements: active banners and notifications. */
  readonly announcements: AnnouncementsModule;
  /** Pages: public page content, legal pages. */
  readonly pages: PagesModule;
  /** Forms: public form viewing and submission. */
  readonly forms: FormsModule;
  /** Social sharing: share tracking and counts. */
  readonly social: SocialModule;
  /** Customer messages: contact form, messaging. */
  readonly messages: MessagesModule;
  /** Subscriptions: recurring billing plans. */
  readonly subscriptions: SubscriptionsModule;
  /** GeoIP: location detection, currency/language suggestions. */
  readonly geoip: GeoipModule;
  /** Recently viewed: product view tracking. */
  readonly recentlyViewed: RecentlyViewedModule;
  /** Product customizer: design editor, templates, saved designs. */
  readonly customizer: CustomizerModule;
  /** Customer dashboard: analytics, digital products, licenses. */
  readonly customer: CustomerModule;
  /** Address services: autocomplete, validation, normalization. */
  readonly addressService: AddressServiceModule;
  /** Referral program: referral tracking and rewards. */
  readonly referrals: ReferralsModule;
  /** Affiliate program: links, commissions, payouts. */
  readonly affiliate: AffiliateModule;

  constructor(config: SpwigConfig) {
    const resolved = resolveConfig(config);
    this.http = new HttpClient(resolved);

    this.auth = new AuthModule(this.http);
    this.catalog = new CatalogModule(this.http);
    this.cart = new CartModule(this.http);
    this.checkout = new CheckoutModule(this.http);
    this.orders = new OrdersModule(this.http);
    this.account = new AccountModule(this.http);
    this.search = new SearchModule(this.http);
    this.store = new StoreModule(this.http);
    this.loyalty = new LoyaltyModule(this.http);
    this.wishlist = new WishlistModule(this.http);
    this.payments = new PaymentsModule(this.http);
    this.webhooks = new WebhooksModule(this.http);
    this.blog = new BlogModule(this.http);
    this.announcements = new AnnouncementsModule(this.http);
    this.pages = new PagesModule(this.http);
    this.forms = new FormsModule(this.http);
    this.social = new SocialModule(this.http);
    this.messages = new MessagesModule(this.http);
    this.subscriptions = new SubscriptionsModule(this.http);
    this.geoip = new GeoipModule(this.http);
    this.recentlyViewed = new RecentlyViewedModule(this.http);
    this.customizer = new CustomizerModule(this.http);
    this.customer = new CustomerModule(this.http);
    this.addressService = new AddressServiceModule(this.http);
    this.referrals = new ReferralsModule(this.http);
    this.affiliate = new AffiliateModule(this.http);
  }

  /** Set or clear the authentication token for subsequent requests. */
  setToken(token: string | undefined): void {
    this.http.setToken(token);
  }

  /** Change the default language for subsequent requests. */
  setLanguage(language: string): void {
    this.http.setLanguage(language);
  }

  /** Change the default currency for subsequent requests. */
  setCurrency(currency: string): void {
    this.http.setCurrency(currency);
  }
}
