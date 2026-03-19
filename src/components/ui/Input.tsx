import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardTypeOptions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  icon,
}: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const containerStyle: ViewStyle = {
    marginBottom: theme.spacing.lg,
  };

  const labelStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1.5,
    borderColor: error
      ? theme.colors.error
      : focused
      ? theme.colors.primary
      : theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  };

  const inputStyle: TextStyle = {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
    marginLeft: icon ? theme.spacing.sm : 0,
    paddingVertical: 0,
  };

  const errorStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
}
