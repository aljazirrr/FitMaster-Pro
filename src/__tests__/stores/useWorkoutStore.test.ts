import { useWorkoutStore } from '../../stores/useWorkoutStore';

const emptyState = {
  activeWorkout: null,
  workoutHistory: [],
  personalRecords: [],
  totalWorkouts: 0,
  weeklyWorkouts: 0,
};

beforeEach(() => {
  useWorkoutStore.setState(emptyState);
});

describe('useWorkoutStore', () => {
  describe('initial state', () => {
    it('has no active workout', () => {
      expect(useWorkoutStore.getState().activeWorkout).toBeNull();
    });

    it('starts with empty history', () => {
      expect(useWorkoutStore.getState().workoutHistory).toHaveLength(0);
    });
  });

  describe('startWorkout', () => {
    it('creates an active workout with default name', () => {
      useWorkoutStore.getState().startWorkout();
      const { activeWorkout } = useWorkoutStore.getState();
      expect(activeWorkout).not.toBeNull();
      expect(activeWorkout?.name).toBe('Workout');
      expect(activeWorkout?.completed).toBe(false);
      expect(activeWorkout?.exercises).toHaveLength(0);
    });

    it('uses custom name when provided', () => {
      useWorkoutStore.getState().startWorkout('Push Day');
      expect(useWorkoutStore.getState().activeWorkout?.name).toBe('Push Day');
    });

    it('sets today as workout date', () => {
      useWorkoutStore.getState().startWorkout();
      const today = new Date().toISOString().split('T')[0];
      expect(useWorkoutStore.getState().activeWorkout?.date).toBe(today);
    });
  });

  describe('addExercise', () => {
    it('adds exercise to active workout', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      const { exercises } = useWorkoutStore.getState().activeWorkout!;
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseId).toBe('bench-press');
    });

    it('adds a default empty set with the exercise', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('squat');
      const exercise = useWorkoutStore.getState().activeWorkout!.exercises[0];
      expect(exercise.sets).toHaveLength(1);
      expect(exercise.sets[0].reps).toBe(0);
      expect(exercise.sets[0].weight).toBe(0);
      expect(exercise.sets[0].completed).toBe(false);
    });

    it('does nothing when no active workout', () => {
      useWorkoutStore.getState().addExercise('bench-press');
      expect(useWorkoutStore.getState().activeWorkout).toBeNull();
    });

    it('can add multiple exercises', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      useWorkoutStore.getState().addExercise('squat');
      expect(useWorkoutStore.getState().activeWorkout!.exercises).toHaveLength(2);
    });
  });

  describe('addSet', () => {
    it('adds a set to an exercise by exerciseId', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      const exId = useWorkoutStore.getState().activeWorkout!.exercises[0].exerciseId;
      useWorkoutStore.getState().addSet(exId);
      expect(useWorkoutStore.getState().activeWorkout!.exercises[0].sets).toHaveLength(2);
    });

    it('copies last set reps/weight to new set', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      const ex = useWorkoutStore.getState().activeWorkout!.exercises[0];
      useWorkoutStore.getState().updateSet(ex.exerciseId, ex.sets[0].id, { reps: 10, weight: 80 });
      useWorkoutStore.getState().addSet(ex.exerciseId);
      const sets = useWorkoutStore.getState().activeWorkout!.exercises[0].sets;
      expect(sets[1].reps).toBe(10);
      expect(sets[1].weight).toBe(80);
    });
  });

  describe('updateSet', () => {
    it('updates set properties', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      const ex = useWorkoutStore.getState().activeWorkout!.exercises[0];
      const setId = ex.sets[0].id;
      useWorkoutStore.getState().updateSet(ex.exerciseId, setId, { reps: 12, weight: 100, completed: true });
      const updatedSet = useWorkoutStore.getState().activeWorkout!.exercises[0].sets[0];
      expect(updatedSet.reps).toBe(12);
      expect(updatedSet.weight).toBe(100);
      expect(updatedSet.completed).toBe(true);
    });
  });

  describe('removeSet', () => {
    it('removes a specific set by id', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      const ex = useWorkoutStore.getState().activeWorkout!.exercises[0];
      useWorkoutStore.getState().addSet(ex.exerciseId);
      expect(useWorkoutStore.getState().activeWorkout!.exercises[0].sets).toHaveLength(2);
      const firstSetId = useWorkoutStore.getState().activeWorkout!.exercises[0].sets[0].id;
      useWorkoutStore.getState().removeSet(ex.exerciseId, firstSetId);
      expect(useWorkoutStore.getState().activeWorkout!.exercises[0].sets).toHaveLength(1);
    });
  });

  describe('removeExercise', () => {
    it('removes exercise by index', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().addExercise('bench-press');
      useWorkoutStore.getState().addExercise('squat');
      useWorkoutStore.getState().removeExercise(0);
      const { exercises } = useWorkoutStore.getState().activeWorkout!;
      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseId).toBe('squat');
    });
  });

  describe('cancelWorkout', () => {
    it('clears active workout without saving', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().cancelWorkout();
      expect(useWorkoutStore.getState().activeWorkout).toBeNull();
      expect(useWorkoutStore.getState().workoutHistory).toHaveLength(0);
    });
  });

  describe('finishWorkout', () => {
    it('moves active workout to history', () => {
      useWorkoutStore.getState().startWorkout('Test Workout');
      useWorkoutStore.getState().finishWorkout();
      const state = useWorkoutStore.getState();
      expect(state.activeWorkout).toBeNull();
      expect(state.workoutHistory).toHaveLength(1);
      expect(state.workoutHistory[0].name).toBe('Test Workout');
      expect(state.workoutHistory[0].completed).toBe(true);
    });

    it('increments totalWorkouts and weeklyWorkouts', () => {
      useWorkoutStore.setState({ ...emptyState, totalWorkouts: 5, weeklyWorkouts: 2 });
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().finishWorkout();
      expect(useWorkoutStore.getState().totalWorkouts).toBe(6);
      expect(useWorkoutStore.getState().weeklyWorkouts).toBe(3);
    });

    it('does nothing when no active workout', () => {
      useWorkoutStore.getState().finishWorkout();
      expect(useWorkoutStore.getState().workoutHistory).toHaveLength(0);
    });

    it('saves endTime and duration', () => {
      useWorkoutStore.getState().startWorkout();
      useWorkoutStore.getState().finishWorkout();
      const completed = useWorkoutStore.getState().workoutHistory[0];
      expect(completed.endTime).toBeTruthy();
      expect(completed.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addPersonalRecord', () => {
    it('adds a new personal record', () => {
      const pr = { id: 'pr1', exerciseId: 'bench-press', weight: 100, reps: 5, date: '2026-03-19', oneRepMax: 117 };
      useWorkoutStore.getState().addPersonalRecord(pr);
      expect(useWorkoutStore.getState().personalRecords).toHaveLength(1);
      expect(useWorkoutStore.getState().personalRecords[0]).toEqual(pr);
    });

    it('keeps the better record for the same exercise', () => {
      const pr1 = { id: 'pr1', exerciseId: 'squat', weight: 120, reps: 5, date: '2026-03-10', oneRepMax: 140 };
      const pr2 = { id: 'pr2', exerciseId: 'squat', weight: 130, reps: 5, date: '2026-03-19', oneRepMax: 152 };
      useWorkoutStore.getState().addPersonalRecord(pr1);
      useWorkoutStore.getState().addPersonalRecord(pr2);
      // pr1 has oneRepMax 140 < 152, so it gets removed and pr2 is added
      const records = useWorkoutStore.getState().personalRecords;
      expect(records).toHaveLength(1);
      expect(records[0].oneRepMax).toBe(152);
    });

    it('keeps different exercises separately', () => {
      const pr1 = { id: 'pr1', exerciseId: 'squat', weight: 120, reps: 5, date: '2026-03-19', oneRepMax: 140 };
      const pr2 = { id: 'pr2', exerciseId: 'deadlift', weight: 150, reps: 5, date: '2026-03-19', oneRepMax: 175 };
      useWorkoutStore.getState().addPersonalRecord(pr1);
      useWorkoutStore.getState().addPersonalRecord(pr2);
      expect(useWorkoutStore.getState().personalRecords).toHaveLength(2);
    });
  });
});
