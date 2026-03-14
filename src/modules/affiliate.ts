import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface AffiliateProgram {
  id: number;
  name: string;
  slug: string;
  description: string;
  commission_type: string;
  commission_value: string;
  commission_display: string;
  cookie_lifetime_days: number;
  status: string;
  auto_approve_affiliates: boolean;
  minimum_payout: string;
  created_at: string;
  [key: string]: unknown;
}

export interface Affiliate {
  id: number;
  affiliate_code: string;
  company_name: string;
  website: string;
  payment_email: string;
  payment_method: string;
  status: string;
  total_earned: number;
  created_at: string;
  [key: string]: unknown;
}

export interface AffiliateLink {
  id: number;
  link_code: string;
  destination_url: string;
  label: string;
  is_active: boolean;
  clicks_count: number;
  tracking_url: string;
  program: number;
  program_name: string;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateAffiliateLinkInput {
  program: number;
  destination_url: string;
  label?: string;
  is_active?: boolean;
}

export interface Commission {
  id: number;
  affiliate_code: string;
  program: number;
  program_name: string;
  order: number;
  amount: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  [key: string]: unknown;
}

export interface Payout {
  id: number;
  affiliate_code: string;
  affiliate_email: string;
  amount: string;
  method: string;
  status: string;
  reference: string;
  created_at: string;
  processed_at: string | null;
  completed_at: string | null;
  [key: string]: unknown;
}

/** Affiliate API: programs, links, commissions, and payouts. */
export class AffiliateModule {
  constructor(private http: HttpClient) {}

  /** List all affiliate programs. */
  async listPrograms(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<AffiliateProgram>> {
    return this.http.get('/api/affiliate/programs/', params as Record<string, unknown>, opts);
  }

  /** Get a single affiliate program by ID. */
  async getProgram(id: number, opts?: RequestOptions): Promise<AffiliateProgram> {
    return this.http.get(`/api/affiliate/programs/${id}/`, undefined, opts);
  }

  /** Join an affiliate program. Requires authentication. */
  async join(data: { program: number; payment_email: string; company_name?: string; website?: string; payment_method?: string }, opts?: RequestOptions): Promise<Affiliate> {
    return this.http.post('/api/affiliate/affiliates/', data, opts);
  }

  /** Get an affiliate record by ID. Requires authentication. */
  async getAffiliate(id: number, opts?: RequestOptions): Promise<Affiliate> {
    return this.http.get(`/api/affiliate/affiliates/${id}/`, undefined, opts);
  }

  /** List affiliate links. Requires authentication. */
  async listLinks(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<AffiliateLink>> {
    return this.http.get('/api/affiliate/links/', params as Record<string, unknown>, opts);
  }

  /** Create a new affiliate link. Requires authentication. */
  async createLink(data: CreateAffiliateLinkInput, opts?: RequestOptions): Promise<AffiliateLink> {
    return this.http.post('/api/affiliate/links/', data, opts);
  }

  /** Get an affiliate link by ID. Requires authentication. */
  async getLink(id: number, opts?: RequestOptions): Promise<AffiliateLink> {
    return this.http.get(`/api/affiliate/links/${id}/`, undefined, opts);
  }

  /** List commissions. Requires authentication. */
  async listCommissions(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Commission>> {
    return this.http.get('/api/affiliate/commissions/', params as Record<string, unknown>, opts);
  }

  /** Get a single commission by ID. Requires authentication. */
  async getCommission(id: number, opts?: RequestOptions): Promise<Commission> {
    return this.http.get(`/api/affiliate/commissions/${id}/`, undefined, opts);
  }

  /** List payouts. Requires authentication. */
  async listPayouts(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<Payout>> {
    return this.http.get('/api/affiliate/payouts/', params as Record<string, unknown>, opts);
  }

  /** Get a single payout by ID. Requires authentication. */
  async getPayout(id: number, opts?: RequestOptions): Promise<Payout> {
    return this.http.get(`/api/affiliate/payouts/${id}/`, undefined, opts);
  }
}
