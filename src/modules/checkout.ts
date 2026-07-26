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
  /**
   * Provider's safe-to-publish client-side key (e.g. Stripe `pk_live_…`,
   * Revolut `public_key`). Lets headless storefronts initialise the
   * provider's browser SDK without baking the key into their build.
   * Null for providers that authenticate server-side only
   * (Airwallex, PayPal, Square) or when the key can't be decrypted.
   */
  publishable_key: string | null;
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

/** Contact details for the checkout. */
export interface ContactInput {
  /** Required. Where the order confirmation is sent, and the identity a
   *  guest order is materialised against. */
  email: string;
  first_name?: string;
  last_name?: string;
  /**
   * Opt-in account creation. When supplied, a real account is created and
   * the customer is signed into this session. The password is used
   * immediately and never stored on the session or echoed back. Omit it to
   * stay a guest — the email/name are still recorded for order creation.
   */
  password?: string;
}

/** Response from persisting contact details. */
export interface ContactResult {
  success: boolean;
  session: CheckoutSession;
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

  /**
   * Persist the customer's contact details (email, name), optionally creating
   * and signing in an account when a `password` is supplied.
   *
   * This is the only place a no-shipping guest's email is recorded before
   * payment, so digital-only and booking-only carts — which skip the shipping
   * step entirely — must call this before `complete()`.
   */
  async setContact(contact: ContactInput, opts?: RequestOptions): Promise<ContactResult> {
    return this.http.post('/api/checkout/contact/', contact, opts);
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
   *
   * When tenders fully cover the order (`amount_due === "0.00"` from
   * `listTenders()`), call this WITHOUT creating a payment intent — the order
   * settles from the held tenders and no gateway is involved.
   */
  async complete(paymentData?: Record<string, unknown>, opts?: RequestOptions): Promise<CompletedOrder> {
    return this.http.post('/api/checkout/complete/', paymentData, opts);
  }

  // === Tenders (gift card / store credit) ===
  //
  // A tender is money the customer already holds, applied against the full
  // post-tax total. It is NOT a discount: the order total never changes, and
  // `amount_due` — not `total_amount` — is what a payment provider should be
  // asked to charge. Every response returns the full recomputed tender state,
  // and any intent created before a tender change is stale: recreate it.

  /** Tenders held against this checkout, and what is still due. */
  async listTenders(opts?: RequestOptions): Promise<CheckoutTenders> {
    return this.http.get('/api/checkout/tenders/', undefined, opts);
  }

  /**
   * Apply a gift card as payment. Holds up to the amount due (or the card's
   * balance if smaller); nothing is debited until payment is confirmed.
   */
  async addGiftCardTender(code: string, opts?: RequestOptions): Promise<CheckoutTenders> {
    return this.http.post('/api/checkout/tenders/gift-card/', { code }, opts);
  }

  /**
   * Apply the signed-in customer's wallet balance as payment. Guests receive
   * 403 — wallets belong to accounts. Single-currency: refused when the
   * wallet and order currencies differ.
   */
  async addWalletTender(opts?: RequestOptions): Promise<CheckoutTenders> {
    return this.http.post('/api/checkout/tenders/wallet/', {}, opts);
  }

  /** Release a hold. Nothing was debited; amount_due rises accordingly. */
  async removeTender(tenderId: string, opts?: RequestOptions): Promise<CheckoutTenders> {
    return this.http.delete(`/api/checkout/tenders/${encodeURIComponent(tenderId)}/`, opts);
  }
}

/** Tender state for a checkout session. */
export interface CheckoutTenders {
  success: boolean;
  /** What the order costs. A tender never changes this. */
  total_amount: string;
  /** Sum of live holds. */
  tendered_amount: string;
  /** What a payment provider should be asked for. Legitimately "0.00" when
   *  tenders cover the order — then use `complete()` and skip intents. */
  amount_due: string;
  currency: string;
  /** Signed-in customer's spendable wallet balance (stored balance minus live
   *  holds across all their sessions). `null` when signed out, no wallet,
   *  frozen, or the wallet currency differs from the order's. */
  wallet_spendable: string | null;
  tenders: CheckoutTenderHold[];
}

export interface CheckoutTenderHold {
  id: string;
  tender_type: 'gift_card' | 'wallet' | string;
  amount: string;
  currency: string;
  /** Last four characters only — the full code is a bearer credential and is
   *  never echoed back. */
  gift_card_last4: string | null;
  /** Localised display label, e.g. "Gift card ••••1234" / "Store credit". */
  label: string;
}
