import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface PlanPricingTier {
  tier_id: string;
  tier_name: string;
  billing_cycle: string;
  billing_cycle_display: string;
  billing_interval: number;
  discount_percentage: string;
  is_default: boolean;
  is_active: boolean;
  [key: string]: unknown;
}

export interface SubscriptionPlan {
  plan_id: string;
  name: string;
  slug: string;
  description: string;
  pricing_model: string;
  pricing_tiers: PlanPricingTier[];
  allow_quantity: boolean;
  minimum_quantity: number;
  maximum_quantity: number;
  trial_period_days: number;
  trial_price: string | null;
  trial_price_currency: string;
  trial_available: boolean;
  cancellation_policy: string;
  minimum_commitment_cycles: number;
  max_billing_cycles: number | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  [key: string]: unknown;
}

export interface Subscription {
  subscription_id: string;
  plan: SubscriptionPlan;
  product_name: string | null;
  variant_name: string | null;
  status: string;
  status_display: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string | null;
  days_until_next_billing: number | null;
  trial_end_date: string | null;
  billing_cycle_count: number;
  total_amount_paid: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  cancellation_reason: string | null;
  is_active_or_trial: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface CreateSubscriptionInput {
  plan_id: string;
  payment_method_id?: string;
}

/**
 * Result of `beginTokenSetup()` (Spwig 1.7.1). Provider-agnostic: when the
 * chosen provider supports subscriptions, the response carries a client setup
 * bundle whose extra fields are provider-specific (hence the index signature).
 * When it doesn't, `supported` is false and the storefront falls back to saved
 * tokens. No gateway is ever named in the shape.
 */
export interface SubscriptionSetupBundle {
  supported: boolean;
  /** Present when `supported` is false — an opaque provider key for fallback UX. */
  provider_key?: string;
  /** Present when `supported` is true. */
  provider_account_id?: string;
  /** Provider client params to initialise the setup UI. */
  client_params?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Subscriptions API: browse plans and manage customer subscriptions. */
export class SubscriptionsModule {
  constructor(private http: HttpClient) {}

  /** List available subscription plans. */
  async listPlans(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<SubscriptionPlan>> {
    return this.http.get('/api/subscriptions/plans/', params as Record<string, unknown>, opts);
  }

  /** Get a single subscription plan by UUID. */
  async getPlan(planId: string, opts?: RequestOptions): Promise<SubscriptionPlan> {
    return this.http.get(`/api/subscriptions/plans/${planId}/`, undefined, opts);
  }

  /** List the current customer's subscriptions. Requires authentication. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Subscription>> {
    return this.http.get('/api/subscriptions/subscriptions/', params as Record<string, unknown>, opts);
  }

  /** Get a single subscription by UUID. Requires authentication. */
  async get(subscriptionId: string, opts?: RequestOptions): Promise<Subscription> {
    return this.http.get(`/api/subscriptions/subscriptions/${subscriptionId}/`, undefined, opts);
  }

  /** Create a new subscription. Requires authentication. */
  async create(data: CreateSubscriptionInput, opts?: RequestOptions): Promise<Subscription> {
    return this.http.post('/api/subscriptions/subscriptions/', data, opts);
  }

  /** Cancel a subscription. Requires authentication. */
  async cancel(subscriptionId: string, data?: { reason?: string }, opts?: RequestOptions): Promise<void> {
    await this.http.post(`/api/subscriptions/subscriptions/${subscriptionId}/cancel/`, data, opts);
  }

  /**
   * Begin provider-agnostic setup for a reusable subscription payment method
   * (Spwig 1.7.1). Pass the active payment provider account UUID; the response
   * says whether that provider supports subscriptions and, if so, carries the
   * client setup bundle used to mint a PaymentToken. Bind the resulting token
   * to each subscription cart line with `cart.attachSubscriptionToken()`.
   * Requires authentication.
   */
  async beginTokenSetup(providerAccountId: string, opts?: RequestOptions): Promise<SubscriptionSetupBundle> {
    return this.http.post('/api/subscriptions/tokens/begin-setup/', { provider_account_id: providerAccountId }, opts);
  }
}
