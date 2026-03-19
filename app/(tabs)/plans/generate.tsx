/**
 * AI Plan Generator screen
 *
 * Flow:
 *  1. User fills in preferences (goal, experience, days/week, equipment)
 *  2. Hits "Generate" — streams Claude's response in real-time
 *  3. Reviews the generated plan preview
 *  4. Saves it to their library
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { generateAIWorkoutPlan, type AIPlanParams } from '../../../src/services/aiPlanService';
import type { WorkoutPlan } from '../../../src/types/workout';
import type { FitnessGoal } from '../../../src/types/user';
import { Equipment } from '../../../src/types/exercise';
import type { WorkoutLevel } from '../../../src/types/workout';

// ─── Option data ──────────────────────────────────────────────────────────────

const GOALS: { key: FitnessGoal; label: string; emoji: string }[] = [
  { key: 'build_muscle', label: 'Build Muscle', emoji: '💪' },
  { key: 'lose_weight', label: 'Lose Weight', emoji: '🔥' },
  { key: 'improve_endurance', label: 'Endurance', emoji: '🏃' },
  { key: 'maintain', label: 'Maintain', emoji: '⚖️' },
  { key: 'flexibility', label: 'Flexibility', emoji: '🧘' },
];

const LEVELS: { key: WorkoutLevel; label: string; desc: string }[] = [
  { key: 'beginner', label: 'Beginner', desc: '< 1 year' },
  { key: 'intermediate', label: 'Intermediate', desc: '1–3 years' },
  { key: 'advanced', label: 'Advanced', desc: '3+ years' },
];

const DAYS = [3, 4, 5, 6];

const EQUIPMENT_OPTIONS: { key: Equipment; label: string }[] = [
  { key: Equipment.Barbell, label: 'Barbell' },
  { key: Equipment.Dumbbell, label: 'Dumbbells' },
  { key: Equipment.Machine, label: 'Machines' },
  { key: Equipment.Cable, label: 'Cables' },
  { key: Equipment.Bodyweight, label: 'Bodyweight' },
  { key: Equipment.Kettlebell, label: 'Kettlebell' },
  { key: Equipment.Bands, label: 'Bands' },
];

// ─── State types ──────────────────────────────────────────────────────────────

type Phase = 'form' | 'generating' | 'preview';

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeneratePlanScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const { saveGeneratedPlan } = useWorkoutStore();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [goal, setGoal] = useState<FitnessGoal>('build_muscle');
  const [experience, setExperience] = useState<WorkoutLevel>('intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipment, setEquipment] = useState<Equipment[]>([
    Equipment.Barbell,
    Equipment.Dumbbell,
    Equipment.Cable,
  ]);

  // ── Generation state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('form');
  const [streamedChars, setStreamedChars] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);

  const dotAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<ReturnType<typeof Animated.loop> | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function toggleEquipment(eq: Equipment) {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq],
    );
  }

  function startDotAnimation() {
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loopRef.current.start();
  }

  function stopDotAnimation() {
    loopRef.current?.stop();
    dotAnim.setValue(0);
  }

  // ─── Generate ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (equipment.length === 0) {
      setEquipment([Equipment.Bodyweight]);
    }

    setError(null);
    setStreamedChars(0);
    setPhase('generating');
    startDotAnimation();

    const params: AIPlanParams = {
      goal,
      experience,
      daysPerWeek,
      equipment: equipment.length > 0 ? equipment : [Equipment.Bodyweight],
    };

    try {
      const plan = await generateAIWorkoutPlan(params, (_chunk) => {
        setStreamedChars((prev) => prev + _chunk.length);
      });
      setGeneratedPlan(plan);
      setPhase('preview');
    } catch (e) {
      setError((e as Error).message ?? 'Something went wrong. Please try again.');
      setPhase('form');
    } finally {
      stopDotAnimation();
    }
  }

  function handleSave() {
    if (!generatedPlan) return;
    saveGeneratedPlan(generatedPlan);
    router.back();
  }

  // ─── Styles (theme-driven) ────────────────────────────────────────────────

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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    backText: { color: colors.text, fontSize: 18 },
    headerTitle: { ...typography.h3, color: colors.text },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.md, paddingBottom: 40 },
    section: { marginBottom: spacing.lg },
    sectionLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 1, textTransform: 'uppercase' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1.5,
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    chipText: { ...typography.body, marginLeft: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    levelCard: {
      flex: 1,
      padding: spacing.sm,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1.5,
      alignItems: 'center',
      marginHorizontal: 3,
    },
    levelLabel: { ...typography.small, fontWeight: '700' },
    levelDesc: { ...typography.caption, marginTop: 2 },
    levelRow: { flexDirection: 'row' },
    dayBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1.5,
      alignItems: 'center',
      marginHorizontal: 3,
    },
    dayNum: { ...typography.h3 },
    dayLabel: { ...typography.caption },
    dayRow: { flexDirection: 'row' },
    generateBtn: {
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    generateBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
    errorBox: {
      backgroundColor: `${colors.error}22`,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    errorText: { ...typography.small, color: colors.error },
    // Generating phase
    generatingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    generatingTitle: { ...typography.h2, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
    generatingSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
    charsText: { ...typography.caption, color: colors.primary, marginTop: spacing.sm },
    // Preview phase
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      marginBottom: spacing.md,
    },
    previewName: { ...typography.h2, color: colors.text },
    previewDesc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.primary}22`,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
    },
    badgeText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    weekTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
    dayRow2: {
      backgroundColor: colors.background,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    dayName: { ...typography.body, color: colors.text, fontWeight: '600' },
    dayExCount: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    saveBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
    retryBtn: {
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    retryBtnText: { ...typography.body, color: colors.text },
  });

  // ─── Render: generating ────────────────────────────────────────────────────

  if (phase === 'generating') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.generatingTitle}>Claude is crafting{'\n'}your plan…</Text>
          <Text style={styles.generatingSubtitle}>
            Using adaptive thinking to personalise your programme.
          </Text>
          {streamedChars > 0 && (
            <Text style={styles.charsText}>{streamedChars} tokens received</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: preview ───────────────────────────────────────────────────────

  if (phase === 'preview' && generatedPlan) {
    const week1 = generatedPlan.weeks[0];
    return (
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('form')}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your AI Plan</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Plan card */}
          <View style={styles.previewCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✨ AI GENERATED</Text>
            </View>
            <Text style={[styles.previewName, { marginTop: spacing.sm }]}>
              {generatedPlan.name}
            </Text>
            <Text style={styles.previewDesc}>{generatedPlan.description}</Text>
            <View style={{ flexDirection: 'row', marginTop: spacing.sm, gap: spacing.xs }}>
              <View style={[styles.badge, { backgroundColor: `${colors.success}22` }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>
                  {generatedPlan.level}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.warning}22` }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>
                  {generatedPlan.daysPerWeek}×/week
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${colors.primary}22` }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {generatedPlan.weeks.length} weeks
                </Text>
              </View>
            </View>
          </View>

          {/* Week 1 preview */}
          {week1 && (
            <View style={styles.previewCard}>
              <Text style={styles.weekTitle}>Week 1 — Overview</Text>
              {week1.days.map((day) => (
                <View key={day.dayNumber} style={styles.dayRow2}>
                  <Text style={styles.dayName}>
                    Day {day.dayNumber} · {day.name}
                  </Text>
                  <Text style={styles.dayExCount}>
                    {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                    {' · '}
                    {day.exercises.slice(0, 3).map((e) =>
                      e.exerciseId.replace(/-/g, ' ')
                    ).join(', ')}
                    {day.exercises.length > 3 ? '…' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* All weeks summary */}
          <View style={styles.previewCard}>
            <Text style={styles.weekTitle}>{generatedPlan.weeks.length}-Week Progression</Text>
            {generatedPlan.weeks.map((week) => (
              <View key={week.weekNumber} style={[styles.dayRow2, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={[styles.dayName, { flex: 1 }]}>Week {week.weekNumber}</Text>
                <Text style={styles.dayExCount}>
                  {week.days.reduce((acc, d) => acc + d.exercises.length, 0)} total sets
                </Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>💾  Save to My Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setPhase('form')}>
            <Text style={styles.retryBtnText}>↩  Generate Another</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: form ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Plan Generator</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fitness Goal</Text>
          <View style={styles.chipRow}>
            {GOALS.map((g) => {
              const selected = goal === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setGoal(g.key)}
                >
                  <Text>{g.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Experience Level</Text>
          <View style={styles.levelRow}>
            {LEVELS.map((lvl) => {
              const selected = experience === lvl.key;
              return (
                <TouchableOpacity
                  key={lvl.key}
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setExperience(lvl.key)}
                >
                  <Text style={[styles.levelLabel, { color: selected ? '#fff' : colors.text }]}>
                    {lvl.label}
                  </Text>
                  <Text style={[styles.levelDesc, { color: selected ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                    {lvl.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Days per week */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Days per Week</Text>
          <View style={styles.dayRow}>
            {DAYS.map((d) => {
              const selected = daysPerWeek === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayBtn,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDaysPerWeek(d)}
                >
                  <Text style={[styles.dayNum, { color: selected ? '#fff' : colors.text }]}>
                    {d}
                  </Text>
                  <Text style={[styles.dayLabel, { color: selected ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                    days
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Available Equipment</Text>
          <View style={styles.chipRow}>
            {EQUIPMENT_OPTIONS.map((eq) => {
              const selected = equipment.includes(eq.key);
              return (
                <TouchableOpacity
                  key={eq.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? `${colors.primary}22` : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleEquipment(eq.key)}
                >
                  <Text style={[styles.chipText, { color: selected ? colors.primary : colors.textSecondary }]}>
                    {selected ? '✓ ' : ''}{eq.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Generate button */}
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Text style={styles.generateBtnText}>✨  Generate My Plan</Text>
        </TouchableOpacity>

        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
          Powered by Claude claude-opus-4-6 · ~10-15 seconds
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
