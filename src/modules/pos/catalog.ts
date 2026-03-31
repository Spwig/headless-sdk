import type { HttpClient } from '../../utils/fetch.js';
import type { PaginationParams, RequestOptions } from '../../utils/types.js';

/** POS product (list view). */
export interface PosProductListItem {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  currency: string;
  product_type: string;
  category_id: number | null;
  image: string | null;
  stock_available: number;
  has_variants: boolean;
}

/** POS product (detail view). */
export interface PosProduct extends PosProductListItem {
  slug: string;
  sales_channel: string;
  category_name: string | null;
  images: string[];
  track_inventory: boolean;
  is_low_stock: boolean;
  variants: PosProductVariant[];
  updated_at: string;
}

/** POS product variant. */
export interface PosProductVariant {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  price: string;
  attributes: Record<string, string>;
  stock_available: number;
  image: string | null;
}

/** POS category. */
export interface PosCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  product_count: number;
  children: PosCategory[];
}

export interface PosCatalogParams extends PaginationParams {
  category?: number;
  barcode?: string;
}

/** POS Catalog API: products, categories, barcode lookup. */
export class PosCatalogModule {
  constructor(private http: HttpClient) {}

  /** List products for POS display. */
  async listProducts(params?: PosCatalogParams, opts?: RequestOptions): Promise<PosProductListItem[]> {
    return this.http.get('/api/pos/products/', params as Record<string, unknown>, opts);
  }

  /** Get product detail by ID. */
  async getProduct(id: number, opts?: RequestOptions): Promise<PosProduct> {
    return this.http.get(`/api/pos/products/${id}/`, undefined, opts);
  }

  /** Look up a product by barcode. */
  async lookupBarcode(barcode: string, opts?: RequestOptions): Promise<PosProduct> {
    return this.http.get(`/api/pos/products/barcode/${barcode}/`, undefined, opts);
  }

  /** List POS categories (tree). */
  async listCategories(opts?: RequestOptions): Promise<PosCategory[]> {
    return this.http.get('/api/pos/categories/', undefined, opts);
  }
}
