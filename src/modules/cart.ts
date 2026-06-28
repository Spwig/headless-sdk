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
  /** Sum of all applied gift card discounts, in cart currency. */
  gift_card_discount_amount: string;
  /** `subtotal - voucher_discount_amount - gift card discounts`. Pre-shipping/tax. */
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
  applied_gift_cards: AppliedGiftCard[];

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

export interface AppliedGiftCard {
  code: string;
  /** Amount applied to this cart, in cart currency. */
  discount_amount: number;
  /** Cart currency. */
  currency: string;
  /** Balance remaining on the gift card, in the gift card's currency. */
  remaining_balance: number;
  /** Gift card's own currency. Same as `currency` for same-currency cards. */
  gift_card_currency: string;
  /** ISO timestamp when this gift card was applied to the cart. */
  applied_at: string;
  /** Original amount applied, in the gift card's currency. Only present for foreign-currency gift cards. */
  original_discount_amount?: number;
  /** Original currency (same as `gift_card_currency`). Only present for foreign-currency gift cards. */
  original_discount_currency?: string;
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
    return this.http.delete(`/api/cart/remove-voucher/${encodeURIComponent(code)}/`, opts);
  }

  /** Apply a gift card code to the cart. */
  async applyGiftCard(code: string, opts?: RequestOptions): Promise<Cart> {
    return this.http.post('/api/cart/apply-gift-card/', { code }, opts);
  }

  /** Remove a previously applied gift card. */
  async removeGiftCard(code: string, opts?: RequestOptions): Promise<Cart> {
    return this.http.delete(`/api/cart/remove-gift-card/${encodeURIComponent(code)}/`, opts);
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
