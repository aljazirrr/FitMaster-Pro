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
import { Linking, Platform } from 'react-native';
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
  /** True once Health Connect permission was explicitly granted by the user */
  permissionGranted: boolean;
  /** True once the first successful sync has completed */
  hasData: boolean;
}

interface ActivityActions {
  setGoal: (goal: number) => void;
  syncSteps: () => Promise<void>;
  /**
   * Must be called from a button press.
   * On Android: opens Health Connect via Linking (avoids native crash from requestPermission),
   * then tries to silently read steps to detect if permission was already granted.
   * On iOS: requests HealthKit permission normally.
   */
  requestPermissionAndSync: () => Promise<'granted' | 'denied' | 'unavailable' | 'not_installed' | 'opened_hc'>;
}

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    (set) => ({
      // ── State ────────────────────────────────────────────────────────────
      stepsToday: 0,
      stepsGoal: 10_000,
      isSyncing: false,
      lastSyncedAt: null,
      permissionGranted: false,
      hasData: false,

      // ── Actions ──────────────────────────────────────────────────────────

      setGoal: (goal) => set({ stepsGoal: Math.max(1, goal) }),

      syncSteps: async () => {
        // Only sync silently if permission was already granted — don't set
        // permissionGranted or hasData here, those come from requestPermissionAndSync.
        set({ isSyncing: true });
        try {
          const steps = await healthService.getStepsToday();
          // Only update stepsToday — don't touch permissionGranted/hasData
          // (those are set only after an explicit user permission grant)
          set((s) => ({
            stepsToday: steps,
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            // Keep hasData true if it was already true; don't flip to true here
            hasData: s.hasData,
          }));
        } catch {
          set({ isSyncing: false });
        }
      },

      requestPermissionAndSync: async () => {
        set({ isSyncing: true });
        try {
          if (Platform.OS === 'android') {
            // ─── Android: NEVER call requestPermission() natively — it crashes ───
            // Instead:
            //   1. Try to silently read steps (works if permission was already granted)
            //   2. If reading succeeds → mark as connected
            //   3. If reading fails → open Health Connect app via Linking so the
            //      user can grant permissions there, then return here and tap again.
            let steps = 0;
            let readOk = false;
            try {
              steps = await healthService.getStepsToday();
              readOk = true;
            } catch {
              readOk = false;
            }

            if (readOk) {
              set({
                stepsToday: steps,
                isSyncing: false,
                lastSyncedAt: new Date().toISOString(),
                permissionGranted: true,
                hasData: true,
              });
              return 'granted';
            }

            // Permission not yet granted — open Health Connect so user can allow it
            set({ isSyncing: false });
            try {
              const hcUrl = 'healthconnect://';
              const canOpen = await Linking.canOpenURL(hcUrl);
              if (canOpen) {
                await Linking.openURL(hcUrl);
                return 'opened_hc';
              }
            } catch {
              // Linking failed — HC not installed
            }
            return 'not_installed';
          }

          // ─── iOS: standard HealthKit permission request (doesn't crash) ───
          const available = await healthService.isAvailable();
          if (!available) {
            set({ isSyncing: false });
            return 'not_installed';
          }
          const granted = await healthService.requestStepsPermission();
          if (!granted) {
            set({ isSyncing: false });
            return 'denied';
          }
          const steps = await healthService.getStepsToday();
          set({
            stepsToday: steps,
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            permissionGranted: true,
            hasData: true,
          });
          return 'granted';
        } catch {
          set({ isSyncing: false });
          return 'unavailable';
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
        permissionGranted: s.permissionGranted,
        hasData: s.hasData,
      }),
    },
  ),
);

export default useActivityStore;
