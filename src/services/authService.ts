import client, { tokenStorage } from './api';
import { ENDPOINTS } from '../constants/api';
import type { UserProfile } from '../types/user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

const authService = {
  /**
   * Authenticate with email + password.
   * Persists JWT tokens to AsyncStorage.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const result = await client.post<AuthResponse>(
      ENDPOINTS.auth.login,
      payload,
      { authenticated: false },
    );
    await tokenStorage.setAccessToken(result.tokens.accessToken);
    await tokenStorage.setRefreshToken(result.tokens.refreshToken);
    return result;
  },

  /**
   * Create a new account.
   * Persists JWT tokens to AsyncStorage.
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const result = await client.post<AuthResponse>(
      ENDPOINTS.auth.register,
      payload,
      { authenticated: false },
    );
    await tokenStorage.setAccessToken(result.tokens.accessToken);
    await tokenStorage.setRefreshToken(result.tokens.refreshToken);
    return result;
  },

  /**
   * Invalidate the session on the server and clear local tokens.
   */
  async logout(): Promise<void> {
    try {
      await client.post<void>(ENDPOINTS.auth.logout);
    } catch {
      // Server call failed (network error, already expired, etc.)
      // Ignore — we always clear tokens locally
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  /**
   * Fetch the authenticated user's profile.
   */
  async getProfile(): Promise<UserProfile> {
    return client.get<UserProfile>(ENDPOINTS.auth.profile);
  },

  /**
   * Update the authenticated user's profile fields.
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return client.patch<UserProfile>(ENDPOINTS.auth.profile, updates);
  },
};

export default authService;
