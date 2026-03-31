import type { HttpClient } from '../../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../../utils/types.js';

/** Admin voucher details. */
export interface AdminVoucher {
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
  eligible_products: number[];
  eligible_categories: number[];
  gift_card_balance: string | null;
  original_gift_card_value: string | null;
  [key: string]: unknown;
}

/** Voucher creation input. */
export interface VoucherCreateInput {
  code?: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: string;
  max_discount_amount?: string;
  min_order_value?: string;
  start_date?: string;
  end_date?: string;
  max_uses_total?: number;
  is_active?: boolean;
  eligible_products?: number[];
  eligible_categories?: number[];
}

/** Voucher usage record. */
export interface AdminVoucherUsage {
  id: number;
  voucher: number;
  voucher_code: string;
  user: number | null;
  user_email: string;
  order: number | null;
  discount_amount: string;
  cart_total: string;
  used_at: string;
}

/** Admin gift card details. */
export interface AdminGiftCard {
  id: number;
  voucher: number;
  voucher_code: string;
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  message: string;
  send_immediately: boolean;
  delivery_date: string | null;
  is_delivered: boolean;
  delivered_at: string | null;
  purchased_by: number | null;
  purchase_order: number | null;
  status: string;
  balance: string;
  original_value: string;
}

/** Gift card creation input. */
export interface GiftCardCreateInput {
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  message?: string;
  send_immediately?: boolean;
  delivery_date?: string;
}

/** Voucher restriction rule. */
export interface VoucherRestriction {
  id: number;
  voucher: number;
  restriction_type: string;
  value: string;
  [key: string]: unknown;
}

/** Bulk voucher generation input. */
export interface BulkGenerateInput {
  prefix?: string;
  count: number;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: string;
  max_discount_amount?: string;
  min_order_value?: string;
  start_date?: string;
  end_date?: string;
  max_uses_total?: number;
}

export interface AdminVoucherListParams extends PaginationParams {
  is_active?: boolean;
  discount_type?: string;
  is_gift_card?: boolean;
}

/** Admin Vouchers API: CRUD vouchers, gift cards, usage tracking, restrictions. */
export class AdminVouchersModule {
  constructor(private http: HttpClient) {}

  /** List vouchers with optional filtering. */
  async list(params?: AdminVoucherListParams, opts?: RequestOptions): Promise<PaginatedResponse<AdminVoucher>> {
    return this.http.get('/api/vouchers/vouchers/', params as Record<string, unknown>, opts);
  }

  /** Get a specific voucher. */
  async get(id: number, opts?: RequestOptions): Promise<AdminVoucher> {
    return this.http.get(`/api/vouchers/vouchers/${id}/`, undefined, opts);
  }

  /** Create a new voucher. */
  async create(data: VoucherCreateInput, opts?: RequestOptions): Promise<AdminVoucher> {
    return this.http.post('/api/vouchers/vouchers/', data, opts);
  }

  /** Get usage statistics for a voucher. */
  async getUsageStats(id: number, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get(`/api/vouchers/vouchers/${id}/usage-stats/`, undefined, opts);
  }

  /** Bulk generate voucher codes. */
  async bulkGenerate(data: BulkGenerateInput, opts?: RequestOptions): Promise<{ codes: string[]; count: number }> {
    return this.http.post('/api/vouchers/vouchers/bulk-generate/', data, opts);
  }

  /** List voucher usage records. */
  async listUsage(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<AdminVoucherUsage>> {
    return this.http.get('/api/vouchers/usage/', params as Record<string, unknown>, opts);
  }

  /** Gift card management. */
  readonly giftCards = {
    /** List gift cards. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<AdminGiftCard>> =>
      this.http.get('/api/vouchers/gift-cards/', params as Record<string, unknown>, opts),

    /** Get a specific gift card. */
    get: (id: number, opts?: RequestOptions): Promise<AdminGiftCard> =>
      this.http.get(`/api/vouchers/gift-cards/${id}/`, undefined, opts),

    /** Create a new gift card. */
    create: (data: GiftCardCreateInput, opts?: RequestOptions): Promise<AdminGiftCard> =>
      this.http.post('/api/vouchers/gift-cards/', data, opts),
  };

  /** List voucher restrictions. */
  async listRestrictions(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<VoucherRestriction>> {
    return this.http.get('/api/vouchers/restrictions/', params as Record<string, unknown>, opts);
  }

  /** Get a specific restriction. */
  async getRestriction(id: number, opts?: RequestOptions): Promise<VoucherRestriction> {
    return this.http.get(`/api/vouchers/restrictions/${id}/`, undefined, opts);
  }
}
