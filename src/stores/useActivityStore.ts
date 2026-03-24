/**
 * useActivityStore — daily step counter + derived metrics.
 *
 * Reads step data from Apple HealthKit (iOS) or Health Connect (Android)
 * via healthService.getStepsToday().  Falls back gracefully when the
 * native module is absent or permission is not granted.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import healthService from '../services/healthService';

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Approximate distance in km (avg stride ~0.75 m) */
export function stepsToKm(steps: number): number {
  return Math.round((steps * 0.75) / 1000 * 10) / 10;
}

/** Rough calorie estimate: ~0.04 kcal per step for average adult */
export function stepsToKcal(steps: number): number {
  return Math.round(steps * 0.04);
}

// ─── State & actions ──────────────────────────────────────────────────────────

interface ActivityState {
  stepsToday: number;
  stepsGoal: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  /** True once the first successful sync has completed */
  hasData: boolean;
}

interface ActivityActions {
  setGoal: (goal: number) => void;
  syncSteps: () => Promise<void>;
}

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    (set) => ({
      // ── State ────────────────────────────────────────────────────────────
      stepsToday: 0,
      stepsGoal: 10_000,
      isSyncing: false,
      lastSyncedAt: null,
      hasData: false,

      // ── Actions ──────────────────────────────────────────────────────────

      setGoal: (goal) => set({ stepsGoal: Math.max(1, goal) }),

      syncSteps: async () => {
        set({ isSyncing: true });
        try {
          const steps = await healthService.getStepsToday();
          set({
            stepsToday: steps,
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            hasData: true,
          });
        } catch {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'fitmaster-activity',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist isSyncing
      partialize: (s) => ({
        stepsToday: s.stepsToday,
        stepsGoal: s.stepsGoal,
        lastSyncedAt: s.lastSyncedAt,
        hasData: s.hasData,
      }),
    },
  ),
);

export default useActivityStore;
