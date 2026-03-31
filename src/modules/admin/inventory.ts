import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types — Dashboard
// ---------------------------------------------------------------------------

export interface VelocityProduct {
  product_id: number;
  product_name: string;
  sku: string;
  units_sold_30d: number;
  daily_average: string;
  [key: string]: unknown;
}

export interface RecentStockout {
  product_id: number;
  product_name: string;
  sku: string;
  stockout_date: string;
  [key: string]: unknown;
}

export interface InventoryDashboard {
  total_products: number;
  total_variants: number;
  total_stock_value: string;
  currency: string;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstock_count: number;
  stockouts_last_30_days: number;
  top_velocity_products: VelocityProduct[];
  recent_stockouts: RecentStockout[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Types — Low Stock
// ---------------------------------------------------------------------------

export interface StockItemBreakdown {
  warehouse_id: number;
  warehouse_name: string;
  on_hand: number;
  allocated: number;
  [key: string]: unknown;
}

export interface LowStockProductDetail {
  product_id: number;
  product_name: string;
  sku: string;
  image_url: string | null;
  category_name: string | null;
  available_stock: number;
  low_stock_threshold: number;
  severity: 'critical' | 'warning';
  velocity_7d: string;
  velocity_30d: string;
  days_of_supply_remaining: string | null;
  last_restock_date: string | null;
  last_restock_quantity: number | null;
  stock_items: StockItemBreakdown[];
  [key: string]: unknown;
}

export interface LowStockListResponse {
  products: LowStockProductDetail[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface LowStockListParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  severity?: 'critical' | 'warning';
  category_id?: number;
  warehouse_id?: number;
}

// ---------------------------------------------------------------------------
// Types — Velocity
// ---------------------------------------------------------------------------

export interface VelocityAverages {
  daily_average_7d: string;
  daily_average_30d: string;
  daily_average_90d: string;
  [key: string]: unknown;
}

export interface DailySalesPoint {
  date: string;
  units_sold: number;
  stock_level: number;
  [key: string]: unknown;
}

export interface VelocityResponse {
  product_id: number;
  variant_id: number | null;
  current_stock: number;
  low_stock_threshold: number;
  velocity: VelocityAverages;
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_percentage: number;
  days_of_supply_remaining: string | null;
  projected_stockout_date: string | null;
  daily_sales: DailySalesPoint[];
  [key: string]: unknown;
}

export interface VelocityParams {
  product_id: number;
  variant_id?: number;
  period?: '7d' | '30d' | '90d';
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Types — Stock Movements
// ---------------------------------------------------------------------------

export interface StockMovement {
  id: number;
  movement_type: string;
  movement_type_display: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  warehouse_id: number;
  warehouse_name: string;
  variant_id: number | null;
  variant_sku: string | null;
  order_number: string | null;
  user_name: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface MovementListResponse {
  movements: StockMovement[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface MovementListParams {
  product_id: number;
  variant_id?: number;
  warehouse_id?: number;
  movement_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Types — Reorder Suggestions
// ---------------------------------------------------------------------------

export interface ReorderSuggestion {
  product_id: number;
  product_name: string;
  sku: string;
  image_url: string | null;
  category_name: string | null;
  current_stock: number;
  velocity_30d: string;
  days_of_supply_remaining: string;
  projected_stockout_date: string;
  suggested_reorder_quantity: number;
  urgency: 'immediate' | 'soon' | 'upcoming';
  [key: string]: unknown;
}

export interface ReorderSettings {
  lead_days: number;
  safety_multiplier: number;
  [key: string]: unknown;
}

export interface ReorderSuggestionListResponse {
  suggestions: ReorderSuggestion[];
  settings: ReorderSettings;
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface ReorderSuggestionParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  urgency?: 'immediate' | 'soon' | 'upcoming';
}

// ---------------------------------------------------------------------------
// Types — Settings
// ---------------------------------------------------------------------------

export interface InventorySettings {
  default_low_stock_threshold: number;
  low_stock_alerts_enabled: boolean;
  low_stock_alert_frequency: 'realtime' | 'daily' | 'weekly';
  track_inventory_by_default: boolean;
  allow_backorders_by_default: boolean;
  default_reorder_lead_days: number;
  safety_stock_multiplier: number;
  velocity_calculation_window_days: number;
  [key: string]: unknown;
}

export interface InventorySettingsUpdateInput {
  default_low_stock_threshold?: number;
  low_stock_alerts_enabled?: boolean;
  low_stock_alert_frequency?: 'realtime' | 'daily' | 'weekly';
  track_inventory_by_default?: boolean;
  allow_backorders_by_default?: boolean;
  default_reorder_lead_days?: number;
  safety_stock_multiplier?: number;
  velocity_calculation_window_days?: number;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin inventory intelligence: dashboard, low stock, velocity, movements, reorder, settings. */
export class AdminInventoryModule {
  constructor(private http: HttpClient) {}

  /** Get inventory dashboard overview (stock breakdown, velocity, stockouts). */
  async getDashboard(opts?: RequestOptions): Promise<InventoryDashboard> {
    return this.http.get('/api/admin/inventory/dashboard/', undefined, opts);
  }

  /** Get low stock products with velocity data and severity levels. */
  async getLowStock(params?: LowStockListParams, opts?: RequestOptions): Promise<LowStockListResponse> {
    return this.http.get('/api/admin/inventory/low-stock/', params as Record<string, unknown>, opts);
  }

  /** Get stock velocity for a specific product (sales trend, projected stockout). */
  async getVelocity(params: VelocityParams, opts?: RequestOptions): Promise<VelocityResponse> {
    return this.http.get('/api/admin/inventory/velocity/', params as Record<string, unknown>, opts);
  }

  /** Get stock movement history for a product (paginated, filterable). */
  async getMovements(params: MovementListParams, opts?: RequestOptions): Promise<MovementListResponse> {
    return this.http.get('/api/admin/inventory/movements/', params as Record<string, unknown>, opts);
  }

  /** Get AI-powered reorder suggestions based on velocity analysis. */
  async getReorderSuggestions(params?: ReorderSuggestionParams, opts?: RequestOptions): Promise<ReorderSuggestionListResponse> {
    return this.http.get('/api/admin/inventory/reorder-suggestions/', params as Record<string, unknown>, opts);
  }

  /** Get inventory settings. */
  async getSettings(opts?: RequestOptions): Promise<InventorySettings> {
    return this.http.get('/api/admin/inventory/settings/', undefined, opts);
  }

  /** Update inventory settings (partial). */
  async updateSettings(data: InventorySettingsUpdateInput, opts?: RequestOptions): Promise<InventorySettings> {
    return this.http.patch('/api/admin/inventory/settings/update/', data, opts);
  }
}
