import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import type { FoodItem } from '../../types/nutrition';

interface FoodCardProps {
  food: FoodItem;
  onPress: () => void;
}

export default function FoodCard({ food, onPress }: FoodCardProps) {
  const { theme } = useTheme();

  const totalMacroGrams = food.protein + food.carbs + food.fat || 1;

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
  };

  const contentStyle: ViewStyle = {
    flex: 1,
  };

  const nameStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  };

  const brandStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  };

  const servingStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  };

  const macroBarContainerStyle: ViewStyle = {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  };

  const calorieContainerStyle: ViewStyle = {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.md,
  };

  const calorieValueStyle: TextStyle = {
    ...theme.typography.h4,
    color: theme.colors.calories,
  };

  const calorieLabelStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  };

  const macroRowStyle: ViewStyle = {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  };

  const macroTextStyle = (color: string): TextStyle => ({
    ...theme.typography.caption,
    color,
    fontWeight: '600',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [containerStyle, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={contentStyle}>
        <Text style={nameStyle} numberOfLines={1}>
          {food.name}
        </Text>
        {food.brand && <Text style={brandStyle}>{food.brand}</Text>}
        <Text style={servingStyle}>
          {food.serving.size} {food.serving.unit}
        </Text>

        {/* Mini macro bars */}
        <View style={macroBarContainerStyle}>
          <View
            style={{
              flex: food.protein / totalMacroGrams,
              backgroundColor: theme.colors.protein,
            }}
          />
          <View
            style={{
              flex: food.carbs / totalMacroGrams,
              backgroundColor: theme.colors.carbs,
            }}
          />
          <View
            style={{
              flex: food.fat / totalMacroGrams,
              backgroundColor: theme.colors.fat,
            }}
          />
        </View>

        {/* Macro text */}
        <View style={macroRowStyle}>
          <Text style={macroTextStyle(theme.colors.protein)}>
            P {food.protein}g
          </Text>
          <Text style={macroTextStyle(theme.colors.carbs)}>
            C {food.carbs}g
          </Text>
          <Text style={macroTextStyle(theme.colors.fat)}>
            F {food.fat}g
          </Text>
        </View>
      </View>

      <View style={calorieContainerStyle}>
        <Text style={calorieValueStyle}>{Math.round(food.calories)}</Text>
        <Text style={calorieLabelStyle}>kcal</Text>
      </View>
    </Pressable>
  );
}
