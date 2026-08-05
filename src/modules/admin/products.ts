import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  status: string;
  status_display: string;
  price: string;
  /**
   * The struck-through "was" price. ⚠️ Spwig 1.7.1: no longer a stored field —
   * it is derived from the sale mechanism and is `null` unless the product is
   * on sale (in which case it equals the regular price). Read-only.
   */
  compare_at_price: string | null;
  currency: string;
  stock_quantity: number;
  low_stock_threshold: number;
  primary_image_url: string | null;
  category_name: string | null;
  brand_name: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AdminProductDetail extends AdminProduct {
  description: string;
  short_description: string;
  meta_title: string;
  meta_description: string;
  weight: string | null;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  attributes: AdminProductAttribute[];
  [key: string]: unknown;
}

export interface AdminProductImage {
  id: number;
  url: string;
  thumbnail_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  [key: string]: unknown;
}

export interface AdminProductVariant {
  id: number;
  name: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  attributes: Record<string, string>;
  [key: string]: unknown;
}

export interface AdminProductAttribute {
  id: number;
  name: string;
  value: string;
  [key: string]: unknown;
}

/** Product stock counts (for published, inventory-tracked products). */
export interface ProductCounts {
  total: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  [key: string]: unknown;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  primary_image_url: string | null;
  [key: string]: unknown;
}

export interface AdminWarehouse {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface AdminProductListParams {
  status?: 'all' | 'draft' | 'published' | 'discontinued';
  stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  search?: string;
  low_stock_only?: boolean;
  category?: number;
  brand?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface ProductCreateInput {
  name: string;
  sku?: string;
  description?: string;
  short_description?: string;
  price: string;
  compare_at_price?: string;
  currency?: string;
  category_id?: number;
  brand_id?: number;
  status?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  weight?: string;
  meta_title?: string;
  meta_description?: string;
  [key: string]: unknown;
}

export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  price?: string;
  compare_at_price?: string;
  currency?: string;
  category_id?: number;
  brand_id?: number;
  status?: string;
  weight?: string;
  meta_title?: string;
  meta_description?: string;
  [key: string]: unknown;
}

export interface BulkProductCreateInput {
  products: ProductCreateInput[];
}

export interface BulkProductUpdateInput {
  products: Array<{ id: number } & ProductUpdateInput>;
}

export interface StockAdjustmentInput {
  quantity: number;
  warehouse_id?: number;
  reason?: string;
}

export interface ProductStatusUpdateInput {
  status: string;
}

export interface ProductImageUpdateInput {
  alt_text?: string;
  sort_order?: number;
}

export interface ProductImageReorderInput {
  image_ids: number[];
}

export interface VariantCreateInput {
  name: string;
  sku?: string;
  price: string;
  compare_at_price?: string;
  stock_quantity?: number;
  is_active?: boolean;
  attributes?: Record<string, string>;
  [key: string]: unknown;
}

export interface VariantUpdateInput {
  name?: string;
  sku?: string;
  price?: string;
  compare_at_price?: string;
  stock_quantity?: number;
  is_active?: boolean;
  attributes?: Record<string, string>;
  [key: string]: unknown;
}

export interface AdminAttribute {
  id: number;
  name: string;
  slug: string;
  values: string[];
  [key: string]: unknown;
}

export interface AttributeCreateInput {
  name: string;
  values?: string[];
}

export interface AttributeAssignInput {
  /**
   * ⚠️ Breaking change (Spwig 1.7.1): the payload is now `assignments` (was
   * `attributes`), each entry references attribute-value IDs (`value_ids`, was
   * free-text `values`), with an optional `sort_order`. The backend now enforces
   * this shape (`attribute_id >= 1`, `value_ids` items `>= 1`, `sort_order >= 0`).
   */
  assignments: Array<{ attribute_id: number; value_ids: number[]; sort_order?: number }>;
}

/** Product list response with custom admin pagination. */
export interface ProductListResponse {
  products: AdminProduct[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin product management: CRUD, stock, images, variants, attributes. */
export class AdminProductsModule {
  constructor(private http: HttpClient) {}

  // ---- Products CRUD ----

  /** List products with filtering and sorting. */
  readonly products = {
    list: (params?: AdminProductListParams, opts?: RequestOptions): Promise<ProductListResponse> =>
      this.http.get('/api/admin/products/', params as Record<string, unknown>, opts),

    /** Get product count statistics. */
    getCounts: (opts?: RequestOptions): Promise<ProductCounts> =>
      this.http.get('/api/admin/products/counts/', undefined, opts),

    /** Get product by SKU. */
    getBySku: (sku: string, opts?: RequestOptions): Promise<AdminProductDetail> =>
      this.http.get('/api/admin/products/by-sku/', { sku }, opts),

    /** List low-stock products. */
    getLowStock: (opts?: RequestOptions): Promise<LowStockProduct[]> =>
      this.http.get('/api/admin/products/low-stock/', undefined, opts),

    /** List warehouses. */
    getWarehouses: (opts?: RequestOptions): Promise<AdminWarehouse[]> =>
      this.http.get('/api/admin/products/warehouses/', undefined, opts),

    /** Create a new product. */
    create: (data: ProductCreateInput, opts?: RequestOptions): Promise<AdminProductDetail> =>
      this.http.post('/api/admin/products/create/', data, opts),

    /** Bulk create products. */
    bulkCreate: (data: BulkProductCreateInput, opts?: RequestOptions): Promise<unknown> =>
      this.http.post('/api/admin/products/bulk/', data, opts),

    /** Bulk update products. */
    bulkUpdate: (data: BulkProductUpdateInput, opts?: RequestOptions): Promise<unknown> =>
      this.http.put('/api/admin/products/bulk/update/', data, opts),

    /** Get product details. */
    get: (productId: number, opts?: RequestOptions): Promise<AdminProductDetail> =>
      this.http.get(`/api/admin/products/${productId}/`, undefined, opts),

    /** Update a product. */
    update: (productId: number, data: ProductUpdateInput, opts?: RequestOptions): Promise<AdminProductDetail> =>
      this.http.put(`/api/admin/products/${productId}/update/`, data, opts),

    /** Delete a product. */
    delete: (productId: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/admin/products/${productId}/delete/`, opts),

    /** Adjust stock quantity. */
    adjustStock: (productId: number, data: StockAdjustmentInput, opts?: RequestOptions): Promise<unknown> =>
      this.http.put(`/api/admin/products/${productId}/stock/`, data, opts),

    /** Update product publish status. */
    updateStatus: (productId: number, data: ProductStatusUpdateInput, opts?: RequestOptions): Promise<unknown> =>
      this.http.put(`/api/admin/products/${productId}/status/`, data, opts),
  };

  // ---- Product Images ----

  readonly images = {
    /** Upload a product image. Accepts FormData with image file. */
    upload: (productId: number, formData: FormData, opts?: RequestOptions): Promise<AdminProductImage> =>
      this.http.post(`/api/admin/products/${productId}/images/`, formData, opts),

    /** Reorder product images. */
    reorder: (productId: number, data: ProductImageReorderInput, opts?: RequestOptions): Promise<void> =>
      this.http.put(`/api/admin/products/${productId}/images/reorder/`, data, opts),

    /** Delete a product image. */
    delete: (productId: number, imageId: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/admin/products/${productId}/images/${imageId}/`, opts),

    /** Set an image as the primary image. */
    setPrimary: (productId: number, imageId: number, opts?: RequestOptions): Promise<void> =>
      this.http.put(`/api/admin/products/${productId}/images/${imageId}/primary/`, undefined, opts),

    /** Update image metadata (alt text, sort order). */
    update: (productId: number, imageId: number, data: ProductImageUpdateInput, opts?: RequestOptions): Promise<AdminProductImage> =>
      this.http.put(`/api/admin/products/${productId}/images/${imageId}/update/`, data, opts),
  };

  // ---- Product Variants ----

  readonly variants = {
    /** List variants for a product. */
    list: (productId: number, opts?: RequestOptions): Promise<AdminProductVariant[]> =>
      this.http.get(`/api/admin/products/${productId}/variants/`, undefined, opts),

    /** Create a new variant. */
    create: (productId: number, data: VariantCreateInput, opts?: RequestOptions): Promise<AdminProductVariant> =>
      this.http.post(`/api/admin/products/${productId}/variants/create/`, data, opts),

    /** Update a variant. */
    update: (productId: number, variantId: number, data: VariantUpdateInput, opts?: RequestOptions): Promise<AdminProductVariant> =>
      this.http.put(`/api/admin/products/${productId}/variants/${variantId}/update/`, data, opts),

    /** Delete a variant. */
    delete: (productId: number, variantId: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/admin/products/${productId}/variants/${variantId}/delete/`, opts),
  };

  // ---- Product Attributes ----

  readonly attributes = {
    /** List available attributes. */
    list: (opts?: RequestOptions): Promise<AdminAttribute[]> =>
      this.http.get('/api/admin/attributes/', undefined, opts),

    /** Create a new attribute. */
    create: (data: AttributeCreateInput, opts?: RequestOptions): Promise<AdminAttribute> =>
      this.http.post('/api/admin/attributes/create/', data, opts),

    /** Assign attributes to a product. */
    assign: (productId: number, data: AttributeAssignInput, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/admin/products/${productId}/attributes/assign/`, data, opts),
  };
}
