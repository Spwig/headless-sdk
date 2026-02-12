import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface CustomerProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  dashboard_layout: string;
  show_order_history: boolean;
  show_wishlist: boolean;
  show_recent_products: boolean;
  show_recommendations: boolean;
  newsletter_subscribed: boolean;
  marketing_emails: boolean;
  order_notifications: boolean;
  lifetime_value: string;
  total_spent: string;
  total_orders: number;
  completed_orders_count: number;
  average_order_value: string;
  days_since_last_order: number | null;
  is_vip_customer: boolean;
  is_at_risk: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  newsletter_subscribed?: boolean;
  marketing_emails?: boolean;
  order_notifications?: boolean;
}

export interface DashboardPreferences {
  dashboard_layout: string;
  show_order_history: boolean;
  show_wishlist: boolean;
  show_recent_products: boolean;
  show_recommendations: boolean;
}

export interface CustomerAddress {
  id: number;
  address_type: 'shipping' | 'billing' | 'both';
  name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  address_type?: 'shipping' | 'billing' | 'both';
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

export interface NotificationPreferences {
  [key: string]: boolean;
}

/** Customer account API: profile, addresses, preferences. */
export class AccountModule {
  constructor(private http: HttpClient) {}

  /** Get the current customer's profile. Requires authentication. */
  async getProfile(opts?: RequestOptions): Promise<CustomerProfile> {
    return this.http.get('/api/accounts/api/profile/', undefined, opts);
  }

  /** Update the current customer's profile. */
  async updateProfile(data: UpdateProfileInput, opts?: RequestOptions): Promise<CustomerProfile> {
    return this.http.patch('/api/accounts/api/profile/update/', data, opts);
  }

  /** Update dashboard display preferences. */
  async updatePreferences(data: Partial<DashboardPreferences>, opts?: RequestOptions): Promise<DashboardPreferences> {
    return this.http.patch('/api/accounts/api/preferences/', data, opts);
  }

  /** Recalculate customer metrics (lifetime value, etc.). */
  async refreshMetrics(opts?: RequestOptions): Promise<CustomerProfile> {
    return this.http.post('/api/accounts/api/refresh-metrics/', undefined, opts);
  }

  /** Get or update notification preferences. */
  async getNotificationPreferences(opts?: RequestOptions): Promise<NotificationPreferences> {
    return this.http.get('/api/accounts/api/notifications/', undefined, opts);
  }

  /** Update notification preferences. */
  async updateNotificationPreferences(data: NotificationPreferences, opts?: RequestOptions): Promise<NotificationPreferences> {
    return this.http.patch('/api/accounts/api/notifications/', data, opts);
  }

  // --- Address management ---

  /** List all saved addresses. */
  async listAddresses(opts?: RequestOptions): Promise<CustomerAddress[]> {
    return this.http.get('/api/accounts/api/addresses/', undefined, opts);
  }

  /** Create a new address. */
  async createAddress(data: CreateAddressInput, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.post('/api/accounts/api/addresses/', data, opts);
  }

  /** Get an address by ID. */
  async getAddress(id: number, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.get(`/api/accounts/api/addresses/${id}/`, undefined, opts);
  }

  /** Update an address. */
  async updateAddress(id: number, data: Partial<CreateAddressInput>, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.patch(`/api/accounts/api/addresses/${id}/`, data, opts);
  }

  /** Delete an address. */
  async deleteAddress(id: number, opts?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/accounts/api/addresses/${id}/`, opts);
  }

  /** Set an address as the default. */
  async setDefaultAddress(id: number, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.post(`/api/accounts/api/addresses/${id}/set-default/`, undefined, opts);
  }
}
