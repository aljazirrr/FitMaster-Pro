/**
 * aiMealPlanService — AI-powered weekly meal plan generation using Claude.
 *
 * Generates a 7-day meal plan with breakfast/lunch/dinner/snacks,
 * macros per meal, grocery list, and prep tips.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { DietType, FitnessGoal } from '../types/user';

function makeClient() {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY_MISSING');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealPlanMeal {
  name: string;
  nameRo: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  prepTime: number; // minutes
  notes?: string;
}

export interface MealPlanDay {
  dayNumber: number;
  dayName: string;
  dayNameRo: string;
  breakfast: MealPlanMeal;
  lunch: MealPlanMeal;
  dinner: MealPlanMeal;
  snacks: MealPlanMeal;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface AIMealPlan {
  id: string;
  name: string;
  nameRo: string;
  goal: FitnessGoal;
  dietType: DietType;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  days: MealPlanDay[];
  groceryList: string[];
  prepTips: string[];
  createdAt: string;
}

export interface MealPlanParams {
  goal: FitnessGoal;
  dietType: DietType;
  targetCalories: number;
  weightKg: number;
  allergies?: string[];
  language?: 'en' | 'ro';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function goalLabel(goal: FitnessGoal): string {
  const map: Record<FitnessGoal, string> = {
    lose_weight: 'weight loss (caloric deficit, high protein)',
    build_muscle: 'muscle gain (caloric surplus, very high protein)',
    maintain: 'weight maintenance (balanced macros)',
    improve_endurance: 'endurance (high carbs, moderate protein)',
    flexibility: 'general health (balanced, anti-inflammatory)',
  };
  return map[goal];
}

function dietLabel(diet: DietType): string {
  const map: Record<DietType, string> = {
    standard: 'standard (omnivore)',
    vegan: 'vegan (no animal products)',
    vegetarian: 'vegetarian (no meat, allows eggs/dairy)',
    keto: 'ketogenic (very low carb, high fat)',
    paleo: 'paleo (whole foods, no grains/dairy)',
    mediterranean: 'mediterranean (olive oil, fish, vegetables, legumes)',
  };
  return map[diet];
}

function macroTargets(
  goal: FitnessGoal,
  calories: number,
  weightKg: number,
): { protein: number; carbs: number; fat: number } {
  const proteinPerKg: Record<FitnessGoal, number> = {
    lose_weight: 2.2,
    build_muscle: 2.5,
    maintain: 1.8,
    improve_endurance: 1.6,
    flexibility: 1.6,
  };
  const protein = Math.round(weightKg * proteinPerKg[goal]);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { protein, carbs, fat };
}

// ─── JSON parsing ─────────────────────────────────────────────────────────────

function parseMealPlanJSON(raw: string, params: MealPlanParams): AIMealPlan {
  const macros = macroTargets(params.goal, params.targetCalories, params.weightKg);

  // Strip markdown fences
  const clean = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  // Find outermost {}
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');

  const parsed = JSON.parse(clean.slice(start, end + 1));

  const days: MealPlanDay[] = (parsed.days ?? []).map((d: any, i: number) => {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const mealObjs: Record<string, MealPlanMeal> = {};

    for (const mt of meals) {
      const m = d[mt] ?? {};
      const meal: MealPlanMeal = {
        name: m.name ?? mt,
        nameRo: m.nameRo ?? m.name ?? mt,
        calories: Number(m.calories) || 0,
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fat: Number(m.fat) || 0,
        ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
        prepTime: Number(m.prepTime) || 15,
        notes: m.notes,
      };
      totalCalories += meal.calories;
      totalProtein += meal.protein;
      totalCarbs += meal.carbs;
      totalFat += meal.fat;
      mealObjs[mt] = meal;
    }

    const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const DAY_NAMES_RO = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

    return {
      dayNumber: i + 1,
      dayName: d.dayName ?? DAY_NAMES[i] ?? `Day ${i + 1}`,
      dayNameRo: d.dayNameRo ?? DAY_NAMES_RO[i] ?? `Ziua ${i + 1}`,
      breakfast: mealObjs.breakfast,
      lunch: mealObjs.lunch,
      dinner: mealObjs.dinner,
      snacks: mealObjs.snacks,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
    };
  });

  return {
    id: `meal-plan-${Date.now()}`,
    name: parsed.name ?? 'AI Meal Plan',
    nameRo: parsed.nameRo ?? 'Plan alimentar AI',
    goal: params.goal,
    dietType: params.dietType,
    targetCalories: params.targetCalories,
    targetProtein: macros.protein,
    targetCarbs: macros.carbs,
    targetFat: macros.fat,
    days,
    groceryList: Array.isArray(parsed.groceryList) ? parsed.groceryList : [],
    prepTips: Array.isArray(parsed.prepTips) ? parsed.prepTips : [],
    createdAt: new Date().toISOString(),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateAIMealPlan(
  params: MealPlanParams,
  onProgress?: (chunk: string) => void,
): Promise<AIMealPlan> {
  const isRo = params.language === 'ro';
  const macros = macroTargets(params.goal, params.targetCalories, params.weightKg);
  const allergiesStr =
    params.allergies && params.allergies.length > 0
      ? params.allergies.join(', ')
      : 'none';

  const prompt = isRo
    ? `Ești nutriționist expert. Generează un plan alimentar complet pentru 7 zile bazat pe:
- Obiectiv: ${goalLabel(params.goal)}
- Dietă: ${dietLabel(params.dietType)}
- Calorii zilnice: ${params.targetCalories} kcal
- Proteine țintă: ${macros.protein}g/zi
- Carbohidrați: ${macros.carbs}g/zi
- Grăsimi: ${macros.fat}g/zi
- Greutate: ${params.weightKg}kg
- Alergii/excluderi: ${allergiesStr}

Returnează DOAR JSON valid (fără markdown, fără text extra) cu această structură exactă:
{
  "name": "Meal Plan Name in English",
  "nameRo": "Numele planului în română",
  "days": [
    {
      "dayName": "Monday",
      "dayNameRo": "Luni",
      "breakfast": {
        "name": "Meal name EN", "nameRo": "Meal name RO",
        "calories": 450, "protein": 35, "carbs": 40, "fat": 12,
        "ingredients": ["200g Greek yogurt", "100g oats", "1 banana"],
        "prepTime": 10,
        "notes": "Optional tip"
      },
      "lunch": { ... same structure ... },
      "dinner": { ... same structure ... },
      "snacks": { ... same structure ... }
    },
    ... 7 days total
  ],
  "groceryList": ["Greek yogurt 1.4kg", "Oats 700g", ...],
  "prepTips": ["Prep chicken in bulk on Sunday", ...]
}`
    : `You are an expert nutritionist. Generate a complete 7-day meal plan based on:
- Goal: ${goalLabel(params.goal)}
- Diet type: ${dietLabel(params.dietType)}
- Daily calories: ${params.targetCalories} kcal
- Target protein: ${macros.protein}g/day
- Target carbs: ${macros.carbs}g/day
- Target fat: ${macros.fat}g/day
- Body weight: ${params.weightKg}kg
- Allergies/exclusions: ${allergiesStr}

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "name": "Meal Plan Name",
  "nameRo": "Numele planului în română",
  "days": [
    {
      "dayName": "Monday",
      "dayNameRo": "Luni",
      "breakfast": {
        "name": "Meal name", "nameRo": "Meal name RO",
        "calories": 450, "protein": 35, "carbs": 40, "fat": 12,
        "ingredients": ["200g Greek yogurt", "100g oats", "1 banana"],
        "prepTime": 10,
        "notes": "Optional tip"
      },
      "lunch": { ... same structure ... },
      "dinner": { ... same structure ... },
      "snacks": { ... same structure ... }
    },
    ... 7 days total
  ],
  "groceryList": ["Greek yogurt 1.4kg", "Oats 700g", ...],
  "prepTips": ["Prep chicken in bulk on Sunday", ...]
}`;

  // Non-streaming — React Native's fetch does not support SSE/streaming.
  const response = await makeClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = response.content.find((b) => b.type === 'text');
  const fullText = block?.type === 'text' ? block.text : '';
  onProgress?.(fullText);
  return parseMealPlanJSON(fullText, params);
}
