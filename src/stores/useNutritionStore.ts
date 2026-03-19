import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DailyNutrition,
  MealEntry,
  MealType,
  ShoppingItem,
} from '../types/nutrition';

interface NutritionState {
  dailyLog: Record<string, DailyNutrition>;
  shoppingList: ShoppingItem[];
}

interface NutritionActions {
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
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    },
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
      // State
      dailyLog: {
        [todayStr]: defaultTodayLog,
      },
      shoppingList: [],

      // Actions
      addMealEntry: (
        date: string,
        mealType: MealType,
        foodId: string,
        servings: number,
      ) =>
        set((state) => {
          const day = state.dailyLog[date] ?? createDefaultDaily(date);
          const entry: MealEntry = {
            id: generateId(),
            foodId,
            servings,
            mealType,
            timestamp: new Date().toISOString(),
          };
          const meals = { ...day.meals };
          meals[mealType] = [...meals[mealType], entry];

          return {
            dailyLog: {
              ...state.dailyLog,
              [date]: { ...day, meals },
            },
          };
        }),

      removeMealEntry: (date: string, mealType: MealType, entryId: string) =>
        set((state) => {
          const day = state.dailyLog[date];
          if (!day) return state;

          const meals = { ...day.meals };
          meals[mealType] = meals[mealType].filter((e) => e.id !== entryId);

          return {
            dailyLog: {
              ...state.dailyLog,
              [date]: { ...day, meals },
            },
          };
        }),

      updateWater: (date: string, amount: number) =>
        set((state) => {
          const day = state.dailyLog[date] ?? createDefaultDaily(date);

          return {
            dailyLog: {
              ...state.dailyLog,
              [date]: {
                ...day,
                water: {
                  ...day.water,
                  current: Math.max(0, day.water.current + amount),
                },
              },
            },
          };
        }),

      setDailyTargets: (
        date: string,
        targets: { calories: number; protein: number; carbs: number; fat: number },
      ) =>
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

      addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) =>
        set((state) => ({
          shoppingList: [
            ...state.shoppingList,
            { ...item, id: generateId(), checked: false },
          ],
        })),

      toggleShoppingItem: (itemId: string) =>
        set((state) => ({
          shoppingList: state.shoppingList.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        })),

      clearShoppingList: () => set({ shoppingList: [] }),

      getDailyNutrition: (date: string): DailyNutrition => {
        const state = get();
        return state.dailyLog[date] ?? createDefaultDaily(date);
      },
    }),
    {
      name: 'fitmaster-nutrition',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useNutritionStore;
