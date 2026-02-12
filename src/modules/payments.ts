import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface PaymentIntent {
  id: string;
  status: string;
  amount: string;
  currency: string;
  provider: string;
  client_secret: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  [key: string]: unknown;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  provider: string;
  last_four: string | null;
  brand: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  [key: string]: unknown;
}

export interface CreatePaymentIntentInput {
  amount: string;
  currency: string;
  provider: string;
  metadata?: Record<string, unknown>;
}

/** Payment API: payment intents and saved payment methods. */
export class PaymentsModule {
  constructor(private http: HttpClient) {}

  /** Create a new payment intent. */
  async createIntent(data: CreatePaymentIntentInput, opts?: RequestOptions): Promise<PaymentIntent> {
    return this.http.post('/api/payments/intents/', data, opts);
  }

  /** Get a payment intent by ID. */
  async getIntent(id: string, opts?: RequestOptions): Promise<PaymentIntent> {
    return this.http.get(`/api/payments/intents/${id}/`, undefined, opts);
  }

  /** Confirm a payment intent. */
  async confirmIntent(id: string, data?: Record<string, unknown>, opts?: RequestOptions): Promise<PaymentIntent> {
    return this.http.post(`/api/payments/intents/${id}/confirm/`, data, opts);
  }

  /** Cancel a payment intent. */
  async cancelIntent(id: string, opts?: RequestOptions): Promise<PaymentIntent> {
    return this.http.post(`/api/payments/intents/${id}/cancel/`, undefined, opts);
  }

  /** List saved payment methods. Requires authentication. */
  async listMethods(opts?: RequestOptions): Promise<SavedPaymentMethod[]> {
    return this.http.get('/api/payments/methods/', undefined, opts);
  }

  /** Save a new payment method. */
  async createMethod(data: Record<string, unknown>, opts?: RequestOptions): Promise<SavedPaymentMethod> {
    return this.http.post('/api/payments/methods/', data, opts);
  }

  /** Delete a saved payment method. */
  async deleteMethod(id: string, opts?: RequestOptions): Promise<void> {
    await this.http.delete(`/api/payments/methods/${id}/`, opts);
  }

  /** Set a payment method as the default. */
  async setDefaultMethod(id: string, opts?: RequestOptions): Promise<SavedPaymentMethod> {
    return this.http.post(`/api/payments/methods/${id}/set-default/`, undefined, opts);
  }
}
