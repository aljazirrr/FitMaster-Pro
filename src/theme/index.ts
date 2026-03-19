import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { darkColors, lightColors, Colors } from './colors';
import { typography, Typography } from './typography';
import { spacing, Spacing } from './spacing';

export interface Theme {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(() => setIsDark((d) => !d), []);
  const setDarkMode = useCallback((dark: boolean) => setIsDark(dark), []);

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    isDark,
  }), [isDark]);

  const value = useMemo(() => ({ theme, toggleTheme, setDarkMode }), [theme, toggleTheme, setDarkMode]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export { darkColors, lightColors, typography, spacing };
export type { Colors, Typography, Spacing };
