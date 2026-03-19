import type { Achievement } from '../types/user';

export const achievements: Achievement[] = [
  { id: 'first-workout', name: 'First Step', nameRo: 'Primul Pas', description: 'Complete your first workout', descriptionRo: 'Completeaza primul antrenament', icon: '\u{1F3CB}', category: 'workout', requirement: '1 workout', unlockedAt: '2025-01-20' },
  { id: '10-workouts', name: 'Getting Serious', nameRo: 'Devine Serios', description: 'Complete 10 workouts', descriptionRo: 'Completeaza 10 antrenamente', icon: '\u{1F4AA}', category: 'workout', requirement: '10 workouts', unlockedAt: '2025-02-15' },
  { id: '50-workouts', name: 'Gym Rat', nameRo: 'Sobolanul Salii', description: 'Complete 50 workouts', descriptionRo: 'Completeaza 50 de antrenamente', icon: '\u{1F400}', category: 'workout', requirement: '50 workouts' },
  { id: '100-workouts', name: 'Century Club', nameRo: 'Clubul Centenarului', description: 'Complete 100 workouts', descriptionRo: 'Completeaza 100 de antrenamente', icon: '\u{1F3C6}', category: 'workout', requirement: '100 workouts' },
  { id: '7-day-streak', name: 'Week Warrior', nameRo: 'Razboinicul Saptamanii', description: 'Maintain a 7-day streak', descriptionRo: 'Mentine o serie de 7 zile', icon: '\u{1F525}', category: 'streak', requirement: '7 day streak', unlockedAt: '2025-03-01' },
  { id: '30-day-streak', name: 'Monthly Monster', nameRo: 'Monstrul Lunar', description: 'Maintain a 30-day streak', descriptionRo: 'Mentine o serie de 30 de zile', icon: '\u{1F31F}', category: 'streak', requirement: '30 day streak' },
  { id: 'first-pr', name: 'New Record', nameRo: 'Nou Record', description: 'Set your first personal record', descriptionRo: 'Stabileste primul record personal', icon: '\u{1F947}', category: 'pr', requirement: '1 PR', unlockedAt: '2025-01-25' },
  { id: 'bench-100', name: 'Bench Century', nameRo: 'Bench Centenar', description: 'Bench press 100kg', descriptionRo: 'Impinge 100kg la piept', icon: '\u{1F3CB}', category: 'pr', requirement: 'Bench 100kg', unlockedAt: '2026-03-17' },
  { id: 'squat-2x', name: 'Double Body Squat', nameRo: 'Genuflexiune Dubla', description: 'Squat 2x your bodyweight', descriptionRo: 'Genuflexiuni cu 2x greutatea corpului', icon: '\u26A1', category: 'pr', requirement: 'Squat 2x BW' },
  { id: 'first-plan', name: 'Plan Maker', nameRo: 'Creator de Plan', description: 'Start your first training plan', descriptionRo: 'Incepe primul plan de antrenament', icon: '\u{1F4CB}', category: 'plan', requirement: 'Start 1 plan' },
  { id: 'nutrition-7', name: 'Clean Eater', nameRo: 'Mancare Curata', description: 'Log nutrition for 7 consecutive days', descriptionRo: 'Inregistreaza nutritia 7 zile consecutiv', icon: '\u{1F34E}', category: 'nutrition', requirement: '7 day logging' },
  { id: 'water-champ', name: 'Hydration Hero', nameRo: 'Eroul Hidratarii', description: 'Hit your water goal 14 days in a row', descriptionRo: 'Atinge obiectivul de apa 14 zile la rand', icon: '\u{1F4A7}', category: 'nutrition', requirement: '14 days water goal' },
];
