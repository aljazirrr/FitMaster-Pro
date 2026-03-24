/**
 * aiFoodService — AI-powered nutritional value estimation.
 *
 * Given a food name and weight in grams, Claude estimates
 * calories, protein, carbs, fat, and fiber.
 * Calls the FitMaster AI proxy server (same pattern as aiPlanService).
 */
import { callAI } from './aiServerClient';
import type { FoodItem } from '../types/nutrition';

function generateId(): string {
  return 'custom-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export async function estimateFoodMacros(
  foodName: string,
  grams: number,
  language: 'en' | 'ro' = 'en',
): Promise<FoodItem> {
  const prompt = `You are a nutrition expert. Estimate the nutritional values for:
Food: "${foodName}"
Amount: ${grams}g

Return ONLY valid JSON, no markdown, no extra text:
{
  "name": "English food name",
  "nameRo": "Denumirea în română",
  "calories": <number for ${grams}g>,
  "protein": <grams of protein>,
  "carbs": <grams of carbs>,
  "fat": <grams of fat>,
  "fiber": <grams of fiber or 0>
}

Use standard nutritional databases (USDA, etc.) as reference. Round to 1 decimal place.`;

  const raw = await callAI('/ai/food-macros', { prompt });
  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  const data = JSON.parse(jsonStr);

  return {
    id: generateId(),
    name: data.name ?? foodName,
    nameRo: data.nameRo ?? foodName,
    serving: { size: grams, unit: 'g' },
    calories: Number(data.calories) || 0,
    protein: Number(data.protein) || 0,
    carbs: Number(data.carbs) || 0,
    fat: Number(data.fat) || 0,
    fiber: data.fiber != null ? Number(data.fiber) : undefined,
  };
}
