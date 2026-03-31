import type { HttpClient } from '../../utils/fetch.js';
import type { PaginationParams, RequestOptions } from '../../utils/types.js';

/** POS stock item. */
export interface PosStockItem {
  product_id: number;
  product_name: string;
  sku: string;
  variant_id: number | null;
  variant_name: string | null;
  on_hand: number;
  allocated: number;
  available: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  image: string | null;
  has_stock_item: boolean;
  product_type: string;
}

/** Cross-location stock (for checking other warehouses). */
export interface PosCrossLocationStock {
  warehouse_id: number;
  warehouse_name: string;
  is_current: boolean;
  on_hand: number;
  allocated: number;
  available: number;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  region_name: string | null;
  same_region: boolean;
  distance_km: number | null;
}

/** POS stock adjustment input. */
export interface PosStockAdjustmentInput {
  product_id: number;
  variant_id?: number;
  adjustment_type: 'receive' | 'damage' | 'recount' | 'return';
  quantity: number;
  reason: string;
  idempotency_key?: string;
}

/** POS stock movement record. */
export interface PosStockMovement {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  variant_id: number | null;
  variant_name: string | null;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  user_name: string;
  created_at: string;
}

/** POS Inventory API: stock levels, adjustments, movements, cross-location lookup. */
export class PosInventoryModule {
  constructor(private http: HttpClient) {}

  /** List stock levels for all products at the current location. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PosStockItem[]> {
    return this.http.get('/api/pos/inventory/', params as Record<string, unknown>, opts);
  }

  /** Get stock level for a specific product. */
  async get(productId: number, opts?: RequestOptions): Promise<PosStockItem> {
    return this.http.get(`/api/pos/inventory/${productId}/`, undefined, opts);
  }

  /** Get stock across all warehouse locations for a product. */
  async getAllLocations(productId: number, opts?: RequestOptions): Promise<PosCrossLocationStock[]> {
    return this.http.get(`/api/pos/inventory/${productId}/all-locations/`, undefined, opts);
  }

  /** Adjust stock (receive, damage, recount, return). */
  async adjust(data: PosStockAdjustmentInput, opts?: RequestOptions): Promise<PosStockItem> {
    return this.http.post('/api/pos/inventory/adjust/', data, opts);
  }

  /** List stock movement history. */
  async getMovements(params?: PaginationParams & { product_id?: number }, opts?: RequestOptions): Promise<PosStockMovement[]> {
    return this.http.get('/api/pos/inventory/movements/', params as Record<string, unknown>, opts);
  }
}
