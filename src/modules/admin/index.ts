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
import { AdminStaffModule } from './staff.js';
import { AdminRolesModule } from './roles.js';
import { AdminInventoryModule } from './inventory.js';
import { AdminBulkModule } from './bulk.js';
import { AdminVouchersModule } from './vouchers.js';
import { AdminShippingModule } from './shipping.js';
import { AdminPagesModule } from './pages.js';
import { AdminMediaModule } from './media.js';
import { AdminMenusModule } from './menus.js';
import { AdminCurrenciesModule } from './currencies.js';

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
export * from './staff.js';
export * from './roles.js';
export * from './inventory.js';
export * from './bulk.js';
export * from './vouchers.js';
export * from './shipping.js';
export * from './pages.js';
export * from './media.js';
export * from './menus.js';
export * from './currencies.js';

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
  /** Staff management: list, invite, update, delete staff members. */
  readonly staff: AdminStaffModule;
  /** Role & permission management: CRUD roles, list permissions. */
  readonly roles: AdminRolesModule;
  /** Inventory intelligence: dashboard, low stock, velocity, movements, reorder. */
  readonly inventory: AdminInventoryModule;
  /** Bulk operations: stock adjustments, price updates, order fulfillment. */
  readonly bulk: AdminBulkModule;
  /** Voucher & gift card management: CRUD, usage, restrictions. */
  readonly vouchers: AdminVouchersModule;
  /** Shipping management: carriers, shipments, providers, documents. */
  readonly shipping: AdminShippingModule;
  /** Page builder management: elements, versions, settings, translations. */
  readonly pages: AdminPagesModule;
  /** Media library: assets, folders, tags, processing. */
  readonly media: AdminMediaModule;
  /** Menu management: CRUD menus, items, reorder, preview. */
  readonly menus: AdminMenusModule;
  /** Currency management: activate/deactivate, reorder, display settings. */
  readonly currencies: AdminCurrenciesModule;

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
    this.staff = new AdminStaffModule(http);
    this.roles = new AdminRolesModule(http);
    this.inventory = new AdminInventoryModule(http);
    this.bulk = new AdminBulkModule(http);
    this.vouchers = new AdminVouchersModule(http);
    this.shipping = new AdminShippingModule(http);
    this.pages = new AdminPagesModule(http);
    this.media = new AdminMediaModule(http);
    this.menus = new AdminMenusModule(http);
    this.currencies = new AdminCurrenciesModule(http);
  }
}
