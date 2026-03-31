import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

/** Tax rate configuration. */
export interface TaxRate {
  id: number;
  name: string;
  country: string;
  state: string;
  city: string;
  postal_codes: string;
  rate: string;
  rate_display: string;
  tax_type: string;
  applies_to_shipping: boolean;
  compound: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** Tax preset group (e.g. EU VAT, US Sales Tax). */
export interface TaxPresetGroup {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  tax_type: string;
  region: string;
  is_active: boolean;
  version: string;
  rates_count: number;
  last_updated: string;
  created_at: string;
}

/** Individual rate within a tax preset. */
export interface TaxPresetRate {
  id: number;
  country: string;
  country_name: string;
  state: string;
  state_name: string;
  rate: string;
  rate_display: string;
  tax_type: string;
  notes: string;
  is_active: boolean;
}

/** Tax calculation request item. */
export interface TaxCalculationItem {
  product_id: number;
  quantity: number;
  price: string;
}

/** Tax calculation result. */
export interface TaxCalculationResult {
  total_tax: string;
  breakdown: Record<string, unknown>;
}

export interface TaxRateListParams extends PaginationParams {
  country?: string;
  is_active?: boolean;
}

/** Tax API: rates, presets, and tax calculation. */
export class TaxModule {
  constructor(private http: HttpClient) {}

  /** List tax rates. */
  async list(params?: TaxRateListParams, opts?: RequestOptions): Promise<PaginatedResponse<TaxRate>> {
    return this.http.get('/api/tax-rates/', params as Record<string, unknown>, opts);
  }

  /** Get a specific tax rate by ID. */
  async get(id: number, opts?: RequestOptions): Promise<TaxRate> {
    return this.http.get(`/api/tax-rates/${id}/`, undefined, opts);
  }

  /** Calculate tax for a set of items and shipping address. */
  async calculate(
    data: {
      country: string;
      state?: string;
      city?: string;
      postal_code?: string;
      items: TaxCalculationItem[];
      shipping_cost?: string;
    },
    opts?: RequestOptions,
  ): Promise<TaxCalculationResult> {
    return this.http.post('/api/tax-rates/calculate/', data, opts);
  }

  /** Get tax rates grouped by country. */
  async getByCountry(opts?: RequestOptions): Promise<Record<string, TaxRate[]>> {
    return this.http.get('/api/tax-rates/by_country/', undefined, opts);
  }

  /** List available tax presets (e.g. EU VAT, US Sales Tax). */
  async getPresets(opts?: RequestOptions): Promise<TaxPresetGroup[]> {
    return this.http.get('/api/tax-presets/', undefined, opts);
  }
}
