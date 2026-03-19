import type { FoodItem } from '../types/nutrition';

export const foods: FoodItem[] = [
  { id: 'oatmeal', name: 'Oatmeal', nameRo: 'Ovaz', serving: { size: 100, unit: 'g' }, calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11 },
  { id: 'banana', name: 'Banana', nameRo: 'Banana', serving: { size: 1, unit: 'medium' }, calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3 },
  { id: 'chicken-breast', name: 'Chicken Breast', nameRo: 'Piept de pui', serving: { size: 100, unit: 'g' }, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'brown-rice', name: 'Brown Rice', nameRo: 'Orez brun', serving: { size: 100, unit: 'g' }, calories: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8 },
  { id: 'protein-shake', name: 'Whey Protein Shake', nameRo: 'Shake de proteine', brand: 'Optimum Nutrition', serving: { size: 1, unit: 'scoop' }, calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: 'egg', name: 'Egg (Large)', nameRo: 'Ou mare', serving: { size: 1, unit: 'egg' }, calories: 72, protein: 6, carbs: 0.4, fat: 5 },
  { id: 'greek-yogurt', name: 'Greek Yogurt', nameRo: 'Iaurt grecesc', serving: { size: 170, unit: 'g' }, calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { id: 'salmon', name: 'Salmon Fillet', nameRo: 'File de somon', serving: { size: 100, unit: 'g' }, calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'sweet-potato', name: 'Sweet Potato', nameRo: 'Cartof dulce', serving: { size: 100, unit: 'g' }, calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3 },
  { id: 'avocado', name: 'Avocado', nameRo: 'Avocado', serving: { size: 0.5, unit: 'fruit' }, calories: 161, protein: 2, carbs: 9, fat: 15, fiber: 7 },
  { id: 'almonds', name: 'Almonds', nameRo: 'Migdale', serving: { size: 28, unit: 'g' }, calories: 161, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
  { id: 'broccoli', name: 'Broccoli', nameRo: 'Broccoli', serving: { size: 100, unit: 'g' }, calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { id: 'white-rice', name: 'White Rice', nameRo: 'Orez alb', serving: { size: 100, unit: 'g' }, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'tuna', name: 'Canned Tuna', nameRo: 'Ton conservat', serving: { size: 100, unit: 'g' }, calories: 116, protein: 26, carbs: 0, fat: 1 },
  { id: 'whole-wheat-bread', name: 'Whole Wheat Bread', nameRo: 'Paine integrala', serving: { size: 1, unit: 'slice' }, calories: 81, protein: 4, carbs: 14, fat: 1.1, fiber: 2 },
];

export function searchFoods(query: string): FoodItem[] {
  const q = query.toLowerCase();
  return foods.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.nameRo.toLowerCase().includes(q) ||
      f.brand?.toLowerCase().includes(q),
  );
}

export function getFoodById(id: string): FoodItem | undefined {
  return foods.find((f) => f.id === id);
}
