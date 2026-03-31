import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppSettings {
  user_id: number;
  email: string;
  full_name: string;
  store_name: string;
  store_currency: string;
  store_timezone: string;
  language: string;
  notifications: {
    notify_new_orders: boolean;
    notify_low_stock: boolean;
    notify_customer_messages: boolean;
  };
  [key: string]: unknown;
}

export interface AdminLanguage {
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface LanguagesResponse {
  current: string;
  available: AdminLanguage[];
  [key: string]: unknown;
}

export interface AdminDevice {
  id: string;
  device_id: string;
  device_name: string;
  platform: string;
  last_active: string;
  created_at: string;
  [key: string]: unknown;
}

export interface DeviceRegistrationInput {
  device_id: string;
  device_name: string;
  platform?: string;
  push_token?: string;
}

export interface PushTokenUpdateInput {
  push_token: string;
}

export interface NotificationPreferencesInput {
  notify_new_orders?: boolean;
  notify_low_stock?: boolean;
  notify_customer_messages?: boolean;
  [key: string]: unknown;
}

export interface AdminSession {
  device_id: string;
  device_name: string;
  platform: string;
  is_current: boolean;
  last_used_at: string | null;
  last_used_ip: string | null;
  created_at: string;
  [key: string]: unknown;
}

// -- Branding types ---------------------------------------------------------

export interface BusinessAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  [key: string]: unknown;
}

export interface BrandingSettings {
  store_name: string;
  logo_url: string | null;
  primary_color: string;
  invoice_footer_text: string;
  packing_slip_footer_text: string;
  tax_id: string;
  business_address: BusinessAddress;
  business_phone: string;
  business_email: string;
  [key: string]: unknown;
}

export interface BrandingSettingsUpdateInput {
  store_name?: string;
  primary_color?: string;
  invoice_footer_text?: string;
  packing_slip_footer_text?: string;
  tax_id?: string;
  business_address?: Partial<BusinessAddress>;
  business_phone?: string;
  business_email?: string;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin settings: app configuration, devices, push notifications, sessions. */
export class AdminSettingsModule {
  constructor(private http: HttpClient) {}

  /** Get app settings (user, store, notifications). */
  async getSettings(opts?: RequestOptions): Promise<AppSettings> {
    return this.http.get('/api/admin/settings/', undefined, opts);
  }

  /** Get available languages. */
  async getLanguages(opts?: RequestOptions): Promise<LanguagesResponse> {
    return this.http.get('/api/admin/settings/languages/', undefined, opts);
  }

  /** List registered devices. */
  async listDevices(opts?: RequestOptions): Promise<AdminDevice[]> {
    return this.http.get('/api/admin/settings/devices/', undefined, opts);
  }

  /** Register a new device. */
  async registerDevice(data: DeviceRegistrationInput, opts?: RequestOptions): Promise<AdminDevice> {
    return this.http.post('/api/admin/settings/devices/register/', data, opts);
  }

  /** Unregister a device. */
  async unregisterDevice(deviceId: string, opts?: RequestOptions): Promise<void> {
    return this.http.delete(`/api/admin/settings/devices/${deviceId}/`, opts);
  }

  /** Update push notification token. */
  async updatePushToken(data: PushTokenUpdateInput, opts?: RequestOptions): Promise<AdminDevice> {
    return this.http.post('/api/admin/settings/push-token/', data, opts);
  }

  /** Update notification preferences. */
  async updateNotifications(data: NotificationPreferencesInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/admin/settings/notifications/', data, opts);
  }

  /** Get active sessions. */
  async getSessions(opts?: RequestOptions): Promise<AdminSession[]> {
    return this.http.get('/api/admin/settings/sessions/', undefined, opts);
  }

  /** Revoke a session by device ID. */
  async revokeSession(deviceId: string, opts?: RequestOptions): Promise<void> {
    await this.http.post(`/api/admin/settings/sessions/${deviceId}/revoke/`, undefined, opts);
  }

  // -- Branding -------------------------------------------------------------

  /** Get store branding settings. */
  async getBranding(opts?: RequestOptions): Promise<BrandingSettings> {
    return this.http.get('/api/admin/settings/branding/', undefined, opts);
  }

  /** Update store branding settings. */
  async updateBranding(data: BrandingSettingsUpdateInput, opts?: RequestOptions): Promise<BrandingSettings> {
    return this.http.patch('/api/admin/settings/branding/update/', data, opts);
  }

  /** Upload a new store logo. Pass a FormData with an 'image' field. */
  async uploadLogo(formData: FormData, opts?: RequestOptions): Promise<{ logo_url: string }> {
    return this.http.post('/api/admin/settings/branding/logo/', formData, opts);
  }
}
