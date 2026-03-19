import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import type { Gender } from '../../src/types/user';

const genderOptions: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

export default function MeasurementsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const setMeasurements = useAuthStore((s) => s.setMeasurements);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const styles = createStyles(theme);
  const isValid = weight && height && age && gender;

  const handleNext = () => {
    if (isValid && gender) {
      setMeasurements(parseFloat(weight), parseFloat(height), parseInt(age, 10), gender);
      router.push('./experience');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '40%' }]} />
        </View>
        <Text style={styles.stepLabel}>Step 2 of 5</Text>
        <Text style={styles.title}>Your Measurements</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 75"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder="e.g. 178"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="e.g. 28"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.pillRow}>
            {genderOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.pill,
                  gender === option.id && styles.pillSelected,
                ]}
                onPress={() => setGender(option.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    gender === option.id && styles.pillTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            !isValid && styles.nextButtonDisabled,
            pressed && isValid && styles.buttonPressed,
          ]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={[styles.nextButtonText, !isValid && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingTop: 16,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    stepLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 24,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingBottom: 16,
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.spacing.borderRadius.md,
      paddingVertical: 16,
      paddingHorizontal: 16,
      fontSize: 17,
      color: theme.colors.text,
      fontWeight: '500',
    },
    pillRow: {
      flexDirection: 'row',
      gap: 10,
    },
    pill: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: theme.spacing.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    pillSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceLight,
    },
    pillText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    pillTextSelected: {
      color: theme.colors.primary,
    },
    bottomSection: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingBottom: 24,
      paddingTop: 12,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 18,
      borderRadius: theme.spacing.borderRadius.lg,
      alignItems: 'center',
    },
    nextButtonDisabled: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    nextButtonText: {
      color: theme.colors.background,
      fontSize: 18,
      fontWeight: '700',
    },
    nextButtonTextDisabled: {
      color: theme.colors.textTertiary,
    },
  });
