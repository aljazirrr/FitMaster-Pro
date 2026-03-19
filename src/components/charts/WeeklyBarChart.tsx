import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '../../theme';

interface BarData {
  day: string;
  value: number;
}

interface WeeklyBarChartProps {
  data: BarData[];
  color?: string;
  label?: string;
}

export default function WeeklyBarChart({
  data,
  color,
  label,
}: WeeklyBarChartProps) {
  const { theme } = useTheme();
  const barColor = color ?? theme.colors.primary;

  const width = 320;
  const height = 160;
  const paddingTop = 16;
  const paddingBottom = 28;
  const paddingLeft = 8;
  const paddingRight = 8;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barCount = data.length;
  const barGap = 8;
  const barWidth = (chartWidth - barGap * (barCount + 1)) / barCount;

  const containerStyle: ViewStyle = {
    alignItems: 'center',
  };

  const labelStyle: TextStyle = {
    ...theme.typography.smallBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      <Svg width={width} height={height}>
        {/* Baseline */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke={theme.colors.border}
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight;
          const x = paddingLeft + barGap + i * (barWidth + barGap);
          const y = paddingTop + chartHeight - barHeight;

          return (
            <React.Fragment key={i}>
              {/* Bar background */}
              <Rect
                x={x}
                y={paddingTop}
                width={barWidth}
                height={chartHeight}
                rx={barWidth / 4}
                fill={theme.colors.surfaceLight}
              />
              {/* Bar fill */}
              {d.value > 0 && (
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barWidth / 4}
                  fill={barColor}
                  opacity={0.85}
                />
              )}
              {/* Value label */}
              {d.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill={theme.colors.textSecondary}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {d.value}
                </SvgText>
              )}
              {/* Day label */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 6}
                fill={theme.colors.textTertiary}
                fontSize={11}
                fontWeight="600"
                textAnchor="middle"
              >
                {d.day}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
