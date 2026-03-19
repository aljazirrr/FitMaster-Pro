import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme';

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  color?: string;
  label?: string;
}

export default function ProgressChart({
  data,
  color,
  label,
}: ProgressChartProps) {
  const { theme } = useTheme();
  const lineColor = color ?? theme.colors.primary;

  const width = 320;
  const height = 180;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 40;
  const paddingRight = 16;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (data.length === 0) {
    const emptyStyle: ViewStyle = {
      width,
      height,
      alignItems: 'center',
      justifyContent: 'center',
    };
    const emptyTextStyle: TextStyle = {
      ...theme.typography.small,
      color: theme.colors.textTertiary,
    };
    return (
      <View style={emptyStyle}>
        <Text style={emptyTextStyle}>No data available</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis labels
  const yLabels = [minVal, minVal + range / 2, maxVal].map((v) => Math.round(v));

  // X-axis labels (show first, middle, last)
  const xIndices =
    data.length <= 3
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 2), data.length - 1];

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
        {/* Y-axis grid lines */}
        {yLabels.map((val, i) => {
          const y =
            paddingTop +
            chartHeight -
            ((val - minVal) / range) * chartHeight;
          return (
            <React.Fragment key={`y-${i}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                fill={theme.colors.textTertiary}
                fontSize={10}
                textAnchor="end"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data dots */}
        {points.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={lineColor}
            stroke={theme.colors.surface}
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels */}
        {xIndices.map((idx) => {
          const d = data[idx];
          const p = points[idx];
          const dateStr = d.date.length > 5 ? d.date.slice(5) : d.date;
          return (
            <SvgText
              key={`x-${idx}`}
              x={p.x}
              y={height - 6}
              fill={theme.colors.textTertiary}
              fontSize={10}
              textAnchor="middle"
            >
              {dateStr}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
