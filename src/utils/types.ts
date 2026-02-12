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

/** Pagination query parameters. */
export interface PaginationParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
}

/** HTTP methods supported by the SDK. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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
