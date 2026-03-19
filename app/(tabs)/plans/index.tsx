import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { workoutPlans } from '../../../src/data/workoutPlans';
import type { WorkoutPlan } from '../../../src/types/workout';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const FILTERS: { key: LevelFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// AI Generate Card
// ---------------------------------------------------------------------------

interface AICardProps {
  colors: ReturnType<typeof useTheme>['theme']['colors'];
  spacing: ReturnType<typeof useTheme>['theme']['spacing'];
  typography: ReturnType<typeof useTheme>['theme']['typography'];
}

function AIGenerateCard({ colors, spacing, typography }: AICardProps) {
  const styles = StyleSheet.create({
    card: {
      borderRadius: spacing.borderRadius.lg,
      overflow: 'hidden',
    },
    inner: {
      backgroundColor: colors.primary,
      padding: spacing.cardPadding,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.22)',
    },
    badge: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: spacing.borderRadius.sm,
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    badgeText: {
      ...typography.label,
      color: '#fff',
    },
    title: {
      ...typography.h3,
      color: '#fff',
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.small,
      color: 'rgba(255,255,255,0.88)',
      marginBottom: spacing.lg,
    },
    button: {
      backgroundColor: '#fff',
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.full,
    },
    buttonText: {
      ...typography.smallBold,
      color: colors.primaryDark,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.overlay} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI POWERED</Text>
        </View>
        <Text style={styles.title}>Generate Custom Plan with AI</Text>
        <Text style={styles.description}>
          Tell us your goals, available equipment, and schedule. Our AI will
          craft a personalised training programme just for you.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Alert.alert('Coming Soon', 'AI plan generation coming soon!', [
              { text: 'OK' },
            ])
          }
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Generate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Plan Card
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: WorkoutPlan;
  colors: ReturnType<typeof useTheme>['theme']['colors'];
  spacing: ReturnType<typeof useTheme>['theme']['spacing'];
  typography: ReturnType<typeof useTheme>['theme']['typography'];
}

function PlanCard({ plan, colors, spacing, typography }: PlanCardProps) {
  const levelColor = getLevelColor(plan.level, colors);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.sm,
    },
    titleWrap: {
      flex: 1,
      marginRight: spacing.sm,
    },
    name: {
      ...typography.h4,
      color: colors.text,
      marginBottom: 2,
    },
    levelBadge: {
      backgroundColor: levelColor,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: spacing.borderRadius.sm,
      alignSelf: 'flex-start' as const,
    },
    levelBadgeText: {
      ...typography.captionBold,
      color: '#fff',
    },
    description: {
      ...typography.small,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    meta: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 5,
    },
    metaDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    metaText: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    viewButton: {
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.sm,
      paddingVertical: spacing.sm,
      alignItems: 'center' as const,
    },
    viewButtonText: {
      ...typography.smallBold,
      color: colors.background,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{plan.name}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{capitalize(plan.level)}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.description}>
        {plan.description}
      </Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{plan.daysPerWeek} days/week</Text>
        </View>
        <View style={styles.metaItem}>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{capitalize(plan.category)}</Text>
        </View>
        {plan.createdBy ? (
          <View style={styles.metaItem}>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>By {plan.createdBy}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/plans/plan/[id]',
            params: { id: plan.id },
          })
        }
        activeOpacity={0.8}
      >
        <Text style={styles.viewButtonText}>View Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PlansScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const [activeFilter, setActiveFilter] = useState<LevelFilter>('all');

  const filteredPlans =
    activeFilter === 'all'
      ? workoutPlans
      : workoutPlans.filter((p) => p.level === activeFilter);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      ...typography.h1,
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      ...typography.small,
      color: colors.textSecondary,
    },
    filterRow: {
      flexDirection: 'row' as const,
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      ...typography.smallBold,
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.screenPadding,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    emptyWrap: {
      alignItems: 'center' as const,
      paddingVertical: spacing.xxxl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workout Plans</Text>
          <Text style={styles.headerSubtitle}>
            {workoutPlans.length} plans available
          </Text>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Plan list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* AI Generate Card — always at top regardless of filter */}
          <AIGenerateCard
            colors={colors}
            spacing={spacing}
            typography={typography}
          />

          {/* Plan cards */}
          {filteredPlans.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                No plans found for this filter.
              </Text>
            </View>
          ) : (
            filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                colors={colors}
                spacing={spacing}
                typography={typography}
              />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
