import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import type { FitnessGoal } from '../../src/types/user';

const goals: { id: FitnessGoal; icon: string; label: string; labelRo: string }[] = [
  { id: 'build_muscle', icon: '🏋️', label: 'Build Muscle', labelRo: 'Construiește Masă Musculară' },
  { id: 'lose_weight', icon: '⚡', label: 'Lose Weight', labelRo: 'Pierde în Greutate' },
  { id: 'maintain', icon: '💪', label: 'Maintain Fitness', labelRo: 'Menține Forma' },
  { id: 'improve_endurance', icon: '🏃', label: 'Improve Endurance', labelRo: 'Îmbunătățește Rezistența' },
  { id: 'flexibility', icon: '🧘', label: 'Flexibility', labelRo: 'Flexibilitate' },
];

export default function GoalsScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const setGoal = useAuthStore((s) => s.setGoal);
  const [selected, setSelected] = useState<FitnessGoal | null>(null);
  const styles = createStyles(theme);
  const isRo = i18n.language === 'ro';

  const handleNext = () => {
    if (selected) {
      setGoal(selected);
      router.push('./measurements');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '20%' }]} />
        </View>
        <Text style={styles.stepLabel}>Step 1 of 5</Text>
        <Text style={styles.title}>What's your fitness goal?</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {goals.map((goal) => (
          <Pressable
            key={goal.id}
            style={[
              styles.goalCard,
              selected === goal.id && styles.goalCardSelected,
            ]}
            onPress={() => setSelected(goal.id)}
          >
            <Text style={styles.goalIcon}>{goal.icon}</Text>
            <View style={styles.goalTextContainer}>
              <Text style={styles.goalLabel}>{goal.label}</Text>
              <Text style={styles.goalLabelRo}>{goal.labelRo}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            !selected && styles.nextButtonDisabled,
            pressed && selected && styles.buttonPressed,
          ]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text style={[styles.nextButtonText, !selected && styles.nextButtonTextDisabled]}>
            Next
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
      gap: 12,
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: theme.spacing.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    goalCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceLight,
    },
    goalIcon: {
      fontSize: 32,
      marginRight: 16,
    },
    goalTextContainer: {
      flex: 1,
    },
    goalLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    goalLabelRo: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    bottomSection: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingBottom: 24,
      paddingTop: 12,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 18,
      borderRadius: theme.spacing.borderRadius.lg,
      alignItems: 'center',
    },
    nextButtonDisabled: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    nextButtonText: {
      color: theme.colors.background,
      fontSize: 18,
      fontWeight: '700',
    },
    nextButtonTextDisabled: {
      color: theme.colors.textTertiary,
    },
  });
