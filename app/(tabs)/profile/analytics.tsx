/**
 * Progress Analytics Screen
 *
 * Shows AI-powered insights on weight trend, projections, and recommendations.
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useProgressStore } from '../../../src/stores/useProgressStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import {
  linearRegression,
  classifyTrend,
  weeklyRate,
  consistencyScore,
} from '../../../src/services/progressAnalyticsService';
import type { ProgressTrend } from '../../../src/services/progressAnalyticsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trendEmoji(trend: ProgressTrend): string {
  switch (trend) {
    case 'positive': return '📈';
    case 'plateau': return '➡️';
    case 'negative': return '📉';
  }
}

function trendLabel(trend: ProgressTrend): string {
  switch (trend) {
    case 'positive': return 'On Track';
    case 'plateau': return 'Plateau';
    case 'negative': return 'Needs Attention';
  }
}

function trendColor(trend: ProgressTrend, colors: ReturnType<typeof useTheme>['theme']['colors']): string {
  switch (trend) {
    case 'positive': return colors.success;
    case 'plateau': return colors.warning;
    case 'negative': return colors.error;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatKgChange(val: number): string {
  return val > 0 ? `+${val}kg` : `${val}kg`;
}

// ─── Mini weight chart (SVG-free) ─────────────────────────────────────────────

interface SparklineProps {
  values: number[];
  color: string;
}

function Sparkline({ values, color }: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const WIDTH = 200;
  const HEIGHT = 48;
  const step = WIDTH / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = HEIGHT - ((v - min) / range) * HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');

  // Render as a simple bar series using React Native views (no SVG dependency needed here)
  const barWidth = Math.max(3, (WIDTH / values.length) - 2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: HEIGHT, gap: 2 }}>
      {values.map((v, i) => {
        const heightPct = ((v - min) / range) * HEIGHT || 4;
        return (
          <View
            key={i}
            style={{
              width: barWidth,
              height: heightPct,
              backgroundColor: color,
              borderRadius: 2,
              opacity: i === values.length - 1 ? 1 : 0.5,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const { language } = useSettingsStore();
  const lang = language as 'en' | 'ro';

  const { weightEntries, measurementEntries, aiInsights, isLoadingInsights, fetchInsightsAsync } =
    useProgressStore();
  const { user } = useAuthStore();

  const goal = user?.goals?.[0];
  const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalChange = last && first ? +(last.value - first.value).toFixed(1) : 0;
  const rate = weightEntries.length >= 2 ? weeklyRate(weightEntries) : 0;
  const { slope } = linearRegression(weightEntries);
  const trend = classifyTrend(slope, goal);
  const consistency = consistencyScore(weightEntries);

  // Measurement delta
  const sortedMeas = [...measurementEntries].sort((a, b) => a.date.localeCompare(b.date));
  const oldMeas = sortedMeas[0]?.measurements;
  const newMeas = sortedMeas[sortedMeas.length - 1]?.measurements;

  const handleFetchInsights = useCallback(() => {
    fetchInsightsAsync({ goal, language: lang });
  }, [fetchInsightsAsync, goal, lang]);

  // Auto-fetch on first load if no insights
  useEffect(() => {
    if (!aiInsights && weightEntries.length >= 2) {
      handleFetchInsights();
    }
  }, []);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
      marginRight: spacing.sm,
    },
    headerTitle: { ...typography.h3, color: colors.text, flex: 1 },
    refreshBtn: {
      backgroundColor: `${colors.primary}22`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: spacing.borderRadius.sm,
    },
    refreshBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.md, paddingBottom: 40 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      marginBottom: spacing.md,
    },
    cardTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
    // Hero stats
    heroRow: { flexDirection: 'row', gap: spacing.sm },
    heroStat: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.sm,
      alignItems: 'center',
    },
    heroValue: { ...typography.h2, color: colors.text },
    heroLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    // Trend badge
    trendBadge: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.sm, paddingVertical: 4,
      borderRadius: 999, alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    trendText: { ...typography.caption, fontWeight: '700', marginLeft: 4 },
    // Summary text
    summaryText: { ...typography.body, color: colors.text, lineHeight: 24 },
    // Recommendations
    recRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    recBullet: { ...typography.body, color: colors.primary, marginRight: spacing.xs, marginTop: 1 },
    recText: { ...typography.small, color: colors.text, flex: 1, lineHeight: 20 },
    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    statBox: {
      backgroundColor: colors.background,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.sm,
      minWidth: '46%',
      flex: 1,
    },
    statValue: { ...typography.h3, color: colors.text },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    // Projection card
    projRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    projIcon: { fontSize: 32 },
    projText: { ...typography.body, color: colors.text, flex: 1, lineHeight: 22 },
    projDate: { ...typography.bodyBold, color: colors.primary },
    // Measurements
    measRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    measLabel: { ...typography.small, color: colors.textSecondary },
    measDelta: { ...typography.smallBold, color: colors.text },
    // Loading
    loadingContainer: { alignItems: 'center', padding: spacing.lg },
    loadingText: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xs },
    // Empty
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  });

  if (weightEntries.length < 2) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={{ color: colors.text, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress Analytics</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Text style={{ fontSize: 48 }}>📊</Text>
          <Text style={[styles.emptyText, { marginTop: spacing.md }]}>
            Log at least 2 weight entries to unlock AI analytics.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const insightsTrend = aiInsights?.trend ?? trend;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: colors.text, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Analytics</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleFetchInsights}
          disabled={isLoadingInsights}
        >
          <Text style={styles.refreshBtnText}>
            {isLoadingInsights ? '⏳' : '✨ Refresh AI'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero stats ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={[styles.trendBadge, { backgroundColor: `${trendColor(insightsTrend, colors)}22` }]}>
            <Text>{trendEmoji(insightsTrend)}</Text>
            <Text style={[styles.trendText, { color: trendColor(insightsTrend, colors) }]}>
              {trendLabel(insightsTrend)}
            </Text>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{last?.value ?? '—'}kg</Text>
              <Text style={styles.heroLabel}>Current</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: totalChange <= 0 ? colors.success : colors.error }]}>
                {formatKgChange(totalChange)}
              </Text>
              <Text style={styles.heroLabel}>Total change</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: colors.primary }]}>
                {rate > 0 ? '+' : ''}{rate}
              </Text>
              <Text style={styles.heroLabel}>kg/week</Text>
            </View>
          </View>

          {/* Sparkline */}
          <View style={{ marginTop: spacing.sm }}>
            <Sparkline
              values={sorted.map((e) => e.value)}
              color={trendColor(insightsTrend, colors)}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={typography.caption}>{first?.date}</Text>
              <Text style={typography.caption}>{last?.date}</Text>
            </View>
          </View>
        </View>

        {/* ── AI Summary ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 AI Analysis</Text>
          {isLoadingInsights ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Claude is analysing your data…</Text>
            </View>
          ) : aiInsights ? (
            <Text style={styles.summaryText}>{aiInsights.summary}</Text>
          ) : (
            <Text style={styles.emptyText}>Tap "✨ Refresh AI" to generate insights.</Text>
          )}
        </View>

        {/* ── Stats grid ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{sorted.length}</Text>
              <Text style={styles.statLabel}>Weight logs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{consistency}%</Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{first?.value ?? '—'}kg</Text>
              <Text style={styles.statLabel}>Starting weight</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {Math.abs(totalChange)}kg
              </Text>
              <Text style={styles.statLabel}>{totalChange <= 0 ? 'Lost' : 'Gained'}</Text>
            </View>
          </View>
        </View>

        {/* ── Goal projection ─────────────────────────────────────────────── */}
        {aiInsights && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Goal Projection</Text>
            <View style={styles.projRow}>
              <Text style={styles.projIcon}>
                {aiInsights.projectedGoalDate ? '🗓️' : '🔄'}
              </Text>
              <Text style={styles.projText}>
                {aiInsights.projectedGoalDate
                  ? <>
                      Estimated to reach your target on{' '}
                      <Text style={styles.projDate}>
                        {formatDate(aiInsights.projectedGoalDate)}
                      </Text>
                      {aiInsights.daysToGoal
                        ? ` (${aiInsights.daysToGoal} days away)`
                        : ''}
                    </>
                  : 'Keep logging consistently to unlock a goal prediction date.'}
              </Text>
            </View>
          </View>
        )}

        {/* ── Recommendations ─────────────────────────────────────────────── */}
        {aiInsights && aiInsights.recommendations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Recommendations</Text>
            {aiInsights.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <Text style={styles.recBullet}>•</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Measurements ─────────────────────────────────────────────────── */}
        {sortedMeas.length >= 2 && oldMeas && newMeas && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📏 Measurement Changes</Text>
            {(
              [
                ['Waist', oldMeas.waist, newMeas.waist],
                ['Chest', oldMeas.chest, newMeas.chest],
                ['Hips', oldMeas.hips, newMeas.hips],
                ['Biceps', oldMeas.biceps, newMeas.biceps],
                ['Thighs', oldMeas.thighs, newMeas.thighs],
              ] as [string, number | undefined, number | undefined][]
            )
              .filter(([, a, b]) => a !== undefined && b !== undefined)
              .map(([label, a, b]) => {
                const delta = +(b! - a!).toFixed(1);
                return (
                  <View key={label} style={styles.measRow}>
                    <Text style={styles.measLabel}>{label}</Text>
                    <Text style={[
                      styles.measDelta,
                      { color: delta < 0 ? colors.success : delta > 0 ? colors.error : colors.textSecondary },
                    ]}>
                      {a}cm → {b}cm ({delta > 0 ? '+' : ''}{delta}cm)
                    </Text>
                  </View>
                );
              })}
          </View>
        )}

        {/* Footer timestamp */}
        {aiInsights && (
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            Last analysed: {new Date(aiInsights.generatedAt).toLocaleString()}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
