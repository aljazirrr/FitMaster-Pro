import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import type { DietType, ActivityLevel } from '../../src/types/user';

const dietOptions: { id: DietType; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'mediterranean', label: 'Mediterranean' },
];

const activityOptions: { id: ActivityLevel; label: string }[] = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'light', label: 'Lightly Active' },
  { id: 'moderate', label: 'Moderately Active' },
  { id: 'active', label: 'Very Active' },
  { id: 'very_active', label: 'Extra Active' },
];

export default function PreferencesScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { setPreferences, setOnboarded } = useAuthStore();
  const [diet, setDiet] = useState<DietType | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const styles = createStyles(theme);

  const isValid = diet && activity;

  const handleComplete = () => {
    if (diet && activity) {
      setPreferences(diet, activity);
      setOnboarded(true);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>
        <Text style={styles.stepLabel}>Step 5 of 5</Text>
        <Text style={styles.title}>Almost Done!</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet Preference</Text>
          <View style={styles.pillGrid}>
            {dietOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.pill,
                  diet === option.id && styles.pillSelected,
                ]}
                onPress={() => setDiet(option.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    diet === option.id && styles.pillTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <View style={styles.activityList}>
            {activityOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.activityItem,
                  activity === option.id && styles.activityItemSelected,
                ]}
                onPress={() => setActivity(option.id)}
              >
                <Text
                  style={[
                    styles.activityText,
                    activity === option.id && styles.activityTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.completeButton,
            !isValid && styles.completeButtonDisabled,
            pressed && isValid && styles.buttonPressed,
          ]}
          onPress={handleComplete}
          disabled={!isValid}
        >
          <Text style={[styles.completeButtonText, !isValid && styles.completeButtonTextDisabled]}>
            Complete Setup
          </Text>
        </Pressable>
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
    header: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingTop: 16,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    stepLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 24,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingBottom: 16,
      gap: 32,
    },
    section: {
      gap: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    pillGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    pill: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: theme.spacing.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    pillSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceLight,
    },
    pillText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    pillTextSelected: {
      color: theme.colors.primary,
    },
    activityList: {
      gap: 10,
    },
    activityItem: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: theme.spacing.borderRadius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    activityItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceLight,
    },
    activityText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activityTextSelected: {
      color: theme.colors.primary,
    },
    bottomSection: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingBottom: 24,
      paddingTop: 12,
    },
    completeButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 18,
      borderRadius: theme.spacing.borderRadius.lg,
      alignItems: 'center',
    },
    completeButtonDisabled: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    completeButtonText: {
      color: theme.colors.background,
      fontSize: 18,
      fontWeight: '700',
    },
    completeButtonTextDisabled: {
      color: theme.colors.textTertiary,
    },
  });
