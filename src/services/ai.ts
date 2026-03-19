// AI Service - Mock implementation for workout and diet plan generation
// Will be replaced with TensorFlow Lite or cloud AI when backend is ready

import { FitnessGoal, ActivityLevel } from '../types/user';
import { Equipment } from '../types/exercise';

interface AIWorkoutParams {
  goal: FitnessGoal;
  experience: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  equipment: Equipment[];
}

interface AIDietParams {
  goal: FitnessGoal;
  tdee: number;
  dietType: string;
  allergies?: string[];
}

export function generateWorkoutPlan(params: AIWorkoutParams): string {
  // Returns a workout plan ID from pre-built plans based on parameters
  const { goal, experience, daysPerWeek } = params;

  if (daysPerWeek <= 3) {
    if (experience === 'beginner') return 'beginner-full-body';
    return 'stronglifts-5x5';
  }
  if (daysPerWeek === 4) {
    return 'upper-lower-split';
  }
  if (goal === 'build_muscle') {
    return daysPerWeek >= 6 ? 'ppl-push-pull-legs' : 'hypertrophy-program';
  }
  if (goal === 'lose_weight') return 'hiit-fat-burn';
  if (goal === 'flexibility') return 'yoga-flexibility';

  return 'upper-lower-split';
}

export function generateDietPlan(params: AIDietParams) {
  const { goal, tdee } = params;
  let targetCalories = tdee;

  if (goal === 'lose_weight') targetCalories = Math.round(tdee * 0.8);
  else if (goal === 'build_muscle') targetCalories = Math.round(tdee * 1.15);

  const protein = Math.round((targetCalories * 0.3) / 4);
  const fat = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

  return {
    targetCalories,
    macros: { protein, carbs, fat },
    mealSuggestions: {
      breakfast: ['Oats with protein powder', 'Greek yogurt with berries', 'Egg white omelette'],
      lunch: ['Chicken breast with rice', 'Salmon with quinoa', 'Turkey wrap'],
      dinner: ['Grilled fish with vegetables', 'Lean beef stir fry', 'Tofu curry with rice'],
      snacks: ['Protein shake', 'Apple with peanut butter', 'Greek yogurt'],
    },
  };
}

export function getVoiceCoachMessage(context: string): string {
  const messages: Record<string, string[]> = {
    workout_start: [
      "Let's crush this workout! You've got this! 💪",
      'Time to get stronger. Focus on form today.',
      "Another day, another chance to be better. Let's go!",
    ],
    set_complete: [
      'Great set! Keep that energy up!',
      'Nice work! Rest up for the next one.',
      'Strong! One step closer to your goals.',
    ],
    workout_end: [
      'Amazing workout! Recovery starts now. 🎉',
      "You showed up and put in the work. That's what counts!",
      'Workout complete! Time to refuel with good nutrition.',
    ],
    pr_achieved: [
      'NEW PERSONAL RECORD! 🏆 You just got stronger!',
      'PR ALERT! All that hard work is paying off!',
      "You just broke your record! That's incredible!",
    ],
  };

  const contextMessages = messages[context] || messages.workout_start;
  return contextMessages[Math.floor(Math.random() * contextMessages.length)];
}
