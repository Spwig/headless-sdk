import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** Currency record from the admin API. */
export interface AdminCurrency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  order: number;
  flag: string;
  settings: CurrencySettings;
}

/** Per-currency display settings. */
export interface CurrencySettings {
  show_flag: boolean;
  show_symbol: boolean;
  custom_symbol: string | null;
}

/** Currency list response. */
export interface CurrencyListResponse {
  currencies: AdminCurrency[];
  total: number;
  active_count: number;
}

/** Currency update input. */
export interface CurrencyUpdateInput {
  is_active?: boolean;
  settings?: Partial<CurrencySettings>;
}

/** Currency reorder entry. */
export interface CurrencyReorderEntry {
  code: string;
  order: number;
}

/** Bulk currency update entry. */
export interface BulkCurrencyUpdate {
  code: string;
  is_active?: boolean;
  settings?: Partial<CurrencySettings>;
}

/**
 * Admin Currencies API: activate/deactivate, reorder, configure display settings.
 *
 * ⚠️ Uncontracted: these endpoints (`/api/currencies/*`) are staff-only,
 * session-authenticated views backing the currency admin UI, and are NOT part of
 * the versioned `api-schema.yml`. Treat as internal/best-effort (untyped
 * responses, may change without a contract bump). For the public list of active
 * currencies, use the contracted `client.store.listCurrencies()` instead.
 */
export class AdminCurrenciesModule {
  constructor(private http: HttpClient) {}

  /** List all currencies (including inactive). */
  async list(params?: { search?: string; active_only?: boolean }, opts?: RequestOptions): Promise<CurrencyListResponse> {
    return this.http.get('/api/currencies/', params as Record<string, unknown>, opts);
  }

  /** List only active currencies. */
  async listActive(opts?: RequestOptions): Promise<CurrencyListResponse> {
    return this.http.get('/api/currencies/active/', undefined, opts);
  }

  /** Activate currencies by their codes. */
  async activate(currencyCodes: string[], opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/currencies/activate/', { currency_codes: currencyCodes }, opts);
  }

  /** Deactivate currencies by their codes. */
  async deactivate(currencyCodes: string[], opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/currencies/deactivate/', { currency_codes: currencyCodes }, opts);
  }

  /** Reorder active currencies. */
  async reorder(currencies: CurrencyReorderEntry[], opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/currencies/reorder/', { currencies }, opts);
  }

  /** Update a single currency's settings. */
  async update(code: string, data: CurrencyUpdateInput, opts?: RequestOptions): Promise<void> {
    return this.http.patch(`/api/currencies/${code}/`, data, opts);
  }

  /** Bulk update multiple currencies at once. */
  async bulkUpdate(currencies: BulkCurrencyUpdate[], opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/currencies/bulk-update/', { currencies }, opts);
  }
}
