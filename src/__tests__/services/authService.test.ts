import authService from '../../services/authService';
import { tokenStorage } from '../../services/api';

// Mock the api client
jest.mock('../../services/api', () => {
  const actual = jest.requireActual('../../services/api');
  return {
    __esModule: true,
    ...actual,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    },
  };
});

import client from '../../services/api';

const mockClient = client as jest.Mocked<typeof client>;

const mockUser = {
  id: '1',
  name: 'Alex',
  email: 'alex@test.com',
  goals: ['build_muscle' as const],
  measurements: { weight: 80, height: 178, age: 28, gender: 'male' as const },
  experience: 'intermediate',
  activityLevel: 'active' as const,
  equipment: [],
  dietPreference: 'standard' as const,
  language: 'en' as const,
  theme: 'dark' as const,
  unitSystem: 'metric' as const,
  isPremium: false,
  streakDays: 0,
  achievements: [],
  joinDate: '2026-01-01',
  lastActive: '2026-03-19T00:00:00Z',
};

const mockTokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };

beforeEach(async () => {
  jest.clearAllMocks();
  await tokenStorage.clearTokens();
});

describe('authService', () => {
  describe('login', () => {
    it('calls POST /auth/login with credentials', async () => {
      mockClient.post.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
      await authService.login({ email: 'alex@test.com', password: 'secret' });
      expect(mockClient.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'alex@test.com', password: 'secret' },
        { authenticated: false },
      );
    });

    it('stores tokens in AsyncStorage after login', async () => {
      mockClient.post.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
      await authService.login({ email: 'alex@test.com', password: 'secret' });
      expect(await tokenStorage.getAccessToken()).toBe('access-jwt');
      expect(await tokenStorage.getRefreshToken()).toBe('refresh-jwt');
    });

    it('returns the user profile', async () => {
      mockClient.post.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
      const result = await authService.login({ email: 'alex@test.com', password: 'secret' });
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('calls POST /auth/register with name, email, password', async () => {
      mockClient.post.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
      await authService.register({ name: 'Alex', email: 'alex@test.com', password: 'secret' });
      expect(mockClient.post).toHaveBeenCalledWith(
        '/auth/register',
        { name: 'Alex', email: 'alex@test.com', password: 'secret' },
        { authenticated: false },
      );
    });

    it('stores tokens after registration', async () => {
      mockClient.post.mockResolvedValueOnce({ user: mockUser, tokens: mockTokens });
      await authService.register({ name: 'Alex', email: 'alex@test.com', password: 'secret' });
      expect(await tokenStorage.getAccessToken()).toBe('access-jwt');
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout', async () => {
      mockClient.post.mockResolvedValueOnce(undefined);
      await tokenStorage.setAccessToken('some-token');
      await authService.logout();
      expect(mockClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('clears tokens even if server call fails', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('Network error'));
      await tokenStorage.setAccessToken('some-token');
      await tokenStorage.setRefreshToken('some-refresh');
      await authService.logout();
      expect(await tokenStorage.getAccessToken()).toBeNull();
      expect(await tokenStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('calls GET /auth/profile and returns user', async () => {
      mockClient.get.mockResolvedValueOnce(mockUser);
      const user = await authService.getProfile();
      expect(mockClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(user).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('calls PATCH /auth/profile with updates', async () => {
      const updated = { ...mockUser, name: 'Alexandra' };
      mockClient.patch.mockResolvedValueOnce(updated);
      const result = await authService.updateProfile({ name: 'Alexandra' });
      expect(mockClient.patch).toHaveBeenCalledWith('/auth/profile', { name: 'Alexandra' });
      expect(result.name).toBe('Alexandra');
    });
  });
});
