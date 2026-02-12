import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

/**
 * Product — matches ProductDetailSerializer output.
 * List endpoints return a subset (e.g., primary_image instead of images array,
 * category_name/brand_name strings instead of full objects).
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  product_type: string;
  description: string;
  short_description: string;
  price_amount: string;
  price_currency: string;
  compare_at_price_amount: string | null;
  discount_percentage: number | null;
  is_in_stock: boolean;
  is_low_stock: boolean;
  is_featured: boolean;
  /** Full category object (detail only; list returns category_name string). */
  category: CategorySummary | null;
  /** Full brand object (detail only; list returns brand_name string). */
  brand: BrandSummary | null;
  /** Product images (detail only; list returns primary_image object). */
  images: ProductImage[];
  variants: ProductVariant[];
  available_attributes: Record<string, unknown>[];
  average_rating: number | null;
  review_count: number;
  /** List-only fields (not in detail). */
  category_name?: string;
  brand_name?: string;
  primary_image?: { url: string; alt_text: string } | null;
  [key: string]: unknown;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  pricing_strategy: string;
  price_amount: string;
  price_currency: string;
  effective_price: string;
  is_active: boolean;
  stock_quantity: number;
  image_url: string | null;
  images: ProductImage[];
  color_swatch: string | null;
  attributes_structured: Array<{ attribute: string; value: string }>;
  [key: string]: unknown;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent: number | null;
  children: Category[];
  product_count: number;
  [key: string]: unknown;
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  [key: string]: unknown;
}

export interface BrandSummary {
  id: number;
  name: string;
  slug: string;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  [key: string]: unknown;
}

export interface Review {
  id: number;
  product: number;
  user: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ProductListParams extends PaginationParams {
  category?: string;
  brand?: string;
  collection?: string;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  [key: string]: unknown;
}

export interface StockAvailability {
  product_id: number;
  is_available: boolean;
  quantity: number;
  locations: Array<{
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
  }>;
}

/** Catalog API: products, categories, brands, collections, and reviews. */
export class CatalogModule {
  constructor(private http: HttpClient) {}

  /** Product sub-module. */
  readonly products = {
    /** List products with optional filtering, search, and pagination. */
    list: (params?: ProductListParams, opts?: RequestOptions): Promise<PaginatedResponse<Product>> =>
      this.http.get('/api/catalog/products/', params as Record<string, unknown>, opts),

    /** Get a single product by slug. */
    get: (slug: string, opts?: RequestOptions): Promise<Product> =>
      this.http.get(`/api/catalog/products/${slug}/`, undefined, opts),

    /** Check stock availability for a product across all warehouses. */
    checkStock: (slug: string, opts?: RequestOptions): Promise<StockAvailability> =>
      this.http.get(`/api/catalog/products/${slug}/check-stock/`, undefined, opts),

    /** Get product availability status. */
    availability: (slug: string, opts?: RequestOptions): Promise<{ is_available: boolean; quantity: number }> =>
      this.http.get(`/api/catalog/products/${slug}/availability/`, undefined, opts),

    /** Subscribe for stock notification when product becomes available. */
    notifyMe: (slug: string, email: string, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/catalog/products/${slug}/notify-me/`, { email }, opts),
  };

  /** Category sub-module. */
  readonly categories = {
    /** List all categories (tree structure). */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Category>> =>
      this.http.get('/api/catalog/categories/', params as Record<string, unknown>, opts),

    /** Get a single category by ID or slug. */
    get: (idOrSlug: string | number, opts?: RequestOptions): Promise<Category> =>
      this.http.get(`/api/catalog/categories/${idOrSlug}/`, undefined, opts),
  };

  /** Brand sub-module. */
  readonly brands = {
    /** List all brands. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Brand>> =>
      this.http.get('/api/catalog/brands/', params as Record<string, unknown>, opts),

    /** Get a single brand by ID or slug. */
    get: (idOrSlug: string | number, opts?: RequestOptions): Promise<Brand> =>
      this.http.get(`/api/catalog/brands/${idOrSlug}/`, undefined, opts),
  };

  /** Collection sub-module. */
  readonly collections = {
    /** List all product collections. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Collection>> =>
      this.http.get('/api/catalog/collections/', params as Record<string, unknown>, opts),

    /** Get a single collection by ID or slug. */
    get: (idOrSlug: string | number, opts?: RequestOptions): Promise<Collection> =>
      this.http.get(`/api/catalog/collections/${idOrSlug}/`, undefined, opts),
  };

  /** Review sub-module. */
  readonly reviews = {
    /** List reviews for a product. */
    list: (params?: PaginationParams & { product?: number }, opts?: RequestOptions): Promise<PaginatedResponse<Review>> =>
      this.http.get('/api/catalog/reviews/', params as Record<string, unknown>, opts),

    /** Submit a review for a product. Requires authentication. */
    create: (data: { product: number; rating: number; title?: string; comment: string }, opts?: RequestOptions): Promise<Review> =>
      this.http.post('/api/catalog/reviews/', data, opts),
  };

  /** Get product recommendations. */
  async getRecommendations(params?: Record<string, unknown>, opts?: RequestOptions): Promise<Product[]> {
    return this.http.get('/api/catalog/recommendations/', params, opts);
  }

  /** Get available filter options for the catalog. */
  async getFilters(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/catalog/filters/', undefined, opts);
  }

  /** Get catalog statistics. */
  async getStats(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/catalog/stats/', undefined, opts);
  }

  /** List pickup locations (warehouses). */
  async getPickupLocations(opts?: RequestOptions): Promise<unknown[]> {
    return this.http.get('/api/catalog/pickup-locations/', undefined, opts);
  }

  /** Check a gift card balance. */
  async checkGiftCardBalance(code: string, opts?: RequestOptions): Promise<{ balance: string; currency: string }> {
    return this.http.post('/api/catalog/gift-cards/check-balance/', { code }, opts);
  }
}
