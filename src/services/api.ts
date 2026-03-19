/**
 * Base API client with JWT authentication, automatic token refresh,
 * timeout handling, and typed error responses.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  ENDPOINTS,
} from '../constants/api';

// ─── Error types ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'AuthError';
  }
}

// ─── Response shape ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── Token management ────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(TOKEN_STORAGE_KEY),
  setAccessToken: (token: string) => AsyncStorage.setItem(TOKEN_STORAGE_KEY, token),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
  setRefreshToken: (token: string) => AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token),
  clearTokens: () =>
    Promise.all([
      AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY),
    ]),
};

// ─── Refresh lock (prevents concurrent refresh requests) ─────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) throw new AuthError('No refresh token available');

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await tokenStorage.clearTokens();
      throw new AuthError('Session expired, please log in again');
    }

    const text = await response.text();
    const { data } = JSON.parse(text) as ApiResponse<{ accessToken: string }>;
    await tokenStorage.setAccessToken(data.accessToken);
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─── Core request function ────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  /** Set to false to skip attaching Authorization header (e.g. login) */
  authenticated?: boolean;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, authenticated = true } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (authenticated) {
    const token = await tokenStorage.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      throw new NetworkError('Request timed out');
    }
    throw new NetworkError(error.message);
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle 401 with one automatic retry after token refresh
  if (response.status === 401 && authenticated) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;

      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), API_TIMEOUT_MS);
      try {
        response = await fetch(url.toString(), {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller2.signal,
        });
      } finally {
        clearTimeout(timeoutId2);
      }
    } catch {
      throw new AuthError();
    }
  }

  // Parse body
  const text = await response.text();
  const json = text ? (JSON.parse(text) as ApiResponse<T>) : ({ data: undefined as T });

  if (!response.ok) {
    const errBody = json as unknown as { code?: string; message?: string };
    throw new ApiError(
      response.status,
      errBody.code ?? 'API_ERROR',
      errBody.message ?? `Request failed with status ${response.status}`,
    );
  }

  return json.data;
}

// ─── Public client API ────────────────────────────────────────────────────────

const client = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('DELETE', path, options),
};

export default client;
