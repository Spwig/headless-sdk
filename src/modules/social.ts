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

  /**
   * Track a social share event (authenticated user).
   *
   * **Requires authentication.** The backend `track_share` endpoint uses
   * `IsAuthenticated` permission and is rate-limited to 50 req/hr per user.
   * Use this for logged-in visitors. For guest sharing (which is the
   * majority of real traffic on a storefront), call `trackShareAnonymous()`
   * instead.
   *
   * @param data.content_type Lowercase model name (e.g. `'product'`, `'blogpost'`).
   * @param data.object_id Primary key of the shared object.
   * @param data.platform One of `facebook`, `twitter`, `linkedin`, `pinterest`, `whatsapp`, `telegram`, `email`.
   * @param data.url The full URL that was shared.
   */
  async trackShare(data: { content_type: string; object_id: number; platform: string; url: string }, opts?: RequestOptions): Promise<{ success: boolean; share_id: number; message: string }> {
    return this.http.post('/api/social/track/', data, opts);
  }

  /**
   * Track a social share event from an anonymous visitor.
   *
   * Does NOT require authentication — use this for guest share tracking.
   * The backend stores the share with `user=null` and links it to the
   * visitor's session key, IP, and device type for analytics.
   *
   * **Rate limit:** 20 requests/hour per IP (stricter than the
   * authenticated variant) to prevent spam and database pollution.
   *
   * Backend accepts the content type as either a bare model name
   * (`'product'`) or the fully qualified form (`'catalog.product'`).
   *
   * @example
   * // Guest visitor clicks the Twitter share button on a PDP
   * await spwig.social.trackShareAnonymous({
   *   content_type: 'product',
   *   object_id: 42,
   *   platform: 'twitter',
   *   url: 'https://cocosbotanica.com/products/vc-serum',
   * });
   */
  async trackShareAnonymous(
    data: { content_type: string; object_id: number; platform: string; url: string },
    opts?: RequestOptions,
  ): Promise<{ success: boolean; share_id: number; message: string }> {
    return this.http.post('/api/social/track/anonymous/', data, opts);
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
