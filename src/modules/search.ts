import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface SearchResult {
  id: number;
  name: string;
  slug: string;
  type: string;
  image: string | null;
  price: string | null;
  url: string;
  [key: string]: unknown;
}

export interface AutocompleteSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'query';
  url?: string;
  image?: string;
}

export interface TrendingSearch {
  query: string;
  count: number;
}

export interface SearchParams extends PaginationParams {
  q: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  [key: string]: unknown;
}

/** Search API: full-text search, autocomplete, and trending. */
export class SearchModule {
  constructor(private http: HttpClient) {}

  /** Full-text search across products, categories, and brands. */
  async search(params: SearchParams, opts?: RequestOptions): Promise<PaginatedResponse<SearchResult>> {
    return this.http.get('/api/search/results/', params as Record<string, unknown>, opts);
  }

  /** Get autocomplete suggestions as the user types. */
  async autocomplete(query: string, opts?: RequestOptions): Promise<AutocompleteSuggestion[]> {
    return this.http.get('/api/search/autocomplete/', { q: query }, opts);
  }

  /** Get trending search terms. */
  async trending(opts?: RequestOptions): Promise<TrendingSearch[]> {
    return this.http.get('/api/search/trending/', undefined, opts);
  }

  /** Track a search result click for analytics. */
  async trackClick(data: { query: string; result_id: number; result_type: string }, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/search/click/', data, opts);
  }

  /** Get spelling/correction suggestions for a query. */
  async suggestCorrections(query: string, opts?: RequestOptions): Promise<string[]> {
    return this.http.get('/api/search/suggest-corrections/', { q: query }, opts);
  }
}
