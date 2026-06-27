import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface CheckoutSession {
  id: number;
  cart: Record<string, unknown>;
  shipping_address: Address | null;
  shipping_address_data: Record<string, unknown> | null;
  billing_address: Address | null;
  billing_address_data: Record<string, unknown> | null;
  selected_shipping_method: ShippingMethod | null;
  payment_provider: string | null;
  payment_provider_name: string | null;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  step_completed: string;
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
  /** Customer email — required when checking out as a guest so the
   * backend can create the guest user and send the order confirmation. */
  email?: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  method_type: string;
  base_cost: number;
  final_cost: number;
  currency: string;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
  estimated_delivery: string | null;
  icon: string | null;
  rules_applied: Array<{ rule_name: string; rule_type: string; adjustment: number }>;
  total_discount: number;
  total_surcharge: number;
}

export interface PaymentProvider {
  id: string;
  provider_name: string;
  provider_slug: string;
  provider_logo: string | null;
  provider_description: string;
  display_name: string;
  available_methods: string[];
  is_default: boolean;
  test_mode: boolean;
}

export interface CompletedOrder {
  id: number;
  order_number: string;
  status: string;
  total: string;
  currency: string;
  created_at: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
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
    const res = await this.http.get<{ shipping_methods: ShippingMethod[] } | ShippingMethod[]>(
      '/api/checkout/shipping-methods/', undefined, opts,
    );
    return Array.isArray(res) ? res : res.shipping_methods;
  }

  /** Select a shipping method. */
  async selectShippingMethod(methodId: number, opts?: RequestOptions): Promise<CheckoutSession> {
    return this.http.post('/api/checkout/shipping-method/', { shipping_method_id: methodId }, opts);
  }

  /** Get available payment providers. */
  async getPaymentProviders(opts?: RequestOptions): Promise<PaymentProvider[]> {
    const res = await this.http.get<{ payment_providers: PaymentProvider[] } | PaymentProvider[]>(
      '/api/checkout/payment-providers/', undefined, opts,
    );
    return Array.isArray(res) ? res : res.payment_providers;
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
