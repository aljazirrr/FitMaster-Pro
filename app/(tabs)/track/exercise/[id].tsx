import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/theme';
import { getExerciseById } from '../../../../src/data/exercises';
import { useWorkoutStore } from '../../../../src/stores/useWorkoutStore';
import type { Exercise } from '../../../../src/types/exercise';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ChipProps {
  label: string;
  color: string;
  backgroundColor: string;
  styles: ReturnType<typeof createStyles>;
}

function Chip({ label, color, backgroundColor, styles }: ChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

interface SectionProps {
  title: string;
  styles: ReturnType<typeof createStyles>;
  children: React.ReactNode;
}

function Section({ title, styles, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { activeWorkout, startWorkout, addExercise } = useWorkoutStore();

  const exercise: Exercise | undefined = id ? getExerciseById(id) : undefined;

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAddToWorkout = useCallback(() => {
    if (!id) return;

    if (activeWorkout) {
      addExercise(id);
      router.push('/(tabs)/track/workout/active');
    } else {
      startWorkout();
      addExercise(id);
      router.push('/(tabs)/track/workout/active');
    }
  }, [id, activeWorkout, startWorkout, addExercise]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
            <Text style={styles.backButtonText}>{'←'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {t('exercise.notFound', 'Exercise Not Found')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>
            {t('exercise.notFoundMessage', 'This exercise could not be found.')}
          </Text>
          <Pressable style={styles.backLinkButton} onPress={handleBack}>
            <Text style={styles.backLinkButtonText}>
              {t('common.goBack', 'Go Back')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
          <Text style={styles.backButtonText}>{'←'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise name + category badge */}
        <View style={styles.heroSection}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge]}>
              <Text style={styles.categoryBadgeText}>{capitalize(exercise.category)}</Text>
            </View>
            <View style={styles.equipmentBadge}>
              <Text style={styles.equipmentBadgeText}>{capitalize(exercise.equipment)}</Text>
            </View>
          </View>
        </View>

        {/* Muscle Groups */}
        <Section title={t('exercise.muscles', 'Muscles Targeted')} styles={styles}>
          <View style={styles.chipRow}>
            <Chip
              key={exercise.muscleGroup}
              label={capitalize(exercise.muscleGroup)}
              color={theme.colors.primary}
              backgroundColor={theme.isDark ? 'rgba(0,212,170,0.15)' : 'rgba(0,184,148,0.12)'}
              styles={styles}
            />
            {exercise.secondaryMuscles.map((muscle) => (
              <Chip
                key={muscle}
                label={capitalize(muscle)}
                color={theme.colors.textSecondary}
                backgroundColor={theme.colors.surface}
                styles={styles}
              />
            ))}
          </View>
          <View style={styles.muscleLabels}>
            <View style={styles.muscleLabelRow}>
              <View style={[styles.muscleLabelDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.muscleLabelText}>
                {t('exercise.primaryMuscle', 'Primary')}: {capitalize(exercise.muscleGroup)}
              </Text>
            </View>
            {exercise.secondaryMuscles.length > 0 && (
              <View style={styles.muscleLabelRow}>
                <View style={[styles.muscleLabelDot, { backgroundColor: theme.colors.textSecondary }]} />
                <Text style={styles.muscleLabelText}>
                  {t('exercise.secondaryMuscles', 'Secondary')}:{' '}
                  {exercise.secondaryMuscles.map(capitalize).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </Section>

        {/* Equipment */}
        <Section title={t('exercise.equipment', 'Equipment')} styles={styles}>
          <View style={styles.equipmentContainer}>
            <Text style={styles.equipmentIcon}>🏋️</Text>
            <Text style={styles.equipmentText}>{capitalize(exercise.equipment)}</Text>
          </View>
        </Section>

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <Section title={t('exercise.instructions', 'Instructions')} styles={styles}>
            {exercise.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Tips */}
        {exercise.tips.length > 0 && (
          <Section title={t('exercise.tips', 'Tips')} styles={styles}>
            {exercise.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Section>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add to Workout button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.addToWorkoutButton,
            pressed && styles.addToWorkoutButtonPressed,
          ]}
          onPress={handleAddToWorkout}
          accessibilityLabel="Add exercise to workout"
        >
          <Text style={styles.addToWorkoutButtonText}>
            {activeWorkout
              ? t('exercise.addToWorkout', 'Add to Workout')
              : t('exercise.startWorkoutWith', 'Start Workout with This Exercise')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const { colors, spacing, typography } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    backButtonText: {
      fontSize: 20,
      color: colors.text,
      lineHeight: 24,
    },
    headerTitle: {
      flex: 1,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
    },
    headerSpacer: {
      width: 36,
    },

    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.screenPadding,
    },

    // Hero
    heroSection: {
      marginBottom: spacing.xl,
    },
    exerciseName: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    categoryBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: spacing.borderRadius.full,
    },
    categoryBadgeText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold as '700',
      color: colors.background,
    },
    equipmentBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: spacing.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    equipmentBadgeText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold as '600',
      color: colors.textSecondary,
    },

    // Sections
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold as '700',
      color: colors.text,
      marginBottom: spacing.md,
    },

    // Chips
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: spacing.borderRadius.full,
    },
    chipText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold as '600',
    },

    // Muscle labels
    muscleLabels: {
      gap: spacing.sm,
    },
    muscleLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    muscleLabelDot: {
      width: 8,
      height: 8,
      borderRadius: spacing.borderRadius.full,
    },
    muscleLabelText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },

    // Equipment
    equipmentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      borderWidth: 1,
      borderColor: colors.border,
    },
    equipmentIcon: {
      fontSize: 24,
    },
    equipmentText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold as '600',
      color: colors.text,
    },

    // Instructions
    instructionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'flex-start',
    },
    instructionNumber: {
      width: 28,
      height: 28,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 1,
    },
    instructionNumberText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold as '700',
      color: colors.background,
    },
    instructionText: {
      flex: 1,
      fontSize: typography.sizes.md,
      color: colors.text,
      lineHeight: 22,
    },

    // Tips
    tipRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
      alignItems: 'flex-start',
    },
    tipBullet: {
      fontSize: typography.sizes.md,
      color: colors.accent,
      lineHeight: 22,
      width: 16,
    },
    tipText: {
      flex: 1,
      fontSize: typography.sizes.md,
      color: colors.text,
      lineHeight: 22,
    },

    // Not found
    notFoundContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screenPadding,
    },
    notFoundText: {
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    backLinkButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: spacing.borderRadius.lg,
    },
    backLinkButtonText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold as '700',
      color: colors.background,
    },

    // Footer
    footer: {
      padding: spacing.screenPadding,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    addToWorkoutButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.lg,
      borderRadius: spacing.borderRadius.lg,
      alignItems: 'center',
    },
    addToWorkoutButtonPressed: {
      opacity: 0.85,
    },
    addToWorkoutButtonText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold as '700',
      color: colors.background,
    },

    bottomSpacer: {
      height: spacing.xxl,
    },
  });
}
