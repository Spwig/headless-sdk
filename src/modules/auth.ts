import type { HttpClient } from '../utils/fetch.js';
import type { RequestOptions } from '../utils/types.js';

export interface RegisterInput {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password_confirm: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface PasswordResetInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  new_password: string;
  new_password_confirm: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface OAuthProvider {
  provider: string;
  name: string;
  is_configured: boolean;
}

export class AuthModule {
  constructor(private http: HttpClient) {}

  /**
   * Register a new customer account.
   * Returns the created user and an auth token.
   */
  async register(data: RegisterInput, opts?: RequestOptions): Promise<AuthResponse> {
    return this.http.post('/api/accounts/api/register/', data, opts);
  }

  /**
   * Log in with username and password.
   * Returns the user profile and an auth token.
   */
  async login(data: LoginInput, opts?: RequestOptions): Promise<AuthResponse> {
    return this.http.post('/api/accounts/api/login/', data, opts);
  }

  /** Log out and invalidate the current auth token. */
  async logout(opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/accounts/api/logout/', undefined, opts);
  }

  /**
   * Request a password reset email.
   * Always returns success to prevent email enumeration.
   */
  async requestPasswordReset(data: PasswordResetInput, opts?: RequestOptions): Promise<void> {
    await this.http.post('/api/accounts/api/password-reset/', data, opts);
  }

  /** Confirm a password reset using the token from the reset email. */
  async confirmPasswordReset(
    uidb64: string,
    token: string,
    data: PasswordResetConfirmInput,
    opts?: RequestOptions,
  ): Promise<void> {
    await this.http.post(`/api/accounts/api/password-reset-confirm/${uidb64}/${token}/`, data, opts);
  }

  /** List available social/OAuth login providers. */
  async getSocialProviders(opts?: RequestOptions): Promise<OAuthProvider[]> {
    return this.http.get('/api/accounts/social/providers/', undefined, opts);
  }
}
