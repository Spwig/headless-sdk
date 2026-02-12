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

  /** Authentication: login, register, logout, password reset. */
  readonly auth: AuthModule;
  /** Product catalog: products, categories, brands, collections, reviews. */
  readonly catalog: CatalogModule;
  /** Shopping cart: items, vouchers, summary. */
  readonly cart: CartModule;
  /** Checkout flow: addresses, shipping, payment, completion. */
  readonly checkout: CheckoutModule;
  /** Order history: list, details, tracking, returns. */
  readonly orders: OrdersModule;
  /** Customer account: profile, addresses, preferences. */
  readonly account: AccountModule;
  /** Search: autocomplete, results, trending. */
  readonly search: SearchModule;
  /** Store info: details, currencies, payment methods, shipping. */
  readonly store: StoreModule;
  /** Loyalty program: tiers, rewards, redemptions, progress. */
  readonly loyalty: LoyaltyModule;
  /** Wishlist management. */
  readonly wishlist: WishlistModule;
  /** Payment intents and saved payment methods. */
  readonly payments: PaymentsModule;

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
