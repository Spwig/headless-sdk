import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface CustomerDashboard {
  name: string;
  email: string;
  member_since: string;
  total_orders: number;
  total_spent: string;
  total_saved: string;
  loyalty_points: number;
  segment: string;
  segment_display: string;
  recent_orders: unknown[];
  recently_viewed: unknown[];
  recommended_products: unknown[];
  abandoned_carts: number;
  items_back_in_stock: number;
  items_on_sale: number;
  [key: string]: unknown;
}

export interface CustomerStats {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_order_value: string;
  total_items_purchased: number;
  unique_products_purchased: number;
  average_items_per_order: number;
  days_since_first_order: number;
  days_since_last_order: number;
  average_days_between_orders: number;
  purchase_frequency_category: string;
  total_returns: number;
  return_rate: number;
  wishlist_items: number;
  reviews_written: number;
  products_viewed: number;
  [key: string]: unknown;
}

export interface CustomerInsights {
  total_lifetime_spent: string;
  average_monthly_spend: string;
  highest_month_spend: string;
  lowest_month_spend: string;
  monthly_spending: unknown[];
  spending_trend: string;
  top_categories: unknown[];
  category_spending: Record<string, unknown>;
  top_brands: unknown[];
  brand_loyalty_score: number;
  peak_shopping_day: string;
  peak_shopping_hour: number;
  average_cart_size: string;
  orders_with_discounts: number;
  discount_usage_rate: number;
  favorite_discount_type: string;
  [key: string]: unknown;
}

export interface DigitalProduct {
  order_number: string;
  order_date: string;
  product_name: string;
  product_slug: string;
  digital_assets: unknown[];
  license_keys: unknown[];
  digital_downloads: unknown[];
  [key: string]: unknown;
}

export interface DigitalLicense {
  id: number;
  product_name: string;
  product_version: string;
  key: string;
  key_type: string;
  max_activations: number;
  current_activations: number;
  activations_remaining: number;
  status: string;
  is_valid: boolean;
  is_expired: boolean;
  is_lifetime: boolean;
  expires_at: string | null;
  issued_at: string | null;
  first_activated_at: string | null;
  last_activated_at: string | null;
  [key: string]: unknown;
}

/** Customer API: dashboard, stats, insights, digital products, and licenses. All endpoints require authentication. */
export class CustomerModule {
  constructor(private http: HttpClient) {}

  /** Get the customer dashboard overview. */
  async getDashboard(opts?: RequestOptions): Promise<CustomerDashboard> {
    return this.http.get('/api/customers/dashboard/', undefined, opts);
  }

  /** Get customer statistics. */
  async getStats(opts?: RequestOptions): Promise<CustomerStats> {
    return this.http.get('/api/customers/stats/', undefined, opts);
  }

  /** Get customer insights and preferences. */
  async getInsights(opts?: RequestOptions): Promise<CustomerInsights> {
    return this.http.get('/api/customers/insights/', undefined, opts);
  }

  /** Get the customer's lifetime value. */
  async getLifetimeValue(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/customers/lifetime-value/', undefined, opts);
  }

  /** Get the customer's loyalty status. */
  async getLoyaltyStatus(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/customers/loyalty-status/', undefined, opts);
  }

  /** Get the customer's total savings. */
  async getSavings(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/customers/savings/', undefined, opts);
  }

  /** Get the customer's favorite products. */
  async getFavorites(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/customers/favorites/', undefined, opts);
  }

  /** Get personalized product recommendations. */
  async getRecommendations(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/customers/recommendations/', undefined, opts);
  }

  /** Get the customer's digital products. */
  async getDigitalProducts(opts?: RequestOptions): Promise<DigitalProduct[]> {
    return this.http.get('/api/customers/digital-products/', undefined, opts);
  }

  /** Get a temporary download link for a digital product. */
  async getDownloadLink(id: number, opts?: RequestOptions): Promise<{ download_url: string; expires_in_seconds: number; filename: string; file_size: string; downloads_remaining: number }> {
    return this.http.get(`/api/customers/digital-products/${id}/download/`, undefined, opts);
  }

  /** Get the customer's digital product licenses. */
  async getLicenses(opts?: RequestOptions): Promise<DigitalLicense[]> {
    return this.http.get('/api/customers/digital-products/licenses/', undefined, opts);
  }

  /** Activate a digital product license. */
  async activateLicense(id: number, data?: { device_identifier: string; device_name?: string; device_info?: Record<string, unknown> }, opts?: RequestOptions): Promise<DigitalLicense> {
    return this.http.post(`/api/customers/digital-products/licenses/${id}/activate/`, data, opts);
  }

  /** Deactivate a digital product license. */
  async deactivateLicense(id: number, data?: { device_identifier: string }, opts?: RequestOptions): Promise<DigitalLicense> {
    return this.http.post(`/api/customers/digital-products/licenses/${id}/deactivate/`, data, opts);
  }
}
