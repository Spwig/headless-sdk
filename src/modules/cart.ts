import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_id: number | null;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  currency: string;
  [key: string]: unknown;
}

export interface Cart {
  items: CartItem[];
  item_count: number;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  currency: string;
  voucher: AppliedVoucher | null;
  [key: string]: unknown;
}

export interface AppliedVoucher {
  code: string;
  discount_type: string;
  discount_value: string;
  discount_amount: string;
  [key: string]: unknown;
}

export interface CartSummary {
  item_count: number;
  subtotal: string;
  total: string;
  currency: string;
}

export interface AddToCartInput {
  product_id: number;
  variant_id?: number;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

/** Shopping cart API: add, update, remove items, vouchers. */
export class CartModule {
  constructor(private http: HttpClient) {}

  /** Get the current cart contents. */
  async get(opts?: RequestOptions): Promise<Cart> {
    return this.http.get('/api/cart/', undefined, opts);
  }

  /** Add a product to the cart. */
  async add(data: AddToCartInput, opts?: RequestOptions): Promise<Cart> {
    return this.http.post('/api/cart/add/', data, opts);
  }

  /** Update the quantity of a cart item. */
  async updateItem(itemId: number, data: UpdateCartItemInput, opts?: RequestOptions): Promise<Cart> {
    return this.http.patch(`/api/cart/items/${itemId}/`, data, opts);
  }

  /** Remove an item from the cart. */
  async removeItem(itemId: number, opts?: RequestOptions): Promise<Cart> {
    return this.http.delete(`/api/cart/items/${itemId}/`, opts);
  }

  /** Clear all items from the cart. */
  async clear(opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/cart/clear/', undefined, opts);
  }

  /** Apply a voucher/discount code to the cart. */
  async applyVoucher(code: string, opts?: RequestOptions): Promise<Cart> {
    return this.http.post('/api/cart/apply-voucher/', { code }, opts);
  }

  /** Remove a previously applied voucher. */
  async removeVoucher(code: string, opts?: RequestOptions): Promise<Cart> {
    return this.http.delete(`/api/cart/remove-voucher/${code}/`, opts);
  }

  /** Get a lightweight cart summary (item count, totals). */
  async getSummary(opts?: RequestOptions): Promise<CartSummary> {
    return this.http.get('/api/cart/summary/', undefined, opts);
  }

  /** Get product recommendations for an empty cart. */
  async getEmptyRecommendations(opts?: RequestOptions): Promise<unknown[]> {
    return this.http.get('/api/cart/empty-recommendations/', undefined, opts);
  }
}
