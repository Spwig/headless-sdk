import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types — Shared
// ---------------------------------------------------------------------------

export interface BulkOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkResultItem[];
  [key: string]: unknown;
}

export interface BulkResultItem {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Types — Stock Adjustment
// ---------------------------------------------------------------------------

export interface StockAdjustmentItem {
  product_id: number;
  variant_id?: number | null;
  warehouse_id?: number | null;
  quantity: number;
  adjustment_type: 'set' | 'adjust';
}

export interface BulkStockAdjustInput {
  adjustments: StockAdjustmentItem[];
  reason: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Types — Price Update
// ---------------------------------------------------------------------------

export interface BulkPriceUpdateInput {
  product_ids: number[];
  update_type: 'absolute' | 'percentage';
  /**
   * ⚠️ Spwig 1.7.1 validation tightened: for `absolute` the value must be `>= 0`;
   * for `percentage` it must be `>= -100`. Out-of-range values are now rejected.
   */
  value: string;
  apply_to?: 'price';
  /** Decimal places to round to. ⚠️ Spwig 1.7.1: max is now the currency's precision (2), was 4. */
  round_to?: number;
}

// ---------------------------------------------------------------------------
// Types — Category Assignment
// ---------------------------------------------------------------------------

export interface BulkAssignCategoryInput {
  product_ids: number[];
  category_id: number;
}

// ---------------------------------------------------------------------------
// Types — Tag Assignment
// ---------------------------------------------------------------------------

export interface BulkAssignTagsInput {
  product_ids: number[];
  tags: string[];
  mode: 'add' | 'replace' | 'remove';
}

// ---------------------------------------------------------------------------
// Types — Sale Update
// ---------------------------------------------------------------------------

export interface BulkSaleUpdateInput {
  product_ids: number[];
  sale_type: 'none' | 'fixed_price' | 'amount_off' | 'percentage_off';
  /** Required for any `sale_type` other than `none`. ⚠️ Spwig 1.7.1: must be `> 0` (0 is now rejected). */
  sale_value?: string | null;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
}

// ---------------------------------------------------------------------------
// Types — Order Status
// ---------------------------------------------------------------------------

export interface BulkOrderStatusInput {
  order_numbers: string[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
}

// ---------------------------------------------------------------------------
// Types — Order Fulfillment
// ---------------------------------------------------------------------------

export interface BulkOrderFulfillItem {
  order_number: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
}

export interface BulkOrderFulfillInput {
  orders: BulkOrderFulfillItem[];
  notify_customers?: boolean;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin bulk operations: stock, prices, categories, tags, sales, order status, fulfillment. */
export class AdminBulkModule {
  constructor(private http: HttpClient) {}

  // ---- Stock ----

  readonly stock = {
    /** Bulk adjust stock quantities across products/variants/warehouses. */
    adjust: (data: BulkStockAdjustInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/inventory/bulk/adjust/', data, opts),
  };

  // ---- Products ----

  readonly products = {
    /** Bulk update product prices (absolute or percentage). */
    updatePrices: (data: BulkPriceUpdateInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/products/bulk/price/', data, opts),

    /** Bulk assign products to a category. */
    assignCategory: (data: BulkAssignCategoryInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/products/bulk/assign-category/', data, opts),

    /** Bulk assign/replace/remove tags on products. */
    assignTags: (data: BulkAssignTagsInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/products/bulk/assign-tags/', data, opts),

    /** Bulk update sale settings (type, value, schedule) on products. */
    updateSale: (data: BulkSaleUpdateInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/products/bulk/sale/', data, opts),
  };

  // ---- Orders ----

  readonly orders = {
    /** Bulk update order statuses. */
    updateStatus: (data: BulkOrderStatusInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/orders/bulk/status/', data, opts),

    /** Bulk fulfill orders with optional tracking info. */
    fulfill: (data: BulkOrderFulfillInput, opts?: RequestOptions): Promise<BulkOperationResult> =>
      this.http.post('/api/admin/orders/bulk/fulfill/', data, opts),
  };
}
