import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminWallet {
  id: number;
  customer_email: string;
  customer_name: string;
  available_balance: string;
  available_balance_currency: string;
  is_active: boolean;
  last_credited_at: string | null;
  last_used_at: string | null;
  [key: string]: unknown;
}

export interface AdminWalletDetail {
  id: number;
  customer_email: string;
  customer_name: string;
  available_balance: string;
  available_balance_currency: string;
  pending_balance: string;
  pending_balance_currency: string;
  lifetime_credited: string;
  lifetime_credited_currency: string;
  lifetime_used: string;
  lifetime_used_currency: string;
  is_active: boolean;
  last_credited_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AdminWalletTransaction {
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
  reference_id: string;
  created_by_email: string | null;
  wallet_id: number;
  wallet_customer_email: string;
  created_at: string;
  [key: string]: unknown;
}

export interface WalletCreditInput {
  amount: string;
  currency?: string;
  source?: 'manual' | 'promotion' | 'refund';
  description: string;
  reference_id?: string;
}

export interface WalletDebitInput {
  amount: string;
  currency?: string;
  source?: 'manual' | 'order';
  description: string;
  reference_id?: string;
}

export interface WalletAdjustInput {
  /** Always-positive magnitude; `direction` decides whether it raises or lowers the balance. */
  amount: string;
  /** `increase` raises the balance, `decrease` lowers it. */
  direction: 'increase' | 'decrease';
  currency?: string;
  description: string;
  reference_id?: string;
}

export interface AdminWalletListParams {
  search?: string;
  is_active?: boolean;
}

export interface AdminTransactionListParams {
  wallet_id?: number;
  type?: 'credit' | 'debit' | 'refund' | 'adjustment' | 'reversal';
  source?: 'referral' | 'refund' | 'promotion' | 'manual' | 'order';
  status?: 'completed' | 'pending' | 'reversed';
  search?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin wallet management: list wallets, credit/debit, freeze, transactions. */
export class AdminWalletsModule {
  constructor(private http: HttpClient) {}

  /** List all customer wallets. */
  async list(params?: AdminWalletListParams, opts?: RequestOptions): Promise<AdminWallet[]> {
    return this.http.get('/api/wallet/wallets/', params as Record<string, unknown>, opts);
  }

  /** Get full wallet details. */
  async get(walletId: number, opts?: RequestOptions): Promise<AdminWalletDetail> {
    return this.http.get(`/api/wallet/wallets/${walletId}/`, undefined, opts);
  }

  /** Manually credit a customer wallet. */
  async credit(walletId: number, data: WalletCreditInput, opts?: RequestOptions): Promise<AdminWalletTransaction> {
    return this.http.post(`/api/wallet/wallets/${walletId}/credit/`, data, opts);
  }

  /** Manually debit a customer wallet. */
  async debit(walletId: number, data: WalletDebitInput, opts?: RequestOptions): Promise<AdminWalletTransaction> {
    return this.http.post(`/api/wallet/wallets/${walletId}/debit/`, data, opts);
  }

  /**
   * Post a signed staff balance correction. `direction` decides whether the
   * (always-positive) `amount` raises or lowers the balance; recorded as a
   * distinct `adjustment` ledger row, separate from organic credits/debits.
   */
  async adjust(walletId: number, data: WalletAdjustInput, opts?: RequestOptions): Promise<AdminWalletTransaction> {
    return this.http.post(`/api/wallet/wallets/${walletId}/adjust/`, data, opts);
  }

  /** Toggle wallet freeze state. */
  async freeze(walletId: number, opts?: RequestOptions): Promise<AdminWalletDetail> {
    return this.http.post(`/api/wallet/wallets/${walletId}/freeze/`, undefined, opts);
  }

  /**
   * List all transactions across all customers.
   *
   * Note: The API places pagination at the envelope level, so the HttpClient
   * unwrap returns only the transaction array. Use `limit` and `offset` params
   * to paginate.
   */
  async listTransactions(params?: AdminTransactionListParams, opts?: RequestOptions): Promise<AdminWalletTransaction[]> {
    return this.http.get('/api/wallet/admin-transactions/', params as Record<string, unknown>, opts);
  }

  /** Get a single transaction detail. */
  async getTransaction(transactionId: number, opts?: RequestOptions): Promise<AdminWalletTransaction> {
    return this.http.get(`/api/wallet/admin-transactions/${transactionId}/`, undefined, opts);
  }
}
