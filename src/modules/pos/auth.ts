import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

/** POS login credentials. */
export interface PosLoginInput {
  email: string;
  password: string;
  terminal_id?: string;
}

/** POS authentication response with JWT tokens. */
export interface PosAuthResponse {
  access_token: string;
  refresh_token: string;
  staff: {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

/** POS token refresh input. */
export interface PosRefreshInput {
  refresh_token: string;
}

/** POS authentication: login, refresh, logout. */
export class PosAuthModule {
  constructor(private http: HttpClient) {}

  /** Staff login for POS terminal. */
  async login(data: PosLoginInput, opts?: RequestOptions): Promise<PosAuthResponse> {
    return this.http.post('/api/pos/auth/login/', data, opts);
  }

  /** Refresh JWT access token. */
  async refresh(data: PosRefreshInput, opts?: RequestOptions): Promise<{ access_token: string }> {
    return this.http.post('/api/pos/auth/refresh/', data, opts);
  }

  /** Logout and invalidate tokens. */
  async logout(opts?: RequestOptions): Promise<void> {
    return this.http.post('/api/pos/auth/logout/', undefined, opts);
  }
}
