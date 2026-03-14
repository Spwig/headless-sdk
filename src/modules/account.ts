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
  email_marketing: boolean;
  email_transactional: boolean;
  newsletter_enabled: boolean;
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
  dashboard_layout?: string;
  show_order_history?: boolean;
  show_wishlist?: boolean;
  show_recent_products?: boolean;
  show_recommendations?: boolean;
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

export interface CommunicationPreference {
  email_enabled: boolean;
  sms_enabled: boolean;
  email_transactional: boolean;
  email_marketing: boolean;
  email_verified: boolean;
  email_verified_at: string | null;
  sms_transactional: boolean;
  sms_marketing: boolean;
  sms_verified: boolean;
  sms_verified_at: string | null;
  app_preferences: Record<string, unknown>;
  email_categories: Record<string, unknown>;
  available_frequencies: Record<string, unknown>;
  language_code: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface CommunicationPreferenceUpdate {
  channel: 'email' | 'sms';
  message_type: string;
  enabled: boolean;
  frequency?: string | null;
}

/** Customer account API: profile, addresses, preferences, GDPR. */
export class AccountModule {
  constructor(private http: HttpClient) {}

  /** Get the current customer's profile. Requires authentication. */
  async getProfile(opts?: RequestOptions): Promise<CustomerProfile> {
    return this.http.get('/api/accounts/profile/', undefined, opts);
  }

  /** Update the current customer's profile. */
  async updateProfile(data: UpdateProfileInput, opts?: RequestOptions): Promise<CustomerProfile> {
    return this.http.put('/api/accounts/profile/update/', data, opts);
  }

  /** Update dashboard display preferences. */
  async updatePreferences(data: Partial<DashboardPreferences>, opts?: RequestOptions): Promise<DashboardPreferences> {
    return this.http.put('/api/accounts/preferences/', data, opts);
  }

  /** Recalculate customer metrics (lifetime value, etc.). */
  async refreshMetrics(opts?: RequestOptions): Promise<CustomerProfile> {
    return this.http.post('/api/accounts/refresh-metrics/', undefined, opts);
  }

  // --- Address management ---

  /** List all saved addresses. */
  async listAddresses(opts?: RequestOptions): Promise<CustomerAddress[]> {
    return this.http.get('/api/accounts/addresses/', undefined, opts);
  }

  /** Create a new address. */
  async createAddress(data: CreateAddressInput, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.post('/api/accounts/addresses/', data, opts);
  }

  /** Get an address by ID. */
  async getAddress(id: number, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.get(`/api/accounts/addresses/${id}/`, undefined, opts);
  }

  /** Update an address. */
  async updateAddress(id: number, data: Partial<CreateAddressInput>, opts?: RequestOptions): Promise<CustomerAddress> {
    return this.http.patch(`/api/accounts/addresses/${id}/`, data, opts);
  }

  /** Delete an address. */
  async deleteAddress(id: number, opts?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/accounts/addresses/${id}/`, opts);
  }

  // --- Communication preferences ---

  /** Get all communication preferences. */
  async getCommunicationPreferences(opts?: RequestOptions): Promise<CommunicationPreference> {
    return this.http.get('/api/accounts/communication-preferences/', undefined, opts);
  }

  /** Update a single communication preference. */
  async updateCommunicationPreference(data: CommunicationPreferenceUpdate, opts?: RequestOptions): Promise<CommunicationPreference> {
    return this.http.put('/api/accounts/communication-preferences/update/', data, opts);
  }

  /** Bulk update multiple communication preferences. */
  async bulkUpdateCommunicationPreferences(data: CommunicationPreferenceUpdate[], opts?: RequestOptions): Promise<CommunicationPreference> {
    return this.http.patch('/api/accounts/communication-preferences/bulk-update/', { updates: data }, opts);
  }

  /** Unsubscribe from all communications (one-click unsubscribe). */
  async unsubscribeAll(opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/accounts/communication-preferences/unsubscribe-all/', undefined, opts);
  }

  // --- GDPR ---

  /** Export all user preferences and data (GDPR Article 15 compliance). */
  async exportPreferences(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/accounts/preferences/export/', undefined, opts);
  }
}
