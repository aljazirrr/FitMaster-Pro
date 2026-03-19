export enum MuscleGroup {
  Chest = 'chest',
  Back = 'back',
  Shoulders = 'shoulders',
  Biceps = 'biceps',
  Triceps = 'triceps',
  Forearms = 'forearms',
  Core = 'core',
  Quads = 'quads',
  Hamstrings = 'hamstrings',
  Glutes = 'glutes',
  Calves = 'calves',
  FullBody = 'fullBody',
}

export enum Equipment {
  Barbell = 'barbell',
  Dumbbell = 'dumbbell',
  Machine = 'machine',
  Cable = 'cable',
  Bodyweight = 'bodyweight',
  Kettlebell = 'kettlebell',
  Bands = 'bands',
  Smith = 'smith',
  EzBar = 'ezBar',
  TrapBar = 'trapBar',
  Other = 'other',
}

export enum ExerciseCategory {
  Strength = 'strength',
  Cardio = 'cardio',
  Stretching = 'stretching',
  Plyometric = 'plyometric',
  Olympic = 'olympic',
  Powerlifting = 'powerlifting',
}

export interface Exercise {
  id: string;
  name: string;
  nameRo: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  category: ExerciseCategory;
  instructions: string[];
  tips: string[];
  imageUrl?: string;
}
