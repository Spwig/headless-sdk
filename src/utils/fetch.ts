import type { ResolvedConfig } from '../config.js';
import type { HttpMethod, RequestOptions } from './types.js';
import {
  SpwigApiError,
  SpwigAuthError,
  SpwigNetworkError,
  SpwigTimeoutError,
  SpwigValidationError,
} from '../errors.js';

/**
 * Internal HTTP client used by all SDK modules.
 * Wraps fetch with auth headers, timeout, and error handling.
 */
export class HttpClient {
  constructor(private config: ResolvedConfig) {}

  /** Update the auth token. */
  setToken(token: string | undefined): void {
    this.config.token = token;
  }

  /** Update the default language. */
  setLanguage(language: string): void {
    this.config.language = language;
  }

  /** Update the default currency. */
  setCurrency(currency: string): void {
    this.config.currency = currency;
  }

  /** Make a GET request. */
  async get<T>(path: string, params?: Record<string, unknown>, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url, undefined, opts);
  }

  /** Make a POST request. */
  async post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, body, opts);
  }

  /** Make a PUT request. */
  async put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, body, opts);
  }

  /** Make a PATCH request. */
  async patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('PATCH', url, body, opts);
  }

  /** Make a DELETE request. */
  async delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url, undefined, opts);
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    // Ensure path starts with /api/ for consistency
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.config.baseUrl}${normalizedPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async request<T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    opts?: RequestOptions,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Accept-Language': opts?.language ?? this.config.language,
    };

    if (this.config.token) {
      headers['Authorization'] = `Token ${this.config.token}`;
    }

    if (opts?.currency ?? this.config.currency) {
      headers['X-Currency'] = (opts?.currency ?? this.config.currency)!;
    }

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (opts?.headers) {
      Object.assign(headers, opts.headers);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Chain external signal if provided
    if (opts?.signal) {
      opts.signal.addEventListener('abort', () => controller.abort());
    }

    let response: Response;
    try {
      response = await this.config.fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (opts?.signal?.aborted) {
          throw err; // User-initiated abort, rethrow as-is
        }
        throw new SpwigTimeoutError(url, this.config.timeout);
      }
      throw new SpwigNetworkError(err);
    } finally {
      clearTimeout(timeoutId);
    }

    // Parse response body
    let responseBody: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      if (response.status === 401) {
        this.config.onUnauthorized?.();
        throw new SpwigAuthError(responseBody);
      }
      if (response.status === 400) {
        throw new SpwigValidationError(responseBody);
      }
      throw new SpwigApiError(response.status, responseBody);
    }

    // Unwrap Spwig API envelope { success, data, message }
    if (
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'success' in responseBody &&
      'data' in responseBody
    ) {
      return (responseBody as { data: T }).data;
    }

    return responseBody as T;
  }
}
