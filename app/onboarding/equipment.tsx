import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import type { Equipment } from '../../src/types/exercise';

const equipmentOptions: { id: string; icon: string; label: string }[] = [
  { id: 'barbell', icon: '🏋️', label: 'Barbell' },
  { id: 'dumbbell', icon: '💪', label: 'Dumbbell' },
  { id: 'machine', icon: '⚙️', label: 'Machine' },
  { id: 'cable', icon: '🔗', label: 'Cable' },
  { id: 'bodyweight', icon: '🤸', label: 'Bodyweight' },
  { id: 'kettlebell', icon: '🔔', label: 'Kettlebell' },
  { id: 'resistance_bands', icon: '〰️', label: 'Resistance Bands' },
  { id: 'smith_machine', icon: '🏗️', label: 'Smith Machine' },
];

export default function EquipmentScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const setEquipment = useAuthStore((s) => s.setEquipment);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const styles = createStyles(theme);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNext = () => {
    setEquipment(Array.from(selected) as unknown as Equipment[]);
    router.push('./preferences');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '80%' }]} />
        </View>
        <Text style={styles.stepLabel}>Step 4 of 5</Text>
        <Text style={styles.title}>Available Equipment</Text>
        <Text style={styles.subtitle}>Select all equipment you have access to</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {equipmentOptions.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.gridItem,
                  isSelected && styles.gridItemSelected,
                ]}
                onPress={() => toggleItem(item.id)}
              >
                <Text style={styles.gridIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.gridLabel,
                    isSelected && styles.gridLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
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
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 24,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.sectionGap,
      paddingBottom: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridItem: {
      width: '47%',
      backgroundColor: theme.colors.surface,
      paddingVertical: 22,
      paddingHorizontal: 16,
      borderRadius: theme.spacing.borderRadius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      gap: 8,
    },
    gridItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceLight,
    },
    gridIcon: {
      fontSize: 32,
    },
    gridLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    gridLabelSelected: {
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
    buttonPressed: {
      opacity: 0.85,
    },
    nextButtonText: {
      color: theme.colors.background,
      fontSize: 18,
      fontWeight: '700',
    },
  });
