import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** POS cart item. */
export interface PosCartItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_id: number | null;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  image: string | null;
}

/** POS cart. */
export interface PosCart {
  id: number;
  items: PosCartItem[];
  item_count: number;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total: string;
  currency: string;
  voucher_code: string | null;
  gift_card_applied: string | null;
}

/** POS add to cart input. */
export interface PosAddToCartInput {
  product_id: number;
  variant_id?: number;
  quantity?: number;
  barcode?: string;
  configuration?: Record<string, unknown>;
  preset_id?: number;
  variant_selections?: Record<string, unknown>;
  excluded_optional_items?: number[];
}

/** Parked cart summary. */
export interface ParkedCart {
  id: number;
  item_count: number;
  total: string;
  currency: string;
  customer_name: string | null;
  parked_at: string;
  parked_by: string;
  [key: string]: unknown;
}

/** POS Cart API: items, vouchers, gift cards, parking. */
export class PosCartModule {
  constructor(private http: HttpClient) {}

  /** Get the current cart. */
  async get(opts?: RequestOptions): Promise<PosCart> {
    return this.http.get('/api/pos/cart/', undefined, opts);
  }

  /** Add an item to the cart. */
  async addItem(data: PosAddToCartInput, opts?: RequestOptions): Promise<PosCart> {
    return this.http.post('/api/pos/cart/items/', data, opts);
  }

  /** Update an item's quantity. Set quantity to 0 to remove. */
  async updateItem(itemId: number, quantity: number, opts?: RequestOptions): Promise<PosCart> {
    return this.http.patch(`/api/pos/cart/items/${itemId}/`, { quantity }, opts);
  }

  /** Remove an item from the cart. */
  async removeItem(itemId: number, opts?: RequestOptions): Promise<PosCart> {
    return this.http.delete(`/api/pos/cart/items/${itemId}/remove/`, opts);
  }

  /** Apply a voucher code to the cart. */
  async applyVoucher(code: string, opts?: RequestOptions): Promise<PosCart> {
    return this.http.post('/api/pos/cart/voucher/', { code }, opts);
  }

  /** Remove the applied voucher. */
  async removeVoucher(opts?: RequestOptions): Promise<PosCart> {
    return this.http.delete('/api/pos/cart/voucher/remove/', opts);
  }

  /** Apply a gift card to the cart. */
  async applyGiftCard(code: string, opts?: RequestOptions): Promise<PosCart> {
    return this.http.post('/api/pos/cart/gift-card/', { code }, opts);
  }

  /** Clear all items from the cart. */
  async clear(opts?: RequestOptions): Promise<PosCart> {
    return this.http.post('/api/pos/cart/clear/', undefined, opts);
  }

  /** Discounts sub-module. */
  readonly discounts = {
    /** Apply a discount to a specific item. */
    applyItemDiscount: (itemId: number, data: { type: string; value: string; reason?: string }, opts?: RequestOptions): Promise<PosCart> =>
      this.http.post(`/api/pos/cart/items/${itemId}/discount/`, data, opts),

    /** Remove a discount from a specific item. */
    removeItemDiscount: (itemId: number, opts?: RequestOptions): Promise<PosCart> =>
      this.http.delete(`/api/pos/cart/items/${itemId}/discount/remove/`, opts),

    /** Apply a manual discount to the entire cart. */
    applyCartDiscount: (data: { type: string; value: string; reason?: string }, opts?: RequestOptions): Promise<PosCart> =>
      this.http.post('/api/pos/cart/manual-discount/', data, opts),

    /** Remove the cart-level manual discount. */
    removeCartDiscount: (opts?: RequestOptions): Promise<PosCart> =>
      this.http.delete('/api/pos/cart/manual-discount/remove/', opts),

    /** Verify a manager's PIN for discount approval. */
    verifyManagerPin: (pin: string, opts?: RequestOptions): Promise<{ valid: boolean; manager_name?: string }> =>
      this.http.post('/api/pos/cart/discount/verify-pin/', { pin }, opts),

    /** Approve a pending discount with manager authorization. */
    approve: (data: { discount_id: number; manager_id: number }, opts?: RequestOptions): Promise<PosCart> =>
      this.http.post('/api/pos/cart/discount/approve/', data, opts),
  };

  /** Parked carts sub-module. */
  readonly parked = {
    /** Park the current cart for later. */
    park: (data?: { customer_name?: string; notes?: string }, opts?: RequestOptions): Promise<ParkedCart> =>
      this.http.post('/api/pos/cart/park/', data, opts),

    /** List all parked carts. */
    list: (opts?: RequestOptions): Promise<ParkedCart[]> =>
      this.http.get('/api/pos/cart/parked/', undefined, opts),

    /** Restore a parked cart as the active cart. */
    restore: (id: number, opts?: RequestOptions): Promise<PosCart> =>
      this.http.post(`/api/pos/cart/parked/${id}/restore/`, undefined, opts),

    /** Delete a parked cart. */
    delete: (id: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/pos/cart/parked/${id}/`, opts),
  };
}
