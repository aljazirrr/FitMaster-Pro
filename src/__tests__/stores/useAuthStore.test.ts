import { useAuthStore } from '../../stores/useAuthStore';

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

  describe('login', () => {
    it('authenticates user with given email', () => {
      useAuthStore.setState({ isAuthenticated: false, user: null });
      useAuthStore.getState().login('test@example.com', 'password');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
    });
  });

  describe('register', () => {
    it('registers user with name and email', () => {
      useAuthStore.setState({ isAuthenticated: false, user: null });
      useAuthStore.getState().register('Maria', 'maria@example.com', 'pass');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('Maria');
      expect(state.user?.email).toBe('maria@example.com');
    });
  });

  describe('logout', () => {
    it('clears user and authentication state', () => {
      useAuthStore.getState().logout();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isOnboarded).toBe(false);
      expect(state.isLoading).toBe(false);
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
