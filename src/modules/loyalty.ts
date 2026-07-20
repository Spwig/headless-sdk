import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface LoyaltyStatus {
  is_member: boolean;
  points: number;
  tier: LoyaltyTier | null;
  next_tier: LoyaltyTier | null;
  points_to_next_tier: number | null;
  lifetime_points: number;
  [key: string]: unknown;
}

export interface LoyaltyTier {
  id: number;
  name: string;
  slug: string;
  min_points: number;
  benefits: string[];
  [key: string]: unknown;
}

export interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  value: string;
  is_available: boolean;
  [key: string]: unknown;
}

export interface LoyaltyRedemption {
  id: number;
  reward: LoyaltyReward;
  points_used: number;
  redeemed_at: string;
  status: string;
  [key: string]: unknown;
}

export interface LoyaltyProgress {
  current_points: number;
  tier: string;
  progress_percentage: number;
  points_to_next_tier: number;
  [key: string]: unknown;
}

export interface LoyaltyHistoryEntry {
  id: number;
  points: number;
  action: string;
  description: string;
  created_at: string;
  [key: string]: unknown;
}

export interface EarningRule {
  action: string;
  points: number;
  description: string;
  [key: string]: unknown;
}

export interface LoyaltyBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at: string | null;
  [key: string]: unknown;
}

/** Loyalty program API: tiers, rewards, points, redemptions. */
export class LoyaltyModule {
  constructor(private http: HttpClient) {}

  /** Get the customer's current loyalty status. */
  async getStatus(opts?: RequestOptions): Promise<LoyaltyStatus> {
    return this.http.get('/api/loyalty/status/', undefined, opts);
  }

  /** Get loyalty progress towards next tier. */
  async getProgress(opts?: RequestOptions): Promise<LoyaltyProgress> {
    return this.http.get('/api/loyalty/progress/', undefined, opts);
  }

  /** List all loyalty tiers. */
  async listTiers(opts?: RequestOptions): Promise<LoyaltyTier[]> {
    return this.http.get('/api/loyalty/tiers/', undefined, opts);
  }

  /** List available rewards. */
  async listRewards(opts?: RequestOptions): Promise<LoyaltyReward[]> {
    return this.http.get('/api/loyalty/rewards/', undefined, opts);
  }

  /**
   * Redeem a reward using loyalty points.
   *
   * BREAKING (2.0.0): takes the reward's `uuid` string, not a numeric id, and
   * calls the real redeem action. The 1.x version POSTed
   * /api/loyalty/redemptions/ — a ReadOnlyModelViewSet — and returned 405 on
   * every call since it shipped.
   *
   * Fixed-value rewards credit the customer's WALLET (spendable at checkout
   * via `checkout.addWalletTender()`); percentage rewards issue a single-use
   * voucher bound to the customer.
   */
  async redeemReward(rewardUuid: string, opts?: RequestOptions): Promise<LoyaltyRedemption> {
    return this.http.post(`/api/loyalty/rewards/${encodeURIComponent(rewardUuid)}/redeem/`, undefined, opts);
  }

  /** List past redemptions. */
  async listRedemptions(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<LoyaltyRedemption>> {
    return this.http.get('/api/loyalty/redemptions/', params as Record<string, unknown>, opts);
  }

  /** Get points transaction history. */
  async getHistory(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<LoyaltyHistoryEntry>> {
    return this.http.get('/api/loyalty/history/', params as Record<string, unknown>, opts);
  }

  /** List earning rules (how to earn points). */
  async listEarningRules(opts?: RequestOptions): Promise<EarningRule[]> {
    return this.http.get('/api/loyalty/earning-rules/', undefined, opts);
  }

  /** List achievement badges. */
  async listBadges(opts?: RequestOptions): Promise<LoyaltyBadge[]> {
    return this.http.get('/api/loyalty/badges/', undefined, opts);
  }
}
