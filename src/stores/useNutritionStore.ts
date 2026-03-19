import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DailyNutrition,
  MealEntry,
  MealType,
  ShoppingItem,
  FoodItem,
} from '../types/nutrition';
import nutritionService from '../services/nutritionService';

interface NutritionState {
  dailyLog: Record<string, DailyNutrition>;
  shoppingList: ShoppingItem[];
  foodSearchResults: FoodItem[];
  isSyncing: boolean;
}

interface NutritionActions {
  // ── Local (sync) actions ──────────────────────────────────────────────────
  addMealEntry: (date: string, mealType: MealType, foodId: string, servings: number) => void;
  removeMealEntry: (date: string, mealType: MealType, entryId: string) => void;
  updateWater: (date: string, amount: number) => void;
  setDailyTargets: (
    date: string,
    targets: { calories: number; protein: number; carbs: number; fat: number },
  ) => void;
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void;
  toggleShoppingItem: (itemId: string) => void;
  clearShoppingList: () => void;
  getDailyNutrition: (date: string) => DailyNutrition;

  // ── Async actions ─────────────────────────────────────────────────────────
  fetchDailyLogAsync: (date: string) => Promise<void>;
  addMealEntryAsync: (date: string, mealType: MealType, foodId: string, servings: number) => Promise<void>;
  removeMealEntryAsync: (date: string, mealType: MealType, entryId: string) => Promise<void>;
  updateWaterAsync: (date: string, amount: number) => Promise<void>;
  searchFoodsAsync: (query: string) => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const todayStr = new Date().toISOString().split('T')[0];

function createDefaultDaily(date: string): DailyNutrition {
  return {
    date,
    targetCalories: 2500,
    targetProtein: 180,
    targetCarbs: 280,
    targetFat: 70,
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    water: { current: 0, target: 8 },
  };
}

const defaultTodayLog: DailyNutrition = {
  date: todayStr,
  targetCalories: 2500,
  targetProtein: 180,
  targetCarbs: 280,
  targetFat: 70,
  meals: {
    breakfast: [
      { id: 'me1', foodId: 'oatmeal', servings: 1, mealType: 'breakfast', timestamp: `${todayStr}T08:00:00` },
      { id: 'me2', foodId: 'banana', servings: 1, mealType: 'breakfast', timestamp: `${todayStr}T08:00:00` },
    ],
    lunch: [
      { id: 'me3', foodId: 'chicken-breast', servings: 1.5, mealType: 'lunch', timestamp: `${todayStr}T12:30:00` },
      { id: 'me4', foodId: 'brown-rice', servings: 1, mealType: 'lunch', timestamp: `${todayStr}T12:30:00` },
    ],
    dinner: [],
    snacks: [
      { id: 'me5', foodId: 'protein-shake', servings: 1, mealType: 'snacks', timestamp: `${todayStr}T16:00:00` },
    ],
  },
  water: { current: 5, target: 8 },
};

export const useNutritionStore = create<NutritionState & NutritionActions>()(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────────
      dailyLog: { [todayStr]: defaultTodayLog },
      shoppingList: [],
      foodSearchResults: [],
      isSyncing: false,

      // ── Local actions ──────────────────────────────────────────────────────

      addMealEntry: (date, mealType, foodId, servings) =>
        set((state) => {
          const day = state.dailyLog[date] ?? createDefaultDaily(date);
          const entry: MealEntry = {
            id: generateId(),
            foodId,
            servings,
            mealType,
            timestamp: new Date().toISOString(),
          };
          const meals = { ...day.meals, [mealType]: [...day.meals[mealType], entry] };
          return { dailyLog: { ...state.dailyLog, [date]: { ...day, meals } } };
        }),

      removeMealEntry: (date, mealType, entryId) =>
        set((state) => {
          const day = state.dailyLog[date];
          if (!day) return state;
          const meals = {
            ...day.meals,
            [mealType]: day.meals[mealType].filter((e) => e.id !== entryId),
          };
          return { dailyLog: { ...state.dailyLog, [date]: { ...day, meals } } };
        }),

      updateWater: (date, amount) =>
        set((state) => {
          const day = state.dailyLog[date] ?? createDefaultDaily(date);
          return {
            dailyLog: {
              ...state.dailyLog,
              [date]: {
                ...day,
                water: { ...day.water, current: Math.max(0, day.water.current + amount) },
              },
            },
          };
        }),

      setDailyTargets: (date, targets) =>
        set((state) => {
          const day = state.dailyLog[date] ?? createDefaultDaily(date);
          return {
            dailyLog: {
              ...state.dailyLog,
              [date]: {
                ...day,
                targetCalories: targets.calories,
                targetProtein: targets.protein,
                targetCarbs: targets.carbs,
                targetFat: targets.fat,
              },
            },
          };
        }),

      addShoppingItem: (item) =>
        set((state) => ({
          shoppingList: [...state.shoppingList, { ...item, id: generateId(), checked: false }],
        })),

      toggleShoppingItem: (itemId) =>
        set((state) => ({
          shoppingList: state.shoppingList.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        })),

      clearShoppingList: () => set({ shoppingList: [] }),

      getDailyNutrition: (date) => {
        const state = get();
        return state.dailyLog[date] ?? createDefaultDaily(date);
      },

      // ── Async actions ──────────────────────────────────────────────────────

      fetchDailyLogAsync: async (date) => {
        set({ isSyncing: true });
        try {
          const daily = await nutritionService.getDailyLog(date);
          set((state) => ({
            dailyLog: { ...state.dailyLog, [date]: daily },
            isSyncing: false,
          }));
        } catch {
          set({ isSyncing: false });
        }
      },

      addMealEntryAsync: async (date, mealType, foodId, servings) => {
        // Optimistic local update first
        get().addMealEntry(date, mealType, foodId, servings);
        try {
          const serverEntry = await nutritionService.addMealEntry(date, mealType, { foodId, servings });
          // Swap optimistic entry for server entry (so the ID matches the backend)
          set((state) => {
            const day = state.dailyLog[date];
            if (!day) return state;
            const meals = {
              ...day.meals,
              [mealType]: [
                // Remove last entry (optimistic) and append server entry
                ...day.meals[mealType].slice(0, -1),
                serverEntry,
              ],
            };
            return { dailyLog: { ...state.dailyLog, [date]: { ...day, meals } } };
          });
        } catch {
          // Optimistic entry stays — will sync on next fetchDailyLogAsync
        }
      },

      removeMealEntryAsync: async (date, mealType, entryId) => {
        // Optimistic remove
        get().removeMealEntry(date, mealType, entryId);
        try {
          await nutritionService.removeMealEntry(date, mealType, entryId);
        } catch {
          // Refetch to restore consistency
          get().fetchDailyLogAsync(date);
        }
      },

      updateWaterAsync: async (date, amount) => {
        // Optimistic local update
        get().updateWater(date, amount);
        try {
          await nutritionService.updateWater(date, amount);
        } catch {
          // Undo optimistic update on failure
          get().updateWater(date, -amount);
        }
      },

      searchFoodsAsync: async (query) => {
        try {
          const results = await nutritionService.searchFoods(query);
          set({ foodSearchResults: results });
        } catch {
          set({ foodSearchResults: [] });
        }
      },
    }),
    {
      name: 'fitmaster-nutrition',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient UI state
      partialize: (state) => ({
        dailyLog: state.dailyLog,
        shoppingList: state.shoppingList,
      }),
    },
  ),
);

export default useNutritionStore;
