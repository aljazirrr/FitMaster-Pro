/**
 * aiFoodService — AI-powered nutritional value estimation.
 *
 * Given a food name and weight in grams, Claude estimates
 * calories, protein, carbs, fat, and fiber.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { FoodItem } from '../types/nutrition';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }, { signal: controller.signal });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    // Strip any accidental markdown fences
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
  } finally {
    clearTimeout(timeout);
  }
}
