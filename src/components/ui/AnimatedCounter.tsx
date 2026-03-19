import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme';
import { formatNumber } from '../../utils/formatters';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  style?: StyleProp<TextStyle>;
}

export default function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  style,
}: AnimatedCounterProps) {
  const { theme } = useTheme();

  const defaultStyle: TextStyle = {
    ...theme.typography.number,
    color: theme.colors.text,
  };

  const displayValue = Number.isInteger(value)
    ? formatNumber(value)
    : value.toFixed(1);

  return (
    <Text style={[defaultStyle, style]}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}
