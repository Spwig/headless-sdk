import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface ShareCounts {
  facebook: number;
  twitter: number;
  linkedin: number;
  pinterest: number;
  whatsapp: number;
  telegram: number;
  email: number;
  total: number;
  [key: string]: unknown;
}

export interface UserShare {
  id: number;
  platform: string;
  content_type: string;
  object_id: number;
  shared_at: string;
  [key: string]: unknown;
}

/** Social sharing API: track shares and retrieve share analytics. */
export class SocialModule {
  constructor(private http: HttpClient) {}

  /** Track a social share event. */
  async trackShare(data: { content_type: string; object_id: number; platform: string; url: string }, opts?: RequestOptions): Promise<{ success: boolean; share_id: number; message: string }> {
    return this.http.post('/api/social/track/', data, opts);
  }

  /** Get share counts for a specific content object. */
  async getShareCounts(type: string, id: number, opts?: RequestOptions): Promise<ShareCounts> {
    return this.http.get(`/api/social/counts/${type}/${id}/`, undefined, opts);
  }

  /** Get the authenticated user's share history. Requires authentication. */
  async getUserShares(opts?: RequestOptions): Promise<{ total_shares: number; by_platform: Record<string, number>; recent_shares: UserShare[] }> {
    return this.http.get('/api/social/user/shares/', undefined, opts);
  }
}
