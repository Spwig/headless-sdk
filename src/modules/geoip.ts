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

/** Options for geoip.resolve() — includes optional page tracking. */
export interface ResolveOptions extends RequestOptions {
  /**
   * Optional URL/path of the page being viewed. When provided, the backend
   * will record a `PageView` for this visitor and update their `VisitorLocation`
   * profile (UTM attribution, device, page count). This is the headless
   * equivalent of Spwig's middleware-based page view tracking and feeds the
   * admin shop dashboard's visitor analytics, traffic sources, and funnel.
   *
   * Pass the current pathname (e.g. `/products/vc-serum`) — the backend
   * normalizes locale prefixes and strips query strings.
   */
  page?: string;
}

/** GeoIP API: location resolution, preferences, and suggestions. */
export class GeoipModule {
  constructor(private http: HttpClient) {}

  /**
   * Resolve the current visitor's geographic location.
   *
   * Pass `{ page: pathname }` to also track this as a page view in Spwig's
   * built-in analytics — no extra endpoint call needed.
   *
   * @example
   * // Just resolve location
   * const geo = await spwig.geoip.resolve();
   *
   * @example
   * // Resolve location AND track this page view
   * await spwig.geoip.resolve({ page: '/products/vc-serum' });
   */
  async resolve(opts?: ResolveOptions): Promise<GeoLocation> {
    const { page, ...rest } = opts ?? {};
    const params = page ? { page } : undefined;
    return this.http.get('/api/geoip/v1/resolve/', params, rest);
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
