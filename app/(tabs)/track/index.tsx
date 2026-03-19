import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { getExerciseById } from '../../../src/data/exercises';
import type { WorkoutSession, PersonalRecord } from '../../../src/types/workout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}

function formatElapsed(startTimeISO: string): string {
  const elapsed = Math.floor((Date.now() - new Date(startTimeISO).getTime()) / 1000);
  return formatDuration(elapsed);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function calcVolume(session: WorkoutSession): number {
  let vol = 0;
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      vol += (s.weight ?? 0) * (s.reps ?? 0);
    }
  }
  return vol;
}

function calcStreak(history: WorkoutSession[]): number {
  if (history.length === 0) return 0;

  const completedDates = Array.from(
    new Set(
      history
        .filter((w) => w.completed)
        .map((w) => w.date),
    ),
  ).sort((a, b) => (a > b ? -1 : 1));

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let cursor = today;

  for (const date of completedDates) {
    if (date === cursor) {
      streak += 1;
      const d = new Date(cursor);
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().split('T')[0];
    } else if (date < cursor) {
      // Allow yesterday as starting point if today has no workout yet
      if (streak === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (date === yesterdayStr) {
          streak += 1;
          const d = new Date(yesterdayStr);
          d.setDate(d.getDate() - 1);
          cursor = d.toISOString().split('T')[0];
          continue;
        }
      }
      break;
    }
  }

  return streak;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  styles: ReturnType<typeof createStyles>;
}

function StatCard({ label, value, styles }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface RecentWorkoutCardProps {
  session: WorkoutSession;
  styles: ReturnType<typeof createStyles>;
}

function RecentWorkoutCard({ session, styles }: RecentWorkoutCardProps) {
  const volume = calcVolume(session);

  const handlePress = () => {
    Alert.alert('Coming Soon', 'Workout detail view coming soon.');
  };

  return (
    <Pressable style={styles.recentCard} onPress={handlePress}>
      <View style={styles.recentCardHeader}>
        <Text style={styles.recentCardName} numberOfLines={1}>{session.name}</Text>
        <Text style={styles.recentCardDate}>{formatDate(session.date)}</Text>
      </View>
      <View style={styles.recentCardMeta}>
        <Text style={styles.recentCardMetaText}>
          {formatDuration(session.duration)}
        </Text>
        <Text style={styles.recentCardMetaSep}>·</Text>
        <Text style={styles.recentCardMetaText}>
          {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.recentCardMetaSep}>·</Text>
        <Text style={styles.recentCardMetaText}>
          {volume > 0 ? `${volume.toLocaleString()} kg vol` : 'No volume'}
        </Text>
      </View>
    </Pressable>
  );
}

interface PRCardProps {
  record: PersonalRecord;
  styles: ReturnType<typeof createStyles>;
}

function PRCard({ record, styles }: PRCardProps) {
  const exercise = getExerciseById(record.exerciseId);
  const exerciseName = exercise?.name ?? record.exerciseId;

  return (
    <View style={styles.prCard}>
      <Text style={styles.prExerciseName} numberOfLines={1}>{exerciseName}</Text>
      <View style={styles.prMetaRow}>
        <View style={styles.prMetaItem}>
          <Text style={styles.prMetaValue}>{record.weight} kg</Text>
          <Text style={styles.prMetaLabel}>Weight</Text>
        </View>
        <View style={styles.prMetaDivider} />
        <View style={styles.prMetaItem}>
          <Text style={styles.prMetaValue}>{record.reps}</Text>
          <Text style={styles.prMetaLabel}>Reps</Text>
        </View>
        <View style={styles.prMetaDivider} />
        <View style={styles.prMetaItem}>
          <Text style={[styles.prMetaValue, styles.prOneRMValue]}>
            {Math.round(record.oneRepMax)} kg
          </Text>
          <Text style={styles.prMetaLabel}>Est. 1RM</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function TrackScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    activeWorkout,
    workoutHistory,
    personalRecords,
    totalWorkouts,
    weeklyWorkouts,
    startWorkout,
  } = useWorkoutStore();

  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    if (!activeWorkout) {
      setElapsedTime('');
      return;
    }

    setElapsedTime(formatElapsed(activeWorkout.startTime));
    const interval = setInterval(() => {
      setElapsedTime(formatElapsed(activeWorkout.startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  const handleStartEmptyWorkout = useCallback(() => {
    startWorkout();
    router.push('/(tabs)/track/workout/active');
  }, [startWorkout]);

  const handleBrowsePlans = useCallback(() => {
    router.push('/(tabs)/plans');
  }, []);

  const handleResumeWorkout = useCallback(() => {
    router.push('/(tabs)/track/workout/active');
  }, []);

  const streak = calcStreak(workoutHistory);
  const recentWorkouts = workoutHistory.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('track.title', 'Workout Tracker')}</Text>
        <Pressable
          style={styles.addButton}
          onPress={handleStartEmptyWorkout}
          accessibilityLabel="Start new workout"
        >
          <Text style={styles.addButtonIcon}>＋</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Workout Banner */}
        {activeWorkout != null && (
          <View style={styles.activeBanner}>
            <View style={styles.activeBannerLeft}>
              <View style={styles.activeDot} />
              <View>
                <Text style={styles.activeBannerTitle}>{activeWorkout.name}</Text>
                <Text style={styles.activeBannerMeta}>
                  {elapsedTime}
                  {'  ·  '}
                  {activeWorkout.exercises.length} exercise
                  {activeWorkout.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Pressable style={styles.resumeButton} onPress={handleResumeWorkout}>
              <Text style={styles.resumeButtonText}>
                {t('track.resume', 'Resume')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label={t('track.totalWorkouts', 'Total')}
            value={totalWorkouts}
            styles={styles}
          />
          <StatCard
            label={t('track.thisWeek', 'This Week')}
            value={weeklyWorkouts}
            styles={styles}
          />
          <StatCard
            label={t('track.streak', 'Streak')}
            value={`${streak}d`}
            styles={styles}
          />
        </View>

        {/* Start Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('track.startWorkout', 'Start Workout')}</Text>
          <View style={styles.startButtonsRow}>
            <Pressable
              style={[styles.startButton, styles.startButtonPrimary]}
              onPress={handleStartEmptyWorkout}
            >
              <Text style={styles.startButtonPrimaryText}>
                {t('track.emptyWorkout', 'Empty Workout')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.startButton, styles.startButtonSecondary]}
              onPress={handleBrowsePlans}
            >
              <Text style={styles.startButtonSecondaryText}>
                {t('track.browsePlans', 'Browse Plans')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('track.recentWorkouts', 'Recent Workouts')}
            </Text>
            {recentWorkouts.map((session) => (
              <RecentWorkoutCard key={session.id} session={session} styles={styles} />
            ))}
          </View>
        )}

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('track.personalRecords', 'Personal Records')}
            </Text>
            {personalRecords.map((pr) => (
              <PRCard key={pr.id} record={pr} styles={styles} />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    addButton: {
      width: 38,
      height: 38,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonIcon: {
      fontSize: 22,
      color: colors.background,
      lineHeight: 26,
      fontWeight: typography.weights.bold,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.screenPadding,
    },

    // Active banner
    activeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    activeBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    activeDot: {
      width: 10,
      height: 10,
      borderRadius: spacing.borderRadius.full,
      backgroundColor: colors.success,
    },
    activeBannerTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    activeBannerMeta: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    resumeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.lg,
    },
    resumeButtonText: {
      color: colors.background,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },

    // Section
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },

    // Start buttons
    startButtonsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    startButton: {
      flex: 1,
      paddingVertical: spacing.lg,
      borderRadius: spacing.borderRadius.lg,
      alignItems: 'center',
    },
    startButtonPrimary: {
      backgroundColor: colors.primary,
    },
    startButtonPrimaryText: {
      color: colors.background,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
    },
    startButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    startButtonSecondaryText: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },

    // Recent workout cards
    recentCard: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    recentCardName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    recentCardDate: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    recentCardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    recentCardMetaText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
    recentCardMetaSep: {
      fontSize: typography.sizes.sm,
      color: colors.textTertiary,
    },

    // PR cards
    prCard: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    prExerciseName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    prMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    prMetaItem: {
      flex: 1,
      alignItems: 'center',
    },
    prMetaDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    prMetaValue: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    prOneRMValue: {
      color: colors.primary,
    },
    prMetaLabel: {
      fontSize: typography.sizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },

    bottomSpacer: {
      height: spacing.xxl,
    },
  });
}
