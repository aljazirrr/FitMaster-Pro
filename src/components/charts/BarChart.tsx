/**
 * Reusable SVG Bar Chart
 *
 * Props:
 *  - data: { label: string; value: number; color?: string }[]
 *  - color: string          — default bar color
 *  - height?: number        — total component height (default 160)
 *  - yLabel?: formatter     — Y-axis label formatter
 *  - showValues?: boolean   — show value on top of each bar
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
const Y_TICKS = 4;
const BAR_RADIUS = 4;
const BAR_GAP_RATIO = 0.35; // fraction of slot that is gap

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  color: string;
  height?: number;
  yLabel?: (v: number) => string;
  showValues?: boolean;
  width?: number;
}

export function BarChart({
  data,
  color,
  height = 160,
  yLabel = (v) => String(Math.round(v)),
  showValues = true,
  width,
}: BarChartProps) {
  const chartWidth = (width ?? SCREEN_W - 32) - PAD_LEFT - PAD_RIGHT;
  const chartHeight = height - PAD_TOP - PAD_BOTTOM;

  const { maxY, yTicks, bars } = useMemo(() => {
    if (data.length === 0) return { maxY: 1, yTicks: [], bars: [] };
    const maxY = Math.max(...data.map((d) => d.value), 1);
    const niceMax = Math.ceil(maxY / 100) * 100 || maxY * 1.2;
    const step = niceMax / (Y_TICKS - 1);
    const yTicks = Array.from({ length: Y_TICKS }, (_, i) => step * i).reverse();

    const slotW = chartWidth / data.length;
    const barW = slotW * (1 - BAR_GAP_RATIO);

    const bars = data.map((d, i) => {
      const barH = Math.max((d.value / niceMax) * chartHeight, d.value > 0 ? 2 : 0);
      return {
        x: PAD_LEFT + i * slotW + (slotW - barW) / 2,
        y: PAD_TOP + (chartHeight - barH),
        w: barW,
        h: barH,
        color: d.color ?? color,
        label: d.label,
        value: d.value,
        labelX: PAD_LEFT + i * slotW + slotW / 2,
      };
    });

    return { maxY: niceMax, yTicks, bars };
  }, [data, chartWidth, chartHeight, color]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  return (
    <View style={{ height, marginHorizontal: -4 }}>
      {/* Y-axis labels */}
      {yTicks.map((v, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            width: PAD_LEFT - 4,
            top: PAD_TOP + (i / (Y_TICKS - 1)) * chartHeight - 8,
            alignItems: 'flex-end',
          }}
        >
          <Text style={styles.yLabel}>{yLabel(v)}</Text>
        </View>
      ))}

      <Svg width={chartWidth + PAD_LEFT + PAD_RIGHT} height={height}>
        {/* Grid lines */}
        {yTicks.map((_, i) => (
          <Line
            key={i}
            x1={PAD_LEFT}
            y1={PAD_TOP + (i / (Y_TICKS - 1)) * chartHeight}
            x2={PAD_LEFT + chartWidth}
            y2={PAD_TOP + (i / (Y_TICKS - 1)) * chartHeight}
            stroke="#88888820"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {bars.map((b, i) => (
          <React.Fragment key={i}>
            <Rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill={b.color}
              opacity={0.85}
            />
            {/* Value on top */}
            {showValues && b.value > 0 && (
              <SvgText
                x={b.labelX}
                y={b.y - 3}
                fontSize={9}
                fill={b.color}
                textAnchor="middle"
                fontWeight="700"
              >
                {yLabel(b.value)}
              </SvgText>
            )}
            {/* X label */}
            <SvgText
              x={b.labelX}
              y={height - 6}
              fontSize={9}
              fill="#888"
              textAnchor="middle"
            >
              {b.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 13 },
  yLabel: { fontSize: 9, color: '#888' },
});
