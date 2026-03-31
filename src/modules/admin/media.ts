import type { HttpClient } from '../../utils/fetch.js';
import type { PaginatedResponse, PaginationParams, RequestOptions } from '../../utils/types.js';

/** Media asset (list view). */
export interface MediaAsset {
  id: string;
  title: string;
  alt_text: string;
  description: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  file_size: number;
  file_size_display: string;
  folder_name: string | null;
  tag_names: string[];
  thumbnail_url: string | null;
  display_url: string | null;
  poster_url: string | null;
  is_public: boolean;
  created_at: string;
  usage_count: number;
}

/** Media asset (detail view). */
export interface MediaAssetDetail extends MediaAsset {
  folder: MediaFolder | null;
  tags: MediaTag[];
  thumbnails: MediaThumbnail[];
  metadata: Record<string, unknown>;
  focal_point_x: number | null;
  focal_point_y: number | null;
  uploaded_by_name: string | null;
  original_url: string | null;
  webp_url: string | null;
  last_used_at: string | null;
  updated_at: string;
}

/** Media folder. */
export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  path: string;
  description: string;
  parent: string | null;
  asset_count: number;
  created_at: string;
}

/** Media tag. */
export interface MediaTag {
  id: number;
  name: string;
  slug: string;
  asset_count: number;
}

/** Media thumbnail preset. */
export interface MediaThumbnail {
  size_preset: string;
  width: number;
  height: number;
  url: string;
  webp_url: string | null;
  created_at: string;
}

/** Media processing job. */
export interface MediaJob {
  id: string;
  status: string;
  asset: string;
  job_type: string;
  progress: number;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  [key: string]: unknown;
}

/** Asset upload input. */
export interface AssetUploadInput {
  title?: string;
  alt_text?: string;
  description?: string;
  folder_id?: string;
  tag_ids?: number[];
  focal_point_x?: number;
  focal_point_y?: number;
  is_public?: boolean;
}

/** Asset update input. */
export interface AssetUpdateInput {
  title?: string;
  alt_text?: string;
  description?: string;
  folder_id?: string;
  tag_ids?: number[];
  focal_point_x?: number;
  focal_point_y?: number;
  is_public?: boolean;
}

/** Folder creation input. */
export interface FolderCreateInput {
  name: string;
  description?: string;
  parent?: string;
}

export interface MediaAssetListParams extends PaginationParams {
  folder?: string;
  mime_type?: string;
  tag?: string;
  is_public?: boolean;
}

/** Admin Media Library API: assets, folders, tags, processing jobs. */
export class AdminMediaModule {
  constructor(private http: HttpClient) {}

  /** Asset management. */
  readonly assets = {
    /** List media assets. */
    list: (params?: MediaAssetListParams, opts?: RequestOptions): Promise<PaginatedResponse<MediaAsset>> =>
      this.http.get('/api/media/assets/', params as Record<string, unknown>, opts),

    /** Get an asset by ID. */
    get: (id: string, opts?: RequestOptions): Promise<MediaAssetDetail> =>
      this.http.get(`/api/media/assets/${id}/`, undefined, opts),

    /** Upload a new asset. */
    create: (file: File, data?: AssetUploadInput, opts?: RequestOptions): Promise<MediaAssetDetail> => {
      const formData = new FormData();
      formData.append('original_file', file);
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => formData.append(key, String(v)));
            } else {
              formData.append(key, String(value));
            }
          }
        }
      }
      return this.http.post('/api/media/assets/', formData, opts);
    },

    /** Update an asset. */
    update: (id: string, data: AssetUpdateInput, opts?: RequestOptions): Promise<MediaAssetDetail> =>
      this.http.put(`/api/media/assets/${id}/`, data, opts),

    /** Delete an asset. */
    delete: (id: string, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/media/assets/${id}/`, opts),
  };

  /** Folder management. */
  readonly folders = {
    /** List folders. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<MediaFolder>> =>
      this.http.get('/api/media/folders/', params as Record<string, unknown>, opts),

    /** Get a folder by ID. */
    get: (id: string, opts?: RequestOptions): Promise<MediaFolder> =>
      this.http.get(`/api/media/folders/${id}/`, undefined, opts),

    /** Create a folder. */
    create: (data: FolderCreateInput, opts?: RequestOptions): Promise<MediaFolder> =>
      this.http.post('/api/media/folders/', data, opts),

    /** Update a folder. */
    update: (id: string, data: Partial<FolderCreateInput>, opts?: RequestOptions): Promise<MediaFolder> =>
      this.http.put(`/api/media/folders/${id}/`, data, opts),

    /** Delete a folder. */
    delete: (id: string, opts?: RequestOptions): Promise<void> =>
      this.http.delete(`/api/media/folders/${id}/`, opts),
  };

  /** Tag management. */
  readonly tags = {
    /** List tags. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<MediaTag>> =>
      this.http.get('/api/media/tags/', params as Record<string, unknown>, opts),

    /** Get a tag by ID. */
    get: (id: number, opts?: RequestOptions): Promise<MediaTag> =>
      this.http.get(`/api/media/tags/${id}/`, undefined, opts),
  };

  /** Processing jobs. */
  readonly jobs = {
    /** List processing jobs. */
    list: (params?: PaginationParams, opts?: RequestOptions): Promise<PaginatedResponse<MediaJob>> =>
      this.http.get('/api/media/jobs/', params as Record<string, unknown>, opts),

    /** Get a job by ID. */
    get: (id: string, opts?: RequestOptions): Promise<MediaJob> =>
      this.http.get(`/api/media/jobs/${id}/`, undefined, opts),
  };

  /** Get upload progress for a pending upload. */
  async getUploadProgress(opts?: RequestOptions): Promise<Record<string, unknown>> {
    return this.http.get('/api/media/upload-progress/', undefined, opts);
  }

  /** Media translation. */
  readonly translations = {
    /** Translate an asset's metadata. */
    translate: (data: { asset_id: string; target_languages: string[] }, opts?: RequestOptions): Promise<Record<string, unknown>> =>
      this.http.post('/api/media/translate/', data, opts),

    /** Get translation status for an asset. */
    getStatus: (id: string, opts?: RequestOptions): Promise<Record<string, unknown>> =>
      this.http.get(`/api/media/media/${id}/translation-status/`, undefined, opts),

    /** Save translations for an asset. */
    save: (id: string, data: Record<string, unknown>, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/media/media/${id}/save-translations/`, data, opts),

    /** Clear translations for an asset. */
    clear: (id: string, opts?: RequestOptions): Promise<void> =>
      this.http.post(`/api/media/media/${id}/clear-translations/`, undefined, opts),
  };
}
