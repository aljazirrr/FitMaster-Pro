import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: 'filled' | 'outline';
}

export default function Badge({
  label,
  color,
  variant = 'filled',
}: BadgeProps) {
  const { theme } = useTheme();
  const badgeColor = color ?? theme.colors.primary;

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.full,
    backgroundColor: variant === 'filled' ? badgeColor : 'transparent',
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderColor: variant === 'outline' ? badgeColor : undefined,
  };

  const textStyle: TextStyle = {
    ...theme.typography.caption,
    fontWeight: '600',
    color: variant === 'filled' ? '#FFFFFF' : badgeColor,
  };

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
