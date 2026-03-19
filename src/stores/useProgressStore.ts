import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasurements } from '../types/user';

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
}

interface ProgressActions {
  addWeight: (value: number) => void;
  addMeasurement: (measurements: BodyMeasurements) => void;
  addPhoto: (uri: string) => void;
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set) => ({
      // State
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
        {
          date: '2026-03-01',
          measurements: {
            weight: 82,
            height: 178,
            age: 28,
            gender: 'male',
            chest: 102,
            waist: 82,
            hips: 98,
            biceps: 36,
            thighs: 58,
          },
        },
        {
          date: '2026-02-01',
          measurements: {
            weight: 84,
            height: 178,
            age: 28,
            gender: 'male',
            chest: 100,
            waist: 84,
            hips: 98,
            biceps: 35,
            thighs: 57,
          },
        },
      ],
      photos: [],

      // Actions
      addWeight: (value: number) =>
        set((state) => ({
          weightEntries: [
            ...state.weightEntries,
            { date: new Date().toISOString().split('T')[0], value },
          ],
        })),

      addMeasurement: (measurements: BodyMeasurements) =>
        set((state) => ({
          measurementEntries: [
            {
              date: new Date().toISOString().split('T')[0],
              measurements,
            },
            ...state.measurementEntries,
          ],
        })),

      addPhoto: (uri: string) =>
        set((state) => ({
          photos: [
            {
              date: new Date().toISOString().split('T')[0],
              uri,
            },
            ...state.photos,
          ],
        })),
    }),
    {
      name: 'fitmaster-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useProgressStore;
