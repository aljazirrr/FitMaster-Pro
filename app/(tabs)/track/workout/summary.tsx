/**
 * Post-Workout Summary Screen
 *
 * Shown after finishing a workout. Displays:
 *  - Duration, sets completed, volume (kg lifted)
 *  - Per-exercise breakdown
 *  - New personal records achieved
 *  - Confetti celebration header
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../../src/theme';
import { useWorkoutStore } from '../../../../src/stores/useWorkoutStore';
import { getExerciseById } from '../../../../src/data/exercises';
import useSettingsStore from '../../../../src/stores/useSettingsStore';
import type { WorkoutSession } from '../../../../src/types/workout';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function WorkoutSummaryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useStyles(theme);
  const { language } = useSettingsStore();
  const isRo = language === 'ro';
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const { workoutHistory, personalRecords } = useWorkoutStore();

  // Find the session — either by id param or the most recent
  const session: WorkoutSession | undefined = useMemo(() => {
    if (sessionId) return workoutHistory.find((s) => s.id === sessionId);
    return workoutHistory[0];
  }, [sessionId, workoutHistory]);

  const stats = useMemo(() => {
    if (!session) return null;

    const completedSets = session.exercises.reduce(
      (n, ex) => n + ex.sets.filter((s) => s.completed).length,
      0,
    );
    const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
    const volume = session.exercises.reduce((vol, ex) => {
      return (
        vol +
        ex.sets
          .filter((s) => s.completed)
          .reduce((v, s) => v + s.weight * s.reps, 0)
      );
    }, 0);

    return { completedSets, totalSets, volume: Math.round(volume) };
  }, [session]);

  // PRs from this session
  const sessionPRs = useMemo(() => {
    if (!session) return [];
    const sessionDate = session.date;
    return personalRecords.filter((pr) => pr.date === sessionDate);
  }, [session, personalRecords]);

  if (!session || !stats) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textSecondary }}>
          {isRo ? 'Nu s-a găsit sesiunea.' : 'Session not found.'}
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/track')}>
          <Text style={styles.doneBtnText}>{isRo ? 'Înapoi' : 'Back'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text style={styles.heroTitle}>
            {isRo ? 'Antrenament terminat!' : 'Workout Complete!'}
          </Text>
          <Text style={styles.heroSubtitle}>{session.name}</Text>
        </View>

        {/* Key stats row */}
        <View style={styles.statsRow}>
          <StatCard
            emoji="⏱"
            label={isRo ? 'Durată' : 'Duration'}
            value={formatDuration(session.duration)}
            theme={theme}
          />
          <StatCard
            emoji="✅"
            label={isRo ? 'Seturi' : 'Sets'}
            value={`${stats.completedSets}/${stats.totalSets}`}
            theme={theme}
          />
          <StatCard
            emoji="🏋️"
            label={isRo ? 'Volum' : 'Volume'}
            value={`${stats.volume.toLocaleString()}kg`}
            theme={theme}
          />
        </View>

        {/* PRs */}
        {sessionPRs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              🎯 {isRo ? 'Record personal nou!' : 'New Personal Record!'}
            </Text>
            {sessionPRs.map((pr) => {
              const ex = getExerciseById(pr.exerciseId);
              return (
                <View key={pr.id} style={styles.prRow}>
                  <Text style={styles.prName}>{ex?.name ?? pr.exerciseId}</Text>
                  <View style={styles.prBadges}>
                    <View style={[styles.prBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
                      <Text style={[styles.prBadgeText, { color: theme.colors.primary }]}>
                        {pr.weight}kg × {pr.reps}
                      </Text>
                    </View>
                    <View style={[styles.prBadge, { backgroundColor: '#4CAF5020' }]}>
                      <Text style={[styles.prBadgeText, { color: '#4CAF50' }]}>
                        1RM ~{pr.oneRepMax}kg
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Exercise breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📋 {isRo ? 'Exerciții' : 'Exercises'}
          </Text>
          {session.exercises.map((ex, i) => {
            const exData = getExerciseById(ex.exerciseId);
            const completedSets = ex.sets.filter((s) => s.completed);
            const volume = completedSets.reduce((v, s) => v + s.weight * s.reps, 0);
            const maxWeight = Math.max(...completedSets.map((s) => s.weight), 0);

            return (
              <View key={ex.id} style={[styles.exRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }]}>
                <Text style={styles.exName}>{exData?.name ?? ex.exerciseId}</Text>
                <View style={styles.exStats}>
                  <Text style={styles.exStat}>
                    {completedSets.length} {isRo ? 'seturi' : 'sets'}
                  </Text>
                  {maxWeight > 0 && (
                    <Text style={styles.exStat}>max {maxWeight}kg</Text>
                  )}
                  {volume > 0 && (
                    <Text style={[styles.exStat, { color: theme.colors.primary }]}>
                      {Math.round(volume)}kg vol
                    </Text>
                  )}
                </View>
                {/* Set chips */}
                <View style={styles.setChips}>
                  {ex.sets.map((s, si) => (
                    <View
                      key={s.id}
                      style={[
                        styles.setChip,
                        s.completed
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: theme.colors.border },
                      ]}
                    >
                      <Text style={[styles.setChipText, s.completed && { color: '#fff' }]}>
                        {s.completed ? `${s.weight}×${s.reps}` : `${si + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Done button */}
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.replace('/(tabs)/track')}
        >
          <Text style={styles.doneBtnText}>
            {isRo ? '✓ Gata' : '✓ Done'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, theme }: { emoji: string; label: string; value: string; theme: any }) {
  return (
    <View style={[statStyles.card, { backgroundColor: theme.colors.card }]}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={[statStyles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', borderRadius: 16, paddingVertical: 16, gap: 4,
  },
  emoji: { fontSize: 24 },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 11 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles(theme: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },

    heroBanner: {
      backgroundColor: theme.colors.primary,
      borderRadius: 24, padding: 32, alignItems: 'center', gap: 8,
    },
    heroEmoji: { fontSize: 48 },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },

    statsRow: { flexDirection: 'row', gap: 10 },

    card: {
      backgroundColor: theme.colors.card, borderRadius: 20, padding: 16, gap: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },

    prRow: { gap: 6 },
    prName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    prBadges: { flexDirection: 'row', gap: 8 },
    prBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    prBadgeText: { fontSize: 13, fontWeight: '700' },

    exRow: { paddingTop: 12, gap: 6 },
    exName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
    exStats: { flexDirection: 'row', gap: 10 },
    exStat: { fontSize: 12, color: theme.colors.textSecondary },
    setChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    setChip: {
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    },
    setChipText: { fontSize: 11, fontWeight: '600', color: theme.colors.text },

    doneBtn: {
      borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 4,
    },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  });
}
