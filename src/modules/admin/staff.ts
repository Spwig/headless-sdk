import type { HttpClient } from '../../utils/fetch.js';
import type { AdminPagination, RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffGroup {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface StaffPermissionsSummary {
  total_permissions: number;
  modules: string[];
  [key: string]: unknown;
}

export interface StaffMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_owner: boolean;
  last_login: string | null;
  date_joined: string;
  groups: StaffGroup[];
  permissions_summary: StaffPermissionsSummary;
  [key: string]: unknown;
}

export interface StaffMemberDetail extends StaffMember {
  permissions: Record<string, string>;
  [key: string]: unknown;
}

export interface StaffListResponse {
  staff: StaffMember[];
  pagination: AdminPagination;
  [key: string]: unknown;
}

export interface StaffListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role_id?: number;
  is_active?: boolean;
  ordering?: string;
}

export interface StaffInviteInput {
  email: string;
  first_name: string;
  last_name: string;
  group_ids: number[];
}

export interface StaffUpdateInput {
  group_ids?: number[];
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin staff management: list, invite, update, and delete staff members. */
export class AdminStaffModule {
  constructor(private http: HttpClient) {}

  /** List staff members with filtering and pagination. */
  async list(params?: StaffListParams, opts?: RequestOptions): Promise<StaffListResponse> {
    return this.http.get('/api/admin/staff/', params as Record<string, unknown>, opts);
  }

  /** Invite a new staff member by email. */
  async invite(data: StaffInviteInput, opts?: RequestOptions): Promise<StaffMemberDetail> {
    return this.http.post('/api/admin/staff/invite/', data, opts);
  }

  /** Update a staff member's roles, status, or name. */
  async update(staffId: number, data: StaffUpdateInput, opts?: RequestOptions): Promise<StaffMemberDetail> {
    return this.http.patch(`/api/admin/staff/${staffId}/`, data, opts);
  }

  /** Delete (deactivate) a staff member and revoke their tokens. */
  async delete(staffId: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/staff/${staffId}/delete/`, opts);
  }
}
