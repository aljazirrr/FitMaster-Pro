import { useAuthStore } from '../../stores/useAuthStore';

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

import authService from '../../services/authService';
const mockAuth = authService as jest.Mocked<typeof authService>;

const defaultUser = {
  id: '1',
  name: 'Alex',
  email: 'alex@fitmaster.com',
  goals: ['build_muscle'],
  measurements: { weight: 80, height: 178, age: 28, gender: 'male' },
  experience: 'intermediate',
  activityLevel: 'active',
  equipment: ['barbell', 'dumbbell', 'machine', 'cable'],
  dietPreference: 'standard',
  language: 'en',
  theme: 'dark',
  unitSystem: 'metric',
  isPremium: false,
  streakDays: 12,
  achievements: [],
  joinDate: '2025-01-15',
};

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: true,
    isOnboarded: false,
    isLoading: false,
    user: { ...defaultUser, lastActive: new Date().toISOString() } as any,
  });
});

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isOnboarded).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.user).not.toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets a user and marks authenticated', () => {
      const newUser = { ...defaultUser, id: '2', name: 'Test', lastActive: new Date().toISOString() } as any;
      useAuthStore.getState().setUser(newUser);
      expect(useAuthStore.getState().user?.name).toBe('Test');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sets null user and marks unauthenticated', () => {
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('loginAsync', () => {
    it('sets user and isAuthenticated on success', async () => {
      const user = { ...defaultUser, email: 'test@example.com', lastActive: new Date().toISOString() } as any;
      mockAuth.login.mockResolvedValueOnce({ user, tokens: { accessToken: 'a', refreshToken: 'r' } });
      useAuthStore.setState({ isAuthenticated: false, user: null });
      await useAuthStore.getState().loginAsync('test@example.com', 'password');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });

    it('sets error on failure', async () => {
      mockAuth.login.mockRejectedValueOnce(new Error('Invalid credentials'));
      await expect(useAuthStore.getState().loginAsync('bad@example.com', 'wrong')).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('registerAsync', () => {
    it('sets user and isAuthenticated on success', async () => {
      const user = { ...defaultUser, name: 'Maria', email: 'maria@example.com', lastActive: new Date().toISOString() } as any;
      mockAuth.register.mockResolvedValueOnce({ user, tokens: { accessToken: 'a', refreshToken: 'r' } });
      await useAuthStore.getState().registerAsync('Maria', 'maria@example.com', 'pass');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Maria');
    });
  });

  describe('logoutAsync', () => {
    it('clears user and authentication state', async () => {
      mockAuth.logout.mockResolvedValueOnce(undefined);
      await useAuthStore.getState().logoutAsync();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isOnboarded).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('clears state even if server call fails', async () => {
      mockAuth.logout.mockRejectedValueOnce(new Error('Network error'));
      await useAuthStore.getState().logoutAsync();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setOnboarded', () => {
    it('sets isOnboarded to true', () => {
      useAuthStore.getState().setOnboarded(true);
      expect(useAuthStore.getState().isOnboarded).toBe(true);
    });

    it('sets isOnboarded to false', () => {
      useAuthStore.setState({ isOnboarded: true });
      useAuthStore.getState().setOnboarded(false);
      expect(useAuthStore.getState().isOnboarded).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('merges partial updates into user', () => {
      useAuthStore.getState().updateProfile({ name: 'Updated Name', isPremium: true });
      const { user } = useAuthStore.getState();
      expect(user?.name).toBe('Updated Name');
      expect(user?.isPremium).toBe(true);
      expect(user?.email).toBe('alex@fitmaster.com'); // unchanged
    });

    it('does nothing when user is null', () => {
      useAuthStore.setState({ user: null });
      useAuthStore.getState().updateProfile({ name: 'Ghost' });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setGoal', () => {
    it('replaces goals with single goal', () => {
      useAuthStore.getState().setGoal('lose_weight');
      expect(useAuthStore.getState().user?.goals).toEqual(['lose_weight']);
    });

    it('does nothing when user is null', () => {
      useAuthStore.setState({ user: null });
      useAuthStore.getState().setGoal('maintain');
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setMeasurements', () => {
    it('updates weight, height, age and gender', () => {
      useAuthStore.getState().setMeasurements(75, 175, 30, 'female');
      const { measurements } = useAuthStore.getState().user!;
      expect(measurements.weight).toBe(75);
      expect(measurements.height).toBe(175);
      expect(measurements.age).toBe(30);
      expect(measurements.gender).toBe('female');
    });
  });

  describe('setExperience', () => {
    it('sets experience level', () => {
      useAuthStore.getState().setExperience('advanced');
      expect(useAuthStore.getState().user?.experience).toBe('advanced');
    });
  });

  describe('setEquipment', () => {
    it('replaces equipment list', () => {
      useAuthStore.getState().setEquipment(['dumbbell'] as any);
      expect(useAuthStore.getState().user?.equipment).toEqual(['dumbbell']);
    });
  });

  describe('setPreferences', () => {
    it('updates diet and activity preferences', () => {
      useAuthStore.getState().setPreferences('vegan', 'sedentary');
      const user = useAuthStore.getState().user;
      expect(user?.dietPreference).toBe('vegan');
      expect(user?.activityLevel).toBe('sedentary');
    });
  });
});
