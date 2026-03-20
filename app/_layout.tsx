import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme';
import { useNotifications } from '../src/hooks/useNotifications';
import useSettingsStore from '../src/stores/useSettingsStore';
import i18n from '../src/i18n';

function RootLayoutInner() {
  const { theme, setDarkMode } = useTheme();
  const { enable } = useNotifications();
  const { notifications, theme: settingsTheme, language } = useSettingsStore();

  // Sync theme store → ThemeProvider
  useEffect(() => {
    setDarkMode(settingsTheme === 'dark');
  }, [settingsTheme]);

  // Sync language store → i18n
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // On first mount, re-schedule reminders if the user had them enabled
  useEffect(() => {
    if (notifications) {
      enable().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
