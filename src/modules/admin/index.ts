import type { HttpClient } from '../../utils/fetch.js';
import { AdminAuthModule } from './auth.js';
import { AdminAnalyticsModule } from './analytics.js';
import { AdminOrdersModule } from './orders.js';
import { AdminProductsModule } from './products.js';
import { AdminCategoriesModule } from './categories.js';
import { AdminBrandsModule } from './brands.js';
import { AdminMessagesModule } from './messages.js';
import { AdminSettingsModule } from './settings.js';
import { AdminWalletsModule } from './wallets.js';

// Re-export all types for convenience
export * from './auth.js';
export * from './analytics.js';
export * from './orders.js';
export * from './products.js';
export * from './categories.js';
export * from './brands.js';
export * from './messages.js';
export * from './settings.js';
export * from './wallets.js';

/**
 * Admin module aggregator.
 *
 * Provides staff/merchant management APIs for the Spwig mobile app
 * and headless admin integrations.
 *
 * @example
 * ```typescript
 * const spwig = new SpwigClient({ baseUrl: 'https://store.example.com' });
 *
 * // Staff login
 * const result = await spwig.admin.auth.login({
 *   email: 'staff@example.com',
 *   password: 'secret',
 *   device_id: 'device-123',
 *   device_name: 'iPhone 15 Pro',
 * });
 * if ('tokens' in result) {
 *   spwig.setToken(result.tokens.access_token);
 * }
 *
 * // Get dashboard analytics
 * const dashboard = await spwig.admin.analytics.getDashboard();
 *
 * // Manage orders
 * const orders = await spwig.admin.orders.list({ filter_type: 'open' });
 *
 * // Manage products
 * const products = await spwig.admin.products.products.list({ status: 'published' });
 * ```
 */
export class AdminModule {
  /** Staff authentication: login, 2FA, SSO, password reset. */
  readonly auth: AdminAuthModule;
  /** Dashboard analytics: KPIs, sales data, top products. */
  readonly analytics: AdminAnalyticsModule;
  /** Order management: list, status, refunds, notes. */
  readonly orders: AdminOrdersModule;
  /** Product management: CRUD, stock, images, variants, attributes. */
  readonly products: AdminProductsModule;
  /** Category management: CRUD, images, banners. */
  readonly categories: AdminCategoriesModule;
  /** Brand management: CRUD operations. */
  readonly brands: AdminBrandsModule;
  /** Message management: unified inbox, replies. */
  readonly messages: AdminMessagesModule;
  /** Settings: app config, devices, push notifications, sessions. */
  readonly settings: AdminSettingsModule;
  /** Wallet management: credit/debit, freeze, transactions. */
  readonly wallets: AdminWalletsModule;

  constructor(http: HttpClient) {
    this.auth = new AdminAuthModule(http);
    this.analytics = new AdminAnalyticsModule(http);
    this.orders = new AdminOrdersModule(http);
    this.products = new AdminProductsModule(http);
    this.categories = new AdminCategoriesModule(http);
    this.brands = new AdminBrandsModule(http);
    this.messages = new AdminMessagesModule(http);
    this.settings = new AdminSettingsModule(http);
    this.wallets = new AdminWalletsModule(http);
  }
}
