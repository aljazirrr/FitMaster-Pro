import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';

interface MacroRingProps {
  current: number;
  target: number;
  color: string;
  label: string;
  unit?: string;
}

export default function MacroRing({
  current,
  target,
  color,
  label,
  unit = 'g',
}: MacroRingProps) {
  const { theme } = useTheme();

  const size = 90;
  const center = size / 2;
  const strokeWidth = 8;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const dashArray = `${circumference * progress} ${circumference * (1 - progress)}`;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
  };

  const ringContainerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
  };

  const centerTextStyle: ViewStyle = {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const currentStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.text,
    textAlign: 'center',
  };

  const targetStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  };

  const labelStyle: TextStyle = {
    ...theme.typography.captionBold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      <View style={ringContainerStyle}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.surfaceLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={dashArray}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        </Svg>
        <View style={centerTextStyle}>
          <Text style={currentStyle}>
            {Math.round(current)}
            {unit}
          </Text>
          <Text style={targetStyle}>/ {Math.round(target)}</Text>
        </View>
      </View>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}
