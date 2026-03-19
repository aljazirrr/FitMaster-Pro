import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/theme';
import { workoutPlans } from '../../../../src/data/workoutPlans';
import { getExerciseById } from '../../../../src/data/exercises';
import type { WorkoutPlan } from '../../../../src/types/workout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getLevelColor(
  level: WorkoutPlan['level'],
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string {
  switch (level) {
    case 'beginner':
      return colors.success;
    case 'intermediate':
      return colors.warning;
    case 'advanced':
      return colors.error;
    default:
      return colors.textSecondary;
  }
}

function formatRest(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PlanDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const { id } = useLocalSearchParams<{ id: string }>();

  const plan = workoutPlans.find((p) => p.id === id);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // ---- Navbar ----
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: spacing.borderRadius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      ...typography.bodyBold,
      color: colors.text,
      lineHeight: 20,
    },
    navTitle: {
      ...typography.h4,
      color: colors.text,
      flex: 1,
    },
    // ---- Hero section ----
    hero: {
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.sectionGap,
    },
    planName: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    planDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.md,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
      marginBottom: spacing.lg,
    },
    levelBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: spacing.borderRadius.full,
      alignSelf: 'flex-start',
    },
    levelBadgeText: {
      ...typography.captionBold,
      color: '#fff',
    },
    metaBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metaBadgeText: {
      ...typography.captionBold,
      color: colors.textSecondary,
    },
    startButton: {
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    startButtonText: {
      ...typography.bodyBold,
      color: colors.background,
    },
    // ---- Divider ----
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.screenPadding,
      marginBottom: spacing.sectionGap,
    },
    // ---- Week section ----
    weekSection: {
      paddingHorizontal: spacing.screenPadding,
      marginBottom: spacing.sectionGap,
    },
    weekHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    weekPill: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: spacing.borderRadius.full,
    },
    weekPillText: {
      ...typography.captionBold,
      color: colors.background,
    },
    weekTitle: {
      ...typography.h4,
      color: colors.text,
    },
    // ---- Day card ----
    dayCard: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dayNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumberText: {
      ...typography.captionBold,
      color: colors.background,
      lineHeight: 16,
    },
    dayName: {
      ...typography.smallBold,
      color: colors.text,
      flex: 1,
    },
    exerciseCount: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    // ---- Exercise row ----
    exerciseList: {
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: spacing.sm,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    exerciseRowLast: {
      borderBottomWidth: 0,
    },
    exerciseIndex: {
      width: 20,
      ...typography.caption,
      color: colors.textTertiary,
      marginRight: spacing.sm,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      ...typography.smallBold,
      color: colors.text,
      marginBottom: 2,
    },
    exerciseMuscle: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    exerciseStats: {
      alignItems: 'flex-end',
    },
    exerciseSetsReps: {
      ...typography.smallBold,
      color: colors.primary,
    },
    exerciseRest: {
      ...typography.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },
    // ---- Not found ----
    notFoundWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    notFoundText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    goBackButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.sm,
    },
    goBackButtonText: {
      ...typography.smallBold,
      color: colors.background,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
  });

  // ---- Not found state ----
  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>Plan not found.</Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const levelColor = getLevelColor(plan.level, colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {plan.name}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>

          {/* Badges row */}
          <View style={styles.badgeRow}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
              <Text style={styles.levelBadgeText}>
                {capitalize(plan.level)}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {plan.daysPerWeek} days/week
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {capitalize(plan.category)}
              </Text>
            </View>
            {plan.createdBy ? (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>By {plan.createdBy}</Text>
              </View>
            ) : null}
          </View>

          {/* Start button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() =>
              Alert.alert(
                'Plan Started',
                'Plan started! Check your workout tab.',
                [{ text: 'OK' }],
              )
            }
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Start This Plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Week overview */}
        {plan.weeks.map((week) => (
          <View key={week.weekNumber} style={styles.weekSection}>
            <View style={styles.weekHeader}>
              <View style={styles.weekPill}>
                <Text style={styles.weekPillText}>
                  Week {week.weekNumber}
                </Text>
              </View>
              <Text style={styles.weekTitle}>
                {week.days.length} training days
              </Text>
            </View>

            {week.days.map((day) => (
              <View key={day.dayNumber} style={styles.dayCard}>
                {/* Day header */}
                <View style={styles.dayHeader}>
                  <View style={styles.dayNumberBadge}>
                    <Text style={styles.dayNumberText}>{day.dayNumber}</Text>
                  </View>
                  <Text style={styles.dayName}>{day.name}</Text>
                  <Text style={styles.exerciseCount}>
                    {day.exercises.length} exercises
                  </Text>
                </View>

                {/* Exercise list */}
                <View style={styles.exerciseList}>
                  {day.exercises.map((ex, idx) => {
                    const exercise = getExerciseById(ex.exerciseId);
                    const isLast = idx === day.exercises.length - 1;
                    return (
                      <View
                        key={`${ex.exerciseId}-${idx}`}
                        style={[
                          styles.exerciseRow,
                          isLast && styles.exerciseRowLast,
                        ]}
                      >
                        <Text style={styles.exerciseIndex}>
                          {idx + 1}.
                        </Text>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>
                            {exercise?.name ?? ex.exerciseId}
                          </Text>
                          {exercise?.muscleGroup ? (
                            <Text style={styles.exerciseMuscle}>
                              {exercise.muscleGroup}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.exerciseStats}>
                          <Text style={styles.exerciseSetsReps}>
                            {ex.sets} × {ex.reps}
                          </Text>
                          <Text style={styles.exerciseRest}>
                            Rest: {formatRest(ex.restSeconds)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
