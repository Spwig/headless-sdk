import type { HttpClient } from '../../utils/fetch.js';
import { PosAuthModule } from './auth.js';
import { PosTerminalsModule } from './terminals.js';
import { PosCatalogModule } from './catalog.js';
import { PosCartModule } from './cart.js';
import { PosCheckoutModule } from './checkout.js';
import { PosInventoryModule } from './inventory.js';
import { PosOrdersModule } from './orders.js';
import { PosShiftsModule } from './shifts.js';
import { PosSyncModule } from './sync.js';
import { PosCustomersModule } from './customers.js';

// Re-export all types for convenience
export * from './auth.js';
export * from './terminals.js';
export * from './catalog.js';
export * from './cart.js';
export * from './checkout.js';
export * from './inventory.js';
export * from './orders.js';
export * from './shifts.js';
export * from './sync.js';
export * from './customers.js';

/**
 * POS module aggregator.
 *
 * Provides point-of-sale APIs for the Spwig POS terminal app,
 * including in-store checkout, inventory, shifts, and offline sync.
 *
 * @example
 * ```typescript
 * const spwig = new SpwigClient({ baseUrl: 'https://store.example.com' });
 *
 * // POS staff login
 * const auth = await spwig.pos.auth.login({
 *   email: 'cashier@store.com',
 *   password: 'secret',
 *   terminal_id: 'POS-001',
 * });
 * spwig.setToken(auth.access_token);
 *
 * // Scan a barcode
 * const product = await spwig.pos.catalog.lookupBarcode('1234567890123');
 *
 * // Add to cart
 * await spwig.pos.cart.addItem({ product_id: product.id });
 *
 * // Cash checkout
 * const result = await spwig.pos.checkout.cash({ amount_tendered: '20.00' });
 * console.log(`Change: ${result.change_given}`);
 * ```
 */
export class PosModule {
  /** POS authentication: login, refresh, logout. */
  readonly auth: PosAuthModule;
  /** Terminal management: registration, config, security, heartbeat. */
  readonly terminals: PosTerminalsModule;
  /** Product catalog: browse, barcode lookup, categories. */
  readonly catalog: PosCatalogModule;
  /** Cart management: items, vouchers, gift cards, discounts, parking. */
  readonly cart: PosCartModule;
  /** Checkout: cash, card, terminal, gift card, split tender. */
  readonly checkout: PosCheckoutModule;
  /** Inventory: stock levels, adjustments, movements, cross-location. */
  readonly inventory: PosInventoryModule;
  /** Orders: list, detail, receipts, refunds, voids. */
  readonly orders: PosOrdersModule;
  /** Shifts & reports: open/close, cash movements, daily stats. */
  readonly shifts: PosShiftsModule;
  /** Offline sync: products, customers, transactions. */
  readonly sync: PosSyncModule;
  /** Customers: search, create, loyalty lookup. */
  readonly customers: PosCustomersModule;

  constructor(http: HttpClient) {
    this.auth = new PosAuthModule(http);
    this.terminals = new PosTerminalsModule(http);
    this.catalog = new PosCatalogModule(http);
    this.cart = new PosCartModule(http);
    this.checkout = new PosCheckoutModule(http);
    this.inventory = new PosInventoryModule(http);
    this.orders = new PosOrdersModule(http);
    this.shifts = new PosShiftsModule(http);
    this.sync = new PosSyncModule(http);
    this.customers = new PosCustomersModule(http);
  }
}
