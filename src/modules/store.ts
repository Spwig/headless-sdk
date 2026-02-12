import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface StoreInfo {
  name: string;
  description: string;
  logo: string | null;
  favicon: string | null;
  contact: StoreContact;
  social: StoreSocial;
  currency: StoreCurrency;
  payment_methods: string[];
  shipping_info: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StoreContact {
  email: string;
  phone: string;
  address: string;
  [key: string]: unknown;
}

export interface StoreSocial {
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  [key: string]: unknown;
}

export interface StoreCurrency {
  code: string;
  symbol: string;
  name: string;
  decimal_places: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  exchange_rate: string;
  decimal_places: number;
}

/** Store information API: details, currencies, contact info. */
export class StoreModule {
  constructor(private http: HttpClient) {}

  /** Get complete store information (cached 5 minutes server-side). */
  async getInfo(opts?: RequestOptions): Promise<StoreInfo> {
    return this.http.get('/api/store/', undefined, opts);
  }

  /** Get basic store name and description. */
  async getBasicInfo(opts?: RequestOptions): Promise<{ name: string; description: string }> {
    return this.http.get('/api/store/info/', undefined, opts);
  }

  /** Get store contact details. */
  async getContact(opts?: RequestOptions): Promise<StoreContact> {
    return this.http.get('/api/store/contact/', undefined, opts);
  }

  /** Get store social media links. */
  async getSocial(opts?: RequestOptions): Promise<StoreSocial> {
    return this.http.get('/api/store/social/', undefined, opts);
  }

  /** Get current currency settings. */
  async getCurrency(opts?: RequestOptions): Promise<StoreCurrency> {
    return this.http.get('/api/store/currency/', undefined, opts);
  }

  /** Get accepted payment method names. */
  async getPaymentMethods(opts?: RequestOptions): Promise<string[]> {
    return this.http.get('/api/store/payment-methods/', undefined, opts);
  }

  /** Get shipping information. */
  async getShippingInfo(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/store/shipping-info/', undefined, opts);
  }

  /** List all active currencies available in the store. */
  async listCurrencies(opts?: RequestOptions): Promise<Currency[]> {
    const res = await this.http.get<{ currencies: Currency[] }>('/api/store/currencies/', undefined, opts);
    return (res as any).currencies ?? res;
  }

  /** Switch the active currency for the session. */
  async setCurrency(code: string, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/store/set-currency/', { currency: code }, opts);
  }
}
