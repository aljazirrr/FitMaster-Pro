import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  PersonalRecord,
} from '../types/workout';
import workoutService from '../services/workoutService';

interface WorkoutState {
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  personalRecords: PersonalRecord[];
  totalWorkouts: number;
  weeklyWorkouts: number;
  isSyncing: boolean;
}

interface WorkoutActions {
  // ── Local (sync) actions ──────────────────────────────────────────────────
  startWorkout: (name?: string) => void;
  addExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeExercise: (exerciseIndex: number) => void;
  cancelWorkout: () => void;
  addPersonalRecord: (record: PersonalRecord) => void;

  // ── Async actions ─────────────────────────────────────────────────────────
  finishWorkout: () => Promise<void>;
  syncHistoryAsync: () => Promise<void>;
  syncPersonalRecordsAsync: () => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const mockHistory: WorkoutSession[] = [
  {
    id: 'w1',
    name: 'Push Day',
    date: '2026-03-17',
    startTime: '2026-03-17T09:00:00',
    endTime: '2026-03-17T10:15:00',
    duration: 4500,
    exercises: [
      {
        id: 'we1',
        exerciseId: 'bench-press',
        sets: [
          { id: 's1', reps: 10, weight: 80, type: 'normal', completed: true },
          { id: 's2', reps: 8, weight: 90, type: 'normal', completed: true },
          { id: 's3', reps: 6, weight: 100, type: 'normal', completed: true },
        ],
        isSuperset: false,
      },
    ],
    completed: true,
  },
  {
    id: 'w2',
    name: 'Pull Day',
    date: '2026-03-16',
    startTime: '2026-03-16T08:00:00',
    endTime: '2026-03-16T09:20:00',
    duration: 4800,
    exercises: [
      {
        id: 'we2',
        exerciseId: 'deadlift',
        sets: [
          { id: 's4', reps: 5, weight: 140, type: 'normal', completed: true },
          { id: 's5', reps: 5, weight: 150, type: 'normal', completed: true },
        ],
        isSuperset: false,
      },
    ],
    completed: true,
  },
  {
    id: 'w3',
    name: 'Leg Day',
    date: '2026-03-15',
    startTime: '2026-03-15T10:00:00',
    endTime: '2026-03-15T11:30:00',
    duration: 5400,
    exercises: [
      {
        id: 'we3',
        exerciseId: 'squat',
        sets: [
          { id: 's6', reps: 8, weight: 120, type: 'normal', completed: true },
          { id: 's7', reps: 6, weight: 130, type: 'normal', completed: true },
        ],
        isSuperset: false,
      },
    ],
    completed: true,
  },
];

export const useWorkoutStore = create<WorkoutState & WorkoutActions>()(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────────
      activeWorkout: null,
      workoutHistory: mockHistory,
      personalRecords: [
        { id: 'pr1', exerciseId: 'bench-press', weight: 100, reps: 6, date: '2026-03-17', oneRepMax: 116 },
        { id: 'pr2', exerciseId: 'squat', weight: 130, reps: 6, date: '2026-03-15', oneRepMax: 152 },
        { id: 'pr3', exerciseId: 'deadlift', weight: 150, reps: 5, date: '2026-03-16', oneRepMax: 175 },
      ],
      totalWorkouts: 47,
      weeklyWorkouts: 3,
      isSyncing: false,

      // ── Local actions ──────────────────────────────────────────────────────

      startWorkout: (name) =>
        set({
          activeWorkout: {
            id: generateId(),
            name: name ?? 'Workout',
            date: new Date().toISOString().split('T')[0],
            startTime: new Date().toISOString(),
            duration: 0,
            exercises: [],
            completed: false,
          },
        }),

      addExercise: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newExercise: WorkoutExercise = {
            id: generateId(),
            exerciseId,
            sets: [{ id: generateId(), reps: 0, weight: 0, type: 'normal', completed: false }],
            isSuperset: false,
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, newExercise],
            },
          };
        }),

      addSet: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exercises = state.activeWorkout.exercises.map((ex) => {
            if (ex.id !== exerciseId && ex.exerciseId !== exerciseId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet: WorkoutSet = {
              id: generateId(),
              reps: lastSet?.reps ?? 0,
              weight: lastSet?.weight ?? 0,
              type: 'normal',
              completed: false,
            };
            return { ...ex, sets: [...ex.sets, newSet] };
          });
          return { activeWorkout: { ...state.activeWorkout, exercises } };
        }),

      updateSet: (exerciseId, setId, updates) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exercises = state.activeWorkout.exercises.map((ex) => {
            if (ex.id !== exerciseId && ex.exerciseId !== exerciseId) return ex;
            return { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)) };
          });
          return { activeWorkout: { ...state.activeWorkout, exercises } };
        }),

      removeSet: (exerciseId, setId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exercises = state.activeWorkout.exercises.map((ex) => {
            if (ex.id !== exerciseId && ex.exerciseId !== exerciseId) return ex;
            return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
          });
          return { activeWorkout: { ...state.activeWorkout, exercises } };
        }),

      removeExercise: (exerciseIndex) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exercises = [...state.activeWorkout.exercises];
          exercises.splice(exerciseIndex, 1);
          return { activeWorkout: { ...state.activeWorkout, exercises } };
        }),

      cancelWorkout: () => set({ activeWorkout: null }),

      addPersonalRecord: (record) =>
        set((state) => ({
          personalRecords: [
            ...state.personalRecords.filter(
              (pr) => pr.exerciseId !== record.exerciseId || pr.oneRepMax > record.oneRepMax,
            ),
            record,
          ],
        })),

      // ── Async actions ──────────────────────────────────────────────────────

      finishWorkout: async () => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        const now = new Date();
        const startTime = new Date(activeWorkout.startTime);
        const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

        const completedWorkout: WorkoutSession = {
          ...activeWorkout,
          endTime: now.toISOString(),
          duration: durationSeconds,
          completed: true,
        };

        // Optimistic local update
        set((state) => ({
          activeWorkout: null,
          workoutHistory: [completedWorkout, ...state.workoutHistory],
          totalWorkouts: state.totalWorkouts + 1,
          weeklyWorkouts: state.weeklyWorkouts + 1,
        }));

        // Persist to backend (fire-and-forget — local state is already updated)
        try {
          const saved = await workoutService.save({
            name: completedWorkout.name,
            date: completedWorkout.date,
            startTime: completedWorkout.startTime,
            endTime: completedWorkout.endTime!,
            duration: completedWorkout.duration,
            exercises: completedWorkout.exercises,
          });
          // Replace optimistic entry with server's canonical version (has real ID)
          set((state) => ({
            workoutHistory: state.workoutHistory.map((w) =>
              w.id === completedWorkout.id ? saved : w,
            ),
          }));
        } catch {
          // Offline — local entry remains; will sync on next syncHistoryAsync call
        }
      },

      syncHistoryAsync: async () => {
        set({ isSyncing: true });
        try {
          const history = await workoutService.getHistory();
          set({ workoutHistory: history, isSyncing: false });
        } catch {
          set({ isSyncing: false });
        }
      },

      syncPersonalRecordsAsync: async () => {
        try {
          const records = await workoutService.getPersonalRecords();
          set({ personalRecords: records });
        } catch {
          // Silently keep local records
        }
      },
    }),
    {
      name: 'fitmaster-workouts',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useWorkoutStore;
