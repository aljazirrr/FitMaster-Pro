import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface WaterTrackerProps {
  current: number;
  target: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function WaterTracker({
  current,
  target,
  onAdd,
  onRemove,
}: WaterTrackerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const fillAnim = useRef(new Animated.Value(0)).current;

  const fillRatio = target > 0 ? Math.min(current / target, 1) : 0;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: fillRatio,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [fillRatio]);

  const glassCount = current;
  const glassTarget = target;

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.cardPadding,
    alignItems: 'center',
  };

  const titleStyle: TextStyle = {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  };

  const glassContainerStyle: ViewStyle = {
    width: 80,
    height: 120,
    borderWidth: 3,
    borderColor: theme.colors.water,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    marginVertical: theme.spacing.md,
    position: 'relative',
  };

  const glassTopStyle: ViewStyle = {
    width: 88,
    height: 3,
    backgroundColor: theme.colors.water,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: -1,
  };

  const fillStyle = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.water,
    opacity: 0.4,
    height: fillAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  const countStyle: TextStyle = {
    ...theme.typography.h2,
    color: theme.colors.water,
  };

  const targetTextStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  };

  const buttonRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  };

  const circleButtonStyle = (bgColor: string): ViewStyle => ({
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: bgColor,
    alignItems: 'center',
    justifyContent: 'center',
  });

  const buttonTextStyle: TextStyle = {
    ...theme.typography.h3,
    color: theme.colors.background,
  };

  const glassRowStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    maxWidth: 200,
  };

  const miniGlassStyle = (filled: boolean): ViewStyle => ({
    width: 20,
    height: 24,
    borderRadius: 4,
    backgroundColor: filled ? theme.colors.water : theme.colors.surfaceLight,
    opacity: filled ? 0.8 : 0.3,
  });

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>Water</Text>

      {/* Glass visual */}
      <View style={glassTopStyle} />
      <View style={glassContainerStyle}>
        <Animated.View style={fillStyle} />
      </View>

      {/* Count */}
      <Text style={countStyle}>
        {glassCount} / {glassTarget}
      </Text>
      <Text style={targetTextStyle}>glasses</Text>

      {/* +/- buttons */}
      <View style={buttonRowStyle}>
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => [
            circleButtonStyle(theme.colors.surfaceLight),
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[buttonTextStyle, { color: theme.colors.text }]}>-</Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            circleButtonStyle(theme.colors.water),
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={buttonTextStyle}>+</Text>
        </Pressable>
      </View>

      {/* Mini glass indicators */}
      <View style={glassRowStyle}>
        {Array.from({ length: glassTarget }, (_, i) => (
          <View key={i} style={miniGlassStyle(i < glassCount)} />
        ))}
      </View>
    </View>
  );
}
