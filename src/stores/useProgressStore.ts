import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasurements, FitnessGoal } from '../types/user';
import progressService from '../services/progressService';
import { generateProgressInsights, type AIProgressInsights } from '../services/progressAnalyticsService';

interface WeightEntry {
  date: string;
  value: number;
}

interface MeasurementEntry {
  date: string;
  measurements: BodyMeasurements;
}

interface PhotoEntry {
  date: string;
  uri: string;
}

interface ProgressState {
  weightEntries: WeightEntry[];
  measurementEntries: MeasurementEntry[];
  photos: PhotoEntry[];
  isSyncing: boolean;
  aiInsights: AIProgressInsights | null;
  isLoadingInsights: boolean;
}

interface ProgressActions {
  // ── Local (sync) actions ──────────────────────────────────────────────────
  addWeight: (value: number) => void;
  addMeasurement: (measurements: BodyMeasurements) => void;
  addPhoto: (uri: string) => void;

  // ── Async actions ─────────────────────────────────────────────────────────
  addWeightAsync: (value: number) => Promise<void>;
  addMeasurementAsync: (measurements: BodyMeasurements) => Promise<void>;
  addPhotoAsync: (uri: string) => Promise<void>;
  syncAllAsync: () => Promise<void>;
  fetchInsightsAsync: (opts?: { goal?: FitnessGoal; targetWeightKg?: number; language?: 'en' | 'ro' }) => Promise<void>;
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────────
      weightEntries: [
        { date: '2026-01-15', value: 85 },
        { date: '2026-01-22', value: 84.5 },
        { date: '2026-01-29', value: 84.2 },
        { date: '2026-02-05', value: 83.8 },
        { date: '2026-02-12', value: 83.5 },
        { date: '2026-02-19', value: 82.9 },
        { date: '2026-02-26', value: 82.5 },
        { date: '2026-03-05', value: 82.0 },
        { date: '2026-03-12', value: 81.5 },
        { date: '2026-03-18', value: 80.0 },
      ],
      measurementEntries: [
        { date: '2026-03-01', measurements: { weight: 82, height: 178, age: 28, gender: 'male', chest: 102, waist: 82, hips: 98, biceps: 36, thighs: 58 } },
        { date: '2026-02-01', measurements: { weight: 84, height: 178, age: 28, gender: 'male', chest: 100, waist: 84, hips: 98, biceps: 35, thighs: 57 } },
      ],
      photos: [],
      isSyncing: false,
      aiInsights: null,
      isLoadingInsights: false,

      // ── Local actions ──────────────────────────────────────────────────────

      addWeight: (value) =>
        set((state) => ({
          weightEntries: [
            ...state.weightEntries,
            { date: new Date().toISOString().split('T')[0], value },
          ],
        })),

      addMeasurement: (measurements) =>
        set((state) => ({
          measurementEntries: [
            { date: new Date().toISOString().split('T')[0], measurements },
            ...state.measurementEntries,
          ],
        })),

      addPhoto: (uri) =>
        set((state) => ({
          photos: [{ date: new Date().toISOString().split('T')[0], uri }, ...state.photos],
        })),

      // ── Async actions ──────────────────────────────────────────────────────

      addWeightAsync: async (value) => {
        // Optimistic local update
        get().addWeight(value);
        try {
          const entry = await progressService.addWeight(value);
          // Swap last entry with server's canonical entry (has proper date from server)
          set((state) => ({
            weightEntries: [...state.weightEntries.slice(0, -1), entry],
          }));
        } catch {
          // Remove optimistic entry on failure
          set((state) => ({ weightEntries: state.weightEntries.slice(0, -1) }));
          throw new Error('Failed to save weight');
        }
      },

      addMeasurementAsync: async (measurements) => {
        get().addMeasurement(measurements);
        try {
          const entry = await progressService.addMeasurement(measurements);
          set((state) => ({
            measurementEntries: [entry, ...state.measurementEntries.slice(1)],
          }));
        } catch {
          set((state) => ({ measurementEntries: state.measurementEntries.slice(1) }));
          throw new Error('Failed to save measurements');
        }
      },

      addPhotoAsync: async (uri) => {
        get().addPhoto(uri);
        try {
          const entry = await progressService.addPhoto(uri);
          set((state) => ({
            photos: [entry, ...state.photos.slice(1)],
          }));
        } catch {
          set((state) => ({ photos: state.photos.slice(1) }));
          throw new Error('Failed to save photo');
        }
      },

      syncAllAsync: async () => {
        set({ isSyncing: true });
        try {
          const [weightEntries, measurementEntries, photos] = await Promise.all([
            progressService.getWeightHistory(),
            progressService.getMeasurements(),
            progressService.getPhotos(),
          ]);
          set({ weightEntries, measurementEntries, photos, isSyncing: false });
        } catch {
          set({ isSyncing: false });
        }
      },

      fetchInsightsAsync: async (opts = {}) => {
        const { weightEntries, measurementEntries } = get();
        if (weightEntries.length < 2) return;
        set({ isLoadingInsights: true });
        try {
          const insights = await generateProgressInsights({
            weightEntries,
            measurementEntries,
            goal: opts.goal,
            targetWeightKg: opts.targetWeightKg,
            language: opts.language ?? 'en',
          });
          set({ aiInsights: insights, isLoadingInsights: false });
        } catch {
          set({ isLoadingInsights: false });
        }
      },
    }),
    {
      name: 'fitmaster-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useProgressStore;
