import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  progress,
  color,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const barColor = color ?? theme.colors.primary;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  const containerStyle: ViewStyle = {
    width: '100%',
  };

  const labelContainerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  };

  const labelTextStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  };

  const trackStyle: ViewStyle = {
    height,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: height / 2,
    overflow: 'hidden',
  };

  const fillStyle = {
    height,
    borderRadius: height / 2,
    backgroundColor: barColor,
    width: animatedWidth.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  return (
    <View style={containerStyle}>
      {showLabel && (
        <View style={labelContainerStyle}>
          {label && <Text style={labelTextStyle}>{label}</Text>}
          <Text style={labelTextStyle}>{Math.round(clampedProgress * 100)}%</Text>
        </View>
      )}
      <View style={trackStyle}>
        <Animated.View style={fillStyle} />
      </View>
    </View>
  );
}
