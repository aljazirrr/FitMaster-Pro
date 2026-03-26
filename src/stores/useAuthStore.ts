import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, FitnessGoal, Gender, DietType, ActivityLevel } from '../types/user';
import type { Equipment } from '../types/exercise';
import authService from '../services/authService';
import firebaseAuthService from '../services/firebaseAuthService';

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  user: UserProfile | null;
}

interface AuthActions {
  // ── Local (sync) actions — used during onboarding flow ──────────────────
  setUser: (user: UserProfile | null) => void;
  setOnboarded: (onboarded: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setGoal: (goal: FitnessGoal) => void;
  setMeasurements: (weight: number, height: number, age: number, gender: Gender) => void;
  setExperience: (level: string) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setPreferences: (diet: DietType, activity: ActivityLevel) => void;

  // ── Async actions — hit the real API ─────────────────────────────────────
  loginAsync: (email: string, password: string) => Promise<void>;
  registerAsync: (name: string, email: string, password: string) => Promise<void>;
  logoutAsync: () => Promise<void>;
  syncProfileAsync: () => Promise<void>;
  updateProfileAsync: (updates: Partial<UserProfile>) => Promise<void>;
  /** Restore a persisted session after biometric verification succeeds */
  biometricLoginAsync: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // ── State ────────────────────────────────────────────────────────────────
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      error: null,
      user: null,

      // ── Local actions ─────────────────────────────────────────────────────
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setGoal: (goal) =>
        set((state) => ({
          user: state.user ? { ...state.user, goals: [goal] } : null,
        })),

      setMeasurements: (weight, height, age, gender) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, measurements: { ...state.user.measurements, weight, height, age, gender } }
            : null,
        })),

      setExperience: (level) =>
        set((state) => ({
          user: state.user ? { ...state.user, experience: level } : null,
        })),

      setEquipment: (equipment) =>
        set((state) => ({
          user: state.user ? { ...state.user, equipment } : null,
        })),

      setPreferences: (diet, activity) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, dietPreference: diet, activityLevel: activity }
            : null,
        })),

      // ── Async actions ─────────────────────────────────────────────────────

      loginAsync: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          let user: UserProfile;
          if (firebaseAuthService.isConfigured()) {
            user = await firebaseAuthService.login(email, password);
          } else {
            // Fallback: no backend configured — create minimal local user
            user = {
              id: Date.now().toString(),
              name: email.split('@')[0],
              email,
              goals: [],
              measurements: { weight: 0, height: 0, age: 0, gender: 'other' },
              experience: 'beginner',
              activityLevel: 'moderate',
              equipment: [] as unknown as Equipment[],
              dietPreference: 'standard',
              language: 'en',
              theme: 'dark',
              unitSystem: 'metric',
              isPremium: false,
              streakDays: 0,
              achievements: [],
              joinDate: new Date().toISOString().split('T')[0],
              lastActive: new Date().toISOString(),
            };
          }
          set({ isAuthenticated: true, isOnboarded: true, user, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      registerAsync: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = firebaseAuthService.isConfigured()
            ? await firebaseAuthService.register(name, email, password)
            : (await authService.register({ name, email, password })).user;
          set({ isAuthenticated: true, user, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },

      logoutAsync: async () => {
        set({ isLoading: true });
        try {
          if (firebaseAuthService.isConfigured()) {
            await firebaseAuthService.logout();
          } else {
            await authService.logout();
          }
        } catch {
          // Ignore — local state is cleared regardless
        } finally {
          set({ isAuthenticated: false, user: null, isOnboarded: false, isLoading: false, error: null });
        }
      },

      syncProfileAsync: async () => {
        try {
          const user = firebaseAuthService.isConfigured()
            ? await firebaseAuthService.getProfile()
            : await authService.getProfile();
          set({ user });
        } catch {
          // Silently fail — local profile is the fallback
        }
      },

      biometricLoginAsync: async () => {
        const storedUser = (get() as any).user as UserProfile | null;
        if (!storedUser) {
          throw new Error('No previous session found. Please log in with email and password first.');
        }
        // Restore the persisted session — biometric has already verified identity
        set({ isAuthenticated: true, isOnboarded: true, error: null });
        // Try to silently refresh Firebase profile in background
        if (firebaseAuthService.isConfigured()) {
          firebaseAuthService.getProfile().then((freshUser) => {
            if (freshUser) set({ user: freshUser });
          }).catch(() => {});
        }
      },

      updateProfileAsync: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const user = firebaseAuthService.isConfigured()
            ? await firebaseAuthService.updateProfile(updates)
            : await authService.updateProfile(updates);
          set({ user, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
          throw err;
        }
      },
    }),
    {
      name: 'fitmaster-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useAuthStore;
