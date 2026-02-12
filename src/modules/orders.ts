import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

/**
 * Order — matches OrderSerializer / OrderDetailSerializer output.
 * Address fields are flattened (shipping_name, shipping_address1, etc.),
 * not nested objects. Money fields use djmoney format (amount + _currency suffix).
 */
export interface Order {
  id: number;
  order_number: string;
  status: string;
  /** Human-readable status (detail only). */
  status_display?: string;
  email: string;
  phone: string;
  /** Money fields — each has an implicit {field}_currency companion. */
  subtotal: string;
  subtotal_currency: string;
  tax_amount: string;
  tax_amount_currency: string;
  shipping_cost: string;
  shipping_cost_currency: string;
  discount_amount: string;
  discount_amount_currency: string;
  total_amount: string;
  total_amount_currency: string;
  /** Flattened shipping address fields. */
  shipping_name: string;
  shipping_address1: string;
  shipping_address2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  /** Flattened billing address fields. */
  billing_same_as_shipping: boolean;
  billing_name: string;
  billing_address1: string;
  billing_address2: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  tracking_number: string | null;
  items: OrderItem[];
  notes: string;
  special_instructions: string;
  /** Detail only: whether the order can be cancelled. */
  can_cancel?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface OrderItem {
  id: number;
  order: number;
  product: number;
  variant: number | null;
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  customizations: Record<string, unknown> | null;
  created_at: string;
  [key: string]: unknown;
}

/** Helper type for constructing addresses in checkout flows. */
export interface OrderAddress {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ReturnRequest {
  id: number;
  order: number;
  reason: string;
  status: string;
  items: Array<{ order_item: number; quantity: number; reason: string }>;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateReturnInput {
  order: number;
  reason: string;
  items: Array<{ order_item: number; quantity: number; reason?: string }>;
}

export interface OrderListParams extends PaginationParams {
  status?: string;
}

/** Orders API: order history, tracking, and returns. */
export class OrdersModule {
  constructor(private http: HttpClient) {}

  /** List customer orders with optional filtering. Requires authentication. */
  async list(params?: OrderListParams, opts?: RequestOptions): Promise<PaginatedResponse<Order>> {
    return this.http.get('/api/orders/', params as Record<string, unknown>, opts);
  }

  /** Get details for a single order by ID. */
  async get(id: number, opts?: RequestOptions): Promise<Order> {
    return this.http.get(`/api/orders/${id}/`, undefined, opts);
  }

  /** List return requests. */
  async listReturns(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<ReturnRequest>> {
    return this.http.get('/api/return-requests/', params as Record<string, unknown>, opts);
  }

  /** Create a return request for an order. */
  async createReturn(data: CreateReturnInput, opts?: RequestOptions): Promise<ReturnRequest> {
    return this.http.post('/api/return-requests/', data, opts);
  }

  /** Get a return request by ID. */
  async getReturn(id: number, opts?: RequestOptions): Promise<ReturnRequest> {
    return this.http.get(`/api/return-requests/${id}/`, undefined, opts);
  }
}
