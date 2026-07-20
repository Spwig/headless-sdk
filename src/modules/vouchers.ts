import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

/** Voucher code details. */
export interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: string;
  max_discount_amount: string | null;
  min_order_value: string | null;
  start_date: string | null;
  end_date: string | null;
  max_uses_total: number | null;
  current_uses: number;
  is_active: boolean;
  is_valid: boolean;
  is_gift_card: boolean;
  uses_remaining: number | null;
  [key: string]: unknown;
}

/** Result of validating a voucher code. */
export interface VoucherValidationResult {
  valid: boolean;
  message: string;
  voucher: Voucher | null;
  discount_amount: string | null;
}

/** Gift card details. */
export interface GiftCard {
  id: number;
  voucher: number;
  voucher_code: string;
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  message: string;
  is_delivered: boolean;
  delivered_at: string | null;
  status: string;
  balance: string;
  original_value: string;
  [key: string]: unknown;
}

/** Gift card balance check result. */
export interface GiftCardBalance {
  code: string;
  balance: string;
  currency: string;
  original_value: string;
  status: string;
}

/** Gift card redemption result. */
export interface GiftCardRedemption {
  success: boolean;
  redeemed_amount: string;
  remaining_balance: string;
}

/** Voucher usage record. */
export interface VoucherUsage {
  id: number;
  voucher: number;
  voucher_code: string;
  user: number | null;
  user_email: string;
  order: number | null;
  discount_amount: string;
  cart_total: string;
  used_at: string;
  [key: string]: unknown;
}

/** Voucher applied to the current cart (from the applied vouchers endpoint). */
export interface CartAppliedVoucher {
  id: number;
  cart: number;
  voucher: number;
  voucher_code: string;
  voucher_name: string;
  discount_amount: string;
  applied_at: string;
}

/** Vouchers & Gift Cards API: validate codes, check balances, view applied discounts. */
export class VouchersModule {
  constructor(private http: HttpClient) {}

  /** Validate a voucher code, optionally against a cart total. */
  async validate(code: string, cartTotal?: string, opts?: RequestOptions): Promise<VoucherValidationResult> {
    return this.http.post('/api/vouchers/vouchers/validate/', { code, cart_total: cartTotal }, opts);
  }

  /** Get details of a specific voucher by ID. */
  async get(id: number, opts?: RequestOptions): Promise<Voucher> {
    return this.http.get(`/api/vouchers/vouchers/${id}/`, undefined, opts);
  }

  /** List vouchers available to the current customer. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Voucher>> {
    return this.http.get('/api/vouchers/vouchers/', params as Record<string, unknown>, opts);
  }

  /** Gift card sub-module. */
  readonly giftCards = {
    /** Check the balance of a gift card by code. */
    checkBalance: (code: string, opts?: RequestOptions): Promise<GiftCardBalance> =>
      this.http.post('/api/vouchers/gift-cards/check-balance/', { code }, opts),

    /** List the customer's gift cards. Requires authentication. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<GiftCard>> =>
      this.http.get('/api/vouchers/gift-cards/', params as Record<string, unknown>, opts),

    /** Get a specific gift card. Requires authentication. */
    get: (id: number, opts?: RequestOptions): Promise<GiftCard> =>
      this.http.get(`/api/vouchers/gift-cards/${id}/`, undefined, opts),

      };

  /** Get vouchers currently applied to the cart. Requires authentication. */
  async getApplied(opts?: RequestOptions): Promise<CartAppliedVoucher[]> {
    return this.http.get('/api/vouchers/applied/', undefined, opts);
  }

  /** Check eligibility of a voucher for the current cart. */
  async checkEligibility(id: number, opts?: RequestOptions): Promise<{ eligible: boolean; message: string }> {
    return this.http.post(`/api/vouchers/vouchers/${id}/check-eligibility/`, undefined, opts);
  }

  /** Calculate the discount a voucher would apply. */
  async calculateDiscount(id: number, opts?: RequestOptions): Promise<{ discount_amount: string; currency: string }> {
    return this.http.post(`/api/vouchers/vouchers/${id}/calculate-discount/`, undefined, opts);
  }
}
