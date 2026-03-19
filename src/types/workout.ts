export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  type: SetType;
  completed: boolean;
  rpe?: number;
  restSeconds?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  isSuperset: boolean;
  supersetWith?: string;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  exercises: WorkoutExercise[];
  notes?: string;
  completed: boolean;
}

export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutDayExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: WorkoutDayExercise[];
}

export interface WorkoutWeek {
  weekNumber: number;
  days: WorkoutDay[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  nameRo: string;
  description: string;
  descriptionRo: string;
  level: WorkoutLevel;
  daysPerWeek: number;
  category: string;
  weeks: WorkoutWeek[];
  createdBy: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  oneRepMax: number;
}
