import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useNutritionStore } from '../../src/stores/useNutritionStore';
import { getFoodById } from '../../src/data/foods';
import type { Theme } from '../../src/theme';
import type { WorkoutSession } from '../../src/types/workout';
import type { MealEntry } from '../../src/types/nutrition';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeBasedGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.goodMorning';
  if (hour < 17) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function calcEntriesNutrition(entries: MealEntry[], customFoods: import('../../../src/types/nutrition').FoodItem[] = []) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const entry of entries) {
    const food = getFoodById(entry.foodId) ?? customFoods.find((f) => f.id === entry.foodId);
    if (!food) continue;
    calories += food.calories * entry.servings;
    protein += food.protein * entry.servings;
    carbs += food.carbs * entry.servings;
    fat += food.fat * entry.servings;
  }
  return { calories, protein, carbs, fat };
}

// Group workout history by day-of-week for the current Mon–Sun week.
// Returns an array of 7 counts indexed Mon=0 … Sun=6.
function getWeeklyWorkoutCounts(history: WorkoutSession[]): number[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon …
  const diffToMon = (dayOfWeek + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - diffToMon);

  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const session of history) {
    const d = new Date(session.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - weekStart.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) {
      counts[diff]++;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Styles factory
// ---------------------------------------------------------------------------

function createStyles(theme: Theme) {
  const { colors, spacing, typography } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: spacing.xxl + spacing.xl,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    greeting: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    userName: {
      ...typography.h2,
      color: colors.text,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    streakText: {
      ...typography.bodyBold,
      color: colors.text,
    },
    streakLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },

    // ── Section headings / gaps ─────────────────────────────────────────────
    sectionTitle: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.screenPadding,
    },
    sectionGap: {
      height: spacing.sectionGap,
    },

    // ── Generic card ────────────────────────────────────────────────────────
    card: {
      marginHorizontal: spacing.screenPadding,
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // ── Calorie ring center text ─────────────────────────────────────────────
    calorieRingWrapper: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    calorieNumber: {
      ...typography.number,
      color: colors.text,
    },
    calorieUnit: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    calorieTarget: {
      ...typography.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },

    // ── Macros ──────────────────────────────────────────────────────────────
    macroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    macroDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    macroLabel: {
      width: 60,
      ...typography.small,
      color: colors.textSecondary,
    },
    macroBarWrapper: {
      flex: 1,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: 8,
      borderRadius: 4,
    },
    macroValue: {
      width: 84,
      ...typography.small,
      color: colors.text,
      textAlign: 'right',
    },
    macroValueTertiary: {
      color: colors.textTertiary,
    },

    // ── Quick actions ───────────────────────────────────────────────────────
    quickActionsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.screenPadding,
      gap: spacing.sm,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    quickActionEmoji: {
      fontSize: 24,
    },
    quickActionLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },

    // ── Weekly activity bar chart ────────────────────────────────────────────
    chartWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 100,
      paddingTop: spacing.sm,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.sm,
    },
    bar: {
      width: '70%',
      borderRadius: spacing.borderRadius.sm,
      minHeight: 4,
    },
    barDayLabel: {
      ...typography.caption,
      color: colors.textTertiary,
    },

    // ── Recent workouts ──────────────────────────────────────────────────────
    workoutItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    workoutIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    workoutInfo: {
      flex: 1,
    },
    workoutName: {
      ...typography.bodyBold,
      color: colors.text,
    },
    workoutDate: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    workoutDuration: {
      ...typography.smallBold,
      color: colors.primary,
    },

    // ── Today's meals ────────────────────────────────────────────────────────
    mealsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    mealChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.lg,
      borderWidth: 1,
      gap: spacing.sm,
    },
    mealChipLogged: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    mealChipEmpty: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    mealChipText: {
      ...typography.small,
      fontWeight: '500',
    },
    mealChipTextLogged: {
      color: colors.primary,
    },
    mealChipTextEmpty: {
      color: colors.textTertiary,
    },

    // ── Water row ────────────────────────────────────────────────────────────
    waterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    waterLabel: {
      ...typography.small,
      color: colors.textSecondary,
      flex: 1,
    },
    waterValue: {
      ...typography.smallBold,
      color: colors.water,
    },

    // ── Stats row ────────────────────────────────────────────────────────────
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginHorizontal: spacing.screenPadding,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    statNumber: {
      ...typography.h3,
      color: colors.text,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // ── Empty state ──────────────────────────────────────────────────────────
    emptyText: {
      ...typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
  });
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  styles: ReturnType<typeof createStyles>;
}

function ProgressBar({ value, max, color, styles }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(pct * 100)}%` as `${number}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MacroRow
// ---------------------------------------------------------------------------

interface MacroRowProps {
  label: string;
  value: number;
  target: number;
  color: string;
  unit: string;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}

function MacroRow({ label, value, target, color, unit, styles }: MacroRowProps) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBarWrapper}>
        <ProgressBar value={value} max={target} color={color} styles={styles} />
      </View>
      <Text style={styles.macroValue}>
        {Math.round(value)}
        <Text style={[styles.macroValue, styles.macroValueTertiary]}>
          /{target}{unit}
        </Text>
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CalorieRing — pure View-based circular progress indicator
// ---------------------------------------------------------------------------

const RING_SIZE = 140;
const RING_BORDER = 10;
const RING_HALF = RING_SIZE / 2;

interface CalorieRingProps {
  consumed: number;
  target: number;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}

function CalorieRing({ consumed, target, theme, styles }: CalorieRingProps) {
  const { t } = useTranslation();
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const deg = pct * 360;
  const rightDeg = Math.min(deg, 180);
  const leftDeg = Math.max(deg - 180, 0);

  return (
    <View style={styles.calorieRingWrapper}>
      {/* Track ring */}
      <View
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_HALF,
          borderWidth: RING_BORDER,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Right half fill (covers 0–180°) */}
        <View
          style={{
            position: 'absolute',
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_HALF,
            overflow: 'hidden',
          }}
          pointerEvents="none"
        >
          <View
            style={{
              position: 'absolute',
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_HALF,
              borderWidth: RING_BORDER,
              borderTopColor: theme.colors.calories,
              borderRightColor: theme.colors.calories,
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: [{ rotate: `${-90 + rightDeg}deg` }],
            }}
          />
        </View>

        {/* Left half fill (covers 180–360°) — only rendered when > 50% */}
        {leftDeg > 0 && (
          <View
            style={{
              position: 'absolute',
              width: RING_SIZE,
              height: RING_SIZE,
              borderRadius: RING_HALF,
              overflow: 'hidden',
            }}
            pointerEvents="none"
          >
            <View
              style={{
                position: 'absolute',
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: RING_HALF,
                borderWidth: RING_BORDER,
                borderBottomColor: theme.colors.calories,
                borderLeftColor: theme.colors.calories,
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
                transform: [{ rotate: `${-90 + leftDeg}deg` }],
              }}
            />
          </View>
        )}

        {/* Center label */}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.calorieNumber}>{Math.round(consumed)}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
          <Text style={styles.calorieTarget}>{t('home.of', 'of')} {target}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MEAL_LABEL_KEYS: Array<{
  key: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  emoji: string;
  tKey: string;
  fallback: string;
}> = [
  { key: 'breakfast', emoji: '🌅', tKey: 'nutrition.breakfast', fallback: 'Breakfast' },
  { key: 'lunch', emoji: '☀️', tKey: 'nutrition.lunch', fallback: 'Lunch' },
  { key: 'dinner', emoji: '🌙', tKey: 'nutrition.dinner', fallback: 'Dinner' },
  { key: 'snacks', emoji: '🍎', tKey: 'nutrition.snacks', fallback: 'Snacks' },
];

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const user = useAuthStore((s) => s.user);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const totalWorkouts = useWorkoutStore((s) => s.totalWorkouts);
  const weeklyWorkouts = useWorkoutStore((s) => s.weeklyWorkouts);
  // Subscribe to dailyLog directly so the component re-renders when food/water is added
  const dailyLog = useNutritionStore((s) => s.dailyLog);
  const customFoods = useNutritionStore((s) => s.customFoods);
  const getDailyNutrition = useNutritionStore((s) => s.getDailyNutrition);

  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setRefreshing(false);
    }, 600);
  }, []);

  const todayStr = getTodayStr();

  const dailyNutrition = useMemo(
    () => getDailyNutrition(todayStr),
    // dailyLog triggers re-render when food/water is added; refreshKey for pull-to-refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dailyLog, todayStr, refreshKey],
  );

  const nutritionTotals = useMemo(() => {
    const allEntries: MealEntry[] = [
      ...dailyNutrition.meals.breakfast,
      ...dailyNutrition.meals.lunch,
      ...dailyNutrition.meals.dinner,
      ...dailyNutrition.meals.snacks,
    ];
    return calcEntriesNutrition(allEntries, customFoods);
  }, [dailyNutrition, customFoods]);

  const weeklyBarData = useMemo(
    () => getWeeklyWorkoutCounts(workoutHistory),
    [workoutHistory],
  );
  const maxBarValue = useMemo(() => Math.max(...weeklyBarData, 1), [weeklyBarData]);

  const recentWorkouts = useMemo(() => workoutHistory.slice(0, 2), [workoutHistory]);

  // Today's index in the Mon=0 … Sun=6 scheme
  const todayBarIndex = useMemo(() => {
    const d = new Date().getDay(); // 0=Sun
    return (d + 6) % 7;
  }, []);

  const greeting = t(getTimeBasedGreetingKey(), 'Good morning');
  const userName = user?.name ?? t('common.athlete', 'Athlete');
  const streakDays = user?.streakDays ?? 0;
  const weight = user?.measurements?.weight;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>

          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 20 }}>🔥</Text>
            <View>
              <Text style={styles.streakText}>{streakDays}</Text>
              <Text style={styles.streakLabel}>{t('home.dayStreak', 'day streak')}</Text>
            </View>
          </View>
        </View>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={{ fontSize: 22 }}>🏋️</Text>
            <Text style={styles.statNumber}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>{t('home.totalWorkouts', 'Total\nWorkouts')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={{ fontSize: 22 }}>📅</Text>
            <Text style={styles.statNumber}>{weeklyWorkouts}</Text>
            <Text style={styles.statLabel}>{t('home.thisWeek', 'This\nWeek')}</Text>
          </View>

          {weight != null && (
            <View style={styles.statCard}>
              <Text style={{ fontSize: 22 }}>⚖️</Text>
              <Text style={styles.statNumber}>{weight}</Text>
              <Text style={styles.statLabel}>{t('home.weightKg', 'Weight\n(kg)')}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionGap} />

        {/* ── Today's Nutrition ──────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {t('home.todayNutrition', "Today's Nutrition")}
        </Text>
        <View style={styles.card}>
          <CalorieRing
            consumed={nutritionTotals.calories}
            target={dailyNutrition.targetCalories}
            theme={theme}
            styles={styles}
          />

          <MacroRow
            label={t('nutrition.protein', 'Protein')}
            value={nutritionTotals.protein}
            target={dailyNutrition.targetProtein}
            color={theme.colors.protein}
            unit="g"
            styles={styles}
            theme={theme}
          />
          <MacroRow
            label={t('nutrition.carbs', 'Carbs')}
            value={nutritionTotals.carbs}
            target={dailyNutrition.targetCarbs}
            color={theme.colors.carbs}
            unit="g"
            styles={styles}
            theme={theme}
          />
          <MacroRow
            label={t('nutrition.fat', 'Fat')}
            value={nutritionTotals.fat}
            target={dailyNutrition.targetFat}
            color={theme.colors.fat}
            unit="g"
            styles={styles}
            theme={theme}
          />

          {/* Water */}
          <View style={styles.waterRow}>
            <Text style={{ fontSize: 18 }}>💧</Text>
            <Text style={styles.waterLabel}>{t('nutrition.water', 'Water')}</Text>
            <View style={{ flex: 2 }}>
              <ProgressBar
                value={dailyNutrition.water.current}
                max={dailyNutrition.water.target}
                color={theme.colors.water}
                styles={styles}
              />
            </View>
            <Text style={styles.waterValue}>
              {dailyNutrition.water.current}/{dailyNutrition.water.target} {t('home.glasses', 'glasses')}
            </Text>
          </View>
        </View>

        <View style={styles.sectionGap} />

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {t('home.quickActions', 'Quick Actions')}
        </Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/track')}
          >
            <Text style={styles.quickActionEmoji}>💪</Text>
            <Text style={styles.quickActionLabel}>{t('home.startWorkout', 'Start\nWorkout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <Text style={styles.quickActionEmoji}>🥗</Text>
            <Text style={styles.quickActionLabel}>{t('home.logMeal', 'Log\nMeal')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.quickActionEmoji}>⚖️</Text>
            <Text style={styles.quickActionLabel}>{t('home.logWeight', 'Log\nWeight')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.quickActionEmoji}>💧</Text>
            <Text style={styles.quickActionLabel}>{t('home.logWater', 'Log\nWater')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionGap} />

        {/* ── Weekly Activity ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {t('home.weeklyActivity', 'Weekly Activity')}
        </Text>
        <View style={styles.card}>
          <View style={styles.chartWrapper}>
            {weeklyBarData.map((count, idx) => {
              const isToday = idx === todayBarIndex;
              const barHeight =
                count > 0
                  ? Math.max((count / maxBarValue) * 72, 12)
                  : 4;
              return (
                <View key={idx} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isToday
                          ? theme.colors.primary
                          : count > 0
                          ? theme.colors.primary + '60'
                          : theme.colors.border,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.barDayLabel,
                      isToday && {
                        color: theme.colors.primary,
                        fontWeight: '700' as const,
                      },
                    ]}
                  >
                    {DAY_LABELS[idx]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionGap} />

        {/* ── Recent Workouts ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {t('home.recentWorkouts', 'Recent Workouts')}
        </Text>
        <View style={styles.card}>
          {recentWorkouts.length === 0 ? (
            <Text style={styles.emptyText}>
              {t('home.noWorkouts', 'No workouts yet. Start your first one!')}
            </Text>
          ) : (
            recentWorkouts.map((session, idx) => (
              <View
                key={session.id}
                style={[
                  styles.workoutItem,
                  idx === recentWorkouts.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.workoutIconCircle}>
                  <Text style={{ fontSize: 18 }}>🏋️</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{session.name}</Text>
                  <Text style={styles.workoutDate}>{formatDate(session.date)}</Text>
                </View>
                <Text style={styles.workoutDuration}>
                  {formatDuration(session.duration)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionGap} />

        {/* ── Today's Meals ──────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>
          {t('home.todayMeals', "Today's Meals")}
        </Text>
        <View style={styles.card}>
          <View style={styles.mealsGrid}>
            {MEAL_LABEL_KEYS.map(({ key, emoji, tKey, fallback }) => {
              const hasEntries = dailyNutrition.meals[key].length > 0;
              const count = dailyNutrition.meals[key].length;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.mealChip,
                    hasEntries ? styles.mealChipLogged : styles.mealChipEmpty,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/nutrition')}
                >
                  <Text style={{ fontSize: 16 }}>{hasEntries ? '✅' : emoji}</Text>
                  <Text
                    style={[
                      styles.mealChipText,
                      hasEntries ? styles.mealChipTextLogged : styles.mealChipTextEmpty,
                    ]}
                  >
                    {t(tKey, fallback)}
                    {hasEntries ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
