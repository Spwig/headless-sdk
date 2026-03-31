import type { HttpClient } from '../../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../../utils/types.js';

/** Page builder page data. */
export interface AdminPage {
  id: number;
  title: string;
  slug: string;
  page_type: string;
  status: string;
  is_published: boolean;
  elements: AdminPageElement[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** Page element. */
export interface AdminPageElement {
  id: number;
  element_type: string;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  order: number;
  is_visible: boolean;
  [key: string]: unknown;
}

/** Element configuration schema. */
export interface ElementConfig {
  type: string;
  name: string;
  icon: string;
  fields: Record<string, unknown>[];
  default_content: Record<string, unknown>;
  default_settings: Record<string, unknown>;
  [key: string]: unknown;
}

/** Page version. */
export interface PageVersion {
  id: number;
  version_number: number;
  created_by: string;
  created_at: string;
  is_published: boolean;
  [key: string]: unknown;
}

/** Page settings. */
export interface PageSettings {
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  custom_css: string | null;
  custom_js: string | null;
  [key: string]: unknown;
}

/** Element creation input. */
export interface ElementCreateInput {
  page: number;
  element_type: string;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  order?: number;
}

/** Element update input. */
export interface ElementUpdateInput {
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  order?: number;
  is_visible?: boolean;
}

/** Visibility rule. */
export interface VisibilityRule {
  id: number;
  name: string;
  rule_type: string;
  conditions: Record<string, unknown>;
  [key: string]: unknown;
}

/** Rule group. */
export interface RuleGroup {
  id: number;
  name: string;
  rules: VisibilityRule[];
  match_type: 'all' | 'any';
  [key: string]: unknown;
}

/** Admin Page Builder API: pages, elements, versions, settings, visibility rules. */
export class AdminPagesModule {
  constructor(private http: HttpClient) {}

  /** Get page data with all elements. */
  async getPage(pageId: number, opts?: RequestOptions): Promise<AdminPage> {
    return this.http.get(`/api/page-builder/page/${pageId}/`, undefined, opts);
  }

  /** Element management. */
  readonly elements = {
    /** List elements for a page. */
    list: (params?: PaginationParams & { page_id?: number }, opts?: RequestOptions): Promise<AdminPageElement[]> =>
      this.http.get('/api/page-builder/elements/', params as Record<string, unknown>, opts),

    /** Get an element by ID. */
    get: (id: number, opts?: RequestOptions): Promise<AdminPageElement> =>
      this.http.get(`/api/page-builder/elements/${id}/`, undefined, opts),

    /** Create a new element. */
    create: (data: ElementCreateInput, opts?: RequestOptions): Promise<AdminPageElement> =>
      this.http.post('/api/page-builder/elements/', data, opts),

    /** Update an element. */
    update: (id: number, data: ElementUpdateInput, opts?: RequestOptions): Promise<AdminPageElement> =>
      this.http.put(`/api/page-builder/elements/${id}/`, data, opts),

    /** Delete an element. */
    delete: (id: number, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/page-builder/elements/${id}/`, opts),

    /** Get configuration schema for an element type. */
    getConfig: (elementType: string, opts?: RequestOptions): Promise<ElementConfig> =>
      this.http.get(`/api/page-builder/elements/config/${elementType}/`, undefined, opts),

    /** Reorder elements on a page. */
    reorder: (data: { page_id: number; order: number[] }, opts?: RequestOptions): Promise<void> =>
      this.http.post('/api/page-builder/elements/reorder/', data, opts),
  };

  /** Page versioning. */
  readonly versions = {
    /** Save current page state as a draft. */
    saveDraft: (pageId: number, opts?: RequestOptions): Promise<PageVersion> =>
      this.http.post(`/api/page-builder/page/${pageId}/save-draft/`, undefined, opts),

    /** Publish the current page draft. */
    publish: (pageId: number, opts?: RequestOptions): Promise<PageVersion> =>
      this.http.post(`/api/page-builder/page/${pageId}/publish/`, undefined, opts),

    /** List page versions. */
    list: (pageId: number, opts?: RequestOptions): Promise<PageVersion[]> =>
      this.http.get(`/api/page-builder/page/${pageId}/versions/`, undefined, opts),

    /** Revert to a specific version. */
    revert: (pageId: number, versionId: number, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/page-builder/page/${pageId}/revert/${versionId}/`, undefined, opts),

    /** Preview a specific version. */
    preview: (pageId: number, versionId: number, opts?: RequestOptions): Promise<AdminPage> =>
      this.http.get(`/api/page-builder/page/${pageId}/preview/${versionId}/`, undefined, opts),

    /** Get publish history. */
    publishHistory: (pageId: number, opts?: RequestOptions): Promise<PageVersion[]> =>
      this.http.get(`/api/page-builder/page/${pageId}/publish-history/`, undefined, opts),
  };

  /** Get page settings. */
  async getSettings(pageId: number, opts?: RequestOptions): Promise<PageSettings> {
    return this.http.get(`/api/page-builder/page/${pageId}/settings/`, undefined, opts);
  }

  /** Update page settings (SEO, custom CSS/JS, etc.). */
  async updateSettings(pageId: number, data: Partial<PageSettings>, opts?: RequestOptions): Promise<PageSettings> {
    return this.http.post(`/api/page-builder/page/${pageId}/settings/update/`, data, opts);
  }

  /** Capture a thumbnail of the page. */
  async captureThumbnail(pageId: number, opts?: RequestOptions): Promise<{ thumbnail_url: string }> {
    return this.http.post(`/api/page-builder/page/${pageId}/capture-thumbnail/`, undefined, opts);
  }

  /** Visibility rules. */
  readonly rules = {
    /** List visibility rules. */
    list: (opts?: RequestOptions): Promise<VisibilityRule[]> =>
      this.http.get('/api/page-builder/visibility-rules/', undefined, opts),

    /** Create a visibility rule. */
    create: (data: Record<string, unknown>, opts?: RequestOptions): Promise<VisibilityRule> =>
      this.http.post('/api/page-builder/rules/', data, opts),

    /** Get a visibility rule. */
    get: (id: number, opts?: RequestOptions): Promise<VisibilityRule> =>
      this.http.get(`/api/page-builder/rules/${id}/`, undefined, opts),

    /** List rule groups. */
    listGroups: (opts?: RequestOptions): Promise<RuleGroup[]> =>
      this.http.get('/api/page-builder/rule-groups/', undefined, opts),

    /** Get a rule group. */
    getGroup: (id: number, opts?: RequestOptions): Promise<RuleGroup> =>
      this.http.get(`/api/page-builder/rule-groups/${id}/`, undefined, opts),
  };

  /** Get available link sources for element links. */
  async getLinkSources(opts?: RequestOptions): Promise<Record<string, unknown>[]> {
    return this.http.get('/api/page-builder/link-sources/', undefined, opts);
  }

  /** Search products for embedding in pages. */
  async searchProducts(query: string, opts?: RequestOptions): Promise<Record<string, unknown>[]> {
    return this.http.get('/api/page-builder/product-search/', { q: query } as Record<string, unknown>, opts);
  }

  /** Page translation. */
  readonly translations = {
    /** Check translation service health. */
    healthCheck: (opts?: RequestOptions): Promise<{ status: string }> =>
      this.http.get('/api/page-builder/translation/translation-health/', undefined, opts),

    /** Translate a page element. */
    translateElement: (data: { element_id: number; target_languages: string[] }, opts?: RequestOptions): Promise<Record<string, unknown>> =>
      this.http.post('/api/page-builder/translation/translate-element/', data, opts),

    /** Get translation status for an element. */
    getStatus: (elementId: number, opts?: RequestOptions): Promise<Record<string, unknown>> =>
      this.http.get(`/api/page-builder/translation/element/${elementId}/translation-status/`, undefined, opts),

    /** Save translations for an element. */
    save: (elementId: number, data: Record<string, unknown>, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/page-builder/translation/element/${elementId}/save-translations/`, data, opts),

    /** Clear translations for an element. */
    clear: (elementId: number, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/page-builder/translation/element/${elementId}/clear-translations/`, undefined, opts),

    /** Schedule full page translation. */
    schedulePage: (data: { page_id: number; target_languages: string[] }, opts?: RequestOptions): Promise<{ job_id: string }> =>
      this.http.post('/api/page-builder/translation/schedule-page-translation/', data, opts),

    /** Get available translation languages. */
    getLanguages: (opts?: RequestOptions): Promise<{ code: string; name: string }[]> =>
      this.http.get('/api/page-builder/translation/available-languages/', undefined, opts),

    /** Get translation job status. */
    getJobStatus: (jobId: string, opts?: RequestOptions): Promise<Record<string, unknown>> =>
      this.http.get(`/api/page-builder/translation/translation-status/${jobId}/`, undefined, opts),
  };
}
