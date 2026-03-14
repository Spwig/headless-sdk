import type { HttpClient } from '../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../utils/types.js';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  excerpt: string;
  category: BlogCategory | null;
  tags: BlogTag[];
  featured_image_url: string | null;
  published_at: string;
  reading_time_minutes: number;
  view_count: number;
  is_featured: boolean;
  is_pinned: boolean;
  created_at: string;
  /** Only present on detail responses. */
  simple_content?: string | null;
  /** Only present on detail responses. */
  content_type?: 'simple' | 'page_builder';
  /** Only present on detail responses. */
  author_name?: string | null;
  /** Only present on detail responses. */
  meta_title?: string;
  /** Only present on detail responses. */
  meta_description?: string;
  /** Only present on detail responses. */
  og_image_url?: string | null;
  /** Only present on detail responses. */
  related_posts?: BlogPost[];
  /** Only present on detail responses. */
  updated_at?: string;
  [key: string]: unknown;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description: string;
  image_url: string | null;
  post_count: number;
  is_active: boolean;
  sort_order: number;
  [key: string]: unknown;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

export interface BlogSettings {
  posts_per_page: number;
  show_reading_time: boolean;
  show_view_count: boolean;
  show_related_posts: boolean;
  related_posts_count: number;
  rss_enabled: boolean;
  enable_subscriptions: boolean;
  require_double_opt_in: boolean;
  default_frequency: string;
  [key: string]: unknown;
}

export interface BlogPostListParams extends PaginationParams {
  category?: string;
  tag?: string;
  search?: string;
}

export interface BlogSubscription {
  email: string;
  is_verified: boolean;
  created_at: string;
}

/** Blog API: posts, categories, tags, subscriptions, and settings. */
export class BlogModule {
  constructor(private http: HttpClient) {}

  /** Post sub-module. */
  readonly posts = {
    /** List blog posts with optional filtering and pagination. */
    list: (params?: BlogPostListParams, opts?: RequestOptions): Promise<PaginatedResponse<BlogPost>> =>
      this.http.get('/api/blog/posts/', params as Record<string, unknown>, opts),

    /** Get a single blog post by ID. */
    get: (id: number, opts?: RequestOptions): Promise<BlogPost> =>
      this.http.get(`/api/blog/posts/${id}/`, undefined, opts),
  };

  /** Category sub-module. */
  readonly categories = {
    /** List all blog categories. */
    list: (opts?: RequestOptions): Promise<BlogCategory[]> =>
      this.http.get('/api/blog/categories/', undefined, opts),

    /** Get a single blog category by ID. */
    get: (id: number, opts?: RequestOptions): Promise<BlogCategory> =>
      this.http.get(`/api/blog/categories/${id}/`, undefined, opts),
  };

  /** Tag sub-module. */
  readonly tags = {
    /** List all blog tags. */
    list: (opts?: RequestOptions): Promise<BlogTag[]> =>
      this.http.get('/api/blog/tags/', undefined, opts),

    /** Get a single blog tag by ID. */
    get: (id: number, opts?: RequestOptions): Promise<BlogTag> =>
      this.http.get(`/api/blog/tags/${id}/`, undefined, opts),
  };

  /** Subscribe to blog newsletter. */
  async subscribe(email: string, opts?: RequestOptions): Promise<BlogSubscription> {
    return this.http.post('/api/blog/subscribe/', { email }, opts);
  }

  /** Verify a blog subscription using a token. */
  async verifySubscription(token: string, opts?: RequestOptions): Promise<void> {
    await this.http.get(`/api/blog/verify/${token}/`, undefined, opts);
  }

  /** Unsubscribe from blog newsletter using a token. */
  async unsubscribe(token: string, opts?: RequestOptions): Promise<void> {
    await this.http.get(`/api/blog/unsubscribe/${token}/`, undefined, opts);
  }

  /** Get subscription preferences using a token. */
  async getPreferences(token: string, opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get(`/api/blog/preferences/${token}/`, undefined, opts);
  }

  /** Get blog settings. */
  async getSettings(opts?: RequestOptions): Promise<BlogSettings> {
    return this.http.get('/api/blog/settings/', undefined, opts);
  }
}
