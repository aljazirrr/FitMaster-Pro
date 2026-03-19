import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';

const levels = [
  {
    id: 'beginner',
    icon: '🌱',
    label: 'Beginner',
    description: 'New to fitness or returning after a long break',
  },
  {
    id: 'intermediate',
    icon: '💪',
    label: 'Intermediate',
    description: 'Training consistently for 6+ months',
  },
  {
    id: 'advanced',
    icon: '🔥',
    label: 'Advanced',
    description: 'Training for 2+ years with solid knowledge',
  },
];

export default function ExperienceScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const setExperience = useAuthStore((s) => s.setExperience);
  const [selected, setSelected] = useState<string | null>(null);
  const styles = createStyles(theme);

  const handleNext = () => {
    if (selected) {
      setExperience(selected);
      router.push('./equipment');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '60%' }]} />
        </View>
        <Text style={styles.stepLabel}>Step 3 of 5</Text>
        <Text style={styles.title}>Experience Level</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {levels.map((level) => (
          <Pressable
            key={level.id}
            style={[
              styles.card,
              selected === level.id && styles.cardSelected,
            ]}
            onPress={() => setSelected(level.id)}
          >
            <Text style={styles.cardIcon}>{level.icon}</Text>
            <Text style={styles.cardLabel}>{level.label}</Text>
            <Text style={styles.cardDescription}>{level.description}</Text>
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
      gap: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 28,
      paddingHorizontal: 24,
      borderRadius: theme.spacing.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceLight,
    },
    cardIcon: {
      fontSize: 40,
      marginBottom: 12,
    },
    cardLabel: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 6,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
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
