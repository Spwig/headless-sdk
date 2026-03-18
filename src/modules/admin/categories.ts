import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent_id: number | null;
  image_url: string | null;
  banner_url: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface CategoryCreateInput {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface CategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface BulkCategoryCreateInput {
  categories: CategoryCreateInput[];
}

export interface AdminCategoryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  parent_id?: number;
  is_active?: 'true' | 'false' | 'all';
  sort?: 'sort_order' | 'name' | '-name' | 'created_at' | '-created_at';
}

/** Category list response with custom admin pagination. */
export interface CategoryListResponse {
  categories: AdminCategory[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin category management: CRUD, images, banners. */
export class AdminCategoriesModule {
  constructor(private http: HttpClient) {}

  /** List categories with filtering and pagination. */
  async list(params?: AdminCategoryListParams, opts?: RequestOptions): Promise<CategoryListResponse> {
    return this.http.get('/api/admin/categories/', params as Record<string, unknown>, opts);
  }

  /** Create a new category. */
  async create(data: CategoryCreateInput, opts?: RequestOptions): Promise<AdminCategory> {
    return this.http.post('/api/admin/categories/create/', data, opts);
  }

  /** Bulk create categories. */
  async bulkCreate(data: BulkCategoryCreateInput, opts?: RequestOptions): Promise<unknown> {
    return this.http.post('/api/admin/categories/bulk/', data, opts);
  }

  /** Get category details. */
  async get(categoryId: number, opts?: RequestOptions): Promise<AdminCategory> {
    return this.http.get(`/api/admin/categories/${categoryId}/`, undefined, opts);
  }

  /** Update a category. */
  async update(categoryId: number, data: CategoryUpdateInput, opts?: RequestOptions): Promise<AdminCategory> {
    return this.http.put(`/api/admin/categories/${categoryId}/update/`, data, opts);
  }

  /** Delete a category. */
  async delete(categoryId: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/categories/${categoryId}/delete/`, opts);
  }

  /** Upload category image. Accepts FormData with image file. */
  async uploadImage(categoryId: number, formData: FormData, opts?: RequestOptions): Promise<unknown> {
    return this.http.post(`/api/admin/categories/${categoryId}/image/`, formData, opts);
  }

  /** Delete category image. */
  async deleteImage(categoryId: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/categories/${categoryId}/image/delete/`, opts);
  }

  /** Upload category banner. Accepts FormData with image file. */
  async uploadBanner(categoryId: number, formData: FormData, opts?: RequestOptions): Promise<unknown> {
    return this.http.post(`/api/admin/categories/${categoryId}/banner/`, formData, opts);
  }

  /** Delete category banner. */
  async deleteBanner(categoryId: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/categories/${categoryId}/banner/delete/`, opts);
  }
}
