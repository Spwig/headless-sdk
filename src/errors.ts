/** Base error class for all Spwig SDK errors. */
export class SpwigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpwigError';
  }
}

/** Thrown when the API returns an error response (4xx or 5xx). */
export class SpwigApiError extends SpwigError {
  /** HTTP status code. */
  readonly status: number;
  /** Raw response body parsed as JSON, if available. */
  readonly body: unknown;
  /** The `message` field from the API response envelope, if present. */
  readonly apiMessage: string | undefined;

  constructor(status: number, body: unknown) {
    const msg = typeof body === 'object' && body !== null && 'message' in body
      ? String((body as Record<string, unknown>).message)
      : `API error ${status}`;
    super(msg);
    this.name = 'SpwigApiError';
    this.status = status;
    this.body = body;
    this.apiMessage = msg;
  }
}

/** Thrown for 401 Unauthorized responses. */
export class SpwigAuthError extends SpwigApiError {
  constructor(body: unknown) {
    super(401, body);
    this.name = 'SpwigAuthError';
  }
}

/** Thrown for 400 Bad Request with validation errors. */
export class SpwigValidationError extends SpwigApiError {
  /** Field-level validation errors from the API. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(body: unknown) {
    super(400, body);
    this.name = 'SpwigValidationError';
    this.fieldErrors = {};
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>;
      // DRF returns field errors as { field_name: ["error1", "error2"] }
      for (const [key, val] of Object.entries(b)) {
        if (key === 'success' || key === 'message' || key === 'data') continue;
        if (Array.isArray(val)) {
          this.fieldErrors[key] = val.map(String);
        }
      }
    }
  }
}

/** Thrown when a request times out. */
export class SpwigTimeoutError extends SpwigError {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'SpwigTimeoutError';
  }
}

/** Thrown when a network error occurs (no response received). */
export class SpwigNetworkError extends SpwigError {
  readonly cause: unknown;

  constructor(cause: unknown) {
    const msg = cause instanceof Error ? cause.message : 'Network error';
    super(msg);
    this.name = 'SpwigNetworkError';
    this.cause = cause;
  }
}
