import type { HttpClient } from '../../utils/fetch.js';
import type { RequestOptions } from '../../utils/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffLoginInput {
  email?: string;
  username?: string;
  password: string;
  device_id: string;
  device_name: string;
}

export interface TwoFactorVerifyInput {
  pending_token: string;
  code: string;
  device_id: string;
  trust_device?: boolean;
}

export interface RefreshTokenInput {
  refresh_token: string;
  device_id?: string;
}

export interface LogoutInput {
  device_id?: string;
  logout_all?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  [key: string]: unknown;
}

/**
 * Successful login response (after HttpClient envelope unwrap).
 * The backend returns `{success, data: {user, tokens}}` — we receive `{user, tokens}`.
 */
export interface StaffLoginResponse {
  user: StaffProfile;
  tokens: TokenResponse;
  [key: string]: unknown;
}

/**
 * 2FA challenge response (after HttpClient envelope unwrap).
 * The backend returns `{success, requires_2fa, data: {pending_token, expires_in}}`
 * — we receive `{pending_token, expires_in}`.
 *
 * Distinguish from `StaffLoginResponse` by checking for `pending_token` field.
 */
export interface TwoFactorRequiredResponse {
  pending_token: string;
  expires_in: number;
  [key: string]: unknown;
}

export interface StaffProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  [key: string]: unknown;
}

export interface AdminPasswordResetInput {
  email: string;
}

export interface AdminPasswordResetConfirmInput {
  uid: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface SsoConfig {
  enabled: boolean;
  provider: string;
  [key: string]: unknown;
}

export interface SsoAuthorizeInput {
  provider?: string;
  redirect_uri?: string;
  [key: string]: unknown;
}

export interface SsoCallbackInput {
  code: string;
  state?: string;
  [key: string]: unknown;
}

export interface SsoTokenInput {
  code: string;
  device_id: string;
  device_name: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

/** Admin authentication: staff login, 2FA, token refresh, SSO. */
export class AdminAuthModule {
  constructor(private http: HttpClient) {}

  /**
   * Login with staff credentials. May return 2FA challenge.
   *
   * Check the response shape to determine the result:
   * - If `'tokens' in result` → successful login (`StaffLoginResponse`)
   * - If `'pending_token' in result` → 2FA required (`TwoFactorRequiredResponse`)
   */
  async login(data: StaffLoginInput, opts?: RequestOptions): Promise<StaffLoginResponse | TwoFactorRequiredResponse> {
    return this.http.post('/api/admin/auth/login/', data, opts);
  }

  /** Verify a 2FA code after login. Returns full login response on success. */
  async verify2fa(data: TwoFactorVerifyInput, opts?: RequestOptions): Promise<StaffLoginResponse> {
    return this.http.post('/api/admin/auth/verify-2fa/', data, opts);
  }

  /**
   * Refresh an expired access token.
   * Returns `{tokens: {access_token, token_type, expires_in, refresh_token?}}`.
   * `refresh_token` is included when token rotation is enabled.
   */
  async refreshToken(data: RefreshTokenInput, opts?: RequestOptions): Promise<{ tokens: TokenResponse }> {
    return this.http.post('/api/admin/auth/refresh/', data, opts);
  }

  /** Logout and invalidate tokens. */
  async logout(data?: LogoutInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/admin/auth/logout/', data, opts);
  }

  /** Get the authenticated staff member's profile. */
  async getProfile(opts?: RequestOptions): Promise<StaffProfile> {
    return this.http.get('/api/admin/auth/profile/', undefined, opts);
  }

  /** Request a password reset email. */
  async requestPasswordReset(data: AdminPasswordResetInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/admin/auth/password-reset/', data, opts);
  }

  /** Confirm a password reset with token. */
  async confirmPasswordReset(data: AdminPasswordResetConfirmInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/admin/auth/password-reset/confirm/', data, opts);
  }

  /** Get SSO configuration. */
  async getSsoConfig(opts?: RequestOptions): Promise<SsoConfig> {
    return this.http.get('/api/admin/auth/sso/config/', undefined, opts);
  }

  /** Initiate mobile SSO authorization flow. */
  async ssoMobileAuthorize(data: SsoAuthorizeInput, opts?: RequestOptions): Promise<unknown> {
    return this.http.post('/api/admin/auth/sso/mobile/authorize/', data, opts);
  }

  /** Handle SSO mobile callback. */
  async ssoMobileCallback(data: SsoCallbackInput, opts?: RequestOptions): Promise<unknown> {
    return this.http.post('/api/admin/auth/sso/mobile/callback/', data, opts);
  }

  /** Exchange SSO code for staff tokens. */
  async ssoMobileToken(data: SsoTokenInput, opts?: RequestOptions): Promise<StaffLoginResponse> {
    return this.http.post('/api/admin/auth/sso/mobile/token/', data, opts);
  }
}
