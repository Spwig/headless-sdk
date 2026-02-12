import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface CheckoutSession {
  shipping_address: Address | null;
  billing_address: Address | null;
  shipping_method: ShippingMethod | null;
  payment_method: string | null;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  [key: string]: unknown;
}

export interface Address {
  id?: number;
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  carrier: string;
  price: string;
  currency: string;
  estimated_days: string | null;
  [key: string]: unknown;
}

export interface PaymentProvider {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  [key: string]: unknown;
}

export interface CompletedOrder {
  id: number;
  order_number: string;
  status: string;
  total: string;
  currency: string;
  created_at: string;
  [key: string]: unknown;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Checkout flow API.
 *
 * The checkout follows a multi-step flow:
 * 1. Get session → 2. Set shipping address → 3. Get shipping methods →
 * 4. Select shipping method → 5. Get payment providers →
 * 6. Select payment method → 7. Validate → 8. Complete
 */
export class CheckoutModule {
  constructor(private http: HttpClient) {}

  /** Get the current checkout session. */
  async getSession(opts?: RequestOptions): Promise<CheckoutSession> {
    return this.http.get('/api/checkout/', undefined, opts);
  }

  /** Set the shipping address for checkout. */
  async setShippingAddress(address: Address, opts?: RequestOptions): Promise<CheckoutSession> {
    return this.http.post('/api/checkout/shipping-address/', address, opts);
  }

  /** Set the billing address for checkout. */
  async setBillingAddress(address: Address, opts?: RequestOptions): Promise<CheckoutSession> {
    return this.http.post('/api/checkout/billing-address/', address, opts);
  }

  /** Get available shipping methods for the current shipping address. */
  async getShippingMethods(opts?: RequestOptions): Promise<ShippingMethod[]> {
    return this.http.get('/api/checkout/shipping-methods/', undefined, opts);
  }

  /** Select a shipping method. */
  async selectShippingMethod(methodId: number, opts?: RequestOptions): Promise<CheckoutSession> {
    return this.http.post('/api/checkout/shipping-method/', { shipping_method_id: methodId }, opts);
  }

  /** Get available payment providers. */
  async getPaymentProviders(opts?: RequestOptions): Promise<PaymentProvider[]> {
    return this.http.get('/api/checkout/payment-providers/', undefined, opts);
  }

  /** Select a payment method/provider. */
  async selectPaymentMethod(providerSlug: string, opts?: RequestOptions): Promise<CheckoutSession> {
    return this.http.post('/api/checkout/payment-method/', { provider: providerSlug }, opts);
  }

  /** Validate the checkout before completing. Returns validation errors if any. */
  async validate(opts?: RequestOptions): Promise<ValidationResult> {
    return this.http.post('/api/checkout/validate/', undefined, opts);
  }

  /**
   * Complete the checkout and create the order.
   * Requires all previous steps (address, shipping, payment) to be set.
   */
  async complete(paymentData?: Record<string, unknown>, opts?: RequestOptions): Promise<CompletedOrder> {
    return this.http.post('/api/checkout/complete/', paymentData, opts);
  }
}
