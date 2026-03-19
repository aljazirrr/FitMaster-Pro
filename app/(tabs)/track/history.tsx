/**
 * Workout History Screen — full history + Personal Records
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { getExerciseById } from '../../../src/data/exercises';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import type { WorkoutSession, PersonalRecord } from '../../../src/types/workout';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function calcVolume(session: WorkoutSession): number {
  return Math.round(
    session.exercises.reduce(
      (vol, ex) =>
        vol + ex.sets.filter((s) => s.completed).reduce((v, s) => v + s.weight * s.reps, 0),
      0,
    ),
  );
}

type Tab = 'history' | 'records';

export default function WorkoutHistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useStyles(theme);
  const { language } = useSettingsStore();
  const isRo = language === 'ro';

  const { workoutHistory, personalRecords } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<Tab>('history');

  // Group sessions by month for section headers
  const grouped = useMemo(() => {
    const map: Record<string, WorkoutSession[]> = {};
    for (const s of workoutHistory) {
      const d = new Date(s.date + 'T00:00:00');
      const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return Object.entries(map).map(([month, sessions]) => ({ month, sessions }));
  }, [workoutHistory]);

  const renderSessionItem = ({ item }: { item: WorkoutSession }) => {
    const volume = calcVolume(item);
    const completed = item.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.completed).length, 0);
    const total = item.exercises.reduce((n, ex) => n + ex.sets.length, 0);

    return (
      <Pressable
        style={styles.sessionCard}
        onPress={() =>
          router.push({ pathname: '/(tabs)/track/workout/summary', params: { sessionId: item.id } } as any)
        }
      >
        <View style={styles.sessionCardLeft}>
          <Text style={styles.sessionName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionMetaText}>⏱ {formatDuration(item.duration)}</Text>
            <Text style={styles.sessionMetaSep}>·</Text>
            <Text style={styles.sessionMetaText}>✅ {completed}/{total}</Text>
            {volume > 0 && (
              <>
                <Text style={styles.sessionMetaSep}>·</Text>
                <Text style={[styles.sessionMetaText, { color: theme.colors.primary }]}>
                  🏋️ {volume.toLocaleString()}kg
                </Text>
              </>
            )}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  };

  const renderPRItem = ({ item }: { item: PersonalRecord }) => {
    const ex = getExerciseById(item.exerciseId);
    return (
      <View style={styles.prCard}>
        <View style={styles.prLeft}>
          <Text style={styles.prExName}>{ex?.name ?? item.exerciseId}</Text>
          <Text style={styles.prDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.prRight}>
          <View style={[styles.prBadge, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Text style={[styles.prBadgeText, { color: theme.colors.primary }]}>
              {item.weight}kg × {item.reps}
            </Text>
          </View>
          <View style={[styles.prBadge, { backgroundColor: '#4CAF5020' }]}>
            <Text style={[styles.prBadgeText, { color: '#4CAF50' }]}>
              1RM ~{item.oneRepMax}kg
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRo ? 'Istoric' : 'History'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
            {workoutHistory.length}
          </Text>
          <Text style={styles.summaryLabel}>
            {isRo ? 'antrenamente' : 'workouts'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {personalRecords.length}
          </Text>
          <Text style={styles.summaryLabel}>
            {isRo ? 'recorduri' : 'records'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
            {workoutHistory.reduce((n, s) => n + Math.round(s.duration / 60), 0).toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>
            {isRo ? 'minute total' : 'total min'}
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['history', 'records'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: theme.colors.primary, fontWeight: '700' }]}>
              {tab === 'history'
                ? (isRo ? '📅 Sesiuni' : '📅 Sessions')
                : (isRo ? '🏆 Recorduri' : '🏆 Records')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'history' ? (
        workoutHistory.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>
              {isRo ? 'Nicio sesiune înregistrată încă.' : 'No workouts recorded yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={grouped}
            keyExtractor={(item) => item.month}
            renderItem={({ item: { month, sessions } }) => (
              <View>
                <Text style={styles.monthHeader}>{month}</Text>
                {sessions.map((s) => renderSessionItem({ item: s }))}
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : (
        personalRecords.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>
              {isRo ? 'Niciun record personal înregistrat.' : 'No personal records yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={personalRecords}
            keyExtractor={(item) => item.id}
            renderItem={renderPRItem}
            contentContainerStyle={styles.listContent}
          />
        )
      )}
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },

    summaryStrip: {
      flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 22, fontWeight: '800' },
    summaryLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },

    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabText: { fontSize: 14, color: theme.colors.textSecondary },

    listContent: { padding: 16, gap: 10 },

    monthHeader: {
      fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginBottom: 8, marginTop: 16,
    },

    sessionCard: {
      backgroundColor: theme.colors.card, borderRadius: 16, padding: 14,
      flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    },
    sessionCardLeft: { flex: 1 },
    sessionName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    sessionDate: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
    sessionMetaText: { fontSize: 12, color: theme.colors.textSecondary },
    sessionMetaSep: { fontSize: 12, color: theme.colors.border },
    chevron: { fontSize: 20, color: theme.colors.textSecondary, marginLeft: 8 },

    prCard: {
      backgroundColor: theme.colors.card, borderRadius: 16, padding: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
    },
    prLeft: { flex: 1 },
    prExName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
    prDate: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    prRight: { gap: 4, alignItems: 'flex-end' },
    prBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    prBadgeText: { fontSize: 12, fontWeight: '700' },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center' },
  });
}
