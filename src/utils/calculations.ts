import type { FitnessGoal } from '../types/user';

/**
 * Calculate one-rep max using Epley or Brzycki formula.
 */
export function calculateOneRM(
  weight: number,
  reps: number,
  formula: 'epley' | 'brzycki' = 'epley'
): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;

  if (formula === 'epley') {
    return Math.round(weight * (1 + reps / 30));
  }
  // Brzycki
  return Math.round(weight * (36 / (37 - reps)));
}

/**
 * Calculate BMI from weight (kg) and height (cm).
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Calculate Total Daily Energy Expenditure using Mifflin-St Jeor equation.
 */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // male or other
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * (activityMultipliers[activityLevel] ?? 1.55));
}

/**
 * Calculate macro split based on TDEE and fitness goal.
 * Returns grams of protein, carbs, and fat.
 */
export function calculateMacros(
  tdee: number,
  goal: FitnessGoal
): { protein: number; carbs: number; fat: number } {
  let proteinPct: number;
  let fatPct: number;
  let carbsPct: number;
  let calorieAdjustment = 0;

  switch (goal) {
    case 'lose_weight':
      calorieAdjustment = -500;
      proteinPct = 0.35;
      fatPct = 0.3;
      carbsPct = 0.35;
      break;
    case 'build_muscle':
      calorieAdjustment = 300;
      proteinPct = 0.3;
      fatPct = 0.25;
      carbsPct = 0.45;
      break;
    case 'improve_endurance':
      proteinPct = 0.2;
      fatPct = 0.25;
      carbsPct = 0.55;
      break;
    case 'flexibility':
      proteinPct = 0.25;
      fatPct = 0.3;
      carbsPct = 0.45;
      break;
    case 'maintain':
    default:
      proteinPct = 0.25;
      fatPct = 0.3;
      carbsPct = 0.45;
      break;
  }

  const adjustedCalories = tdee + calorieAdjustment;

  return {
    protein: Math.round((adjustedCalories * proteinPct) / 4),
    carbs: Math.round((adjustedCalories * carbsPct) / 4),
    fat: Math.round((adjustedCalories * fatPct) / 9),
  };
}

/**
 * Calculate plates needed per side for a given target weight.
 * Standard plates: 25, 20, 15, 10, 5, 2.5, 1.25 kg.
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number = 20
): number[] {
  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const plates: number[] = [];

  let remaining = (targetWeight - barWeight) / 2;

  if (remaining <= 0) return plates;

  for (const plate of availablePlates) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }

  return plates;
}

/**
 * Convert kilograms to pounds.
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Convert pounds to kilograms.
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 10) / 10;
}
