/** Standard Spwig API response envelope. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

/** Paginated list response from DRF PageNumberPagination. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Admin API custom pagination metadata (used by admin list endpoints). */
export interface AdminPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

/** Pagination query parameters. */
export interface PaginationParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

/** HTTP methods supported by the SDK. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Result of a binary file download (PDF, CSV, ZIP). */
export interface BlobResponse {
  blob: Blob;
  filename: string | null;
}

/** Options for individual API requests. */
export interface RequestOptions {
  /** Override the default language for this request. */
  language?: string;
  /** Override the default currency for this request. */
  currency?: string;
  /** Additional headers to include. */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}
