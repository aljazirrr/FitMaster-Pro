import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import Input from '../ui/Input';
import { calculateOneRM } from '../../utils/calculations';

interface OneRMCalculatorProps {
  onClose: () => void;
}

export default function OneRMCalculator({ onClose }: OneRMCalculatorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const weightNum = parseFloat(weight) || 0;
  const repsNum = parseInt(reps, 10) || 0;

  const results = useMemo(() => {
    if (weightNum <= 0 || repsNum <= 0) {
      return { epley: 0, brzycki: 0 };
    }
    return {
      epley: calculateOneRM(weightNum, repsNum, 'epley'),
      brzycki: calculateOneRM(weightNum, repsNum, 'brzycki'),
    };
  }, [weightNum, repsNum]);

  // Percentage table based on Epley 1RM
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60];

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.xl,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const titleStyle: TextStyle = {
    ...theme.typography.h3,
    color: theme.colors.text,
  };

  const closeStyle: TextStyle = {
    ...theme.typography.h3,
    color: theme.colors.textTertiary,
  };

  const inputRowStyle: ViewStyle = {
    flexDirection: 'row',
    gap: theme.spacing.md,
  };

  const inputWrapperStyle: ViewStyle = {
    flex: 1,
  };

  const resultsContainerStyle: ViewStyle = {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.lg,
  };

  const resultRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  };

  const formulaLabelStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  };

  const resultValueStyle: TextStyle = {
    ...theme.typography.h3,
    color: theme.colors.primary,
  };

  const sectionTitleStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  };

  const tableRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  };

  const tableHeaderStyle: TextStyle = {
    ...theme.typography.captionBold,
    color: theme.colors.textTertiary,
    flex: 1,
    textAlign: 'center',
  };

  const tableCellStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  };

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={headerStyle}>
        <Text style={titleStyle}>1RM Calculator</Text>
        <Pressable onPress={onClose}>
          <Text style={closeStyle}>{'\u2715'}</Text>
        </Pressable>
      </View>

      {/* Inputs */}
      <View style={inputRowStyle}>
        <View style={inputWrapperStyle}>
          <Input
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="100"
            keyboardType="numeric"
          />
        </View>
        <View style={inputWrapperStyle}>
          <Input
            label="Reps"
            value={reps}
            onChangeText={setReps}
            placeholder="5"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Results */}
      {results.epley > 0 && (
        <>
          <View style={resultsContainerStyle}>
            <View style={resultRowStyle}>
              <Text style={formulaLabelStyle}>Epley Formula</Text>
              <Text style={resultValueStyle}>{results.epley} kg</Text>
            </View>
            <View style={[resultRowStyle, { marginBottom: 0 }]}>
              <Text style={formulaLabelStyle}>Brzycki Formula</Text>
              <Text style={resultValueStyle}>{results.brzycki} kg</Text>
            </View>
          </View>

          {/* Percentage table */}
          <Text style={sectionTitleStyle}>ESTIMATED LOADS</Text>
          <View style={tableRowStyle}>
            <Text style={tableHeaderStyle}>%1RM</Text>
            <Text style={tableHeaderStyle}>Weight</Text>
            <Text style={tableHeaderStyle}>Est. Reps</Text>
          </View>
          {percentages.map((pct) => {
            const estWeight = Math.round(results.epley * (pct / 100));
            const estReps =
              pct === 100
                ? 1
                : pct >= 95
                ? 2
                : pct >= 90
                ? 3
                : pct >= 85
                ? 5
                : pct >= 80
                ? 6
                : pct >= 75
                ? 8
                : pct >= 70
                ? 10
                : pct >= 65
                ? 12
                : 15;
            return (
              <View key={pct} style={tableRowStyle}>
                <Text style={tableCellStyle}>{pct}%</Text>
                <Text style={tableCellStyle}>{estWeight} kg</Text>
                <Text style={tableCellStyle}>{estReps}</Text>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}
