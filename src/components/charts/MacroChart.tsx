import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';

interface MacroChartProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
}

export default function MacroChart({
  calories,
  protein,
  carbs,
  fat,
  targetCalories,
}: MacroChartProps) {
  const { theme } = useTheme();

  const size = 180;
  const center = size / 2;
  const strokeWidth = 12;

  // Three concentric rings: protein (outer), carbs (middle), fat (inner)
  const rings = [
    {
      label: 'Protein',
      current: protein,
      target: Math.max(protein, 1),
      color: theme.colors.protein,
      radius: center - strokeWidth / 2 - 2,
    },
    {
      label: 'Carbs',
      current: carbs,
      target: Math.max(carbs, 1),
      color: theme.colors.carbs,
      radius: center - strokeWidth - strokeWidth / 2 - 6,
    },
    {
      label: 'Fat',
      current: fat,
      target: Math.max(fat, 1),
      color: theme.colors.fat,
      radius: center - strokeWidth * 2 - strokeWidth / 2 - 10,
    },
  ];

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
  };

  const centerTextContainer: ViewStyle = {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const calorieValueStyle: TextStyle = {
    ...theme.typography.h2,
    color: theme.colors.text,
  };

  const calorieLabelStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  };

  return (
    <View style={containerStyle}>
      <Svg width={size} height={size}>
        {rings.map((ring) => {
          const circumference = 2 * Math.PI * ring.radius;
          const progress = Math.min(ring.current / ring.target, 1);
          const dashArray = `${circumference * progress} ${circumference * (1 - progress)}`;

          return (
            <React.Fragment key={ring.label}>
              {/* Background track */}
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={theme.colors.surfaceLight}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress arc */}
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dashArray}
                strokeDashoffset={circumference * 0.25}
                strokeLinecap="round"
                rotation={-90}
                origin={`${center}, ${center}`}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={centerTextContainer}>
        <Text style={calorieValueStyle}>{Math.round(calories)}</Text>
        <Text style={calorieLabelStyle}>/ {targetCalories} kcal</Text>
      </View>
    </View>
  );
}
