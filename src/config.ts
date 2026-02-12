/** Configuration options for the Spwig SDK client. */
export interface SpwigConfig {
  /** Base URL of the Spwig backend (e.g. "https://example.com" or "https://api.example.com"). No trailing slash. */
  baseUrl: string;
  /** Default language code sent via Accept-Language header (e.g. "en", "fr", "de"). */
  language?: string;
  /** Default currency code sent via X-Currency header (e.g. "EUR", "USD"). */
  currency?: string;
  /** Auth token to include in requests. Can also be set later via client.setToken(). */
  token?: string;
  /** Custom fetch implementation. Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
  /** Request timeout in milliseconds. Defaults to 30000 (30s). */
  timeout?: number;
  /** Called when a request receives a 401 response. Use this to redirect to login. */
  onUnauthorized?: () => void;
}

/** @internal Resolved config with defaults applied. */
export interface ResolvedConfig {
  baseUrl: string;
  language: string;
  currency: string | undefined;
  token: string | undefined;
  fetch: typeof globalThis.fetch;
  timeout: number;
  onUnauthorized: (() => void) | undefined;
}

export function resolveConfig(config: SpwigConfig): ResolvedConfig {
  return {
    baseUrl: config.baseUrl.replace(/\/+$/, ''),
    language: config.language ?? 'en',
    currency: config.currency,
    token: config.token,
    fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    timeout: config.timeout ?? 30_000,
    onUnauthorized: config.onUnauthorized,
  };
}
