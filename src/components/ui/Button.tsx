import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: ButtonSize;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  size = 'md',
}: ButtonProps) {
  const { theme } = useTheme();

  const getBackgroundColor = useCallback((): string => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  }, [variant, disabled, theme]);

  const getTextColor = useCallback((): string => {
    if (disabled) return theme.colors.textTertiary;
    switch (variant) {
      case 'primary':
        return theme.colors.background;
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.background;
    }
  }, [variant, disabled, theme]);

  const getBorderStyle = useCallback((): ViewStyle => {
    if (variant === 'outline') {
      return {
        borderWidth: 1.5,
        borderColor: disabled ? theme.colors.border : theme.colors.primary,
      };
    }
    return {};
  }, [variant, disabled, theme]);

  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 36, paddingHorizontal: theme.spacing.md, fontSize: 13 },
    md: { height: 48, paddingHorizontal: theme.spacing.lg, fontSize: 15 },
    lg: { height: 56, paddingHorizontal: theme.spacing.xl, fontSize: 17 },
  };

  const sizeConfig = sizeStyles[size];

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    backgroundColor: getBackgroundColor(),
    borderRadius: theme.spacing.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: fullWidth ? 'stretch' : 'auto',
    ...getBorderStyle(),
  };

  const textStyle: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    color: getTextColor(),
    marginLeft: icon ? theme.spacing.sm : 0,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        containerStyle,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
