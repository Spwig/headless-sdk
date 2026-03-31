import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffRole {
  id: number;
  name: string;
  is_built_in: boolean;
  staff_count: number;
  permissions: Record<string, string>;
  description: string;
  [key: string]: unknown;
}

export interface RoleCreateInput {
  name: string;
  description?: string;
  permissions: Record<string, string>;
}

export interface RoleUpdateInput {
  name?: string;
  description?: string;
  permissions?: Record<string, string>;
}

export interface PermissionCategory {
  key: string;
  display_name: string;
  description: string;
  access_levels: string[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin role & permission management: CRUD roles, list permission categories. */
export class AdminRolesModule {
  constructor(private http: HttpClient) {}

  /** List all staff roles. */
  async list(opts?: RequestOptions): Promise<StaffRole[]> {
    return this.http.get('/api/admin/roles/', undefined, opts);
  }

  /** Create a custom role with permissions. */
  async create(data: RoleCreateInput, opts?: RequestOptions): Promise<StaffRole> {
    return this.http.post('/api/admin/roles/create/', data, opts);
  }

  /** Update a custom role. */
  async update(roleId: number, data: RoleUpdateInput, opts?: RequestOptions): Promise<StaffRole> {
    return this.http.patch(`/api/admin/roles/${roleId}/`, data, opts);
  }

  /** Delete a custom role. */
  async delete(roleId: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/roles/${roleId}/delete/`, opts);
  }

  /** List all available permission categories and their access levels. */
  async listPermissions(opts?: RequestOptions): Promise<PermissionCategory[]> {
    return this.http.get('/api/admin/permissions/', undefined, opts);
  }
}
