export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Serving {
  size: number;
  unit: string;
}

export interface FoodItem {
  id: string;
  name: string;
  nameRo: string;
  brand?: string;
  barcode?: string;
  serving: Serving;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MealEntry {
  id: string;
  foodId: string;
  servings: number;
  mealType: MealType;
  timestamp: string;
}

export interface DailyNutrition {
  date: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: {
    breakfast: MealEntry[];
    lunch: MealEntry[];
    dinner: MealEntry[];
    snacks: MealEntry[];
  };
  water: {
    current: number;
    target: number;
  };
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  nameRo: string;
  description: string;
  descriptionRo: string;
  category: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string;
  tags: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  category: string;
}
