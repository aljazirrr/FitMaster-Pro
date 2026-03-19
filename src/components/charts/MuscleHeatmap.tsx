import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Circle as SvgCircle, Rect, G } from 'react-native-svg';
import { useTheme } from '../../theme';
import { MuscleGroup } from '../../types/exercise';

interface MuscleHeatmapProps {
  muscleData: Record<MuscleGroup, number>; // 0-1 intensity
}

// Positions for muscle groups on front and back silhouettes
const frontMusclePositions: Record<string, { x: number; y: number; r: number }> = {
  [MuscleGroup.Chest]: { x: 50, y: 72, r: 14 },
  [MuscleGroup.Shoulders]: { x: 28, y: 58, r: 10 },
  [MuscleGroup.Biceps]: { x: 20, y: 85, r: 8 },
  [MuscleGroup.Forearms]: { x: 16, y: 108, r: 7 },
  [MuscleGroup.Core]: { x: 50, y: 105, r: 12 },
  [MuscleGroup.Quads]: { x: 38, y: 150, r: 10 },
  [MuscleGroup.Calves]: { x: 38, y: 195, r: 8 },
};

const backMusclePositions: Record<string, { x: number; y: number; r: number }> = {
  [MuscleGroup.Back]: { x: 50, y: 80, r: 16 },
  [MuscleGroup.Triceps]: { x: 22, y: 85, r: 8 },
  [MuscleGroup.Hamstrings]: { x: 40, y: 160, r: 10 },
  [MuscleGroup.Glutes]: { x: 50, y: 128, r: 12 },
};

function getIntensityColor(
  intensity: number,
  muscle: { low: string; medium: string; high: string; intense: string },
): string {
  if (intensity <= 0) return 'transparent';
  if (intensity < 0.25) return muscle.low;
  if (intensity < 0.5) return muscle.medium;
  if (intensity < 0.75) return muscle.high;
  return muscle.intense;
}

// Simplified body outline as SVG path
const FRONT_BODY_PATH =
  'M50,8 C56,8 60,12 60,18 C60,24 56,28 50,28 C44,28 40,24 40,18 C40,12 44,8 50,8 Z ' + // Head
  'M38,30 L30,32 L18,55 L14,65 L20,65 L28,48 L34,36 L36,55 L34,70 ' + // Left arm top
  'L28,80 L24,95 L20,110 L14,130 L18,132 L26,112 L30,95 L34,82 ' + // Left arm bottom
  'M62,30 L70,32 L82,55 L86,65 L80,65 L72,48 L66,36 L64,55 L66,70 ' + // Right arm top
  'L72,80 L76,95 L80,110 L86,130 L82,132 L74,112 L70,95 L66,82 ' + // Right arm bottom
  'M38,30 L42,45 L40,90 L38,115 L36,135 L34,165 L32,190 L30,215 L34,218 L40,195 L42,170 L44,145 L48,135 ' + // Left torso/leg
  'M62,30 L58,45 L60,90 L62,115 L64,135 L66,165 L68,190 L70,215 L66,218 L60,195 L58,170 L56,145 L52,135'; // Right torso/leg

const BACK_BODY_PATH =
  'M50,8 C56,8 60,12 60,18 C60,24 56,28 50,28 C44,28 40,24 40,18 C40,12 44,8 50,8 Z ' +
  'M38,30 L30,32 L18,55 L14,65 L20,65 L28,48 L34,36 L36,55 L34,70 ' +
  'L28,80 L24,95 L20,110 L14,130 L18,132 L26,112 L30,95 L34,82 ' +
  'M62,30 L70,32 L82,55 L86,65 L80,65 L72,48 L66,36 L64,55 L66,70 ' +
  'L72,80 L76,95 L80,110 L86,130 L82,132 L74,112 L70,95 L66,82 ' +
  'M38,30 L42,45 L40,90 L38,115 L36,135 L34,165 L32,190 L30,215 L34,218 L40,195 L42,170 L44,145 L48,135 ' +
  'M62,30 L58,45 L60,90 L62,115 L64,135 L66,165 L68,190 L70,215 L66,218 L60,195 L58,170 L56,145 L52,135';

export default function MuscleHeatmap({ muscleData }: MuscleHeatmapProps) {
  const { theme } = useTheme();

  const svgWidth = 100;
  const svgHeight = 230;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  };

  const columnStyle: ViewStyle = {
    alignItems: 'center',
  };

  const columnLabelStyle: TextStyle = {
    ...theme.typography.captionBold,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  };

  const renderSilhouette = (
    bodyPath: string,
    musclePositions: Record<string, { x: number; y: number; r: number }>,
    viewLabel: string,
  ) => (
    <View style={columnStyle}>
      <Text style={columnLabelStyle}>{viewLabel}</Text>
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Body outline */}
        <Path
          d={bodyPath}
          stroke={theme.colors.textTertiary}
          strokeWidth={1}
          fill="none"
          opacity={0.4}
        />
        {/* Muscle group circles */}
        {Object.entries(musclePositions).map(([muscleKey, pos]) => {
          const intensity = muscleData[muscleKey as MuscleGroup] ?? 0;
          const fillColor = getIntensityColor(intensity, theme.colors.muscle);
          if (intensity <= 0) return null;

          // Mirror for symmetric muscles
          const isMirrored =
            muscleKey !== MuscleGroup.Core &&
            muscleKey !== MuscleGroup.Back &&
            muscleKey !== MuscleGroup.Glutes;
          const mirrorX = svgWidth - pos.x;

          return (
            <G key={muscleKey}>
              <SvgCircle
                cx={pos.x}
                cy={pos.y}
                r={pos.r}
                fill={fillColor}
                opacity={0.7 + intensity * 0.3}
              />
              {isMirrored && (
                <SvgCircle
                  cx={mirrorX}
                  cy={pos.y}
                  r={pos.r}
                  fill={fillColor}
                  opacity={0.7 + intensity * 0.3}
                />
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );

  // Legend
  const legendStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  };

  const legendItemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  };

  const legendTextStyle: TextStyle = {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  };

  const legendEntries = [
    { label: 'Low', color: theme.colors.muscle.low },
    { label: 'Med', color: theme.colors.muscle.medium },
    { label: 'High', color: theme.colors.muscle.high },
    { label: 'Max', color: theme.colors.muscle.intense },
  ];

  return (
    <View>
      <View style={containerStyle}>
        {renderSilhouette(FRONT_BODY_PATH, frontMusclePositions, 'Front')}
        {renderSilhouette(BACK_BODY_PATH, backMusclePositions, 'Back')}
      </View>
      <View style={legendStyle}>
        {legendEntries.map((entry) => (
          <View key={entry.label} style={legendItemStyle}>
            <Svg width={12} height={12}>
              <Rect x={0} y={0} width={12} height={12} rx={3} fill={entry.color} />
            </Svg>
            <Text style={legendTextStyle}>{entry.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
