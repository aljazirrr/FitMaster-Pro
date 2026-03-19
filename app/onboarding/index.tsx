import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';

const features = [
  { icon: '🏋️', label: 'Smart Workout Tracking' },
  { icon: '🥗', label: 'Nutrition & Meal Plans' },
  { icon: '📊', label: 'Progress Analytics' },
];

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>
            Fit<Text style={styles.titleAccent}>Master</Text> Pro
          </Text>
          <Text style={styles.subtitle}>Your AI-Powered Fitness Companion</Text>
        </View>

        <View style={styles.featuresSection}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('./goals')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>
              Already have an account?{' '}
              <Text style={styles.loginLinkAccent}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.sectionGap,
      justifyContent: 'space-between',
    },
    heroSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    title: {
      fontSize: 42,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -1,
      marginBottom: 12,
    },
    titleAccent: {
      color: theme.colors.primary,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    featuresSection: {
      paddingVertical: 32,
      gap: 20,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderRadius: theme.spacing.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    featureIcon: {
      fontSize: 28,
      marginRight: 16,
    },
    featureLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.text,
    },
    bottomSection: {
      paddingBottom: 24,
      gap: 16,
      alignItems: 'center',
    },
    getStartedButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 18,
      borderRadius: theme.spacing.borderRadius.lg,
      alignItems: 'center',
      width: '100%',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    getStartedText: {
      color: theme.colors.background,
      fontSize: 18,
      fontWeight: '700',
    },
    loginLink: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      paddingVertical: 8,
    },
    loginLinkAccent: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
