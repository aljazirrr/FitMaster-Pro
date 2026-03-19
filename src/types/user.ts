import type { Equipment } from './exercise';

export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance' | 'flexibility';

export type DietType = 'standard' | 'vegan' | 'vegetarian' | 'keto' | 'paleo' | 'mediterranean';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Gender = 'male' | 'female' | 'other';

export type UnitSystem = 'metric' | 'imperial';

export interface BodyMeasurements {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
}

export interface Achievement {
  id: string;
  name: string;
  nameRo: string;
  description: string;
  descriptionRo: string;
  icon: string;
  category: string;
  requirement: string;
  unlockedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  goals: FitnessGoal[];
  measurements: BodyMeasurements;
  experience: string;
  activityLevel: ActivityLevel;
  equipment: Equipment[];
  dietPreference: DietType;
  language: string;
  theme: string;
  unitSystem: UnitSystem;
  isPremium: boolean;
  streakDays: number;
  achievements: Achievement[];
  joinDate: string;
  lastActive: string;
}
