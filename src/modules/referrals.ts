import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface ReferralProgram {
  id: number;
  name: string;
  status: string;
  reward_config: Record<string, unknown>;
  eligibility_rules: Record<string, unknown>;
  terms_and_conditions: string;
  [key: string]: unknown;
}

export interface ReferralDashboard {
  id: number;
  token: string;
  referral_link: string;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_rewards_earned: string;
  conversion_rate: number;
  signup_rate: number;
  created_at: string;
  [key: string]: unknown;
}

export interface ReferralReward {
  id: number;
  recipient_type: string;
  kind: string;
  amount: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

/** Referrals API: program info, click tracking, dashboard, and rewards. */
export class ReferralsModule {
  constructor(private http: HttpClient) {}

  /** Get the referral program details. */
  async getProgram(opts?: RequestOptions): Promise<ReferralProgram> {
    return this.http.get('/api/referrals/program/', undefined, opts);
  }

  /** Track a referral link click. */
  async trackClick(token: string, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/referrals/click/', { token }, opts);
  }

  /**
   * Get the current user's referral dashboard. Requires authentication.
   *
   * Uses the versioned DRF endpoint `/api/referrals/identities/me/`, whose
   * payload is a superset of `ReferralDashboard`. (The legacy
   * `/api/referrals/me/` aggregation view is a plain-Django endpoint that was
   * never part of the API contract.)
   */
  async getMyReferrals(opts?: RequestOptions): Promise<ReferralDashboard> {
    return this.http.get('/api/referrals/identities/me/', undefined, opts);
  }

  /** List the current user's referral rewards. Requires authentication. */
  async listRewards(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<ReferralReward>> {
    return this.http.get('/api/referrals/rewards/', params as Record<string, unknown>, opts);
  }
}
