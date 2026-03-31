import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, BlobResponse, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesKPI {
  total_sales: string;
  currency: string;
  order_count: number;
  average_order_value: string;
  period: string;
  [key: string]: unknown;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  sku: string;
  units_sold: number;
  revenue: string;
  currency: string;
  [key: string]: unknown;
}

export interface OrderStatusBreakdown {
  status: string;
  status_display: string;
  count: number;
  [key: string]: unknown;
}

export interface DashboardAnalytics {
  today: SalesKPI;
  last_7_days: SalesKPI;
  last_30_days: SalesKPI;
  top_products_today: TopProduct[];
  top_products_7_days: TopProduct[];
  order_status_breakdown: OrderStatusBreakdown[];
  pending_orders_count: number;
  low_stock_count: number;
  [key: string]: unknown;
}

export interface QuickStats {
  today_sales: string;
  today_orders: number;
  pending_orders: number;
  low_stock_items: number;
  currency: string;
  [key: string]: unknown;
}

export interface SalesComparison {
  current_value: string;
  previous_value: string;
  change_percentage: string | null;
  trend: 'up' | 'down' | 'stable';
  currency: string;
  [key: string]: unknown;
}

export interface DailyStatsItem {
  date: string;
  revenue: string;
  order_count: number;
  average_order_value: string;
  [key: string]: unknown;
}

export interface DailyStats {
  period: string;
  currency: string;
  start_date: string;
  end_date: string;
  days: DailyStatsItem[];
  [key: string]: unknown;
}

export type AnalyticsPeriod = 'today' | '7_days' | '30_days';
export type DailyStatsPeriod = '7_days' | '30_days' | '90_days';

export interface TopProductsParams {
  period?: 'today' | '7_days';
  limit?: number;
}

// -- Advanced analytics types -----------------------------------------------

export interface ProductAnalyticsItem {
  product_id: number;
  product_name: string;
  sku: string;
  image_url: string | null;
  category_name: string;
  brand_name: string;
  units_sold: number;
  revenue: string;
  orders_count: number;
  returns_count: number;
  return_rate: string;
  average_selling_price: string;
  [key: string]: unknown;
}

export interface ProductAnalyticsSummary {
  total_revenue: string;
  total_units: number;
  total_products_sold: number;
  [key: string]: unknown;
}

export interface ProductAnalyticsResponse {
  currency: string;
  start_date: string;
  end_date: string;
  summary: ProductAnalyticsSummary;
  results: ProductAnalyticsItem[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface ProductAnalyticsParams {
  start_date: string;
  end_date: string;
  category_id?: number;
  brand_id?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: unknown;
}

export interface CustomerRecord {
  user_id: number;
  name: string;
  email: string;
  segment: 'new' | 'returning';
  total_spent: string;
  total_orders: number;
  range_spent: string;
  range_orders: number;
  joined: string | null;
  [key: string]: unknown;
}

export interface CustomerSummary {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  average_ltv: string;
  average_orders_per_customer: number;
  [key: string]: unknown;
}

export interface GeoBreakdownItem {
  country: string;
  order_count: number;
  revenue: string;
  customer_count: number;
  [key: string]: unknown;
}

export interface LtvDistributionBucket {
  label: string;
  count: number;
  [key: string]: unknown;
}

export interface CustomerAnalyticsResponse {
  currency: string;
  start_date: string;
  end_date: string;
  summary: CustomerSummary;
  geo_breakdown: GeoBreakdownItem[];
  ltv_distribution: LtvDistributionBucket[];
  top_customers: CustomerRecord[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface CustomerAnalyticsParams {
  start_date: string;
  end_date: string;
  segment?: 'new' | 'returning';
  ordering?: string;
  page?: number;
  page_size?: number;
  [key: string]: unknown;
}

export interface CategoryAnalyticsItem {
  category_id: number | null;
  category_name: string;
  revenue: string;
  units_sold: number;
  orders_count: number;
  products_count: number;
  revenue_percentage: string;
  [key: string]: unknown;
}

export interface CategoryAnalyticsSummary {
  total_revenue: string;
  total_units: number;
  total_categories: number;
  [key: string]: unknown;
}

export interface CategoryAnalyticsResponse {
  currency: string;
  start_date: string;
  end_date: string;
  summary: CategoryAnalyticsSummary;
  categories: CategoryAnalyticsItem[];
  [key: string]: unknown;
}

export interface CategoryAnalyticsParams {
  start_date: string;
  end_date: string;
  ordering?: string;
  [key: string]: unknown;
}

export interface BrandAnalyticsItem {
  brand_id: number | null;
  brand_name: string;
  revenue: string;
  units_sold: number;
  orders_count: number;
  products_count: number;
  revenue_percentage: string;
  [key: string]: unknown;
}

export interface BrandAnalyticsSummary {
  total_revenue: string;
  total_units: number;
  total_brands: number;
  [key: string]: unknown;
}

export interface BrandAnalyticsResponse {
  currency: string;
  start_date: string;
  end_date: string;
  summary: BrandAnalyticsSummary;
  brands: BrandAnalyticsItem[];
  [key: string]: unknown;
}

export interface BrandAnalyticsParams {
  start_date: string;
  end_date: string;
  ordering?: string;
  [key: string]: unknown;
}

export interface DailyBreakdownPoint {
  date: string;
  revenue: string;
  order_count: number;
  [key: string]: unknown;
}

export interface EnhancedComparisonResponse {
  current_value: string;
  previous_value: string;
  current_order_count: number;
  previous_order_count: number;
  change_percentage: string | null;
  trend: 'up' | 'down' | 'stable';
  currency: string;
  daily_breakdown: {
    current: DailyBreakdownPoint[];
    previous: DailyBreakdownPoint[];
  };
  [key: string]: unknown;
}

export interface ComparisonParams {
  period?: 'today' | '7_days';
  start_date?: string;
  end_date?: string;
  compare_start_date?: string;
  compare_end_date?: string;
}

export interface AnalyticsExportParams {
  report_type: 'products' | 'customers' | 'categories' | 'brands' | 'orders' | 'summary';
  format: 'csv' | 'pdf';
  start_date: string;
  end_date: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin analytics: dashboard KPIs, sales data, top products. */
export class AdminAnalyticsModule {
  constructor(private http: HttpClient) {}

  /** Get complete dashboard analytics. */
  async getDashboard(opts?: RequestOptions): Promise<DashboardAnalytics> {
    return this.http.get('/api/admin/analytics/dashboard/', undefined, opts);
  }

  /** Get quick stats for dashboard header. */
  async getQuickStats(opts?: RequestOptions): Promise<QuickStats> {
    return this.http.get('/api/admin/analytics/quick-stats/', undefined, opts);
  }

  /** Get sales KPIs for a specific period. */
  async getSalesKpi(period?: AnalyticsPeriod, opts?: RequestOptions): Promise<SalesKPI> {
    return this.http.get('/api/admin/analytics/sales-kpi/', period ? { period } : undefined, opts);
  }

  /** Get top selling products. */
  async getTopProducts(params?: TopProductsParams, opts?: RequestOptions): Promise<TopProduct[]> {
    return this.http.get('/api/admin/analytics/top-products/', params as Record<string, unknown>, opts);
  }

  /** Get sales comparison with previous period. */
  async getSalesComparison(period?: 'today' | '7_days', opts?: RequestOptions): Promise<SalesComparison> {
    return this.http.get('/api/admin/analytics/sales-comparison/', period ? { period } : undefined, opts);
  }

  /** Get daily stats breakdown for chart display. */
  async getDailyStats(period?: DailyStatsPeriod, opts?: RequestOptions): Promise<DailyStats> {
    return this.http.get('/api/admin/analytics/daily-stats/', period ? { period } : undefined, opts);
  }

  // -- Advanced analytics ---------------------------------------------------

  /** Get product-level performance analytics for a date range. */
  async getProductAnalytics(params: ProductAnalyticsParams, opts?: RequestOptions): Promise<ProductAnalyticsResponse> {
    return this.http.get('/api/admin/analytics/products/', params as Record<string, unknown>, opts);
  }

  /** Get customer analytics for a date range. */
  async getCustomerAnalytics(params: CustomerAnalyticsParams, opts?: RequestOptions): Promise<CustomerAnalyticsResponse> {
    return this.http.get('/api/admin/analytics/customers/', params as Record<string, unknown>, opts);
  }

  /** Get revenue and sales breakdown per category. */
  async getCategoryAnalytics(params: CategoryAnalyticsParams, opts?: RequestOptions): Promise<CategoryAnalyticsResponse> {
    return this.http.get('/api/admin/analytics/categories/', params as Record<string, unknown>, opts);
  }

  /** Get revenue and sales breakdown per brand. */
  async getBrandAnalytics(params: BrandAnalyticsParams, opts?: RequestOptions): Promise<BrandAnalyticsResponse> {
    return this.http.get('/api/admin/analytics/brands/', params as Record<string, unknown>, opts);
  }

  /** Get enhanced sales comparison between two date ranges with daily breakdown. */
  async getComparison(params?: ComparisonParams, opts?: RequestOptions): Promise<EnhancedComparisonResponse> {
    return this.http.get('/api/admin/analytics/comparison/', params as Record<string, unknown>, opts);
  }

  /** Export analytics report as CSV or PDF. Returns binary file data. */
  async exportReport(params: AnalyticsExportParams, opts?: RequestOptions): Promise<BlobResponse> {
    return this.http.fetchBlob('/api/admin/analytics/export/', params as Record<string, unknown>, undefined, 'GET', opts);
  }
}
