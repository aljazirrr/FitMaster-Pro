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
];
