import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  WorkoutPlan,
  PersonalRecord,
} from '../types/workout';
import workoutService from '../services/workoutService';
import { saveWorkoutSession, fetchWorkoutHistory, savePersonalRecord, fetchPersonalRecords } from '../services/firestoreService';

interface WorkoutState {
  activeWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  personalRecords: PersonalRecord[];
  totalWorkouts: number;
  weeklyWorkouts: number;
  isSyncing: boolean;
  savedPlans: WorkoutPlan[];
}

interface WorkoutActions {
  // ── Local (sync) actions ──────────────────────────────────────────────────
  startWorkout: (name?: string) => void;
  saveGeneratedPlan: (plan: WorkoutPlan) => void;
  removeGeneratedPlan: (planId: string) => void;
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

export const useWorkoutStore = create<WorkoutState & WorkoutActions>()(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────────
      activeWorkout: null,
      workoutHistory: [],
      savedPlans: [],
      personalRecords: [],
      totalWorkouts: 0,
      weeklyWorkouts: 0,
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

      saveGeneratedPlan: (plan) =>
        set((state) => ({
          savedPlans: [plan, ...state.savedPlans.filter((p) => p.id !== plan.id)],
        })),

      removeGeneratedPlan: (planId) =>
        set((state) => ({
          savedPlans: state.savedPlans.filter((p) => p.id !== planId),
        })),

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

        // Persist to Firestore (fire-and-forget — local state is already updated)
        saveWorkoutSession(completedWorkout).catch(() => {});

        // Also try legacy REST API if available
        try {
          const saved = await workoutService.save({
            name: completedWorkout.name,
            date: completedWorkout.date,
            startTime: completedWorkout.startTime,
            endTime: completedWorkout.endTime!,
            duration: completedWorkout.duration,
            exercises: completedWorkout.exercises,
          });
          set((state) => ({
            workoutHistory: state.workoutHistory.map((w) =>
              w.id === completedWorkout.id ? saved : w,
            ),
          }));
        } catch {
          // Offline — local entry remains
        }
      },

      syncHistoryAsync: async () => {
        set({ isSyncing: true });
        try {
          // Prefer Firestore; fall back to REST API
          const firebaseHistory = await fetchWorkoutHistory();
          if (firebaseHistory.length > 0) {
            set({ workoutHistory: firebaseHistory, isSyncing: false });
          } else {
            const history = await workoutService.getHistory();
            set({ workoutHistory: history, isSyncing: false });
          }
        } catch {
          set({ isSyncing: false });
        }
      },

      syncPersonalRecordsAsync: async () => {
        try {
          const firebaseRecords = await fetchPersonalRecords();
          if (firebaseRecords.length > 0) {
            set({ personalRecords: firebaseRecords });
          } else {
            const records = await workoutService.getPersonalRecords();
            set({ personalRecords: records });
          }
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
