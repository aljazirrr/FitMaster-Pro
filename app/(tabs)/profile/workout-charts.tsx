/**
 * Workout Charts Screen
 *
 * - Weekly volume bar chart (last 12 weeks)
 * - Personal records line chart per exercise (selector)
 * - Workout frequency heatmap (last 12 weeks, color-coded)
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { getExerciseById } from '../../../src/data/exercises';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import { BarChart } from '../../../src/components/charts/BarChart';
import { LineChart } from '../../../src/components/charts/LineChart';

const SCREEN_W = Dimensions.get('window').width;
const WEEKS_BACK = 12;

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function weekLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WorkoutChartsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { language } = useSettingsStore();
  const isRo = language === 'ro';
  const styles = useStyles(theme);

  const { workoutHistory, personalRecords } = useWorkoutStore();

  // ── Weekly volume ──────────────────────────────────────────────────────────
  const volumeData = useMemo(() => {
    const now = new Date();
    const weeks: { key: string; label: string; volume: number; count: number }[] = [];

    for (let w = WEEKS_BACK - 1; w >= 0; w--) {
      const monday = new Date(now);
      const day = monday.getDay();
      const diffToMon = (day + 6) % 7;
      monday.setDate(now.getDate() - diffToMon - w * 7);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekSessions = workoutHistory.filter((s) => {
        const d = new Date(s.date + 'T00:00:00');
        return d >= monday && d <= sunday;
      });

      const vol = weekSessions.reduce((sum, s) =>
        sum + s.exercises.reduce((v, ex) =>
          v + ex.sets.filter((set) => set.completed).reduce((sv, set) => sv + set.weight * set.reps, 0), 0), 0);

      weeks.push({ key, label: weekLabel(key), volume: Math.round(vol), count: weekSessions.length });
    }
    return weeks;
  }, [workoutHistory]);

  // ── Frequency heatmap (last 12 weeks, Mon–Sun) ────────────────────────────
  const heatmapData = useMemo(() => {
    const workoutDates = new Set(workoutHistory.map((s) => s.date));
    const now = new Date();
    const day = now.getDay();
    const diffToMon = (day + 6) % 7;

    const cells: { date: string; hasWorkout: boolean }[][] = [];
    for (let w = WEEKS_BACK - 1; w >= 0; w--) {
      const week: { date: string; hasWorkout: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(now);
        cell.setDate(now.getDate() - diffToMon - w * 7 + d);
        cell.setHours(0, 0, 0, 0);
        const iso = cell.toISOString().slice(0, 10);
        week.push({ date: iso, hasWorkout: workoutDates.has(iso) });
      }
      cells.push(week);
    }
    return cells;
  }, [workoutHistory]);

  // ── PR selector ────────────────────────────────────────────────────────────
  const prExercises = useMemo(() => {
    const seen = new Set<string>();
    return personalRecords
      .filter((pr) => !seen.has(pr.exerciseId) && seen.add(pr.exerciseId))
      .map((pr) => ({
        id: pr.exerciseId,
        name: getExerciseById(pr.exerciseId)?.name ?? pr.exerciseId,
      }));
  }, [personalRecords]);

  const [selectedExId, setSelectedExId] = useState<string>(prExercises[0]?.id ?? '');

  const prLineData = useMemo(() => {
    return personalRecords
      .filter((pr) => pr.exerciseId === selectedExId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((pr) => ({ x: pr.date.slice(5), y: pr.oneRepMax }));
  }, [personalRecords, selectedExId]);

  // ── Total stats ────────────────────────────────────────────────────────────
  const totalVolume = useMemo(() =>
    workoutHistory.reduce((sum, s) =>
      sum + s.exercises.reduce((v, ex) =>
        v + ex.sets.filter((set) => set.completed).reduce((sv, set) => sv + set.weight * set.reps, 0), 0), 0),
    [workoutHistory]);

  const activeDays = useMemo(() => new Set(workoutHistory.map((s) => s.date)).size, [workoutHistory]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRo ? 'Grafice Antrenament' : 'Workout Charts'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Summary strip */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
              {workoutHistory.length}
            </Text>
            <Text style={styles.summaryLabel}>
              {isRo ? 'Antrenamente' : 'Workouts'}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#4CAF5015' }]}>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {activeDays}
            </Text>
            <Text style={styles.summaryLabel}>
              {isRo ? 'Zile active' : 'Active days'}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FF980015' }]}>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
              {(totalVolume / 1000).toFixed(0)}t
            </Text>
            <Text style={styles.summaryLabel}>
              {isRo ? 'Volum total' : 'Total volume'}
            </Text>
          </View>
        </View>

        {/* Weekly volume chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📊 {isRo ? 'Volum săptămânal (kg)' : 'Weekly Volume (kg)'}
          </Text>
          {workoutHistory.length === 0 ? (
            <Text style={styles.emptyText}>
              {isRo ? 'Niciun antrenament înregistrat.' : 'No workouts recorded yet.'}
            </Text>
          ) : (
            <BarChart
              data={volumeData.map((w) => ({
                label: w.label,
                value: w.volume,
                color: w.volume === 0 ? `${theme.colors.primary}30` : theme.colors.primary,
              }))}
              color={theme.colors.primary}
              height={180}
              yLabel={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
            />
          )}
        </View>

        {/* Workout frequency heatmap */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🗓 {isRo ? 'Frecvență (ultimele 12 săpt.)' : 'Frequency (last 12 weeks)'}
          </Text>
          <View style={styles.heatmapContainer}>
            {/* Day labels */}
            <View style={styles.heatmapDayLabels}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <Text key={i} style={styles.heatmapDayLabel}>{d}</Text>
              ))}
            </View>
            {/* Weeks */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.heatmapGrid}>
                {heatmapData.map((week, wi) => (
                  <View key={wi} style={styles.heatmapWeek}>
                    {week.map((cell, di) => (
                      <View
                        key={di}
                        style={[
                          styles.heatmapCell,
                          {
                            backgroundColor: cell.hasWorkout
                              ? theme.colors.primary
                              : `${theme.colors.primary}18`,
                          },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          <Text style={styles.heatmapLegend}>
            {isRo ? '■ zi cu antrenament' : '■ workout day'}
          </Text>
        </View>

        {/* Personal Records chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🏆 {isRo ? 'Evoluție 1RM Estimat' : 'Estimated 1RM Progress'}
          </Text>
          {prExercises.length === 0 ? (
            <Text style={styles.emptyText}>
              {isRo ? 'Completează antrenamente pentru a vedea recordurile.' : 'Complete workouts to see personal records.'}
            </Text>
          ) : (
            <>
              {/* Exercise selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
                {prExercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[
                      styles.exChip,
                      selectedExId === ex.id && { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => setSelectedExId(ex.id)}
                  >
                    <Text style={[
                      styles.exChipText,
                      selectedExId === ex.id && { color: '#fff' },
                    ]}>
                      {ex.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {prLineData.length < 2 ? (
                <Text style={styles.emptyText}>
                  {isRo ? 'Nevoie de cel puțin 2 înregistrări pentru grafic.' : 'Need at least 2 entries for a chart.'}
                </Text>
              ) : (
                <LineChart
                  data={prLineData}
                  color="#4CAF50"
                  height={180}
                  showTrendline
                  yLabel={(v) => `${Math.round(v)}kg`}
                />
              )}

              {/* Current PR badge */}
              {prLineData.length > 0 && (
                <View style={[styles.prBadge, { backgroundColor: `#4CAF5015` }]}>
                  <Text style={[styles.prBadgeText, { color: '#4CAF50' }]}>
                    🎯 Current 1RM: {prLineData[prLineData.length - 1]?.y}kg
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Per-week workout count */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            💪 {isRo ? 'Antrenamente pe săptămână' : 'Workouts per Week'}
          </Text>
          {workoutHistory.length === 0 ? (
            <Text style={styles.emptyText}>
              {isRo ? 'Niciun antrenament.' : 'No workouts yet.'}
            </Text>
          ) : (
            <BarChart
              data={volumeData.map((w) => ({
                label: w.label,
                value: w.count,
                color: w.count === 0 ? `${theme.colors.primary}30` : '#FF9800',
              }))}
              color="#FF9800"
              height={140}
              yLabel={(v) => String(Math.round(v))}
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(theme: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    backBtn: { width: 40, alignItems: 'center' },
    backBtnText: { fontSize: 28, color: theme.colors.text, lineHeight: 32 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    scrollContent: { padding: 16, paddingBottom: 48, gap: 16 },

    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
    summaryValue: { fontSize: 22, fontWeight: '800' },
    summaryLabel: { fontSize: 11, color: theme.colors.textSecondary },

    card: {
      backgroundColor: theme.colors.card, borderRadius: 20, padding: 16,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    emptyText: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 20 },

    heatmapContainer: { flexDirection: 'row', gap: 6 },
    heatmapDayLabels: { justifyContent: 'space-between', paddingVertical: 1 },
    heatmapDayLabel: { fontSize: 9, color: theme.colors.textSecondary, height: 14, lineHeight: 14 },
    heatmapGrid: { flexDirection: 'row', gap: 3 },
    heatmapWeek: { gap: 3 },
    heatmapCell: { width: 12, height: 12, borderRadius: 2 },
    heatmapLegend: { fontSize: 10, color: theme.colors.primary, marginTop: 8 },

    exChip: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
      backgroundColor: theme.colors.background,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    exChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },

    prBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, alignSelf: 'flex-start' },
    prBadgeText: { fontSize: 13, fontWeight: '700' },
  });
}
