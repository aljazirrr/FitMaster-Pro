import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, FitnessGoal, Gender, DietType, ActivityLevel } from '../types/user';
import type { Equipment } from '../types/exercise';

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  user: UserProfile | null;
}

interface AuthActions {
  setUser: (user: UserProfile | null) => void;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
  setOnboarded: (onboarded: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setGoal: (goal: FitnessGoal) => void;
  setMeasurements: (weight: number, height: number, age: number, gender: Gender) => void;
  setExperience: (level: string) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setPreferences: (diet: DietType, activity: ActivityLevel) => void;
}

const defaultUser: UserProfile = {
  id: '1',
  name: 'Alex',
  email: 'alex@fitmaster.com',
  goals: ['build_muscle'],
  measurements: {
    weight: 80,
    height: 178,
    age: 28,
    gender: 'male',
  },
  experience: 'intermediate',
  activityLevel: 'active',
  equipment: ['barbell', 'dumbbell', 'machine', 'cable'] as unknown as Equipment[],
  dietPreference: 'standard',
  language: 'en',
  theme: 'dark',
  unitSystem: 'metric',
  isPremium: false,
  streakDays: 12,
  achievements: [],
  joinDate: '2025-01-15',
  lastActive: new Date().toISOString(),
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      isAuthenticated: true,
      isOnboarded: false,
      isLoading: false,
      user: defaultUser,

      // Actions
      setUser: (user: UserProfile | null) =>
        set({ user, isAuthenticated: !!user }),

      login: (email: string, _password: string) =>
        set({ isAuthenticated: true, user: { ...defaultUser, email } }),

      register: (name: string, email: string, _password: string) =>
        set({ isAuthenticated: true, user: { ...defaultUser, name, email } }),

      logout: () =>
        set({ isAuthenticated: false, user: null, isOnboarded: false, isLoading: false }),

      setOnboarded: (onboarded: boolean) =>
        set({ isOnboarded: onboarded }),

      updateProfile: (updates: Partial<UserProfile>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setGoal: (goal: FitnessGoal) =>
        set((state) => ({
          user: state.user ? { ...state.user, goals: [goal] } : null,
        })),

      setMeasurements: (weight: number, height: number, age: number, gender: Gender) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, measurements: { ...state.user.measurements, weight, height, age, gender } }
            : null,
        })),

      setExperience: (level: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, experience: level } : null,
        })),

      setEquipment: (equipment: Equipment[]) =>
        set((state) => ({
          user: state.user ? { ...state.user, equipment } : null,
        })),

      setPreferences: (diet: DietType, activity: ActivityLevel) =>
        set((state) => ({
          user: state.user ? { ...state.user, dietPreference: diet, activityLevel: activity } : null,
        })),
    }),
    {
      name: 'fitmaster-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useAuthStore;
