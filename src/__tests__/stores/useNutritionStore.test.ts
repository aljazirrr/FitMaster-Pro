import useNutritionStore from '../../stores/useNutritionStore';

const emptyState = {
  dailyLog: {},
  shoppingList: [],
};

const TEST_DATE = '2026-03-19';

beforeEach(() => {
  useNutritionStore.setState(emptyState);
});

describe('useNutritionStore', () => {
  describe('getDailyNutrition', () => {
    it('returns default daily nutrition for unknown date', () => {
      const result = useNutritionStore.getState().getDailyNutrition(TEST_DATE);
      expect(result.date).toBe(TEST_DATE);
      expect(result.targetCalories).toBe(2500);
      expect(result.water.current).toBe(0);
      expect(result.water.target).toBe(8);
    });

    it('returns stored nutrition for known date', () => {
      useNutritionStore.getState().updateWater(TEST_DATE, 3);
      const result = useNutritionStore.getState().getDailyNutrition(TEST_DATE);
      expect(result.water.current).toBe(3);
    });
  });

  describe('addMealEntry', () => {
    it('adds a meal entry to the correct meal', () => {
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'breakfast', 'oatmeal', 1);
      const daily = useNutritionStore.getState().getDailyNutrition(TEST_DATE);
      expect(daily.meals.breakfast).toHaveLength(1);
      expect(daily.meals.breakfast[0].foodId).toBe('oatmeal');
      expect(daily.meals.breakfast[0].servings).toBe(1);
    });

    it('appends multiple entries to the same meal', () => {
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'lunch', 'chicken-breast', 1.5);
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'lunch', 'brown-rice', 1);
      const daily = useNutritionStore.getState().getDailyNutrition(TEST_DATE);
      expect(daily.meals.lunch).toHaveLength(2);
    });

    it('creates the day entry if it does not exist', () => {
      useNutritionStore.getState().addMealEntry('2026-01-01', 'dinner', 'chicken-breast', 2);
      const daily = useNutritionStore.getState().getDailyNutrition('2026-01-01');
      expect(daily.meals.dinner).toHaveLength(1);
    });

    it('assigns a unique id to each entry', () => {
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'snacks', 'protein-shake', 1);
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'snacks', 'banana', 1);
      const { snacks } = useNutritionStore.getState().getDailyNutrition(TEST_DATE).meals;
      expect(snacks[0].id).not.toBe(snacks[1].id);
    });
  });

  describe('removeMealEntry', () => {
    it('removes a meal entry by id', () => {
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'breakfast', 'oatmeal', 1);
      const entry = useNutritionStore.getState().getDailyNutrition(TEST_DATE).meals.breakfast[0];
      useNutritionStore.getState().removeMealEntry(TEST_DATE, 'breakfast', entry.id);
      expect(useNutritionStore.getState().getDailyNutrition(TEST_DATE).meals.breakfast).toHaveLength(0);
    });

    it('only removes the targeted entry', () => {
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'breakfast', 'oatmeal', 1);
      useNutritionStore.getState().addMealEntry(TEST_DATE, 'breakfast', 'banana', 1);
      const entries = useNutritionStore.getState().getDailyNutrition(TEST_DATE).meals.breakfast;
      useNutritionStore.getState().removeMealEntry(TEST_DATE, 'breakfast', entries[0].id);
      const remaining = useNutritionStore.getState().getDailyNutrition(TEST_DATE).meals.breakfast;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].foodId).toBe('banana');
    });

    it('does nothing for non-existent date', () => {
      useNutritionStore.getState().removeMealEntry('2099-01-01', 'breakfast', 'fake-id');
      expect(useNutritionStore.getState().dailyLog['2099-01-01']).toBeUndefined();
    });
  });

  describe('updateWater', () => {
    it('adds water amount', () => {
      useNutritionStore.getState().updateWater(TEST_DATE, 2);
      expect(useNutritionStore.getState().getDailyNutrition(TEST_DATE).water.current).toBe(2);
    });

    it('accumulates water across multiple calls', () => {
      useNutritionStore.getState().updateWater(TEST_DATE, 3);
      useNutritionStore.getState().updateWater(TEST_DATE, 2);
      expect(useNutritionStore.getState().getDailyNutrition(TEST_DATE).water.current).toBe(5);
    });

    it('does not go below 0', () => {
      useNutritionStore.getState().updateWater(TEST_DATE, -10);
      expect(useNutritionStore.getState().getDailyNutrition(TEST_DATE).water.current).toBe(0);
    });

    it('creates the day entry if it does not exist', () => {
      useNutritionStore.getState().updateWater('2026-01-15', 4);
      expect(useNutritionStore.getState().getDailyNutrition('2026-01-15').water.current).toBe(4);
    });
  });

  describe('setDailyTargets', () => {
    it('sets calorie and macro targets for a date', () => {
      useNutritionStore.getState().setDailyTargets(TEST_DATE, {
        calories: 2000, protein: 150, carbs: 250, fat: 65,
      });
      const daily = useNutritionStore.getState().getDailyNutrition(TEST_DATE);
      expect(daily.targetCalories).toBe(2000);
      expect(daily.targetProtein).toBe(150);
      expect(daily.targetCarbs).toBe(250);
      expect(daily.targetFat).toBe(65);
    });
  });

  describe('addShoppingItem', () => {
    it('adds a shopping item with generated id and unchecked state', () => {
      useNutritionStore.getState().addShoppingItem({ name: 'Chicken breast', amount: 500, unit: 'g', category: 'protein' });
      const { shoppingList } = useNutritionStore.getState();
      expect(shoppingList).toHaveLength(1);
      expect(shoppingList[0].name).toBe('Chicken breast');
      expect(shoppingList[0].amount).toBe(500);
      expect(shoppingList[0].checked).toBe(false);
      expect(shoppingList[0].id).toBeTruthy();
    });

    it('appends multiple items', () => {
      useNutritionStore.getState().addShoppingItem({ name: 'Rice', amount: 1, unit: 'kg', category: 'carbs' });
      useNutritionStore.getState().addShoppingItem({ name: 'Eggs', amount: 12, unit: 'pcs', category: 'protein' });
      expect(useNutritionStore.getState().shoppingList).toHaveLength(2);
    });
  });

  describe('toggleShoppingItem', () => {
    it('toggles checked state', () => {
      useNutritionStore.getState().addShoppingItem({ name: 'Rice', amount: 1, unit: 'kg', category: 'carbs' });
      const id = useNutritionStore.getState().shoppingList[0].id;
      useNutritionStore.getState().toggleShoppingItem(id);
      expect(useNutritionStore.getState().shoppingList[0].checked).toBe(true);
      useNutritionStore.getState().toggleShoppingItem(id);
      expect(useNutritionStore.getState().shoppingList[0].checked).toBe(false);
    });

    it('does not affect other items', () => {
      useNutritionStore.getState().addShoppingItem({ name: 'Rice', amount: 1, unit: 'kg', category: 'carbs' });
      useNutritionStore.getState().addShoppingItem({ name: 'Eggs', amount: 12, unit: 'pcs', category: 'protein' });
      const [item1] = useNutritionStore.getState().shoppingList;
      useNutritionStore.getState().toggleShoppingItem(item1.id);
      expect(useNutritionStore.getState().shoppingList[1].checked).toBe(false);
    });
  });

  describe('clearShoppingList', () => {
    it('empties the shopping list', () => {
      useNutritionStore.getState().addShoppingItem({ name: 'Rice', amount: 1, unit: 'kg', category: 'carbs' });
      useNutritionStore.getState().addShoppingItem({ name: 'Eggs', amount: 12, unit: 'pcs', category: 'protein' });
      useNutritionStore.getState().clearShoppingList();
      expect(useNutritionStore.getState().shoppingList).toHaveLength(0);
    });

    it('is idempotent on empty list', () => {
      useNutritionStore.getState().clearShoppingList();
      expect(useNutritionStore.getState().shoppingList).toHaveLength(0);
    });
  });
});
