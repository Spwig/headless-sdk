import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminBrand {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface BrandCreateInput {
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface BrandUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface BulkBrandCreateInput {
  brands: BrandCreateInput[];
}

export interface AdminBrandListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: 'true' | 'false' | 'all';
  sort?: 'name' | '-name' | 'created_at' | '-created_at';
}

/** Brand list response with custom admin pagination. */
export interface BrandListResponse {
  brands: AdminBrand[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin brand management: CRUD operations. */
export class AdminBrandsModule {
  constructor(private http: HttpClient) {}

  /** List brands with filtering and pagination. */
  async list(params?: AdminBrandListParams, opts?: RequestOptions): Promise<BrandListResponse> {
    return this.http.get('/api/admin/brands/', params as Record<string, unknown>, opts);
  }

  /** Create a new brand. */
  async create(data: BrandCreateInput, opts?: RequestOptions): Promise<AdminBrand> {
    return this.http.post('/api/admin/brands/create/', data, opts);
  }

  /** Bulk create brands. */
  async bulkCreate(data: BulkBrandCreateInput, opts?: RequestOptions): Promise<unknown> {
    return this.http.post('/api/admin/brands/bulk/', data, opts);
  }

  /** Get brand details. */
  async get(brandId: number, opts?: RequestOptions): Promise<AdminBrand> {
    return this.http.get(`/api/admin/brands/${brandId}/`, undefined, opts);
  }

  /** Update a brand. */
  async update(brandId: number, data: BrandUpdateInput, opts?: RequestOptions): Promise<AdminBrand> {
    return this.http.put(`/api/admin/brands/${brandId}/update/`, data, opts);
  }

  /** Delete a brand. */
  async delete(brandId: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/brands/${brandId}/delete/`, opts);
  }
}
