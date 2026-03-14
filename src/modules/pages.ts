import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface PageElement {
  id: number;
  element_type: string;
  name: string;
  content: Record<string, unknown>;
  order: number;
  css_classes: string;
  style_overrides: Record<string, unknown>;
  responsive_config: Record<string, unknown>;
  visibility_config: Record<string, unknown>;
  children: PageElement[] | null;
  [key: string]: unknown;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  page_type: string;
  seo: {
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image: string | null;
  };
  elements: PageElement[];
  theme: { id: number; name: string } | null;
  published_at: string | null;
  [key: string]: unknown;
}

export interface LegalPageSummary {
  id: number;
  title: string;
  slug: string;
  page_type: string;
  meta_description: string;
}

export interface LegalPages {
  pages: LegalPageSummary[];
  count: number;
}

/** Pages API: retrieve published pages and legal content. */
export class PagesModule {
  constructor(private http: HttpClient) {}

  /** Get all legal pages (terms, privacy, returns, shipping). */
  async getLegal(opts?: RequestOptions): Promise<LegalPages> {
    return this.http.get('/api/page-builder/public/legal/', undefined, opts);
  }

  /** Get a page by its type. */
  async getByType(type: string, opts?: RequestOptions): Promise<Page> {
    return this.http.get(`/api/page-builder/public/type/${type}/`, undefined, opts);
  }

  /** Get a page by its slug. */
  async getBySlug(slug: string, opts?: RequestOptions): Promise<Page> {
    return this.http.get(`/api/page-builder/public/${slug}/`, undefined, opts);
  }
}
