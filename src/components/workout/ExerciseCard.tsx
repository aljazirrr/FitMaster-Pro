import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import type { Exercise } from '../../types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

const equipmentIcons: Record<string, string> = {
  barbell: '\u{1F3CB}',
  dumbbell: '\u{1F4AA}',
  machine: '\u2699\uFE0F',
  cable: '\u{1F517}',
  bodyweight: '\u{1F9D8}',
  kettlebell: '\u{1F514}',
  bands: '\u{1F4CF}',
  smith: '\u{1F3ED}',
  ezBar: '\u{1F4C8}',
  trapBar: '\u26A1',
  other: '\u{1F3AF}',
};

export default function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  const isRo = i18n.language === 'ro';
  const displayName = isRo && exercise.nameRo ? exercise.nameRo : exercise.name;
  const equipmentIcon = equipmentIcons[exercise.equipment] ?? '\u{1F3AF}';

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
  };

  const iconContainerStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  };

  const iconStyle: TextStyle = {
    fontSize: 20,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
  };

  const nameStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  };

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [containerStyle, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={iconContainerStyle}>
        <Text style={iconStyle}>{equipmentIcon}</Text>
      </View>
      <View style={contentStyle}>
        <Text style={nameStyle} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={rowStyle}>
          <Badge
            label={exercise.muscleGroup}
            color={theme.colors.primary}
            variant="outline"
          />
          <Text
            style={{
              ...theme.typography.caption,
              color: theme.colors.textTertiary,
            }}
          >
            {exercise.equipment}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
