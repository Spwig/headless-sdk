import type { HttpClient } from '../utils/fetch.js';
import type { PaginationParams, RequestOptions } from '../utils/types.js';

/**
 * A single result item returned by `SearchModule.search()`.
 *
 * Matches the backend `SearchResultItemSerializer`. Fields vary by content
 * type — e.g. `name` for products/categories/brands, `title` for blog posts.
 */
export interface SearchResult {
  id: number;
  type: 'product' | 'category' | 'brand' | 'blog_post' | string;
  slug: string;
  url: string;
  /** Product / category / brand name. */
  name?: string;
  /** Blog post title. */
  title?: string;
  /** Untranslated name (when translation is applied). */
  name_base?: string | null;
  title_base?: string | null;
  price?: string;
  currency?: string;
  /** Image URL — backend field is `thumbnail`, not `image`. */
  thumbnail?: string | null;
  /** Brand logo (for brand results). */
  logo?: string | null;
  sku?: string | null;
  in_stock?: boolean;
  is_translated?: boolean;
  description?: string;
  excerpt?: string;
  product_count?: number;
  [key: string]: unknown;
}

/**
 * Response shape returned by `SearchModule.search()`.
 *
 * NOT a standard `PaginatedResponse` — the search endpoint has its own
 * envelope with facets, language, and the originating search query ID.
 */
export interface SearchResultsResponse {
  query: string;
  language: string;
  did_you_mean: string | null;
  redirect: { url: string; is_external?: boolean } | null;
  results: SearchResult[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  facets: {
    types?: Record<string, number>;
    categories?: Array<Record<string, unknown>>;
    brands?: Array<Record<string, unknown>>;
    price_range?: Record<string, unknown>;
    in_stock?: Record<string, number>;
  };
  applied_synonyms?: string[];
  response_time_ms: number;
  /**
   * ID of the SearchQuery row created by this request. Pass this to
   * `trackClick()` so clicks can be attributed to the originating search
   * in the admin analytics dashboard.
   *
   * Present on normal search responses. Absent when:
   *   - The query is empty
   *   - The backend matched a SearchRedirect (`redirect` is non-null)
   *   - Query tracking is disabled in SearchSettings
   *
   * Available in Spwig backend versions that include the headless
   * tracking fix (search_query_id is now explicitly returned).
   */
  search_query_id?: number;
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

export interface SearchEngine {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  content_types: string[];
  [key: string]: unknown;
}

export interface SearchSettings {
  is_enabled: boolean;
  min_query_length: number;
  autocomplete_enabled: boolean;
  autocomplete_max_results: number;
  autocomplete_debounce_ms: number;
  show_thumbnails: boolean;
  search_products: boolean;
  search_categories: boolean;
  search_brands: boolean;
  search_blog_posts: boolean;
  fuzzy_enabled: boolean;
  results_per_page: number;
  [key: string]: unknown;
}

/** Input for `SearchModule.trackClick()` — matches backend serializer. */
export interface TrackClickInput {
  /**
   * The ID of the SearchQuery record this click belongs to. Get it from
   * `SearchResultsResponse.search_query_id` after calling `search()`.
   */
  search_query_id: number;
  /**
   * The content type of the clicked result. Accepts either:
   *   - A bare lowercase model name: `'product'`, `'category'`, `'brand'`, `'blogpost'`
   *   - Or the fully qualified form: `'catalog.product'`, `'blog.blogpost'`
   * Bare model names are preferred — the frontend shouldn't need to know
   * Django app labels. Corresponds to `SearchResult.type`.
   */
  content_type: string;
  /** Primary key of the clicked content object. */
  object_id: number;
  /** Zero-based position of the result in the list (0 = first). */
  position?: number;
}

/** Search API: full-text search, autocomplete, trending, engines. */
export class SearchModule {
  constructor(private http: HttpClient) {}

  /**
   * Full-text search across products, categories, brands, and blog posts.
   *
   * Returns a custom envelope with `results`, `facets`, `total_pages`, and
   * (when the backend supports it) `search_query_id` for click tracking.
   * This is **not** a `PaginatedResponse` — pagination uses `page` /
   * `per_page` / `total_pages` instead of `next` / `previous`.
   */
  async search(params: SearchParams, opts?: RequestOptions): Promise<SearchResultsResponse> {
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

  /**
   * Track a click on a search result for analytics.
   *
   * Pass the `search_query_id` from the `SearchResultsResponse` along with
   * the clicked item's content type and ID. This creates a `SearchClick`
   * row linked back to the original search, enabling the admin dashboard
   * to compute click-through rates and identify zero-result queries.
   *
   * @example
   * const results = await spwig.search.search({ q: 'serum' });
   * // user clicks the second product result
   * await spwig.search.trackClick({
   *   search_query_id: results.search_query_id!,
   *   content_type: 'product',
   *   object_id: results.results[1].id,
   *   position: 1,
   * });
   */
  async trackClick(data: TrackClickInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/search/click/', data, opts);
  }

  /** Get spelling/correction suggestions for a query. */
  async suggestCorrections(query: string, opts?: RequestOptions): Promise<string[]> {
    return this.http.get('/api/search/suggest-corrections/', { q: query }, opts);
  }

  /** List available search engines. */
  async getEngines(opts?: RequestOptions): Promise<SearchEngine[]> {
    return this.http.get('/api/search/engines/', undefined, opts);
  }

  /** Get search configuration settings. */
  async getSettings(opts?: RequestOptions): Promise<SearchSettings> {
    return this.http.get('/api/search/settings/', undefined, opts);
  }
}
