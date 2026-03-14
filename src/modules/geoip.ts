import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface GeoLocation {
  ip: string;
  country: string;
  country_name: string;
  region: string;
  region_name: string;
  city: string;
  postal_code: string;
  lat: number;
  lon: number;
  currency: string;
  language: string;
  timezone: string;
  is_eu: boolean;
  [key: string]: unknown;
}

export interface GeoPreference {
  currency?: string;
  language?: string;
  country?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  language: string;
  is_eu: boolean;
  [key: string]: unknown;
}

export interface CurrencySuggestion {
  default: string;
  accepted: string[];
  symbol: string;
}

export interface LanguageSuggestion {
  default: string;
  supported: string[];
}

/** GeoIP API: location resolution, preferences, and suggestions. */
export class GeoipModule {
  constructor(private http: HttpClient) {}

  /** Resolve the current visitor's geographic location. */
  async resolve(opts?: RequestOptions): Promise<GeoLocation> {
    return this.http.get('/api/geoip/v1/resolve/', undefined, opts);
  }

  /** Set geographic preference for the session. */
  async setPreference(data: GeoPreference, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/geoip/v1/preference/', data, opts);
  }

  /** Get a currency suggestion based on the visitor's location. */
  async suggestCurrency(opts?: RequestOptions): Promise<CurrencySuggestion> {
    return this.http.get('/api/geoip/v1/suggest/currency/', undefined, opts);
  }

  /** Get a language suggestion based on the visitor's location. */
  async suggestLanguage(opts?: RequestOptions): Promise<LanguageSuggestion> {
    return this.http.get('/api/geoip/v1/suggest/language/', undefined, opts);
  }

  /** List all available countries. */
  async listCountries(opts?: RequestOptions): Promise<Country[]> {
    return this.http.get('/api/geoip/v1/countries/', undefined, opts);
  }

  /** Report a location correction. */
  async reportCorrection(data: { actual_country?: string; actual_city?: string; actual_region?: string; feedback?: string }, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/geoip/v1/report/', data, opts);
  }
}
