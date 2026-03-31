import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

/** Shipping carrier preset. */
export interface Carrier {
  id: number;
  name: string;
  slug: string;
  tracking_url_template: string | null;
  logo: string | null;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
}

/** Tracking event for a shipment. */
export interface TrackingEvent {
  id: number;
  occurred_at: string;
  status: string;
  location: string;
  description: string;
  created_at: string;
}

/** Shipment details. */
export interface Shipment {
  id: number;
  order: number;
  status: string;
  tracking_id: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  provider_name: string | null;
  origin_country: string;
  dest_country: string;
  service_level: string | null;
  shipping_cost: string;
  tracking_events: TrackingEvent[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ShipmentListParams extends PaginationParams {
  order_id?: number;
  status?: string;
}

/** Shipping & Tracking API: track shipments, view carriers, get tracking events. */
export class ShippingModule {
  constructor(private http: HttpClient) {}

  /** List shipments for the current customer. Requires authentication. */
  async list(params?: ShipmentListParams, opts?: RequestOptions): Promise<PaginatedResponse<Shipment>> {
    return this.http.get('/api/shipping/shipments/', params as Record<string, unknown>, opts);
  }

  /** Get a specific shipment by ID. Requires authentication. */
  async get(id: number, opts?: RequestOptions): Promise<Shipment> {
    return this.http.get(`/api/shipping/shipments/${id}/`, undefined, opts);
  }

  /** Get shipments for a specific order. Requires authentication. */
  async getByOrder(orderId: number, opts?: RequestOptions): Promise<Shipment[]> {
    return this.http.get('/api/shipping/shipments/by_order/', { order_id: orderId } as Record<string, unknown>, opts);
  }

  /** Get tracking events for a shipment. Requires authentication. */
  async getTracking(shipmentId: number, opts?: RequestOptions): Promise<TrackingEvent[]> {
    return this.http.get(`/api/shipping/shipments/${shipmentId}/tracking/`, undefined, opts);
  }

  /** List available shipping carriers. */
  async getCarriers(opts?: RequestOptions): Promise<Carrier[]> {
    return this.http.get('/api/shipping/carriers/', undefined, opts);
  }

  /** Get a specific carrier by ID. */
  async getCarrier(id: number, opts?: RequestOptions): Promise<Carrier> {
    return this.http.get(`/api/shipping/carriers/${id}/`, undefined, opts);
  }

  /** List tracking events with optional filtering. */
  async getTrackingEvents(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<TrackingEvent>> {
    return this.http.get('/api/shipping/tracking-events/', params as Record<string, unknown>, opts);
  }
}
