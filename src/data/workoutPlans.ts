import type { WorkoutPlan } from '../types/workout';

export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'ppl-beginner',
    name: 'Push Pull Legs - Beginner',
    nameRo: 'Impins Tras Picioare - Incepator',
    description: 'A classic 3-day push/pull/legs split perfect for beginners learning compound movements.',
    descriptionRo: 'Un split clasic de 3 zile impins/tras/picioare, perfect pentru incepatori.',
    level: 'beginner',
    daysPerWeek: 3,
    category: 'hypertrophy',
    createdBy: 'FitMaster',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            name: 'Push Day',
            exercises: [
              { exerciseId: 'bench-press', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'overhead-press', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'incline-bench', sets: 3, reps: 12, restSeconds: 60 },
              { exerciseId: 'lateral-raise', sets: 3, reps: 15, restSeconds: 60 },
              { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Pull Day',
            exercises: [
              { exerciseId: 'deadlift', sets: 3, reps: 5, restSeconds: 120 },
              { exerciseId: 'barbell-row', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restSeconds: 60 },
              { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 60 },
              { exerciseId: 'dumbbell-curl', sets: 3, reps: 12, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Leg Day',
            exercises: [
              { exerciseId: 'squat', sets: 3, reps: 8, restSeconds: 120 },
              { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 90 },
              { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
              { exerciseId: 'calf-raise', sets: 4, reps: 15, restSeconds: 45 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper Lower Split',
    nameRo: 'Split Superior Inferior',
    description: 'A 4-day upper/lower split for intermediate lifters looking to build strength and size.',
    descriptionRo: 'Un split de 4 zile superior/inferior pentru sportivi intermediari.',
    level: 'intermediate',
    daysPerWeek: 4,
    category: 'strength',
    createdBy: 'FitMaster',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            name: 'Upper A',
            exercises: [
              { exerciseId: 'bench-press', sets: 4, reps: 6, restSeconds: 120 },
              { exerciseId: 'barbell-row', sets: 4, reps: 6, restSeconds: 120 },
              { exerciseId: 'overhead-press', sets: 3, reps: 8, restSeconds: 90 },
              { exerciseId: 'dumbbell-curl', sets: 3, reps: 10, restSeconds: 60 },
              { exerciseId: 'tricep-pushdown', sets: 3, reps: 10, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Lower A',
            exercises: [
              { exerciseId: 'squat', sets: 4, reps: 6, restSeconds: 120 },
              { exerciseId: 'romanian-deadlift', sets: 3, reps: 8, restSeconds: 90 },
              { exerciseId: 'leg-press', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
              { exerciseId: 'calf-raise', sets: 4, reps: 12, restSeconds: 45 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Upper B',
            exercises: [
              { exerciseId: 'incline-bench', sets: 4, reps: 8, restSeconds: 90 },
              { exerciseId: 'lat-pulldown', sets: 4, reps: 8, restSeconds: 90 },
              { exerciseId: 'lateral-raise', sets: 3, reps: 15, restSeconds: 60 },
              { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 60 },
              { exerciseId: 'dumbbell-fly', sets: 3, reps: 12, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 4,
            name: 'Lower B',
            exercises: [
              { exerciseId: 'deadlift', sets: 4, reps: 5, restSeconds: 180 },
              { exerciseId: 'leg-press', sets: 3, reps: 12, restSeconds: 90 },
              { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
              { exerciseId: 'calf-raise', sets: 4, reps: 15, restSeconds: 45 },
              { exerciseId: 'plank', sets: 3, reps: 60, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'full-body-3x',
    name: 'Full Body 3x per Week',
    nameRo: 'Corp Complet 3x pe Saptamana',
    description: 'Train your entire body three times per week. Great for busy schedules and maximizing frequency.',
    descriptionRo: 'Antreneaza-ti intregul corp de 3 ori pe saptamana. Ideal pentru programme incarcate.',
    level: 'beginner',
    daysPerWeek: 3,
    category: 'general',
    createdBy: 'FitMaster',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            name: 'Full Body A',
            exercises: [
              { exerciseId: 'squat', sets: 3, reps: 8, restSeconds: 120 },
              { exerciseId: 'bench-press', sets: 3, reps: 8, restSeconds: 90 },
              { exerciseId: 'barbell-row', sets: 3, reps: 8, restSeconds: 90 },
              { exerciseId: 'lateral-raise', sets: 2, reps: 15, restSeconds: 60 },
              { exerciseId: 'plank', sets: 2, reps: 45, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Full Body B',
            exercises: [
              { exerciseId: 'deadlift', sets: 3, reps: 5, restSeconds: 120 },
              { exerciseId: 'overhead-press', sets: 3, reps: 8, restSeconds: 90 },
              { exerciseId: 'lat-pulldown', sets: 3, reps: 10, restSeconds: 60 },
              { exerciseId: 'leg-curl', sets: 3, reps: 12, restSeconds: 60 },
              { exerciseId: 'dumbbell-curl', sets: 2, reps: 12, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Full Body C',
            exercises: [
              { exerciseId: 'leg-press', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'incline-bench', sets: 3, reps: 10, restSeconds: 90 },
              { exerciseId: 'pull-up', sets: 3, reps: 8, restSeconds: 90 },
              { exerciseId: 'face-pull', sets: 3, reps: 15, restSeconds: 60 },
              { exerciseId: 'tricep-pushdown', sets: 2, reps: 12, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },

  // ── Pilates ───────────────────────────────────────────────────────────────
  {
    id: 'pilates-beginner',
    name: 'Pilates Foundation',
    nameRo: 'Pilates - Fundament',
    description: 'A 4-week beginner Pilates program focusing on core strength, posture, and body awareness using mat-based exercises.',
    descriptionRo: 'Program Pilates de 4 saptamani pentru incepatori, axat pe forta core, postura si constientizarea corpului.',
    level: 'beginner',
    daysPerWeek: 3,
    category: 'pilates',
    createdBy: 'FitMaster',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            name: 'Core Activation',
            exercises: [
              { exerciseId: 'pilates-hundred', sets: 2, reps: 1, restSeconds: 60 },
              { exerciseId: 'pilates-roll-up', sets: 3, reps: 6, restSeconds: 60 },
              { exerciseId: 'pilates-leg-circle', sets: 2, reps: 5, restSeconds: 45 },
              { exerciseId: 'cat-cow', sets: 2, reps: 10, restSeconds: 30 },
              { exerciseId: 'plank', sets: 3, reps: 20, restSeconds: 60 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Spine & Mobility',
            exercises: [
              { exerciseId: 'pilates-swan', sets: 3, reps: 8, restSeconds: 45 },
              { exerciseId: 'cat-cow', sets: 3, reps: 12, restSeconds: 30 },
              { exerciseId: 'hip-flexor-stretch', sets: 2, reps: 30, restSeconds: 30 },
              { exerciseId: 'worlds-greatest-stretch', sets: 2, reps: 5, restSeconds: 30 },
              { exerciseId: 'yoga-child', sets: 2, reps: 60, restSeconds: 30 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Full Mat Flow',
            exercises: [
              { exerciseId: 'pilates-hundred', sets: 1, reps: 1, restSeconds: 30 },
              { exerciseId: 'pilates-roll-up', sets: 3, reps: 8, restSeconds: 60 },
              { exerciseId: 'pilates-leg-circle', sets: 3, reps: 6, restSeconds: 45 },
              { exerciseId: 'pilates-swan', sets: 3, reps: 8, restSeconds: 45 },
              { exerciseId: 'pilates-teaser', sets: 2, reps: 5, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },

  // ── Yoga ─────────────────────────────────────────────────────────────────
  {
    id: 'yoga-beginner-flow',
    name: 'Morning Yoga Flow',
    nameRo: 'Yoga de Dimineata',
    description: 'A gentle beginner yoga program to build flexibility, balance, and mindfulness. Perfect for morning routines.',
    descriptionRo: 'Program yoga blând pentru incepatori, ideal pentru rutina de dimineata. Imbunatateste flexibilitatea si echilibrul.',
    level: 'beginner',
    daysPerWeek: 4,
    category: 'yoga',
    createdBy: 'FitMaster',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            name: 'Sun Salutation Foundation',
            exercises: [
              { exerciseId: 'yoga-downward-dog', sets: 3, reps: 10, restSeconds: 30 },
              { exerciseId: 'yoga-warrior1', sets: 3, reps: 30, restSeconds: 30 },
              { exerciseId: 'cat-cow', sets: 3, reps: 10, restSeconds: 30 },
              { exerciseId: 'yoga-child', sets: 2, reps: 60, restSeconds: 30 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Balance & Strength',
            exercises: [
              { exerciseId: 'yoga-tree', sets: 3, reps: 30, restSeconds: 30 },
              { exerciseId: 'yoga-warrior1', sets: 3, reps: 30, restSeconds: 30 },
              { exerciseId: 'yoga-downward-dog', sets: 4, reps: 10, restSeconds: 30 },
              { exerciseId: 'plank', sets: 3, reps: 20, restSeconds: 45 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Hip Opening',
            exercises: [
              { exerciseId: 'hip-flexor-stretch', sets: 3, reps: 45, restSeconds: 30 },
              { exerciseId: 'worlds-greatest-stretch', sets: 3, reps: 5, restSeconds: 30 },
              { exerciseId: 'yoga-downward-dog', sets: 3, reps: 10, restSeconds: 30 },
              { exerciseId: 'yoga-child', sets: 3, reps: 60, restSeconds: 30 },
            ],
          },
          {
            dayNumber: 4,
            name: 'Restorative Flow',
            exercises: [
              { exerciseId: 'cat-cow', sets: 3, reps: 12, restSeconds: 30 },
              { exerciseId: 'yoga-tree', sets: 2, reps: 45, restSeconds: 30 },
              { exerciseId: 'pilates-swan', sets: 3, reps: 8, restSeconds: 30 },
              { exerciseId: 'yoga-child', sets: 3, reps: 90, restSeconds: 30 },
            ],
          },
        ],
      },
    ],
  },

  // ── HIIT ─────────────────────────────────────────────────────────────────
  {
    id: 'hiit-beginner',
    name: 'HIIT Basics',
    nameRo: 'HIIT pentru Incepatori',
    description: '3-day beginner HIIT program with short intense intervals and full rest periods. Burns fat and builds conditioning.',
    descriptionRo: 'Program HIIT de 3 zile pentru incepatori. Intervale scurte si intense, ardere eficienta de grasime.',
    level: 'beginner',
    daysPerWeek: 3,
    category: 'hiit',
    createdBy: 'FitMaster',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            name: 'Bodyweight Circuit',
            exercises: [
              { exerciseId: 'push-up', sets: 4, reps: 15, restSeconds: 30 },
              { exerciseId: 'squat', sets: 4, reps: 20, restSeconds: 30 },
              { exerciseId: 'plank', sets: 4, reps: 30, restSeconds: 30 },
              { exerciseId: 'kettlebell-swing', sets: 4, reps: 15, restSeconds: 30 },
            ],
          },
          {
            dayNumber: 2,
            name: 'Tabata Core',
            exercises: [
              { exerciseId: 'plank', sets: 8, reps: 20, restSeconds: 10 },
              { exerciseId: 'push-up', sets: 8, reps: 10, restSeconds: 10 },
              { exerciseId: 'squat', sets: 8, reps: 15, restSeconds: 10 },
            ],
          },
          {
            dayNumber: 3,
            name: 'Full Body Blast',
            exercises: [
              { exerciseId: 'kettlebell-swing', sets: 5, reps: 20, restSeconds: 20 },
              { exerciseId: 'push-up', sets: 5, reps: 15, restSeconds: 20 },
              { exerciseId: 'squat', sets: 5, reps: 20, restSeconds: 20 },
              { exerciseId: 'plank', sets: 3, reps: 45, restSeconds: 30 },
            ],
          },
        ],
      },
    ],
  },
];
