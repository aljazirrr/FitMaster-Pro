import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useProgressStore } from '../../../src/stores/useProgressStore';
import type { FitnessGoal, Gender, ActivityLevel, DietType } from '../../../src/types/user';

const FITNESS_GOALS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'improve_endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const DIET_TYPES: { value: DietType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'mediterranean', label: 'Mediterranean' },
];

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const { user, updateProfile } = useAuthStore();
  const addWeight = useProgressStore((s) => s.addWeight);

  const [name, setName] = useState(user?.name ?? '');
  const [weight, setWeight] = useState(String(user?.measurements?.weight ?? ''));
  const [height, setHeight] = useState(String(user?.measurements?.height ?? ''));
  const [age, setAge] = useState(String(user?.measurements?.age ?? ''));
  const [gender, setGender] = useState<Gender>(user?.measurements?.gender ?? 'male');
  const [goals, setGoals] = useState<FitnessGoal[]>(user?.goals ?? []);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(user?.activityLevel ?? 'moderate');
  const [dietPreference, setDietPreference] = useState<DietType>(user?.dietPreference ?? 'standard');

  const toggleGoal = (g: FitnessGoal) => {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
      Alert.alert('Error', 'Please enter valid measurements.');
      return;
    }
    if (goals.length === 0) {
      Alert.alert('Error', 'Select at least one goal.');
      return;
    }
    updateProfile({
      name: name.trim(),
      goals,
      activityLevel,
      dietPreference,
      measurements: {
        ...(user?.measurements ?? { weight: w, height: h, age: a, gender }),
        weight: w,
        height: h,
        age: a,
        gender,
      },
    });
    // If weight changed, log it in the weight history so Body Stats stays in sync
    if (w !== user?.measurements?.weight) {
      addWeight(w);
    }
    router.back();
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h4, color: colors.text },
    cancelText: { ...typography.body, color: colors.textSecondary },
    saveText: { ...typography.bodyBold, color: colors.primary },
    scrollContent: { paddingBottom: 40 },
    section: {
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.sectionGap,
    },
    sectionTitle: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
    card: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    inputRowLast: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.cardPadding,
      paddingVertical: spacing.md,
    },
    inputLabel: { ...typography.small, color: colors.textSecondary, width: 80 },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      textAlign: 'right',
    },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: spacing.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}22`,
    },
    chipText: { ...typography.captionBold, color: colors.textSecondary },
    chipTextActive: { color: colors.primary },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Years"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.inputRowLast}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.chip, gender === g.value && styles.chipActive]}
                    onPress={() => setGender(g.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="kg"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputRowLast}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="cm"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Goals</Text>
          <View style={styles.chipsWrap}>
            {FITNESS_GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, goals.includes(g.value) && styles.chipActive]}
                onPress={() => toggleGoal(g.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, goals.includes(g.value) && styles.chipTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <View style={styles.chipsWrap}>
            {ACTIVITY_LEVELS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.chip, activityLevel === a.value && styles.chipActive]}
                onPress={() => setActivityLevel(a.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, activityLevel === a.value && styles.chipTextActive]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Diet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet Preference</Text>
          <View style={styles.chipsWrap}>
            {DIET_TYPES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.chip, dietPreference === d.value && styles.chipActive]}
                onPress={() => setDietPreference(d.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, dietPreference === d.value && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
