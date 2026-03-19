import React, { useMemo } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { calculatePlates } from '../../utils/calculations';

interface PlateCalculatorProps {
  targetWeight: number;
  barWeight?: number;
}

const plateColors: Record<number, string> = {
  25: '#FF4757',
  20: '#3742FA',
  15: '#FFD93D',
  10: '#2ED573',
  5: '#FFFFFF',
  2.5: '#1E90FF',
  1.25: '#C0C0C0',
};

const plateWidths: Record<number, number> = {
  25: 24,
  20: 22,
  15: 20,
  10: 18,
  5: 14,
  2.5: 12,
  1.25: 10,
};

const plateHeights: Record<number, number> = {
  25: 80,
  20: 74,
  15: 66,
  10: 58,
  5: 48,
  2.5: 40,
  1.25: 34,
};

export default function PlateCalculator({
  targetWeight,
  barWeight = 20,
}: PlateCalculatorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const plates = useMemo(
    () => calculatePlates(targetWeight, barWeight),
    [targetWeight, barWeight],
  );

  const perSideWeight = (targetWeight - barWeight) / 2;
  const isValid = targetWeight > barWeight;

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.lg,
  };

  const titleStyle: TextStyle = {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  };

  const subtitleStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  };

  const barContainerStyle: ViewStyle = {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const barVisualStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const barStyle: ViewStyle = {
    width: 80,
    height: 10,
    backgroundColor: theme.colors.textTertiary,
    borderRadius: 2,
  };

  const plateStyle = (plate: number): ViewStyle => ({
    width: plateWidths[plate] ?? 14,
    height: plateHeights[plate] ?? 50,
    backgroundColor: plateColors[plate] ?? '#888',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  });

  const plateLabelStyle: TextStyle = {
    fontSize: 8,
    fontWeight: '700',
    color: '#000',
  };

  const collarStyle: ViewStyle = {
    width: 8,
    height: 20,
    backgroundColor: theme.colors.textTertiary,
    borderRadius: 2,
  };

  const summaryContainerStyle: ViewStyle = {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
  };

  const summaryTitleStyle: TextStyle = {
    ...theme.typography.captionBold,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.sm,
  };

  const summaryRowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  };

  const summaryLabelStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  };

  const summaryValueStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.text,
  };

  const emptyStyle: TextStyle = {
    ...theme.typography.small,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  };

  if (!isValid) {
    return (
      <View style={containerStyle}>
        <Text style={titleStyle}>Plate Calculator</Text>
        <Text style={emptyStyle}>
          Target weight must be greater than bar weight ({barWeight} kg)
        </Text>
      </View>
    );
  }

  // Count plates for summary
  const plateCounts: Record<number, number> = {};
  plates.forEach((p) => {
    plateCounts[p] = (plateCounts[p] ?? 0) + 1;
  });

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>Plate Calculator</Text>
      <Text style={subtitleStyle}>
        {targetWeight} kg total | {barWeight} kg bar | {perSideWeight} kg per side
      </Text>

      {/* Visual barbell */}
      <View style={barContainerStyle}>
        <View style={barVisualStyle}>
          {/* Left plates (reversed for visual) */}
          {[...plates].reverse().map((plate, i) => (
            <View key={`l-${i}`} style={plateStyle(plate)}>
              <Text style={plateLabelStyle}>{plate}</Text>
            </View>
          ))}
          {/* Left collar */}
          <View style={collarStyle} />
          {/* Bar */}
          <View style={barStyle} />
          {/* Right collar */}
          <View style={collarStyle} />
          {/* Right plates */}
          {plates.map((plate, i) => (
            <View key={`r-${i}`} style={plateStyle(plate)}>
              <Text style={plateLabelStyle}>{plate}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={summaryContainerStyle}>
        <Text style={summaryTitleStyle}>PLATES PER SIDE</Text>
        {Object.entries(plateCounts)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([plate, count]) => (
            <View key={plate} style={summaryRowStyle}>
              <Text style={summaryLabelStyle}>{plate} kg</Text>
              <Text style={summaryValueStyle}>{count}x</Text>
            </View>
          ))}
      </View>
    </View>
  );
}
