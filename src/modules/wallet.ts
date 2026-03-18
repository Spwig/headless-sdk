import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface WalletBalance {
  available_balance: string;
  available_balance_currency: string;
  pending_balance: string;
  pending_balance_currency: string;
  lifetime_credited: string;
  lifetime_used: string;
  is_active: boolean;
  [key: string]: unknown;
}

export interface WalletTransaction {
  id: number;
  transaction_type: string;
  transaction_type_display: string;
  amount: string;
  amount_currency: string;
  balance_after: string;
  balance_after_currency: string;
  status: string;
  source: string;
  source_display: string;
  description: string;
  created_at: string;
  [key: string]: unknown;
}

export interface WalletTransactionParams {
  type?: 'credit' | 'debit' | 'refund' | 'adjustment' | 'reversal';
  source?: 'referral' | 'refund' | 'promotion' | 'manual' | 'order';
  status?: 'completed' | 'pending' | 'reversed';
  limit?: number;
  offset?: number;
}

/**
 * Offset-based pagination response shape.
 *
 * Note: The wallet API places `pagination` at envelope level (sibling of
 * `data`), so pagination metadata is stripped by the HttpClient envelope
 * unwrap. Pass `limit`/`offset` as params and track pagination yourself.
 */
export interface OffsetPaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  items: T[];
}

/** Customer wallet API: balance and transaction history. */
export class WalletModule {
  constructor(private http: HttpClient) {}

  /** Get the authenticated customer's wallet balance. Creates wallet if none exists. */
  async getBalance(opts?: RequestOptions): Promise<WalletBalance> {
    return this.http.get('/api/wallet/balance/', undefined, opts);
  }

  /**
   * List the authenticated customer's wallet transaction history.
   *
   * Note: The API places pagination at the envelope level, so the HttpClient
   * unwrap returns only the transaction array. Use `limit` and `offset` params
   * to paginate.
   */
  async listTransactions(
    params?: WalletTransactionParams,
    opts?: RequestOptions,
  ): Promise<WalletTransaction[]> {
    return this.http.get('/api/wallet/transactions/', params as Record<string, unknown>, opts);
  }
}
