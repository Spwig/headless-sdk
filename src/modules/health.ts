import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

/** Basic health check response. */
export interface HealthStatus {
  status: 'ok' | 'error';
  [key: string]: unknown;
}

/** Detailed health check with component status. */
export interface DetailedHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  database: string;
  cache: string;
  celery: string;
  storage: string;
  [key: string]: unknown;
}

/** Health check API: verify backend availability and component status. */
export class HealthModule {
  constructor(private http: HttpClient) {}

  /** Basic health check — returns 200 if the backend is responding. */
  async check(opts?: RequestOptions): Promise<HealthStatus> {
    return this.http.get('/health/', undefined, opts);
  }

  /** Detailed health check — includes database, cache, celery, storage status. Requires staff auth. */
  async detailed(opts?: RequestOptions): Promise<DetailedHealthStatus> {
    return this.http.get('/health/detailed/', undefined, opts);
  }

  /** Kubernetes liveness probe. */
  async live(opts?: RequestOptions): Promise<HealthStatus> {
    return this.http.get('/health/live/', undefined, opts);
  }

  /** Kubernetes readiness probe. */
  async ready(opts?: RequestOptions): Promise<HealthStatus> {
    return this.http.get('/health/ready/', undefined, opts);
  }
}
