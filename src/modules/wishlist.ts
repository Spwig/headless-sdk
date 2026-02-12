import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface WishlistItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  product_price: string;
  product_available: boolean;
  added_at: string;
  [key: string]: unknown;
}

/** Wishlist API: add, remove, and list saved products. */
export class WishlistModule {
  constructor(private http: HttpClient) {}

  /** List all items in the customer's wishlist. Requires authentication. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<WishlistItem>> {
    return this.http.get('/api/wishlists/', params as Record<string, unknown>, opts);
  }

  /** Add a product to the wishlist. */
  async add(productId: number, opts?: RequestOptions): Promise<WishlistItem> {
    return this.http.post('/api/wishlists/add/', { product: productId }, opts);
  }

  /** Remove an item from the wishlist. */
  async remove(itemId: number, opts?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/wishlists/items/${itemId}/`, opts);
  }
}
