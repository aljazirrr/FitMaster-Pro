import client from './api';
import { ENDPOINTS } from '../constants/api';
import type { DailyNutrition, MealEntry, MealType, FoodItem } from '../types/nutrition';

export interface AddMealEntryPayload {
  foodId: string;
  servings: number;
}

export interface DailyTargetsPayload {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const nutritionService = {
  /**
   * Fetch the full daily nutrition log for a given date (YYYY-MM-DD).
   * Returns default targets and empty meals if no log exists yet.
   */
  async getDailyLog(date: string): Promise<DailyNutrition> {
    return client.get<DailyNutrition>(ENDPOINTS.nutrition.dailyLog(date));
  },

  /**
   * Add a food entry to a specific meal for the given date.
   */
  async addMealEntry(
    date: string,
    mealType: MealType,
    payload: AddMealEntryPayload,
  ): Promise<MealEntry> {
    return client.post<MealEntry>(
      ENDPOINTS.nutrition.mealEntry(date, mealType),
      payload,
    );
  },

  /**
   * Remove a food entry from a meal.
   */
  async removeMealEntry(
    date: string,
    mealType: MealType,
    entryId: string,
  ): Promise<void> {
    return client.delete<void>(
      ENDPOINTS.nutrition.mealEntryById(date, mealType, entryId),
    );
  },

  /**
   * Update the water intake for a date.
   * `amount` is a delta (positive to add, negative to remove).
   */
  async updateWater(date: string, amount: number): Promise<{ current: number }> {
    return client.patch<{ current: number }>(
      ENDPOINTS.nutrition.water(date),
      { amount },
    );
  },

  /**
   * Set the calorie and macro targets for a date.
   */
  async setDailyTargets(
    date: string,
    targets: DailyTargetsPayload,
  ): Promise<DailyNutrition> {
    return client.put<DailyNutrition>(
      ENDPOINTS.nutrition.targets(date),
      targets,
    );
  },

  /**
   * Search the food database.
   * Returns matching FoodItem entries from the backend (or third-party USDA/Open Food Facts proxy).
   */
  async searchFoods(query: string, limit = 20): Promise<FoodItem[]> {
    return client.get<FoodItem[]>(ENDPOINTS.nutrition.foodSearch, {
      params: { q: query, limit },
    });
  },
};

export default nutritionService;
