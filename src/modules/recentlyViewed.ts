import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface RecentlyViewedItem {
  id: number;
  product: Record<string, unknown>;
  viewed_at: string;
  view_count: number;
  [key: string]: unknown;
}

/** Recently viewed API: retrieve product view history. */
export class RecentlyViewedModule {
  constructor(private http: HttpClient) {}

  /** List recently viewed products. */
  async list(params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<RecentlyViewedItem>> {
    return this.http.get('/api/recently-viewed/', params as Record<string, unknown>, opts);
  }
}
