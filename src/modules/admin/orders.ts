import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, BlobResponse, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  currency: string;
  image_url: string | null;
  [key: string]: unknown;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  payment_status: string;
  payment_status_display: string;
  customer_name: string;
  email: string;
  total_amount: string;
  currency: string;
  /**
   * Number of line items. ⚠️ Spwig 1.7.1: now sums item quantities EXCLUDING
   * bundle child lines, so this value can differ from before for orders that
   * contain bundles.
   */
  item_count: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AdminOrderDetail {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  payment_status: string;
  payment_status_display: string;
  email: string;
  phone: string;
  // Shipping address
  shipping_name: string;
  shipping_address1: string;
  shipping_address2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string;
  // Billing address
  billing_same_as_shipping: boolean;
  billing_name: string;
  billing_address1: string;
  billing_address2: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  // Totals
  subtotal: string;
  tax_amount: string;
  shipping_cost: string;
  discount_amount: string;
  total_amount: string;
  amount_paid: string;
  amount_refunded: string;
  currency: string;
  // Shipping & tracking
  tracking_number: string;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  // Notes
  notes: string;
  special_instructions: string;
  // Items
  items: AdminOrderItem[];
  item_count: number;
  // Timestamps
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  [key: string]: unknown;
}

/** Order counts response — grouped by status with aggregates. */
export interface OrderCounts {
  by_status: Record<string, number>;
  open: number;
  completed: number;
  total: number;
  [key: string]: unknown;
}

export interface OrderNote {
  id: number;
  note: string;
  is_customer_visible: boolean;
  is_customer_note: boolean;
  author_name: string;
  created_at: string;
  [key: string]: unknown;
}

/** Order notes response — includes notes array and count. */
export interface OrderNotesResponse {
  notes: OrderNote[];
  count: number;
  [key: string]: unknown;
}

export interface OrderStatusUpdateInput {
  status: string;
  tracking_number?: string;
  notes?: string;
}

export interface TrackingUpdateInput {
  tracking_number: string;
  carrier?: string;
}

export interface OrderRefundInput {
  amount?: string;
  reason?: string;
}

export interface OrderCancelInput {
  reason?: string;
  notify_customer?: boolean;
}

export interface OrderNoteCreateInput {
  note: string;
  is_customer_visible?: boolean;
  notify_customer?: boolean;
}

export interface AdminOrderListParams {
  filter_type?: 'all' | 'open' | 'completed' | 'refunded';
  status?: string;
  search?: string;
  sort?: '-created_at' | 'created_at' | '-total_amount' | 'total_amount';
  page?: number;
  page_size?: number;
}

/** Order list response with custom admin pagination. */
export interface OrderListResponse {
  orders: AdminOrder[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface BatchDocumentsInput {
  order_numbers: string[];
  document_types: ('invoice' | 'packing_slip' | 'pick_list')[];
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin order management: list, detail, status updates, refunds, notes. */
export class AdminOrdersModule {
  constructor(private http: HttpClient) {}

  /** List orders with filtering and sorting. */
  async list(params?: AdminOrderListParams, opts?: RequestOptions): Promise<OrderListResponse> {
    return this.http.get('/api/admin/orders/', params as Record<string, unknown>, opts);
  }

  /** Get order count statistics by status. */
  async getCounts(opts?: RequestOptions): Promise<OrderCounts> {
    return this.http.get('/api/admin/orders/counts/', undefined, opts);
  }

  /** Get full order details. */
  async get(orderNumber: string, opts?: RequestOptions): Promise<AdminOrderDetail> {
    return this.http.get(`/api/admin/orders/${orderNumber}/`, undefined, opts);
  }

  /** Update order status. */
  async updateStatus(orderNumber: string, data: OrderStatusUpdateInput, opts?: RequestOptions): Promise<AdminOrderDetail> {
    return this.http.post(`/api/admin/orders/${orderNumber}/status/`, data, opts);
  }

  /** Update shipping tracking information. */
  async updateTracking(orderNumber: string, data: TrackingUpdateInput, opts?: RequestOptions): Promise<AdminOrderDetail> {
    return this.http.post(`/api/admin/orders/${orderNumber}/tracking/`, data, opts);
  }

  /** Cancel an order. */
  async cancel(orderNumber: string, data?: OrderCancelInput, opts?: RequestOptions): Promise<AdminOrderDetail> {
    return this.http.post(`/api/admin/orders/${orderNumber}/cancel/`, data, opts);
  }

  /** Initiate an order refund. */
  async refund(orderNumber: string, data?: OrderRefundInput, opts?: RequestOptions): Promise<AdminOrderDetail> {
    return this.http.post(`/api/admin/orders/${orderNumber}/refund/`, data, opts);
  }

  /** Get order notes. */
  async getNotes(orderNumber: string, opts?: RequestOptions): Promise<OrderNotesResponse> {
    return this.http.get(`/api/admin/orders/${orderNumber}/notes/`, undefined, opts);
  }

  /** Add a note to an order. */
  async addNote(orderNumber: string, data: OrderNoteCreateInput, opts?: RequestOptions): Promise<OrderNote> {
    return this.http.post(`/api/admin/orders/${orderNumber}/notes/add/`, data, opts);
  }

  // -- Document generation --------------------------------------------------

  /** Download invoice PDF for an order. */
  async getInvoicePdf(orderNumber: string, opts?: RequestOptions): Promise<BlobResponse> {
    return this.http.fetchBlob(`/api/admin/orders/${orderNumber}/invoice/pdf/`, undefined, undefined, 'GET', opts);
  }

  /** Download packing slip PDF for an order. */
  async getPackingSlipPdf(orderNumber: string, opts?: RequestOptions): Promise<BlobResponse> {
    return this.http.fetchBlob(`/api/admin/orders/${orderNumber}/packing-slip/pdf/`, undefined, undefined, 'GET', opts);
  }

  /** Download pick list PDF for an order. */
  async getPickListPdf(orderNumber: string, opts?: RequestOptions): Promise<BlobResponse> {
    return this.http.fetchBlob(`/api/admin/orders/${orderNumber}/pick-list/pdf/`, undefined, undefined, 'GET', opts);
  }

  /** Download batch documents as a ZIP file for multiple orders. */
  async getBatchDocuments(data: BatchDocumentsInput, opts?: RequestOptions): Promise<BlobResponse> {
    return this.http.fetchBlob('/api/admin/orders/batch-documents/', undefined, data, 'POST', opts);
  }
}
