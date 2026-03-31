import type { HttpClient } from '../../utils/fetch.js';
import type { BlobResponse, PaginatedResponse, PaginationParams, RequestOptions } from '../../utils/types.js';

/** Carrier preset (admin view). */
export interface AdminCarrier {
  id: number;
  name: string;
  slug: string;
  tracking_url_template: string | null;
  logo: string | null;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
}

/** Carrier creation/update input. */
export interface CarrierInput {
  name: string;
  slug?: string;
  tracking_url_template?: string;
  logo?: string;
  is_active?: boolean;
  is_default?: boolean;
}

/** Shipment (admin view). */
export interface AdminShipment {
  id: number;
  order: number;
  user: number | null;
  status: string;
  tracking_id: string | null;
  tracking_url: string | null;
  label_url: string | null;
  carrier_preset: number | null;
  carrier_name: string | null;
  provider_account: number | null;
  provider_name: string | null;
  origin_country: string;
  dest_country: string;
  service_level: string | null;
  packages: Record<string, unknown> | null;
  shipping_cost: string;
  carrier_cost: string;
  pricing_mode_used: string | null;
  is_manual: boolean;
  is_api: boolean;
  tracking_events: AdminTrackingEvent[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** Shipment creation input. */
export interface ShipmentCreateInput {
  order: number;
  carrier_preset?: number;
  provider_account?: number;
  tracking_id?: string;
  origin_country?: string;
  dest_country?: string;
  service_level?: string;
  packages?: Record<string, unknown>;
}

/** Tracking event (admin view). */
export interface AdminTrackingEvent {
  id: number;
  occurred_at: string;
  status: string;
  location: string;
  description: string;
  created_at: string;
}

/** Shipping provider account. */
export interface ProviderAccount {
  id: number;
  component: number;
  component_name: string;
  provider_type: string;
  display_name: string;
  is_active: boolean;
  is_default: boolean;
  connection_status: string;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Provider account creation input. */
export interface ProviderAccountCreateInput {
  component: number;
  display_name: string;
  is_active?: boolean;
  is_default?: boolean;
  credentials: Record<string, unknown>;
}

export interface AdminShipmentListParams extends PaginationParams {
  order_id?: number;
  status?: string;
}

/** Admin Shipping API: carriers, shipments, providers, tracking, documents. */
export class AdminShippingModule {
  constructor(private http: HttpClient) {}

  /** Carrier management. */
  readonly carriers = {
    /** List all carriers. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<AdminCarrier>> =>
      this.http.get('/api/shipping/carriers/', params as Record<string, unknown>, opts),

    /** Get a carrier by ID. */
    get: (id: number, opts?: RequestOptions): Promise<AdminCarrier> =>
      this.http.get(`/api/shipping/carriers/${id}/`, undefined, opts),

    /** Create a carrier. */
    create: (data: CarrierInput, opts?: RequestOptions): Promise<AdminCarrier> =>
      this.http.post('/api/shipping/carriers/', data, opts),

    /** Update a carrier. */
    update: (id: number, data: Partial<CarrierInput>, opts?: RequestOptions): Promise<AdminCarrier> =>
      this.http.put(`/api/shipping/carriers/${id}/`, data, opts),

    /** Delete a carrier. */
    delete: (id: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/shipping/carriers/${id}/`, opts),
  };

  /** Shipment management. */
  readonly shipments = {
    /** List shipments. */
    list: (params?: AdminShipmentListParams, opts?: RequestOptions): Promise<PaginatedResponse<AdminShipment>> =>
      this.http.get('/api/shipping/shipments/', params as Record<string, unknown>, opts),

    /** Get a shipment by ID. */
    get: (id: number, opts?: RequestOptions): Promise<AdminShipment> =>
      this.http.get(`/api/shipping/shipments/${id}/`, undefined, opts),

    /** Create a new shipment. */
    create: (data: ShipmentCreateInput, opts?: RequestOptions): Promise<AdminShipment> =>
      this.http.post('/api/shipping/shipments/', data, opts),

    /** Update a shipment. */
    update: (id: number, data: Partial<ShipmentCreateInput>, opts?: RequestOptions): Promise<AdminShipment> =>
      this.http.put(`/api/shipping/shipments/${id}/`, data, opts),

    /** Get tracking events for a shipment. */
    getTracking: (id: number, opts?: RequestOptions): Promise<AdminTrackingEvent[]> =>
      this.http.get(`/api/shipping/shipments/${id}/tracking/`, undefined, opts),

    /** Download packing slip PDF. */
    getPackingSlip: (id: number, opts?: RequestOptions): Promise<BlobResponse> =>
      this.http.fetchBlob(`/api/shipping/shipments/${id}/documents/packing-slip/`, undefined, undefined, 'GET', opts),

    /** Download commercial invoice PDF. */
    getCommercialInvoice: (id: number, opts?: RequestOptions): Promise<BlobResponse> =>
      this.http.fetchBlob(`/api/shipping/shipments/${id}/documents/commercial-invoice/`, undefined, undefined, 'GET', opts),

    /** Download customs form PDF. */
    getCustomsForm: (id: number, opts?: RequestOptions): Promise<BlobResponse> =>
      this.http.fetchBlob(`/api/shipping/shipments/${id}/documents/customs-form/`, undefined, undefined, 'GET', opts),
  };

  /** Provider account management. */
  readonly providers = {
    /** List shipping provider accounts. */
    list: (opts?: RequestOptions): Promise<ProviderAccount[]> =>
      this.http.get('/api/shipping/providers/', undefined, opts),

    /** Create a provider account. */
    create: (data: ProviderAccountCreateInput, opts?: RequestOptions): Promise<ProviderAccount> =>
      this.http.post('/api/shipping/providers/', data, opts),

    /** Test connection to a provider. */
    testConnection: (id: number, opts?: RequestOptions): Promise<{ success: boolean; message?: string }> =>
      this.http.post(`/api/shipping/providers/${id}/test_connection/`, undefined, opts),
  };
}
