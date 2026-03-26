import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { useNutritionStore } from '../../../src/stores/useNutritionStore';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import { getFoodById, searchFoods } from '../../../src/data/foods';
import type { MealType } from '../../../src/types/nutrition';
import type { FoodItem } from '../../../src/types/nutrition';
import { estimateFoodMacros } from '../../../src/services/aiFoodService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr: string, t: (key: string) => string): string {
  const today = toISODateString(new Date());
  const yesterday = toISODateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return t('nutrition.today');
  if (dateStr === yesterday) return t('nutrition.yesterday');
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function offsetDate(dateStr: string, days: number): string {
  // Parse as UTC noon to avoid DST/timezone shifts in toISOString()
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

function MacroBar({ label, consumed, target, color, unit = 'g' }: MacroBarProps) {
  const { theme } = useTheme();
  const styles = useMacroBarStyles(theme);
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarValue}>
          {Math.round(consumed)}/{target}{unit}
        </Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View
          style={[
            styles.macroBarFill,
            { width: `${progress * 100}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function useMacroBarStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    macroBarContainer: {
      marginBottom: theme.spacing.md,
    },
    macroBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    macroBarLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    macroBarValue: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
      fontWeight: '600',
    },
    macroBarTrack: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.spacing.borderRadius.full,
      overflow: 'hidden',
    },
    macroBarFill: {
      height: '100%',
      borderRadius: theme.spacing.borderRadius.full,
    },
  });
}

// ─── Food Search Modal ────────────────────────────────────────────────────────

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (foodId: string, servings: number) => void;
}

function FoodSearchModal({ visible, onClose, onAdd }: FoodSearchModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const { addCustomFood } = useNutritionStore();
  const isRo = language === 'ro';
  const styles = useFoodModalStyles(theme);

  const [mode, setMode] = useState<'search' | 'custom'>('search');
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingsText, setServingsText] = useState('1');

  // Custom food AI state
  const [customFoodName, setCustomFoodName] = useState('');
  const [customGrams, setCustomGrams] = useState('100');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<FoodItem | null>(null);

  const results = useMemo(() => {
    if (query.trim().length === 0) return [];
    return searchFoods(query.trim());
  }, [query]);

  const handleSelectFood = useCallback((food: FoodItem) => {
    setSelectedFood(food);
    setServingsText('1');
  }, []);

  const handleAdd = useCallback(() => {
    if (!selectedFood) return;
    const servings = parseFloat(servingsText);
    if (isNaN(servings) || servings <= 0) {
      Alert.alert(t('nutrition.invalidServings'), t('nutrition.invalidServingsMsg'));
      return;
    }
    onAdd(selectedFood.id, servings);
    setQuery('');
    setSelectedFood(null);
    setServingsText('1');
  }, [selectedFood, servingsText, onAdd, t]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedFood(null);
    setServingsText('1');
    setMode('search');
    setCustomFoodName('');
    setCustomGrams('100');
    setAiResult(null);
    onClose();
  }, [onClose]);

  const handleAICalculate = useCallback(async () => {
    if (!customFoodName.trim()) return;
    const grams = parseFloat(customGrams);
    if (isNaN(grams) || grams <= 0) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await estimateFoodMacros(customFoodName.trim(), grams, language as 'en' | 'ro');
      setAiResult(result);
    } catch {
      Alert.alert(
        isRo ? 'Eroare AI' : 'AI Error',
        isRo ? 'Nu s-au putut calcula valorile nutritive.' : 'Could not calculate nutritional values.',
      );
    } finally {
      setAiLoading(false);
    }
  }, [customFoodName, customGrams, language, isRo]);

  const handleAddAIFood = useCallback(() => {
    if (!aiResult) return;
    addCustomFood(aiResult);
    onAdd(aiResult.id, 1);
    handleClose();
  }, [aiResult, addCustomFood, onAdd, handleClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('nutrition.searchFood')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Toggle */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: theme.spacing.screenPadding,
          marginBottom: theme.spacing.sm,
          borderRadius: theme.spacing.borderRadius.lg,
          backgroundColor: theme.colors.surface,
          padding: 3,
        }}>
          {(['search', 'custom'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: theme.spacing.borderRadius.md,
                backgroundColor: mode === m ? theme.colors.primary : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: mode === m ? '#fff' : theme.colors.textSecondary,
              }}>
                {m === 'search'
                  ? (isRo ? '🔍 Caută' : '🔍 Search')
                  : (isRo ? '✨ AI Custom' : '✨ AI Custom')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'search' ? (
          <>
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('nutrition.searchPlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>

            {/* Selected Food & Servings */}
            {selectedFood && (
              <View style={styles.selectedFoodCard}>
                <Text style={styles.selectedFoodName}>
                  {isRo ? selectedFood.nameRo : selectedFood.name}
                </Text>
                {selectedFood.brand && (
                  <Text style={styles.selectedFoodBrand}>{selectedFood.brand}</Text>
                )}
                <Text style={styles.selectedFoodInfo}>
                  {Math.round(selectedFood.calories * parseFloat(servingsText || '1'))} kcal
                  {'  ·  '}P: {Math.round(selectedFood.protein * parseFloat(servingsText || '1'))}g
                  {'  ·  '}C: {Math.round(selectedFood.carbs * parseFloat(servingsText || '1'))}g
                  {'  ·  '}F: {Math.round(selectedFood.fat * parseFloat(servingsText || '1'))}g
                </Text>
                <View style={styles.servingRow}>
                  <Text style={styles.servingLabel}>{t('nutrition.servings')}:</Text>
                  <TextInput
                    style={styles.servingInput}
                    value={servingsText}
                    onChangeText={setServingsText}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.servingUnit}>
                    × {selectedFood.serving.size} {selectedFood.serving.unit}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                  <Text style={styles.addButtonText}>{t('nutrition.addFood')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsList}
              ListEmptyComponent={
                query.trim().length > 0 ? (
                  <Text style={styles.emptyText}>{t('nutrition.noFoodsFound')}</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.foodResultItem,
                    selectedFood?.id === item.id && styles.foodResultItemSelected,
                  ]}
                  onPress={() => handleSelectFood(item)}
                >
                  <View style={styles.foodResultInfo}>
                    <Text style={styles.foodResultName}>
                      {isRo ? item.nameRo : item.name}
                    </Text>
                    {item.brand && (
                      <Text style={styles.foodResultBrand}>{item.brand}</Text>
                    )}
                    <Text style={styles.foodResultMeta}>
                      {item.serving.size} {item.serving.unit} · {item.calories} kcal
                    </Text>
                  </View>
                  <Text style={styles.foodResultCalories}>{item.calories}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        ) : (
          /* ── AI Custom Food ── */
          <ScrollView
            contentContainerStyle={{ padding: theme.spacing.screenPadding, gap: theme.spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
              {isRo
                ? 'Introdu numele alimentului și gramajul. Claude AI va estima valorile nutritive.'
                : 'Enter the food name and weight. Claude AI will estimate the nutritional values.'}
            </Text>

            <View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
                {isRo ? 'Denumire aliment' : 'Food name'}
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder={isRo ? 'ex: piept de pui grătar' : 'e.g. grilled chicken breast'}
                placeholderTextColor={theme.colors.textTertiary}
                value={customFoodName}
                onChangeText={setCustomFoodName}
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
                {isRo ? 'Gramaj (g)' : 'Weight (g)'}
              </Text>
              <TextInput
                style={[styles.searchInput, { width: 120 }]}
                placeholder="100"
                placeholderTextColor={theme.colors.textTertiary}
                value={customGrams}
                onChangeText={setCustomGrams}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, { opacity: aiLoading || !customFoodName.trim() ? 0.5 : 1 }]}
              onPress={handleAICalculate}
              disabled={aiLoading || !customFoodName.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>
                {aiLoading
                  ? (isRo ? 'Se calculează...' : 'Calculating...')
                  : (isRo ? '✨ Calculează cu AI' : '✨ Calculate with AI')}
              </Text>
            </TouchableOpacity>

            {/* AI Result Preview */}
            {aiResult && (
              <View style={[styles.selectedFoodCard, { marginHorizontal: 0 }]}>
                <Text style={styles.selectedFoodName}>
                  {isRo ? aiResult.nameRo : aiResult.name}
                </Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginBottom: 8 }}>
                  {isRo ? 'Estimat de Claude AI pentru' : 'Claude AI estimate for'} {customGrams}g
                </Text>

                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                  {[
                    { label: 'Kcal', value: aiResult.calories, color: theme.colors.calories ?? theme.colors.warning },
                    { label: isRo ? 'Prot' : 'Prot', value: aiResult.protein, color: theme.colors.primary },
                    { label: isRo ? 'Carb' : 'Carb', value: aiResult.carbs, color: theme.colors.secondary },
                    { label: isRo ? 'Grăs' : 'Fat', value: aiResult.fat, color: theme.colors.accent },
                  ].map((m) => (
                    <View key={m.label} style={{
                      flex: 1,
                      backgroundColor: m.color + '20',
                      borderRadius: theme.spacing.borderRadius.sm,
                      padding: theme.spacing.sm,
                      alignItems: 'center',
                    }}>
                      <Text style={{ color: m.color, fontWeight: '700', fontSize: 15 }}>
                        {Math.round(m.value)}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                        {m.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {aiResult.fiber != null && (
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: theme.spacing.md }}>
                    {isRo ? 'Fibre: ' : 'Fiber: '}{Math.round(aiResult.fiber)}g
                  </Text>
                )}

                <TouchableOpacity style={styles.addButton} onPress={handleAddAIFood} activeOpacity={0.8}>
                  <Text style={styles.addButtonText}>
                    {isRo ? '+ Adaugă la masă' : '+ Add to meal'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function useFoodModalStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    closeButtonText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    searchInputContainer: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingVertical: theme.spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedFoodCard: {
      marginHorizontal: theme.spacing.screenPadding,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    selectedFoodName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    selectedFoodBrand: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    selectedFoodInfo: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    servingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    servingLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    servingInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.borderRadius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 6,
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: 64,
      textAlign: 'center',
    },
    servingUnit: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textTertiary,
      flex: 1,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.borderRadius.lg,
      paddingVertical: theme.spacing.sm + 4,
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    resultsList: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingBottom: theme.spacing.xxl,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.xl,
      fontSize: theme.typography.sizes.sm,
    },
    foodResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    foodResultItemSelected: {
      backgroundColor: theme.colors.primary + '15',
      marginHorizontal: -theme.spacing.screenPadding,
      paddingHorizontal: theme.spacing.screenPadding,
    },
    foodResultInfo: {
      flex: 1,
    },
    foodResultName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '600',
      color: theme.colors.text,
    },
    foodResultBrand: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      marginTop: 1,
    },
    foodResultMeta: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    foodResultCalories: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.calories,
    },
  });
}

// ─── Meal Section ─────────────────────────────────────────────────────────────

interface MealSectionProps {
  title: string;
  mealType: MealType;
  date: string;
  onAddFood: (mealType: MealType) => void;
}

function MealSection({ title, mealType, date, onAddFood }: MealSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const isRo = language === 'ro';
  const styles = useMealSectionStyles(theme);
  const [expanded, setExpanded] = useState(true);

  const { getDailyNutrition, removeMealEntry, customFoods } = useNutritionStore();
  const daily = getDailyNutrition(date);
  const entries = daily.meals[mealType];

  const mealCalories = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const food = getFoodById(entry.foodId) ?? customFoods.find((f) => f.id === entry.foodId);
      return sum + (food ? food.calories * entry.servings : 0);
    }, 0);
  }, [entries, customFoods]);

  const handleDelete = useCallback(
    (entryId: string) => {
      removeMealEntry(date, mealType, entryId);
    },
    [date, mealType, removeMealEntry],
  );

  return (
    <View style={styles.mealSection}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.mealHeader}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.mealTitle}>{title}</Text>
        <View style={styles.mealHeaderRight}>
          <Text style={styles.mealCaloriesBadge}>{Math.round(mealCalories)} kcal</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Entries */}
      {expanded && (
        <View style={styles.mealBody}>
          {entries.length === 0 ? (
            <Text style={styles.emptyMealText}>{t('nutrition.noFoods')}</Text>
          ) : (
            entries.map((entry) => {
              const food = getFoodById(entry.foodId) ?? customFoods.find(f => f.id === entry.foodId);
              if (!food) return null;
              return (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryName}>{isRo ? food.nameRo : food.name}</Text>
                    <Text style={styles.entryMeta}>
                      {entry.servings} × {food.serving.size} {food.serving.unit}
                      {'  ·  '}
                      {Math.round(food.calories * entry.servings)} kcal
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(entry.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Add Food Button */}
          <TouchableOpacity
            style={styles.addFoodButton}
            onPress={() => onAddFood(mealType)}
            activeOpacity={0.7}
          >
            <Text style={styles.addFoodButtonText}>+ {t('nutrition.addFood')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function useMealSectionStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    mealSection: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    mealHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.cardPadding,
      paddingVertical: theme.spacing.md,
    },
    mealTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    mealHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    mealCaloriesBadge: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.calories,
    },
    chevron: {
      fontSize: 10,
      color: theme.colors.textTertiary,
    },
    mealBody: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing.cardPadding,
      paddingBottom: theme.spacing.md,
    },
    emptyMealText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    entryInfo: {
      flex: 1,
    },
    entryName: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.text,
    },
    entryMeta: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.error + '20',
    },
    deleteButtonText: {
      fontSize: 11,
      color: theme.colors.error,
      fontWeight: '700',
    },
    addFoodButton: {
      marginTop: theme.spacing.md,
      borderWidth: 1.5,
      borderColor: theme.colors.primary + '60',
      borderStyle: 'dashed',
      borderRadius: theme.spacing.borderRadius.sm,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
    },
    addFoodButtonText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
}

// ─── Water Tracker ────────────────────────────────────────────────────────────

interface WaterTrackerProps {
  date: string;
}

function WaterTracker({ date }: WaterTrackerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useWaterStyles(theme);
  const { getDailyNutrition, updateWater } = useNutritionStore();
  const daily = getDailyNutrition(date);
  const { current, target } = daily.water;

  const glasses = useMemo(() => {
    return Array.from({ length: target }, (_, i) => i < current);
  }, [current, target]);

  return (
    <View style={styles.waterCard}>
      <View style={styles.waterHeader}>
        <Text style={styles.waterTitle}>{t('nutrition.water')}</Text>
        <Text style={styles.waterCount}>
          {current}/{target} {t('nutrition.glasses')}
        </Text>
      </View>
      <View style={styles.glassRow}>
        {glasses.map((filled, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.glassIcon, filled && styles.glassIconFilled]}
            onPress={() => updateWater(date, filled ? -1 : 1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.glassEmoji, !filled && styles.glassEmojiEmpty]}>
              {filled ? '💧' : '🫙'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.waterButtonRow}>
        <TouchableOpacity
          style={styles.waterButton}
          onPress={() => updateWater(date, -1)}
          disabled={current === 0}
        >
          <Text style={[styles.waterButtonText, current === 0 && styles.waterButtonDisabled]}>
            − {t('nutrition.removeGlass')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.waterButton, styles.waterButtonAdd]}
          onPress={() => updateWater(date, 1)}
        >
          <Text style={styles.waterButtonAddText}>+ {t('nutrition.addGlass')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function useWaterStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    waterCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    waterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    waterTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    waterCount: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.water,
    },
    glassRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    glassIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    glassIconFilled: {
      backgroundColor: theme.colors.water + '25',
    },
    glassEmoji: {
      fontSize: 20,
    },
    glassEmojiEmpty: {
      opacity: 0.4,
    },
    waterButtonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    waterButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    waterButtonText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    waterButtonDisabled: {
      opacity: 0.4,
    },
    waterButtonAdd: {
      backgroundColor: theme.colors.water,
      borderColor: theme.colors.water,
    },
    waterButtonAddText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(theme);
  const router = useRouter();

  const [date, setDate] = useState<string>(toISODateString(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');

  const { getDailyNutrition, addMealEntry, customFoods, savedMealPlans } = useNutritionStore();
  const daily = getDailyNutrition(date);

  // Computed totals (includes custom AI-added foods)
  const totals = useMemo(() => {
    const allEntries = [
      ...daily.meals.breakfast,
      ...daily.meals.lunch,
      ...daily.meals.dinner,
      ...daily.meals.snacks,
    ];
    return allEntries.reduce(
      (acc, entry) => {
        const food = getFoodById(entry.foodId) ?? customFoods.find((f) => f.id === entry.foodId);
        if (!food) return acc;
        return {
          calories: acc.calories + food.calories * entry.servings,
          protein: acc.protein + food.protein * entry.servings,
          carbs: acc.carbs + food.carbs * entry.servings,
          fat: acc.fat + food.fat * entry.servings,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [daily, customFoods]);

  const calorieProgress = daily.targetCalories > 0
    ? Math.min(totals.calories / daily.targetCalories, 1)
    : 0;
  const caloriesRemaining = Math.max(daily.targetCalories - Math.round(totals.calories), 0);

  const handlePrevDay = useCallback(() => {
    setDate((d) => offsetDate(d, -1));
  }, []);

  const handleNextDay = useCallback(() => {
    const next = offsetDate(date, 1);
    if (next <= toISODateString(new Date())) {
      setDate(next);
    }
  }, [date]);

  const handleOpenAddFood = useCallback((mealType: MealType) => {
    setActiveMealType(mealType);
    setModalVisible(true);
  }, []);

  const handleAddFood = useCallback(
    (foodId: string, servings: number) => {
      addMealEntry(date, activeMealType, foodId, servings);
      setModalVisible(false);
    },
    [date, activeMealType, addMealEntry],
  );

  const isToday = date === toISODateString(new Date());

  const mealTypes: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: t('nutrition.breakfast') },
    { type: 'lunch', label: t('nutrition.lunch') },
    { type: 'dinner', label: t('nutrition.dinner') },
    { type: 'snacks', label: t('nutrition.snacks') },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <Text style={styles.screenTitle}>{t('nutrition.title')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: `${theme.colors.primary}22`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => router.push('/(tabs)/nutrition/generate-meal-plan' as any)}
          >
            <Text style={{ fontSize: 14 }}>✨</Text>
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>AI Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => router.push('/(tabs)/nutrition/scanner' as any)}
          >
            <Text style={{ fontSize: 14 }}>📷</Text>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateNavButton} onPress={handlePrevDay}>
          <Text style={styles.dateNavArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDate(date, t)}</Text>
        <TouchableOpacity
          style={[styles.dateNavButton, isToday && styles.dateNavButtonDisabled]}
          onPress={handleNextDay}
          disabled={isToday}
        >
          <Text style={[styles.dateNavArrow, isToday && styles.dateNavArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calorie Summary Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieRow}>
            <View style={styles.calorieMain}>
              <Text style={styles.calorieNumber}>{Math.round(totals.calories)}</Text>
              <Text style={styles.calorieLabel}>{t('nutrition.kcalConsumed')}</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieTarget}>
              <Text style={styles.calorieTargetNumber}>{daily.targetCalories}</Text>
              <Text style={styles.calorieTargetLabel}>{t('nutrition.target')}</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieRemaining}>
              <Text style={[styles.calorieRemainingNumber, { color: caloriesRemaining > 0 ? theme.colors.success : theme.colors.error }]}>
                {caloriesRemaining}
              </Text>
              <Text style={styles.calorieRemainingLabel}>{t('nutrition.remaining')}</Text>
            </View>
          </View>

          {/* Calorie Progress Bar */}
          <View style={styles.calorieProgressTrack}>
            <View
              style={[
                styles.calorieProgressFill,
                {
                  width: `${calorieProgress * 100}%` as any,
                  backgroundColor: calorieProgress >= 1 ? theme.colors.error : theme.colors.calories,
                },
              ]}
            />
          </View>
        </View>

        {/* Macros Card */}
        <View style={styles.macrosCard}>
          <Text style={styles.sectionTitle}>{t('nutrition.macros')}</Text>
          <MacroBar
            label={t('nutrition.protein')}
            consumed={totals.protein}
            target={daily.targetProtein}
            color={theme.colors.protein}
          />
          <MacroBar
            label={t('nutrition.carbs')}
            consumed={totals.carbs}
            target={daily.targetCarbs}
            color={theme.colors.carbs}
          />
          <MacroBar
            label={t('nutrition.fat')}
            consumed={totals.fat}
            target={daily.targetFat}
            color={theme.colors.fat}
          />
        </View>

        {/* Meal Sections */}
        <Text style={styles.sectionHeader}>{t('nutrition.meals')}</Text>
        {mealTypes.map(({ type, label }) => (
          <MealSection
            key={type}
            title={label}
            mealType={type}
            date={date}
            onAddFood={handleOpenAddFood}
          />
        ))}

        {/* Water Tracker */}
        <Text style={styles.sectionHeader}>{t('nutrition.hydration')}</Text>
        <WaterTracker date={date} />

        {/* Saved AI Meal Plans */}
        {savedMealPlans.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>✨ AI Meal Plans</Text>
            {savedMealPlans.map((mp) => (
              <TouchableOpacity
                key={mp.id}
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.spacing.borderRadius.lg,
                  padding: theme.spacing.cardPadding,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  marginBottom: theme.spacing.sm,
                }}
                activeOpacity={0.75}
                onPress={() => router.push({ pathname: '/(tabs)/nutrition/generate-meal-plan' as any, params: { viewId: mp.id } })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>{mp.nameRo || mp.name}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {mp.targetCalories} kcal/zi · {mp.days.length} zile · {new Date(mp.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: theme.colors.primary + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>AI</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Food Search Modal */}
      <FoodSearchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddFood}
      />
    </SafeAreaView>
  );
}

function useStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    screenTitle: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: '800',
      color: theme.colors.text,
    },
    dateNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xl,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    dateNavButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    dateNavButtonDisabled: {
      opacity: 0.4,
    },
    dateNavArrow: {
      fontSize: 24,
      color: theme.colors.text,
      lineHeight: 28,
    },
    dateNavArrowDisabled: {
      color: theme.colors.textTertiary,
    },
    dateLabel: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '600',
      color: theme.colors.text,
      minWidth: 120,
      textAlign: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.lg,
    },
    calorieCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    calorieRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    calorieMain: {
      flex: 1,
      alignItems: 'center',
    },
    calorieNumber: {
      fontSize: 36,
      fontWeight: '800',
      color: theme.colors.calories,
      lineHeight: 42,
    },
    calorieLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    calorieDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
    },
    calorieTarget: {
      flex: 1,
      alignItems: 'center',
    },
    calorieTargetNumber: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: '700',
      color: theme.colors.text,
    },
    calorieTargetLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    calorieRemaining: {
      flex: 1,
      alignItems: 'center',
    },
    calorieRemainingNumber: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: '700',
    },
    calorieRemainingLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    calorieProgressTrack: {
      height: 10,
      backgroundColor: theme.colors.border,
      borderRadius: theme.spacing.borderRadius.full,
      overflow: 'hidden',
    },
    calorieProgressFill: {
      height: '100%',
      borderRadius: theme.spacing.borderRadius.full,
    },
    macrosCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    bottomPadding: {
      height: theme.spacing.xxl,
    },
  });
}
