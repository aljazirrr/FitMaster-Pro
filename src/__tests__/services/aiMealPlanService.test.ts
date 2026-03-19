/**
 * Tests for aiMealPlanService
 */

import { generateAIMealPlan } from '../../services/aiMealPlanService';

const mockSdk = require('../../../__mocks__/@anthropic-ai/sdk');

const SAMPLE_PLAN = JSON.stringify({
  name: 'Muscle Gain Plan',
  nameRo: 'Plan pentru masă musculară',
  days: Array.from({ length: 7 }, (_, i) => ({
    dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
    dayNameRo: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'][i],
    breakfast: {
      name: 'Oatmeal with eggs', nameRo: 'Ovăz cu ouă',
      calories: 450, protein: 35, carbs: 50, fat: 10,
      ingredients: ['100g oats', '3 eggs'], prepTime: 10,
    },
    lunch: {
      name: 'Chicken and rice', nameRo: 'Pui cu orez',
      calories: 650, protein: 55, carbs: 70, fat: 12,
      ingredients: ['200g chicken', '150g rice'], prepTime: 20,
    },
    dinner: {
      name: 'Salmon with vegetables', nameRo: 'Somon cu legume',
      calories: 550, protein: 45, carbs: 30, fat: 22,
      ingredients: ['200g salmon', '200g broccoli'], prepTime: 25,
    },
    snacks: {
      name: 'Greek yogurt', nameRo: 'Iaurt grecesc',
      calories: 150, protein: 15, carbs: 10, fat: 3,
      ingredients: ['200g Greek yogurt', '1 tbsp honey'], prepTime: 2,
    },
  })),
  groceryList: ['Chicken breast 1.4kg', 'Salmon 400g', 'Oats 700g'],
  prepTips: ['Prep chicken on Sundays', 'Cook rice in bulk'],
});

beforeEach(() => {
  mockSdk._reset();
  mockSdk._setNextStream(SAMPLE_PLAN);
});

describe('generateAIMealPlan', () => {
  const baseParams = {
    goal: 'build_muscle' as const,
    dietType: 'standard' as const,
    targetCalories: 2200,
    weightKg: 80,
    language: 'en' as const,
  };

  it('returns a plan with correct metadata', async () => {
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.name).toBe('Muscle Gain Plan');
    expect(plan.goal).toBe('build_muscle');
    expect(plan.dietType).toBe('standard');
    expect(plan.targetCalories).toBe(2200);
    expect(plan.id).toMatch(/^meal-plan-/);
    expect(plan.createdAt).toBeTruthy();
  });

  it('returns 7 days', async () => {
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.days).toHaveLength(7);
  });

  it('each day has 4 meals', async () => {
    const plan = await generateAIMealPlan(baseParams);
    for (const day of plan.days) {
      expect(day.breakfast).toBeDefined();
      expect(day.lunch).toBeDefined();
      expect(day.dinner).toBeDefined();
      expect(day.snacks).toBeDefined();
    }
  });

  it('computes day totals correctly', async () => {
    const plan = await generateAIMealPlan(baseParams);
    const day = plan.days[0];
    const expectedCal = day.breakfast.calories + day.lunch.calories + day.dinner.calories + day.snacks.calories;
    expect(day.totalCalories).toBe(Math.round(expectedCal));
  });

  it('calculates protein target from weight', async () => {
    // build_muscle: 2.5g/kg * 80kg = 200g
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.targetProtein).toBe(200);
  });

  it('calculates protein target for lose_weight', async () => {
    mockSdk._setNextStream(SAMPLE_PLAN);
    const plan = await generateAIMealPlan({ ...baseParams, goal: 'lose_weight' });
    // lose_weight: 2.2g/kg * 80kg = 176g
    expect(plan.targetProtein).toBe(176);
  });

  it('includes grocery list', async () => {
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.groceryList).toHaveLength(3);
    expect(plan.groceryList[0]).toBe('Chicken breast 1.4kg');
  });

  it('includes prep tips', async () => {
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.prepTips).toHaveLength(2);
  });

  it('calls onProgress callback with streamed chunks', async () => {
    const chunks: string[] = [];
    await generateAIMealPlan(baseParams, (chunk) => chunks.push(chunk));
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toContain('Muscle Gain Plan');
  });

  it('strips markdown fences from response', async () => {
    const withFences = '```json\n' + SAMPLE_PLAN + '\n```';
    mockSdk._setNextStream(withFences);
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.name).toBe('Muscle Gain Plan');
  });

  it('uses Romanian name when language is ro', async () => {
    mockSdk._setNextStream(SAMPLE_PLAN);
    const plan = await generateAIMealPlan({ ...baseParams, language: 'ro' });
    expect(plan.nameRo).toBe('Plan pentru masă musculară');
  });

  it('assigns dayNumber starting from 1', async () => {
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.days[0].dayNumber).toBe(1);
    expect(plan.days[6].dayNumber).toBe(7);
  });

  it('throws on stream error (no fallback at plan level)', async () => {
    mockSdk._reset();
    mockSdk._setNextStreamError('API error');
    await expect(generateAIMealPlan(baseParams)).rejects.toThrow();
  });

  it('assigns meal ingredients as arrays', async () => {
    const plan = await generateAIMealPlan(baseParams);
    expect(Array.isArray(plan.days[0].breakfast.ingredients)).toBe(true);
    expect(plan.days[0].breakfast.ingredients[0]).toBe('100g oats');
  });

  it('handles missing optional fields gracefully', async () => {
    const minimalPlan = JSON.stringify({
      name: 'Minimal Plan',
      nameRo: 'Plan minimal',
      days: [
        {
          dayName: 'Monday', dayNameRo: 'Luni',
          breakfast: { name: 'Toast', nameRo: 'Pâine prăjită', calories: 200, protein: 5, carbs: 30, fat: 5, ingredients: [] },
          lunch: { name: 'Salad', nameRo: 'Salată', calories: 300, protein: 10, carbs: 20, fat: 10, ingredients: [] },
          dinner: { name: 'Soup', nameRo: 'Supă', calories: 250, protein: 8, carbs: 25, fat: 8, ingredients: [] },
          snacks: { name: 'Fruit', nameRo: 'Fruct', calories: 80, protein: 1, carbs: 18, fat: 0, ingredients: [] },
        },
      ],
    });
    mockSdk._reset();
    mockSdk._setNextStream(minimalPlan);
    const plan = await generateAIMealPlan(baseParams);
    expect(plan.name).toBe('Minimal Plan');
    expect(plan.days).toHaveLength(1);
    expect(plan.groceryList).toEqual([]);
    expect(plan.prepTips).toEqual([]);
  });
});
