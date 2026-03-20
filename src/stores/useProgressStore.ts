import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasurements, FitnessGoal } from '../types/user';
import progressService from '../services/progressService';
import { generateProgressInsights, type AIProgressInsights } from '../services/progressAnalyticsService';
import { saveWeightEntry, saveMeasurement, fetchWeightLog, fetchMeasurements } from '../services/firestoreService';

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
  removePhoto: (uri: string) => void;

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
      weightEntries: [],
      measurementEntries: [],
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

      removePhoto: (uri) =>
        set((state) => ({
          photos: state.photos.filter((p) => p.uri !== uri),
        })),

      // ── Async actions ──────────────────────────────────────────────────────

      addWeightAsync: async (value) => {
        // Optimistic local update
        get().addWeight(value);
        const entry = { date: new Date().toISOString().slice(0, 10), value };
        // Sync to Firestore (fire-and-forget)
        saveWeightEntry(entry).catch(() => {});
        try {
          const serverEntry = await progressService.addWeight(value);
          set((state) => ({
            weightEntries: [...state.weightEntries.slice(0, -1), serverEntry],
          }));
        } catch {
          // Keep local entry; Firestore already has it
        }
      },

      addMeasurementAsync: async (measurements) => {
        get().addMeasurement(measurements);
        const entry = { date: new Date().toISOString().slice(0, 10), measurements: measurements as unknown as Record<string, number> };
        saveMeasurement(entry).catch(() => {});
        try {
          const serverEntry = await progressService.addMeasurement(measurements);
          set((state) => ({
            measurementEntries: [serverEntry, ...state.measurementEntries.slice(1)],
          }));
        } catch {
          // Keep local entry
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
          // Try Firestore first; fall back to REST API
          const [fsWeight, fsMeas] = await Promise.all([
            fetchWeightLog().catch(() => []),
            fetchMeasurements().catch(() => []),
          ]);

          if (fsWeight.length > 0 || fsMeas.length > 0) {
            set({
              weightEntries: fsWeight as any[],
              measurementEntries: fsMeas as any[],
              isSyncing: false,
            });
          } else {
            const [weightEntries, measurementEntries, photos] = await Promise.all([
              progressService.getWeightHistory(),
              progressService.getMeasurements(),
              progressService.getPhotos(),
            ]);
            set({ weightEntries, measurementEntries, photos, isSyncing: false });
          }
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
