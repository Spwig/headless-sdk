import type { HttpClient } from '../../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../../utils/types.js';

/** Menu (list view). */
export interface AdminMenu {
  id: number;
  name: string;
  slug: string;
  description: string;
  location: string;
  location_display: string;
  display_type: string;
  display_type_display: string;
  is_active: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
}

/** Menu (detail view with item tree). */
export interface AdminMenuDetail extends AdminMenu {
  custom_css: string | null;
  css_classes: string | null;
  global_style: Record<string, unknown> | null;
  mobile_config: Record<string, unknown> | null;
  translations: Record<string, unknown> | null;
  items_tree: AdminMenuItem[];
}

/** Menu item with nested children. */
export interface AdminMenuItem {
  id: number;
  menu: number;
  parent: number | null;
  item_type: string;
  title: string;
  url: string | null;
  resolved_url: string | null;
  resolved_title: string | null;
  page_reference: number | null;
  category_reference: number | null;
  target: string;
  icon: string | null;
  badge_text: string | null;
  badge_color: string | null;
  style_config: Record<string, unknown> | null;
  widget_config: Record<string, unknown> | null;
  tree_config: Record<string, unknown> | null;
  mega_menu_content: Record<string, unknown> | null;
  visibility_rules: Record<string, unknown> | null;
  translations: Record<string, unknown> | null;
  order: number;
  is_active: boolean;
  css_classes: string | null;
  has_children: boolean;
  children: AdminMenuItem[];
  [key: string]: unknown;
}

/** Menu creation/update input. */
export interface MenuInput {
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  display_type?: string;
  custom_css?: string;
  css_classes?: string;
  global_style?: Record<string, unknown>;
  mobile_config?: Record<string, unknown>;
  translations?: Record<string, unknown>;
  is_active?: boolean;
}

/** Menu item creation/update input. */
export interface MenuItemInput {
  menu: number;
  parent?: number | null;
  item_type: string;
  title: string;
  url?: string;
  page_reference?: number;
  category_reference?: number;
  target?: string;
  icon?: string;
  badge_text?: string;
  badge_color?: string;
  style_config?: Record<string, unknown>;
  widget_config?: Record<string, unknown>;
  tree_config?: Record<string, unknown>;
  mega_menu_content?: Record<string, unknown>;
  visibility_rules?: Record<string, unknown>;
  translations?: Record<string, unknown>;
  order?: number;
  is_active?: boolean;
  css_classes?: string;
}

/** Menu item reorder entry. */
export interface MenuItemReorderEntry {
  id: number;
  order: number;
  parent_id?: number | null;
}

/** Quick-add source for creating menu items. */
export interface MenuSource {
  type: string;
  label: string;
  items: Array<{ id: number; title: string; url: string }>;
}

/** Admin Menus API: CRUD menus, manage items, reorder, preview. */
export class AdminMenusModule {
  constructor(private http: HttpClient) {}

  /** List all menus. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<AdminMenu>> {
    return this.http.get('/api/menu/', params as Record<string, unknown>, opts);
  }

  /** Get a menu with its full item tree. */
  async get(id: number, opts?: RequestOptions): Promise<AdminMenuDetail> {
    return this.http.get(`/api/menu/${id}/`, undefined, opts);
  }

  /** Create a new menu. */
  async create(data: MenuInput, opts?: RequestOptions): Promise<AdminMenuDetail> {
    return this.http.post('/api/menu/', data, opts);
  }

  /** Update a menu. */
  async update(id: number, data: Partial<MenuInput>, opts?: RequestOptions): Promise<AdminMenuDetail> {
    return this.http.put(`/api/menu/${id}/`, data, opts);
  }

  /** Delete a menu. */
  async delete(id: number, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/menu/${id}/`, opts);
  }

  /** Preview a menu as it would render on the storefront. */
  async preview(id: number, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get(`/api/menu/${id}/preview/`, undefined, opts);
  }

  /** Save the full menu item structure (batch). */
  async saveStructure(id: number, data: Record<string, unknown>, opts?: RequestOptions): Promise<void> {
    return this.http.post(`/api/menu/${id}/save-structure/`, data, opts);
  }

  /** Menu item management. */
  readonly items = {
    /** List menu items (flat, all menus). */
    list: (params?: PaginationParams & { menu?: number }, opts?: RequestOptions): Promise<PaginatedResponse<AdminMenuItem>> =>
      this.http.get('/api/menu/items/', params as Record<string, unknown>, opts),

    /** Get a menu item by ID. */
    get: (id: number, opts?: RequestOptions): Promise<AdminMenuItem> =>
      this.http.get(`/api/menu/items/${id}/`, undefined, opts),

    /** Create a menu item. */
    create: (data: MenuItemInput, opts?: RequestOptions): Promise<AdminMenuItem> =>
      this.http.post('/api/menu/items/', data, opts),

    /** Update a menu item. */
    update: (id: number, data: Partial<MenuItemInput>, opts?: RequestOptions): Promise<AdminMenuItem> =>
      this.http.put(`/api/menu/items/${id}/`, data, opts),

    /** Delete a menu item. */
    delete: (id: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/menu/items/${id}/`, opts),

    /** Reorder menu items (supports parent changes for drag-and-drop). */
    reorder: (items: MenuItemReorderEntry[], opts?: RequestOptions): Promise<void> =>
      this.http.post('/api/menu/items/reorder/', { items }, opts),
  };

  /** Get quick-add sources (pages, categories, etc.). */
  async getSources(opts?: RequestOptions): Promise<MenuSource[]> {
    return this.http.get('/api/menu/sources/', undefined, opts);
  }

  /** Get menu design tokens (for theming). */
  async getTokens(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/menu/tokens/', undefined, opts);
  }
}
