import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface AddressSuggestion {
  text: string;
  place_id: string;
  description: string;
  components: Record<string, unknown>;
  confidence: number;
  [key: string]: unknown;
}

export interface NormalizedAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

export interface AddressValidation {
  valid: boolean;
  enhanced: NormalizedAddress | null;
  errors: string[];
}

export interface AddressInput {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  [key: string]: unknown;
}

/**
 * Address Service API: autocomplete, normalization, validation, and geocoding.
 *
 * ⚠️ Uncontracted: these endpoints (`/api/address/*`) are not part of the
 * versioned `api-schema.yml` — they proxy Spwig's external address service and
 * are treated as internal/best-effort, so responses are untyped and may change
 * without a contract bump. Fine for the built-in checkout flow; if you depend
 * on them in a custom frontend, pin your SDK version.
 */
export class AddressServiceModule {
  constructor(private http: HttpClient) {}

  /** Get address autocomplete suggestions for a query. */
  async autocomplete(query: string, params?: { country?: string; lat?: number; lon?: number; limit?: number }, opts?: RequestOptions): Promise<{ suggestions: AddressSuggestion[] }> {
    return this.http.get('/api/address/autocomplete/', { q: query, ...params }, opts);
  }

  /** Normalize an address to a standard format. */
  async normalize(address: string, opts?: RequestOptions): Promise<NormalizedAddress> {
    return this.http.post('/api/address/normalize/', { address }, opts);
  }

  /** Validate an address and return issues if any. */
  async validate(data: AddressInput, opts?: RequestOptions): Promise<AddressValidation> {
    return this.http.get('/api/address/validate/', data as Record<string, unknown>, opts);
  }

  /** Enhance an address with additional data. Requires authentication. */
  async enhance(data: { address: AddressInput }, opts?: RequestOptions): Promise<{ enhanced: NormalizedAddress }> {
    return this.http.post('/api/address/enhance/', data, opts);
  }

  /** Reverse geocode coordinates to an address. */
  async reverseGeocode(lat: number, lon: number, opts?: RequestOptions): Promise<NormalizedAddress> {
    return this.http.get('/api/address/reverse/', { lat, lon }, opts);
  }

  /** Check the address service health status. */
  async health(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/address/health/', undefined, opts);
  }
}
