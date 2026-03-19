import React, { useState } from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { MealEntry, FoodItem } from '../../types/nutrition';

interface MealSectionProps {
  title: string;
  entries: MealEntry[];
  foods: FoodItem[];
  onAddFood: () => void;
  onRemoveEntry: (entryId: string) => void;
}

export default function MealSection({
  title,
  entries,
  foods,
  onAddFood,
  onRemoveEntry,
}: MealSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  // Build a lookup map for foods
  const foodMap = new Map(foods.map((f) => [f.id, f]));

  // Calculate total calories for this meal
  const totalCalories = entries.reduce((sum, entry) => {
    const food = foodMap.get(entry.foodId);
    return sum + (food ? food.calories * entry.servings : 0);
  }, 0);

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    overflow: 'hidden',
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.cardPadding,
  };

  const headerLeftStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };

  const titleStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  };

  const calorieStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  };

  const chevronStyle: TextStyle = {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  };

  const entryContainerStyle: ViewStyle = {
    paddingHorizontal: theme.spacing.cardPadding,
    paddingBottom: theme.spacing.sm,
  };

  const entryRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  };

  const entryNameStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.text,
    flex: 1,
  };

  const entryServingStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  };

  const entryCalStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
    minWidth: 50,
    textAlign: 'right',
  };

  const removeButtonStyle: TextStyle = {
    ...theme.typography.body,
    color: theme.colors.error,
    paddingLeft: theme.spacing.md,
  };

  const addButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  };

  const addTextStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.primary,
  };

  const emptyStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  };

  return (
    <View style={containerStyle}>
      {/* Header */}
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={headerStyle}>
          <View style={headerLeftStyle}>
            <Text style={titleStyle}>{title}</Text>
            <Text style={calorieStyle}>
              {Math.round(totalCalories)} kcal
            </Text>
          </View>
          <Text style={chevronStyle}>{expanded ? '\u25B2' : '\u25BC'}</Text>
        </View>
      </Pressable>

      {/* Entry list */}
      {expanded && (
        <View style={entryContainerStyle}>
          {entries.length === 0 ? (
            <Text style={emptyStyle}>No items added yet</Text>
          ) : (
            entries.map((entry) => {
              const food = foodMap.get(entry.foodId);
              if (!food) return null;
              const entryCals = Math.round(food.calories * entry.servings);

              return (
                <View key={entry.id} style={entryRowStyle}>
                  <View style={{ flex: 1 }}>
                    <Text style={entryNameStyle} numberOfLines={1}>
                      {food.name}
                    </Text>
                    <Text style={entryServingStyle}>
                      {entry.servings} x {food.serving.size}
                      {food.serving.unit}
                    </Text>
                  </View>
                  <Text style={entryCalStyle}>{entryCals} kcal</Text>
                  <Pressable onPress={() => onRemoveEntry(entry.id)}>
                    <Text style={removeButtonStyle}>{'\u00D7'}</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Add button */}
      <Pressable
        onPress={onAddFood}
        style={({ pressed }) => [addButtonStyle, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={addTextStyle}>+ Add Food</Text>
      </Pressable>
    </View>
  );
}
