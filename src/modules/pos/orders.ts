import type { HttpClient } from '../../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../../utils/types.js';

/** POS order (list view). */
export interface PosOrderListItem {
  id: number;
  order_number: string;
  status: string;
  total: string;
  currency: string;
  item_count: number;
  customer_name: string | null;
  cashier_name: string;
  created_at: string;
}

/** POS order item. */
export interface PosOrderItem {
  id: number;
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

/** POS payment detail. */
export interface PosPaymentInfo {
  method: string;
  method_display: string;
  amount: string;
  amount_tendered: string | null;
  change_given: string | null;
  card_last_four: string | null;
}

/** POS order (detail view). */
export interface PosOrder {
  id: number;
  order_number: string;
  status: string;
  channel: string;
  items: PosOrderItem[];
  payments: PosPaymentInfo[];
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total: string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  cashier_name: string;
  terminal_name: string;
  created_at: string;
}

/** POS receipt data for printing. */
export interface PosReceipt {
  order_number: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  terminal_name: string;
  cashier_name: string;
  items: PosOrderItem[];
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total: string;
  currency: string;
  payments: PosPaymentInfo[];
  change_given: string | null;
  date: string;
  footer_text: string;
}

/** POS cashier/staff entry. */
export interface PosCashier {
  id: number;
  name: string;
  email: string;
}

/** Refund input. */
export interface PosRefundInput {
  items?: Array<{ item_id: number; quantity: number; reason?: string }>;
  reason?: string;
}

export interface PosOrderListParams extends PaginationParams {
  status?: string;
  cashier_id?: number;
  date_from?: string;
  date_to?: string;
}

/** POS Orders API: list, detail, receipts, refunds, voids. */
export class PosOrdersModule {
  constructor(private http: HttpClient) {}

  /** List POS orders. */
  async list(params?: PosOrderListParams, opts?: RequestOptions): Promise<PaginatedResponse<PosOrderListItem>> {
    return this.http.get('/api/pos/orders/', params as Record<string, unknown>, opts);
  }

  /** Get order detail. */
  async get(id: number, opts?: RequestOptions): Promise<PosOrder> {
    return this.http.get(`/api/pos/orders/${id}/`, undefined, opts);
  }

  /** List cashiers/staff who have processed orders. */
  async getCashiers(opts?: RequestOptions): Promise<PosCashier[]> {
    return this.http.get('/api/pos/orders/cashiers/', undefined, opts);
  }

  /** Get receipt data for printing. */
  async getReceipt(orderId: number, opts?: RequestOptions): Promise<PosReceipt> {
    return this.http.get(`/api/pos/orders/${orderId}/receipt/`, undefined, opts);
  }

  /** Process a refund. */
  async refund(orderId: number, data?: PosRefundInput, opts?: RequestOptions): Promise<PosOrder> {
    return this.http.post(`/api/pos/orders/${orderId}/refund/`, data, opts);
  }

  /** Void an order (full cancellation before settlement). */
  async void(orderId: number, opts?: RequestOptions): Promise<PosOrder> {
    return this.http.post(`/api/pos/orders/${orderId}/void/`, undefined, opts);
  }

  /** Send a digital receipt to the customer. */
  async sendReceipt(orderId: number, data: { email: string }, opts?: RequestOptions): Promise<{ sent: boolean }> {
    return this.http.post(`/api/pos/orders/${orderId}/send-receipt/`, data, opts);
  }

  /** Check receipt delivery status. */
  async getReceiptStatus(orderId: number, opts?: RequestOptions): Promise<{ status: string; sent_at?: string }> {
    return this.http.get(`/api/pos/orders/${orderId}/receipt-status/`, undefined, opts);
  }
}
