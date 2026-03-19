import React from 'react';
import { View, Text, TextInput, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { WorkoutSet } from '../../types/workout';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  onUpdate: (updated: Partial<WorkoutSet>) => void;
  onRemove: () => void;
}

const setTypeColors: Record<string, string> = {
  normal: 'transparent',
  warmup: '#FFD93D',
  dropset: '#FF6B6B',
  failure: '#FF4757',
};

const setTypeLabels: Record<string, string> = {
  normal: '',
  warmup: 'W',
  dropset: 'D',
  failure: 'F',
};

export default function SetRow({ set, index, onUpdate, onRemove }: SetRowProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: set.completed
      ? theme.isDark
        ? 'rgba(0,212,170,0.08)'
        : 'rgba(0,184,148,0.08)'
      : 'transparent',
  };

  const setNumberStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
    width: 28,
    textAlign: 'center',
  };

  const typeIndicatorStyle: ViewStyle = {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: setTypeColors[set.type] ?? 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  };

  const typeTextStyle: TextStyle = {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  };

  const inputContainerStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };

  const inputStyle: TextStyle = {
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 60,
    textAlign: 'center',
  };

  const labelStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    width: 32,
  };

  const checkboxStyle: ViewStyle = {
    width: 28,
    height: 28,
    borderRadius: theme.spacing.borderRadius.sm,
    borderWidth: 2,
    borderColor: set.completed ? theme.colors.primary : theme.colors.border,
    backgroundColor: set.completed ? theme.colors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  };

  const checkmarkStyle: TextStyle = {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  };

  const removeStyle: TextStyle = {
    ...theme.typography.body,
    color: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
  };

  return (
    <View style={containerStyle}>
      {/* Set type indicator */}
      <View style={typeIndicatorStyle}>
        {set.type !== 'normal' && (
          <Text style={typeTextStyle}>{setTypeLabels[set.type]}</Text>
        )}
      </View>

      {/* Set number */}
      <Text style={setNumberStyle}>{index + 1}</Text>

      {/* Weight and reps inputs */}
      <View style={inputContainerStyle}>
        <Text style={labelStyle}>kg</Text>
        <TextInput
          style={inputStyle}
          value={set.weight > 0 ? String(set.weight) : ''}
          onChangeText={(text) => {
            const val = parseFloat(text) || 0;
            onUpdate({ weight: val });
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
        />

        <Text style={labelStyle}>reps</Text>
        <TextInput
          style={inputStyle}
          value={set.reps > 0 ? String(set.reps) : ''}
          onChangeText={(text) => {
            const val = parseInt(text, 10) || 0;
            onUpdate({ reps: val });
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>

      {/* Completed checkbox */}
      <Pressable
        style={checkboxStyle}
        onPress={() => onUpdate({ completed: !set.completed })}
      >
        {set.completed && <Text style={checkmarkStyle}>{'\u2713'}</Text>}
      </Pressable>

      {/* Remove button */}
      <Pressable onPress={onRemove}>
        <Text style={removeStyle}>{'\u00D7'}</Text>
      </Pressable>
    </View>
  );
}
