/**
 * Barcode Food Scanner Service
 *
 * Flow:
 *  1. Look up barcode in local food DB (instant, offline)
 *  2. Fetch from Open Food Facts API (free, no key needed)
 *  3. If data is incomplete / not found → ask Claude to fill in estimates
 */

import Anthropic from '@anthropic-ai/sdk';
import { foods } from '../data/foods';
import type { FoodItem } from '../types/nutrition';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

// ─── Open Food Facts ─────────────────────────────────────────────────────────

const OFF_BASE = 'https://world.openfoodfacts.org/api/v0/product';

interface OFFProduct {
  product_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
}

interface OFFResponse {
  status: number; // 1 = found, 0 = not found
  product?: OFFProduct;
}

function parseServing(product: OFFProduct): { size: number; unit: string } {
  if (product.serving_quantity && product.serving_quantity > 0) {
    const unit = product.serving_size?.replace(/[\d.,\s]+/, '').trim() || 'g';
    return { size: product.serving_quantity, unit };
  }
  return { size: 100, unit: 'g' };
}

function generateId(barcode: string): string {
  return `barcode-${barcode}`;
}

function offProductToFoodItem(barcode: string, product: OFFProduct): FoodItem | null {
  const n = product.nutriments;
  if (!n) return null;

  const calories = n['energy-kcal_100g'] ?? n['energy-kcal_serving'];
  const protein = n.proteins_100g;
  const carbs = n.carbohydrates_100g;
  const fat = n.fat_100g;

  // Require at least name + calories to be usable
  if (!product.product_name || calories == null) return null;

  const serving = parseServing(product);
  // Scale nutrients from 100g basis if serving size differs
  const scale = serving.unit === 'g' ? serving.size / 100 : 1;

  return {
    id: generateId(barcode),
    name: product.product_name,
    nameRo: product.product_name, // will be filled by AI if available
    brand: product.brands,
    barcode,
    serving,
    calories: Math.round((calories ?? 0) * (serving.unit === 'g' ? scale : 1)),
    protein: Math.round(((protein ?? 0) * scale + Number.EPSILON) * 10) / 10,
    carbs: Math.round(((carbs ?? 0) * scale + Number.EPSILON) * 10) / 10,
    fat: Math.round(((fat ?? 0) * scale + Number.EPSILON) * 10) / 10,
    fiber: n.fiber_100g != null ? Math.round(n.fiber_100g * scale * 10) / 10 : undefined,
    sugar: n.sugars_100g != null ? Math.round(n.sugars_100g * scale * 10) / 10 : undefined,
    sodium: n.sodium_100g != null ? Math.round(n.sodium_100g * scale * 10) / 10 : undefined,
  };
}

async function fetchFromOpenFoodFacts(barcode: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`${OFF_BASE}/${barcode}.json`);
    if (!res.ok) return null;
    const data: OFFResponse = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return offProductToFoodItem(barcode, data.product);
  } catch {
    return null;
  }
}

// ─── Claude AI Fallback ───────────────────────────────────────────────────────

async function enrichWithClaude(
  barcode: string,
  partialItem: Partial<FoodItem> | null,
  language: 'en' | 'ro' = 'en',
): Promise<FoodItem> {
  const isRo = language === 'ro';
  const productHint = partialItem?.name ? `Product name: "${partialItem.name}"` : '';
  const brandHint = partialItem?.brand ? `, Brand: "${partialItem.brand}"` : '';

  const prompt = isRo
    ? `Barcode: ${barcode}. ${productHint}${brandHint}
Estimeaza informatiile nutritionale pentru acest produs alimentar si returneaza DOAR JSON valid (fara markdown, fara text extra):
{
  "name": "Numele produsului in engleza",
  "nameRo": "Numele produsului in romana",
  "brand": "Marca (sau null)",
  "serving": { "size": numar, "unit": "g sau ml sau bucata" },
  "calories": numar,
  "protein": numar,
  "carbs": numar,
  "fat": numar,
  "fiber": numar_sau_null,
  "sugar": numar_sau_null,
  "sodium": numar_sau_null
}
Daca nu recunosti codul de bare, estimeaza un produs generic de snack de 100g.`
    : `Barcode: ${barcode}. ${productHint}${brandHint}
Estimate nutritional information for this food product and return ONLY valid JSON (no markdown, no extra text):
{
  "name": "Product name in English",
  "nameRo": "Product name in Romanian",
  "brand": "Brand name or null",
  "serving": { "size": number, "unit": "g or ml or piece" },
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number_or_null,
  "sugar": number_or_null,
  "sodium": number_or_null
}
If you don't recognize the barcode, estimate a generic 100g snack product.`;

  const fallback: FoodItem = {
    id: generateId(barcode),
    name: partialItem?.name ?? 'Unknown Product',
    nameRo: partialItem?.name ?? 'Produs necunoscut',
    brand: partialItem?.brand,
    barcode,
    serving: partialItem?.serving ?? { size: 100, unit: 'g' },
    calories: partialItem?.calories ?? 150,
    protein: partialItem?.protein ?? 5,
    carbs: partialItem?.carbs ?? 20,
    fat: partialItem?.fat ?? 5,
  };

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return fallback;

    const raw = block.text.trim();
    // Strip markdown fences if present
    const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(json);

    return {
      id: generateId(barcode),
      name: parsed.name ?? fallback.name,
      nameRo: parsed.nameRo ?? fallback.nameRo,
      brand: parsed.brand ?? fallback.brand,
      barcode,
      serving: parsed.serving ?? fallback.serving,
      calories: Number(parsed.calories) || fallback.calories,
      protein: Number(parsed.protein) || fallback.protein,
      carbs: Number(parsed.carbs) || fallback.carbs,
      fat: Number(parsed.fat) || fallback.fat,
      fiber: parsed.fiber != null ? Number(parsed.fiber) : undefined,
      sugar: parsed.sugar != null ? Number(parsed.sugar) : undefined,
      sodium: parsed.sodium != null ? Number(parsed.sodium) : undefined,
    };
  } catch {
    return fallback;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BarcodeLookupResult {
  foodItem: FoodItem;
  source: 'local' | 'openfoodfacts' | 'ai';
}

/**
 * Main entry point.
 * Returns a FoodItem for the given barcode, trying local → OFF → Claude.
 */
export async function lookupBarcode(
  barcode: string,
  language: 'en' | 'ro' = 'en',
): Promise<BarcodeLookupResult> {
  // 1. Local database (instant)
  const localMatch = foods.find((f) => f.barcode === barcode);
  if (localMatch) return { foodItem: localMatch, source: 'local' };

  // 2. Open Food Facts (free public API)
  const offResult = await fetchFromOpenFoodFacts(barcode);
  if (offResult) {
    // Enrich with Claude: translate to Romanian AND verify the product name
    // (OFH sometimes has wrong products for regional barcodes)
    try {
      const enriched = await enrichWithClaude(barcode, offResult, language);
      offResult.nameRo = enriched.nameRo;
      // If Claude returned a significantly different name, trust Claude's version
      // (handles the case where OFH has wrong product for a Romanian barcode)
      if (
        enriched.name &&
        enriched.name !== 'Unknown Product' &&
        enriched.name.toLowerCase() !== offResult.name.toLowerCase()
      ) {
        offResult.name = enriched.name;
        offResult.calories = enriched.calories;
        offResult.protein = enriched.protein;
        offResult.carbs = enriched.carbs;
        offResult.fat = enriched.fat;
        if (enriched.fiber != null) offResult.fiber = enriched.fiber;
        if (enriched.sugar != null) offResult.sugar = enriched.sugar;
        if (enriched.sodium != null) offResult.sodium = enriched.sodium;
      }
    } catch {
      // keep original OFH data
    }
    return { foodItem: offResult, source: 'openfoodfacts' };
  }

  // 3. Claude AI as last resort
  const aiResult = await enrichWithClaude(barcode, null, language);
  return { foodItem: aiResult, source: 'ai' };
}

/**
 * Force re-lookup using only Claude AI, bypassing Open Food Facts.
 * Use when the OFH result appears incorrect.
 */
export async function lookupBarcodeWithAI(
  barcode: string,
  language: 'en' | 'ro' = 'en',
): Promise<BarcodeLookupResult> {
  const aiResult = await enrichWithClaude(barcode, null, language);
  return { foodItem: aiResult, source: 'ai' };
}

/**
 * Validates that a string looks like a barcode (digits only, 8–14 chars).
 */
export function isValidBarcode(value: string): boolean {
  return /^\d{8,14}$/.test(value);
}
