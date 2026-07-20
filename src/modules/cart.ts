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
  id: number;
  items: CartItem[];

  /** Sum of line quantities (excluding bundle/configurable components). */
  item_count: number;
  /** Alias for `item_count`. Same value. */
  total_items: number;

  /**
   * Sum of `(unit_price + customization_price) * quantity` across line items.
   * If items were added on sale, this is the post-sale subtotal — the
   * customer-facing pre-shipping subtotal. Use `subtotal + total_savings`
   * to get the pre-sale subtotal for "savings" displays.
   */
  subtotal: string;
  /** Alias for `subtotal`. */
  total_amount: string;
  /** Sum of `(product.price - unit_price) * quantity` across line items — item-level savings from product-level sales. */
  total_savings: string;
  /** Sum of all applied voucher discounts. Distinct from `total_savings`. */
  voucher_discount_amount: string;
  /** `subtotal - voucher_discount_amount`. Pre-shipping/tax. Gift cards are
   *  no longer cart state — they are payment tenders on the checkout; see
   *  `checkout.listTenders()`. */
  final_amount: string;
  /** `final_amount + shipping_cost` (cart-side; tax not included here, tax lives on CheckoutSession). */
  grand_total: string;
  /** Alias for `grand_total`. */
  total: string;
  /** Shipping cost when a shipping method has been selected on the cart, otherwise "0.00". */
  shipping_cost: string;
  /** ISO currency code for every Money value above. */
  currency: string;

  total_weight: string;
  requires_shipping: boolean;
  applied_vouchers: AppliedVoucher[];

  /** @deprecated The backend does not return this field. Use `voucher_discount_amount`. */
  discount?: string;
  /** @deprecated Tax is not on the cart — it lives on `CheckoutSession`. */
  tax?: string;
  /** @deprecated Use `applied_vouchers` (array). */
  voucher?: AppliedVoucher | null;

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
  /** Required when the product is a gift card. `recipient_email` is the only
   *  mandatory key; unknown keys are rejected by the server. `amount` selects
   *  a denomination where the product offers a choice; `scheduled_send_at`
   *  must be offset-aware ISO-8601, in the future, at most a year ahead. */
  gift_card_data?: {
    recipient_email: string;
    recipient_name?: string;
    sender_name?: string;
    /** Max 500 characters, no HTML/markup. */
    message?: string;
    scheduled_send_at?: string;
    amount?: string;
  };
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
    return this.http.delete(`/api/cart/remove-voucher/${encodeURIComponent(code)}/`, opts);
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
