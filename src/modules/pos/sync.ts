import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** Sync status response. */
export interface PosSyncStatus {
  last_sync: string | null;
  products_pending: number;
  customers_pending: number;
  orders_pending: number;
  [key: string]: unknown;
}

/** Sync version info. */
export interface PosSyncVersion {
  products_version: string;
  customers_version: string;
  settings_version: string;
  [key: string]: unknown;
}

/** Offline transaction for upload. */
export interface PosOfflineTransaction {
  local_id: string;
  items: Array<{ product_id: number; variant_id?: number; quantity: number; unit_price: string }>;
  payments: Array<{ method: string; amount: string; [key: string]: unknown }>;
  total: string;
  customer_id?: number;
  created_at: string;
  [key: string]: unknown;
}

/** POS Sync API: offline data synchronization. */
export class PosSyncModule {
  constructor(private http: HttpClient) {}

  /** Sync products (delta update). */
  async syncProducts(data?: { since?: string }, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.post('/api/pos/sync/products/', data, opts);
  }

  /** Sync customers (delta update). */
  async syncCustomers(data?: { since?: string }, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.post('/api/pos/sync/customers/', data, opts);
  }

  /** Upload offline transactions collected while the terminal was disconnected. */
  async uploadOfflineTransactions(transactions: PosOfflineTransaction[], opts?: RequestOptions): Promise<{ processed: number; errors: Record<string, string>[] }> {
    return this.http.post('/api/pos/sync/offline-transactions/', { transactions }, opts);
  }

  /** Sync stock adjustments from the terminal. */
  async syncStockAdjustments(data: Record<string, unknown>, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.post('/api/pos/sync/stock-adjustments/', data, opts);
  }

  /** Sync orders from the terminal. */
  async syncOrders(data: Record<string, unknown>, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.post('/api/pos/sync/orders/', data, opts);
  }

  /** Get current sync status. */
  async getStatus(opts?: RequestOptions): Promise<PosSyncStatus> {
    return this.http.get('/api/pos/sync/status/', undefined, opts);
  }

  /** Get sync version stamps for change detection. */
  async getVersion(opts?: RequestOptions): Promise<PosSyncVersion> {
    return this.http.get('/api/pos/sync/version/', undefined, opts);
  }
}
