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
        set({ isSyncing: true });
        try {
          const steps = await healthService.getStepsToday();
          // getStepsToday returns 0 silently when permission is denied.
          // We cannot distinguish 0-steps-with-permission from 0-steps-without.
          // Best proxy: if we got here without an exception from the HC module
          // itself, treat it as a successful read and mark permission as granted.
          // This auto-detects permission after the user grants it in HC app.
          set({
            stepsToday: steps,
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            permissionGranted: true,
            hasData: true,
          });
        } catch {
          // HC threw — permission not granted yet or module unavailable
          set({ isSyncing: false });
        }
      },

      requestPermissionAndSync: async () => {
        // ── Android ─────────────────────────────────────────────────────────
        // HC.requestPermission() crashes the Android Activity in builds that
        // pre-date the manifest regeneration. We do ZERO native HC calls here.
        // Instead: open Health Connect via Linking so the user can grant the
        // permission there.  syncSteps() (called on mount / pull-to-refresh)
        // will automatically detect the granted permission next time.
        if (Platform.OS === 'android') {
          try {
            const canOpen = await Linking.canOpenURL('healthconnect://');
            if (canOpen) {
              await Linking.openURL('healthconnect://');
              return 'opened_hc';
            }
          } catch {
            // ignore
          }
          return 'not_installed';
        }

        // ── iOS ─────────────────────────────────────────────────────────────
        set({ isSyncing: true });
        try {
          const available = await healthService.isAvailable();
          if (!available) { set({ isSyncing: false }); return 'not_installed'; }
          const granted = await healthService.requestStepsPermission();
          if (!granted) { set({ isSyncing: false }); return 'denied'; }
          const steps = await healthService.getStepsToday();
          set({ stepsToday: steps, isSyncing: false, lastSyncedAt: new Date().toISOString(), permissionGranted: true, hasData: true });
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
