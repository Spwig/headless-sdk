import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

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
}
