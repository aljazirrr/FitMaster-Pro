import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useWorkoutStore } from '../../../src/stores/useWorkoutStore';
import { useProgressStore } from '../../../src/stores/useProgressStore';
import useSettingsStore from '../../../src/stores/useSettingsStore';
import { achievements } from '../../../src/data/achievements';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function calcBMI(weightKg: number, heightCm: number): string {
  if (!heightCm || heightCm <= 0) return '—';
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function goalLabel(goal: string, t: (key: string, fallback: string) => string): string {
  const map: Record<string, string> = {
    lose_weight: t('onboarding.goals.lose_weight', 'Lose Weight'),
    build_muscle: t('onboarding.goals.build_muscle', 'Build Muscle'),
    maintain: t('onboarding.goals.maintain', 'Maintain'),
    improve_endurance: t('onboarding.goals.improve_endurance', 'Endurance'),
    flexibility: t('onboarding.goals.flexibility', 'Flexibility'),
  };
  return map[goal] ?? goal.replace(/_/g, ' ');
}

function goalColor(
  goal: string,
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string {
  const map: Record<string, string> = {
    lose_weight: colors.accent,
    build_muscle: colors.primary,
    maintain: colors.secondary,
    improve_endurance: colors.warning,
    flexibility: colors.success,
  };
  return map[goal] ?? colors.textSecondary;
}

function achievementTierColor(
  category: string,
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string {
  const map: Record<string, string> = {
    workout: colors.primary,
    streak: colors.warning,
    pr: colors.accent,
    plan: colors.secondary,
    nutrition: colors.success,
  };
  return map[category] ?? colors.textSecondary;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface WeightBarChartProps {
  entries: { date: string; value: number }[];
  colors: ReturnType<typeof useTheme>['theme']['colors'];
  spacing: ReturnType<typeof useTheme>['theme']['spacing'];
  typography: ReturnType<typeof useTheme>['theme']['typography'];
}

function WeightBarChart({ entries, colors, spacing, typography }: WeightBarChartProps) {
  const last7 = entries.slice(-7);
  if (last7.length === 0) return null;

  const values = last7.map((e) => e.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const BAR_MAX_HEIGHT = 40;

  const styles = StyleSheet.create({
    chartWrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 5,
      height: BAR_MAX_HEIGHT + 20,
      marginTop: spacing.sm,
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
      borderRadius: 3,
      minHeight: 4,
    },
    barLabel: {
      ...typography.caption,
      color: colors.textTertiary,
      marginTop: 3,
      fontSize: 9,
    },
  });

  return (
    <View style={styles.chartWrap}>
      {last7.map((entry, i) => {
        const heightPct = ((entry.value - minVal) / range) * 0.8 + 0.2;
        const barH = Math.max(4, Math.round(BAR_MAX_HEIGHT * heightPct));
        const isLast = i === last7.length - 1;
        return (
          <View key={entry.date + i} style={styles.barCol}>
            <View
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor: isLast ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: isLast ? colors.primary : colors.border,
                },
              ]}
            />
            <Text style={styles.barLabel}>{entry.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['theme']['colors'];
  spacing: ReturnType<typeof useTheme>['theme']['spacing'];
  typography: ReturnType<typeof useTheme>['theme']['typography'];
  isLast?: boolean;
}

function SettingsRow({ label, children, colors, spacing, typography, isLast }: SettingsRowProps) {
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.border,
    },
    label: {
      ...typography.small,
      color: colors.text,
    },
  });
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useTheme>['theme']['colors'];
  spacing: ReturnType<typeof useTheme>['theme']['spacing'];
  typography: ReturnType<typeof useTheme>['theme']['typography'];
}

function SegmentedControl({
  options,
  value,
  onChange,
  colors,
  spacing,
  typography,
}: SegmentedControlProps) {
  const styles = StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    option: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
    },
    optionActive: {
      backgroundColor: colors.primary,
    },
    optionText: {
      ...typography.captionBold,
      color: colors.textSecondary,
    },
    optionTextActive: {
      color: colors.background,
    },
  });
  return (
    <View style={styles.wrap}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.option, value === opt.value && styles.optionActive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.optionText,
              value === opt.value && styles.optionTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Weight Log Modal
// ---------------------------------------------------------------------------

interface WeightLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  colors: ReturnType<typeof useTheme>['theme']['colors'];
  spacing: ReturnType<typeof useTheme>['theme']['spacing'];
  typography: ReturnType<typeof useTheme>['theme']['typography'];
  unitSystem: string;
}

function WeightLogModal({
  visible,
  onClose,
  onSubmit,
  colors,
  spacing,
  typography,
  unitSystem,
}: WeightLogModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      Alert.alert(t('weightModal.invalidInput', 'Invalid Input'), t('weightModal.invalidMsg', 'Please enter a valid weight value.'));
      return;
    }
    onSubmit(num);
    setValue('');
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: spacing.borderRadius.lg,
      borderTopRightRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      paddingBottom: spacing.xxl,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.small,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: spacing.borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.text,
    },
    unit: {
      ...typography.small,
      color: colors.textSecondary,
      width: 30,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...typography.smallBold,
      color: colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: spacing.borderRadius.sm,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      ...typography.smallBold,
      color: colors.background,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('weightModal.title', 'Log Weight')}</Text>
          <Text style={styles.subtitle}>
            {t('weightModal.subtitle', 'Enter your current weight to track your progress.')}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder="0.0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.unit}>
              {unitSystem === 'imperial' ? 'lbs' : 'kg'}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmButtonText}>{t('common.save', 'Save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const { user, logoutAsync, updateProfile } = useAuthStore();
  const { totalWorkouts, personalRecords } = useWorkoutStore();
  const { weightEntries, photos, addWeight } = useProgressStore();
  const { theme: settingsTheme, language, units, notifications, toggleTheme, setLanguage, setUnits, toggleNotificationsAsync, biometricEnabled, setBiometricEnabled, twoFAEnabled, setTwoFAEnabled } = useSettingsStore();

  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const currentWeight =
    weightEntries.length > 0
      ? weightEntries[weightEntries.length - 1].value
      : user?.measurements?.weight ?? 0;

  const heightCm = user?.measurements?.height ?? 0;
  const bmi = calcBMI(currentWeight, heightCm);

  const visibleAchievements = showAllAchievements
    ? achievements
    : achievements.slice(0, 6);

  const handleLogout = () => {
    Alert.alert(t('profile.logoutTitle', 'Log Out'), t('profile.logoutMsg', 'Are you sure you want to log out?'), [
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      {
        text: t('profile.logoutTitle', 'Log Out'),
        style: 'destructive',
        onPress: async () => {
          await logoutAsync();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    // ---- Section helpers ----
    sectionTitle: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.cardPadding,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // ---- Profile header ----
    profileHeader: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.screenPadding,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    avatarText: {
      ...typography.h2,
      color: colors.background,
    },
    premiumBadge: {
      position: 'absolute',
      bottom: 0,
      right: -4,
      backgroundColor: colors.warning,
      borderRadius: spacing.borderRadius.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderWidth: 2,
      borderColor: colors.background,
    },
    premiumBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#1a1a1a',
    },
    profileName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      ...typography.small,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    profileMetaRow: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    profileMetaItem: {
      alignItems: 'center',
    },
    profileMetaValue: {
      ...typography.smallBold,
      color: colors.primary,
    },
    profileMetaLabel: {
      ...typography.caption,
      color: colors.textTertiary,
    },
    // ---- Stats row ----
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.screenPadding,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      ...typography.number,
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    // ---- Sections ----
    section: {
      paddingHorizontal: spacing.screenPadding,
      marginBottom: spacing.sectionGap,
    },
    // ---- Body stats ----
    bodyStatRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    bodyStatItem: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: spacing.borderRadius.sm,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bodyStatValue: {
      ...typography.h4,
      color: colors.text,
    },
    bodyStatLabel: {
      ...typography.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },
    bmiValue: {
      color: colors.primary,
    },
    logWeightButton: {
      backgroundColor: colors.primary,
      borderRadius: spacing.borderRadius.sm,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    logWeightButtonText: {
      ...typography.smallBold,
      color: colors.background,
    },
    chartTitle: {
      ...typography.captionBold,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: 2,
    },
    // ---- Goals ----
    goalsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    goalTag: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: spacing.borderRadius.full,
    },
    goalTagText: {
      ...typography.captionBold,
      color: '#fff',
    },
    // ---- Achievements ----
    achievementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    achievementBadge: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: spacing.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sm,
    },
    achievementIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    achievementName: {
      ...typography.caption,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 14,
    },
    seeAllButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: spacing.borderRadius.sm,
    },
    seeAllButtonText: {
      ...typography.smallBold,
      color: colors.primary,
    },
    // ---- Settings ----
    settingsCard: {
      backgroundColor: colors.card,
      borderRadius: spacing.borderRadius.lg,
      paddingHorizontal: spacing.cardPadding,
      borderWidth: 1,
      borderColor: colors.border,
    },
    // ---- Photos ----
    photosRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    photosCountText: {
      ...typography.h4,
      color: colors.text,
    },
    photosLabel: {
      ...typography.small,
      color: colors.textSecondary,
      marginTop: 2,
    },
    viewPhotosButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    viewPhotosButtonText: {
      ...typography.smallBold,
      color: colors.primary,
    },
    // ---- Logout ----
    logoutButton: {
      marginHorizontal: spacing.screenPadding,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: spacing.borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.error,
      alignItems: 'center',
    },
    logoutButtonText: {
      ...typography.bodyBold,
      color: colors.error,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.screenPadding,
      marginBottom: spacing.sectionGap,
    },
    editProfileButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: spacing.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    editProfileButtonText: {
      ...typography.smallBold,
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ---- 1. Profile Header ---- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user ? getInitials(user.name) : '??'}
              </Text>
            </View>
            {user?.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{user?.name ?? 'Unknown'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          <View style={styles.profileMetaRow}>
            <View style={styles.profileMetaItem}>
              <Text style={styles.profileMetaValue}>
                {user?.streakDays ?? 0}
              </Text>
              <Text style={styles.profileMetaLabel}>{t('profile.streak', 'Streak')}</Text>
            </View>
            <View style={styles.profileMetaItem}>
              <Text style={styles.profileMetaValue}>
                {formatDate(user?.joinDate ?? 'Jan 2025')}
              </Text>
              <Text style={styles.profileMetaLabel}>{t('profile.memberSince', 'Member since')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/(tabs)/profile/edit' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileButtonText}>{t('profile.editProfile', 'Edit Profile')}</Text>
          </TouchableOpacity>
        </View>

        {/* ---- 2. Stats row ---- */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>{t('profile.workouts', 'Workouts')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{personalRecords.length}</Text>
            <Text style={styles.statLabel}>{t('profile.prs', 'PRs')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weightEntries.length}</Text>
            <Text style={styles.statLabel}>{t('profile.weighIns', 'Weigh-ins')}</Text>
          </View>
        </View>

        {/* ---- 3. Body Stats ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.bodyStats', 'Body Stats')}</Text>
          <View style={styles.card}>
            <View style={styles.bodyStatRow}>
              <View style={styles.bodyStatItem}>
                <Text style={styles.bodyStatValue}>
                  {currentWeight}
                  {units === 'imperial' ? ' lbs' : ' kg'}
                </Text>
                <Text style={styles.bodyStatLabel}>{t('profile.weight', 'Weight')}</Text>
              </View>
              <View style={styles.bodyStatItem}>
                <Text style={styles.bodyStatValue}>
                  {heightCm > 0 ? `${heightCm} cm` : '—'}
                </Text>
                <Text style={styles.bodyStatLabel}>{t('profile.height', 'Height')}</Text>
              </View>
              <View style={styles.bodyStatItem}>
                <Text style={[styles.bodyStatValue, styles.bmiValue]}>
                  {bmi}
                </Text>
                <Text style={styles.bodyStatLabel}>{t('profile.bmi', 'BMI')}</Text>
              </View>
            </View>

            {/* Inline weight bar chart */}
            {weightEntries.length > 0 && (
              <>
                <Text style={styles.chartTitle}>{t('profile.lastEntries', 'Last {{count}} entries', { count: Math.min(7, weightEntries.length) })}</Text>
                <WeightBarChart
                  entries={weightEntries}
                  colors={colors}
                  spacing={spacing}
                  typography={typography}
                />
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.logWeightButton, { flex: 1 }]}
                onPress={() => setWeightModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.logWeightButtonText}>{t('profile.logWeight', 'Log Weight')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logWeightButton, { flex: 1, backgroundColor: `${colors.primary}22` }]}
                onPress={() => router.push('/(tabs)/profile/analytics')}
                activeOpacity={0.85}
              >
                <Text style={[styles.logWeightButtonText, { color: colors.primary }]}>{t('profile.aiAnalysis', '✨ AI Analysis')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ---- 4. Goals ---- */}
        {user?.goals && user.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.goals', 'Goals')}</Text>
            <View style={styles.goalsWrap}>
              {user.goals.map((goal) => (
                <View
                  key={goal}
                  style={[
                    styles.goalTag,
                    { backgroundColor: goalColor(goal, colors) },
                  ]}
                >
                  <Text style={styles.goalTagText}>{goalLabel(goal, t)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ---- 5. Settings ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings', 'Settings')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              label={t('settings.theme', 'Theme')}
              colors={colors}
              spacing={spacing}
              typography={typography}
            >
              <SegmentedControl
                options={[
                  { label: t('settings.dark', 'Dark'), value: 'dark' },
                  { label: t('settings.light', 'Light'), value: 'light' },
                ]}
                value={settingsTheme}
                onChange={(v) => { if (v !== settingsTheme) toggleTheme(); }}
                colors={colors}
                spacing={spacing}
                typography={typography}
              />
            </SettingsRow>

            <SettingsRow
              label={t('settings.language', 'Language')}
              colors={colors}
              spacing={spacing}
              typography={typography}
            >
              <SegmentedControl
                options={[
                  { label: 'EN', value: 'en' },
                  { label: 'RO', value: 'ro' },
                ]}
                value={language}
                onChange={(v) => setLanguage(v as 'en' | 'ro')}
                colors={colors}
                spacing={spacing}
                typography={typography}
              />
            </SettingsRow>

            <SettingsRow
              label={t('settings.units', 'Units')}
              colors={colors}
              spacing={spacing}
              typography={typography}
            >
              <SegmentedControl
                options={[
                  { label: t('settings.metric', 'Metric'), value: 'metric' },
                  { label: t('settings.imperial', 'Imperial'), value: 'imperial' },
                ]}
                value={units}
                onChange={(v) => setUnits(v as 'metric' | 'imperial')}
                colors={colors}
                spacing={spacing}
                typography={typography}
              />
            </SettingsRow>

            <SettingsRow
              label={t('settings.notifications', 'Notifications')}
              colors={colors}
              spacing={spacing}
              typography={typography}
              isLast
            >
              <Switch
                value={notifications}
                onValueChange={() => toggleNotificationsAsync()}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </SettingsRow>
          </View>
        </View>

        {/* ---- 6. Security ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.security', 'Security')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              label={t('profile.changePassword', 'Change Password')}
              colors={colors}
              spacing={spacing}
              typography={typography}
            >
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Change Password',
                    'A password reset link will be sent to your email address.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Send Link',
                        onPress: () =>
                          Alert.alert('Email Sent', 'Check your inbox for the reset link.'),
                      },
                    ],
                  )
                }
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: spacing.borderRadius.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                  {t('profile.reset', 'Reset')}
                </Text>
              </TouchableOpacity>
            </SettingsRow>

            <SettingsRow
              label={t('profile.faceId', 'Face ID / Fingerprint')}
              colors={colors}
              spacing={spacing}
              typography={typography}
            >
              <Switch
                value={biometricEnabled}
                onValueChange={(val) => {
                  if (val) {
                    Alert.alert(
                      'Enable Biometric Login',
                      'Use fingerprint or face recognition to sign in faster.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Enable',
                          onPress: () => setBiometricEnabled(true),
                        },
                      ],
                    );
                  } else {
                    setBiometricEnabled(false);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </SettingsRow>

            <SettingsRow
              label={t('profile.twoStep', 'Two-Step Verification')}
              colors={colors}
              spacing={spacing}
              typography={typography}
              isLast
            >
              <Switch
                value={twoFAEnabled}
                onValueChange={(val) => {
                  if (val) {
                    Alert.alert(
                      'Enable 2-Step Verification',
                      'You will receive a code via SMS or authenticator app each time you sign in.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Enable',
                          onPress: () => setTwoFAEnabled(true),
                        },
                      ],
                    );
                  } else {
                    Alert.alert(
                      'Disable 2-Step Verification',
                      'This will make your account less secure. Are you sure?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Disable',
                          style: 'destructive',
                          onPress: () => setTwoFAEnabled(false),
                        },
                      ],
                    );
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </SettingsRow>
          </View>
        </View>

        {/* ---- 7. Wearables & Integrations ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.wearables', 'Wearables & Integrations')}</Text>
          <View style={styles.card}>
            <View style={{ gap: spacing.sm }}>
              {[
                { icon: '⌚', label: 'Apple Watch / Wear OS', sub: 'Sync workouts & heart rate' },
                { icon: '❤️', label: 'Apple Health / Google Fit', sub: 'Import steps, sleep & calories' },
                { icon: '🏃', label: 'Strava', sub: 'Connect running & cycling activity' },
                { icon: '📿', label: 'Fitbit / Garmin / Whoop', sub: 'Sync fitness bands & rings' },
                { icon: '🎵', label: 'Pilates & Yoga Apps', sub: 'Import mindfulness minutes' },
              ].map((item, idx, arr) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      item.label,
                      'Integration coming soon. Connect your ' + item.label + ' to automatically sync your activity data.',
                      [{ text: 'OK' }],
                    )
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    gap: spacing.md,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {item.sub}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ---- 8. Achievements ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {visibleAchievements.map((ach) => {
              const tierColor = achievementTierColor(ach.category, colors);
              const isUnlocked = !!ach.unlockedAt;
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementBadge,
                    {
                      backgroundColor: isUnlocked
                        ? `${tierColor}22`
                        : colors.surface,
                      borderColor: isUnlocked ? tierColor : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.achievementIcon,
                      { opacity: isUnlocked ? 1 : 0.35 },
                    ]}
                  >
                    {ach.icon}
                  </Text>
                  <Text
                    style={[
                      styles.achievementName,
                      { color: isUnlocked ? colors.text : colors.textTertiary },
                    ]}
                    numberOfLines={2}
                  >
                    {ach.name}
                  </Text>
                </View>
              );
            })}
          </View>
          {achievements.length > 6 && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => setShowAllAchievements((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllButtonText}>
                {showAllAchievements
                  ? 'Show Less'
                  : `See All (${achievements.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ---- 9. Progress Photos ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Photos</Text>
          <View style={styles.card}>
            <View style={styles.photosRow}>
              <View>
                <Text style={styles.photosCountText}>{photos.length}</Text>
                <Text style={styles.photosLabel}>
                  {photos.length === 1 ? 'photo saved' : 'photos saved'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewPhotosButton}
                onPress={() => router.push('/(tabs)/profile/photos' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewPhotosButtonText}>View Photos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ---- 10. Logout ---- */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Weight Log Modal */}
      <WeightLogModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
        onSubmit={(value) => {
          addWeight(value);
          // Keep user.measurements.weight in sync with the logged weight
          updateProfile({
            measurements: { ...(user?.measurements ?? {}), weight: value } as any,
          });
        }}
        colors={colors}
        spacing={spacing}
        typography={typography}
        unitSystem={units}
      />
    </SafeAreaView>
  );
}
