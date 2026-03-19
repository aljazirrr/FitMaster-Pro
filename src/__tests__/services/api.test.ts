import client, { ApiError, NetworkError, AuthError, tokenStorage } from '../../services/api';

// ─── fetch mock helpers ───────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

function mockFetchNetworkError(message = 'Failed to fetch') {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error(message));
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(async () => {
  jest.clearAllMocks();
  await tokenStorage.clearTokens();
});

afterAll(() => {
  jest.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ApiClient', () => {
  describe('GET requests', () => {
    it('returns data from a successful response', async () => {
      mockFetch(200, { data: { id: '1', name: 'Alex' } });
      const result = await client.get<{ id: string; name: string }>('/auth/profile');
      expect(result).toEqual({ id: '1', name: 'Alex' });
    });

    it('appends query params to the URL', async () => {
      mockFetch(200, { data: [] });
      await client.get('/nutrition/foods/search', { params: { q: 'chicken', limit: 10 } });
      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('q=chicken');
      expect(calledUrl).toContain('limit=10');
    });

    it('attaches Authorization header when token exists', async () => {
      await tokenStorage.setAccessToken('test-jwt-token');
      mockFetch(200, { data: {} });
      await client.get('/auth/profile');
      const headers = (global.fetch as jest.Mock).mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-jwt-token');
    });

    it('omits Authorization header when authenticated=false', async () => {
      mockFetch(200, { data: {} });
      await client.post('/auth/login', { email: 'a', password: 'b' }, { authenticated: false });
      const headers = (global.fetch as jest.Mock).mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('POST requests', () => {
    it('serializes body as JSON', async () => {
      mockFetch(201, { data: { id: '1' } });
      await client.post('/community/posts', { content: 'Hello' });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1]?.body as string);
      expect(body).toEqual({ content: 'Hello' });
    });

    it('returns data from the created resource', async () => {
      mockFetch(201, { data: { id: 'new-post', content: 'Hello', likes: 0 } });
      const result = await client.post<{ id: string }>('/community/posts', { content: 'Hello' });
      expect(result.id).toBe('new-post');
    });
  });

  describe('Error handling', () => {
    it('throws ApiError on non-2xx response', async () => {
      mockFetch(404, { code: 'NOT_FOUND', message: 'Resource not found' });
      await expect(client.get('/workouts/nonexistent')).rejects.toThrow(ApiError);
    });

    it('ApiError has correct status and code', async () => {
      mockFetch(403, { code: 'FORBIDDEN', message: 'Access denied' });
      try {
        await client.get('/admin/data');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(403);
        expect((err as ApiError).code).toBe('FORBIDDEN');
        expect((err as ApiError).message).toBe('Access denied');
      }
    });

    it('throws NetworkError on fetch failure', async () => {
      mockFetchNetworkError('Network is down');
      await expect(client.get('/any-path')).rejects.toThrow(NetworkError);
    });

    it('throws NetworkError on timeout (AbortError)', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      await expect(client.get('/slow-endpoint')).rejects.toThrow(NetworkError);
    });

    it('handles empty response body (204 No Content)', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(''),
      } as Response);
      const result = await client.delete('/workouts/123');
      expect(result).toBeUndefined();
    });
  });

  describe('Token refresh on 401', () => {
    it('throws AuthError when refresh token is missing', async () => {
      mockFetch(401, { code: 'UNAUTHORIZED', message: 'Token expired' });
      await expect(client.get('/auth/profile')).rejects.toThrow(AuthError);
    });

    it('retries with new token after successful refresh', async () => {
      await tokenStorage.setAccessToken('expired-token');
      await tokenStorage.setRefreshToken('valid-refresh-token');

      global.fetch = jest.fn()
        // First call → 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Expired' })),
        } as Response)
        // Refresh call → new access token
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ data: { accessToken: 'new-token' } })),
        } as Response)
        // Retry of original request → success
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ data: { id: '1' } })),
        } as Response);

      const result = await client.get<{ id: string }>('/auth/profile');
      expect(result).toEqual({ id: '1' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});

describe('tokenStorage', () => {
  it('stores and retrieves access token', async () => {
    await tokenStorage.setAccessToken('my-token');
    const token = await tokenStorage.getAccessToken();
    expect(token).toBe('my-token');
  });

  it('stores and retrieves refresh token', async () => {
    await tokenStorage.setRefreshToken('my-refresh');
    const token = await tokenStorage.getRefreshToken();
    expect(token).toBe('my-refresh');
  });

  it('clearTokens removes both tokens', async () => {
    await tokenStorage.setAccessToken('a');
    await tokenStorage.setRefreshToken('b');
    await tokenStorage.clearTokens();
    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });
});
