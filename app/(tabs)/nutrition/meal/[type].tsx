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
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/theme';
import { useNutritionStore } from '../../../../src/stores/useNutritionStore';
import { getFoodById, searchFoods } from '../../../../src/data/foods';
import type { MealType } from '../../../../src/types/nutrition';
import type { FoodItem } from '../../../../src/types/nutrition';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function capitalizeMealType(type: string): string {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function isValidMealType(value: string): value is MealType {
  return ['breakfast', 'lunch', 'dinner', 'snacks'].includes(value);
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
  const styles = useModalStyles(theme);

  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingsText, setServingsText] = useState('1');

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
    onClose();
  }, [onClose]);

  const previewServings = parseFloat(servingsText || '1') || 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
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

        {/* Search Input */}
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('nutrition.searchPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>

        {/* Selected food detail & servings */}
        {selectedFood && (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedName}>{selectedFood.name}</Text>
            {selectedFood.brand && (
              <Text style={styles.selectedBrand}>{selectedFood.brand}</Text>
            )}
            <View style={styles.selectedMacroRow}>
              <View style={[styles.macroPill, { backgroundColor: theme.colors.calories + '20' }]}>
                <Text style={[styles.macroPillValue, { color: theme.colors.calories }]}>
                  {Math.round(selectedFood.calories * previewServings)}
                </Text>
                <Text style={[styles.macroPillLabel, { color: theme.colors.calories }]}>kcal</Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: theme.colors.protein + '20' }]}>
                <Text style={[styles.macroPillValue, { color: theme.colors.protein }]}>
                  {Math.round(selectedFood.protein * previewServings)}g
                </Text>
                <Text style={[styles.macroPillLabel, { color: theme.colors.protein }]}>
                  {t('nutrition.protein')}
                </Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: theme.colors.carbs + '20' }]}>
                <Text style={[styles.macroPillValue, { color: theme.colors.carbs }]}>
                  {Math.round(selectedFood.carbs * previewServings)}g
                </Text>
                <Text style={[styles.macroPillLabel, { color: theme.colors.carbs }]}>
                  {t('nutrition.carbs')}
                </Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: theme.colors.fat + '20' }]}>
                <Text style={[styles.macroPillValue, { color: theme.colors.fat }]}>
                  {Math.round(selectedFood.fat * previewServings)}g
                </Text>
                <Text style={[styles.macroPillLabel, { color: theme.colors.fat }]}>
                  {t('nutrition.fat')}
                </Text>
              </View>
            </View>
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
            <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAdd}>
              <Text style={styles.addButtonText}>{t('nutrition.addFood')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
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
                styles.resultItem,
                selectedFood?.id === item.id && { backgroundColor: theme.colors.primary + '15' },
              ]}
              onPress={() => handleSelectFood(item)}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                {item.brand && <Text style={styles.resultBrand}>{item.brand}</Text>}
                <Text style={styles.resultMeta}>
                  {item.serving.size} {item.serving.unit}
                  {'  ·  P: '}
                  {item.protein}g
                  {'  C: '}
                  {item.carbs}g
                  {'  F: '}
                  {item.fat}g
                </Text>
              </View>
              <Text style={[styles.resultCalories, { color: theme.colors.calories }]}>
                {item.calories}
              </Text>
            </TouchableOpacity>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function useModalStyles(theme: ReturnType<typeof useTheme>['theme']) {
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
    searchInputWrapper: {
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
    selectedCard: {
      marginHorizontal: theme.spacing.screenPadding,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    selectedName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    selectedBrand: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    selectedMacroRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      flexWrap: 'wrap',
    },
    macroPill: {
      borderRadius: theme.spacing.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      alignItems: 'center',
      minWidth: 52,
    },
    macroPillValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: '700',
    },
    macroPillLabel: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: '500',
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
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    resultInfo: {
      flex: 1,
    },
    resultName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '600',
      color: theme.colors.text,
    },
    resultBrand: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      marginTop: 1,
    },
    resultMeta: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    resultCalories: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
    },
  });
}

// ─── Meal Detail Screen ───────────────────────────────────────────────────────

export default function MealDetailScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(theme);

  const params = useLocalSearchParams<{ type: string }>();
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type ?? '';
  const mealType: MealType = isValidMealType(rawType) ? rawType : 'breakfast';
  const today = toISODateString(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const { getDailyNutrition, addMealEntry, removeMealEntry } = useNutritionStore();
  const daily = getDailyNutrition(today);
  const entries = daily.meals[mealType];

  // Meal-level totals
  const mealTotals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const food = getFoodById(entry.foodId);
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
  }, [entries]);

  const handleDelete = useCallback(
    (entryId: string) => {
      Alert.alert(
        t('nutrition.removeEntry'),
        t('nutrition.removeEntryConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.remove'),
            style: 'destructive',
            onPress: () => removeMealEntry(today, mealType, entryId),
          },
        ],
      );
    },
    [today, mealType, removeMealEntry, t],
  );

  const handleAddFood = useCallback(
    (foodId: string, servings: number) => {
      addMealEntry(today, mealType, foodId, servings);
      setModalVisible(false);
    },
    [today, mealType, addMealEntry],
  );

  const mealLabel = useMemo(() => {
    const map: Record<MealType, string> = {
      breakfast: t('nutrition.breakfast'),
      lunch: t('nutrition.lunch'),
      dinner: t('nutrition.dinner'),
      snacks: t('nutrition.snacks'),
    };
    return map[mealType] ?? capitalizeMealType(mealType);
  }, [mealType, t]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mealLabel}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Meal Totals Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.calories }]}>
            {Math.round(mealTotals.calories)}
          </Text>
          <Text style={styles.summaryLabel}>kcal</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.protein }]}>
            {Math.round(mealTotals.protein)}g
          </Text>
          <Text style={styles.summaryLabel}>{t('nutrition.protein')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.carbs }]}>
            {Math.round(mealTotals.carbs)}g
          </Text>
          <Text style={styles.summaryLabel}>{t('nutrition.carbs')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.fat }]}>
            {Math.round(mealTotals.fat)}g
          </Text>
          <Text style={styles.summaryLabel}>{t('nutrition.fat')}</Text>
        </View>
      </View>

      {/* Entry List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>{t('nutrition.noFoods')}</Text>
            <Text style={styles.emptySubtitle}>{t('nutrition.addFoodPrompt')}</Text>
          </View>
        ) : (
          entries.map((entry) => {
            const food = getFoodById(entry.foodId);
            if (!food) return null;

            const entryCalories = food.calories * entry.servings;
            const entryProtein = food.protein * entry.servings;
            const entryCarbs = food.carbs * entry.servings;
            const entryFat = food.fat * entry.servings;

            return (
              <View key={entry.id} style={styles.entryCard}>
                {/* Top row: name + delete */}
                <View style={styles.entryCardHeader}>
                  <View style={styles.entryCardTitles}>
                    <Text style={styles.entryFoodName}>{food.name}</Text>
                    {food.brand && (
                      <Text style={styles.entryBrand}>{food.brand}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(entry.id)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Servings info */}
                <Text style={styles.entryServings}>
                  {entry.servings} {entry.servings === 1 ? t('nutrition.serving') : t('nutrition.servings')}
                  {' · '}
                  {entry.servings * food.serving.size} {food.serving.unit}
                </Text>

                {/* Macro chips */}
                <View style={styles.entryMacroRow}>
                  <View style={[styles.macroChip, { backgroundColor: theme.colors.calories + '18' }]}>
                    <Text style={[styles.macroChipText, { color: theme.colors.calories }]}>
                      {Math.round(entryCalories)} kcal
                    </Text>
                  </View>
                  <View style={[styles.macroChip, { backgroundColor: theme.colors.protein + '18' }]}>
                    <Text style={[styles.macroChipText, { color: theme.colors.protein }]}>
                      P {Math.round(entryProtein)}g
                    </Text>
                  </View>
                  <View style={[styles.macroChip, { backgroundColor: theme.colors.carbs + '18' }]}>
                    <Text style={[styles.macroChipText, { color: theme.colors.carbs }]}>
                      C {Math.round(entryCarbs)}g
                    </Text>
                  </View>
                  <View style={[styles.macroChip, { backgroundColor: theme.colors.fat + '18' }]}>
                    <Text style={[styles.macroChipText, { color: theme.colors.fat }]}>
                      F {Math.round(entryFat)}g
                    </Text>
                  </View>
                </View>

                {/* Optional: fiber */}
                {food.fiber !== undefined && (
                  <Text style={styles.entryFiber}>
                    {t('nutrition.fiber')}: {Math.round(food.fiber * entry.servings)}g
                  </Text>
                )}
              </View>
            );
          })
        )}
        <View style={styles.fabSpacer} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenPadding,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    backArrow: {
      fontSize: 24,
      color: theme.colors.text,
      lineHeight: 28,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSpacer: {
      width: 40,
    },
    summaryBar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.screenPadding,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
    },
    summaryLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    summaryDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 4,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPadding,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
    },
    emptyEmoji: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    entryCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.borderRadius.lg,
      padding: theme.spacing.cardPadding,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    entryCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    entryCardTitles: {
      flex: 1,
    },
    entryFoodName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: '700',
      color: theme.colors.text,
    },
    entryBrand: {
      fontSize: theme.typography.sizes.sm,
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
      marginLeft: theme.spacing.sm,
    },
    deleteButtonText: {
      fontSize: 11,
      color: theme.colors.error,
      fontWeight: '700',
    },
    entryServings: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    entryMacroRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    macroChip: {
      borderRadius: theme.spacing.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
    },
    macroChipText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: '700',
    },
    entryFiber: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.sm,
    },
    fabSpacer: {
      height: 80,
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      right: theme.spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabText: {
      fontSize: 28,
      color: '#FFFFFF',
      lineHeight: 32,
      fontWeight: '400',
    },
  });
}
