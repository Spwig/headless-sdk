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
  /**
   * URL the provider redirects the customer to after a successful
   * payment (e.g. after a 3DS challenge). Required by the backend's
   * orchestration endpoint; passed through to Stripe / Adyen / etc.
   */
  return_url: string;
  /**
   * URL the provider redirects the customer to if they cancel out of
   * the payment flow.
   */
  cancel_url: string;
  /**
   * Optional explicit checkout session. Defaults to the current user's
   * (or visitor's) active cart's session — typically you don't need to
   * pass this.
   *
   * ⚠️ Breaking change (Spwig 1.7.1): this is the CheckoutSession integer PK,
   * not a UUID string. Previously typed/documented as a UUID; the backend
   * treats it as an integer.
   */
  checkout_session_id?: number;
  /**
   * Optional explicit payment provider account UUID. Defaults to the
   * provider already selected on the checkout session.
   */
  provider_id?: string;
  /** Optional saved-card / saved-method UUID for returning customers. */
  saved_method_id?: string;
  /** Optional metadata to attach to the intent. */
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
