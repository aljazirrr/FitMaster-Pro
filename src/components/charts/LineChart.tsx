/**
 * Reusable SVG Line Chart
 *
 * Props:
 *  - data: { x: string; y: number }[]  — sorted data points
 *  - color: string                      — line/fill color
 *  - height?: number                    — chart area height (default 160)
 *  - showTrendline?: boolean            — dotted linear-regression line
 *  - yLabel?: (v: number) => string     — formatter for Y axis labels
 *  - xLabel?: (s: string) => string     — formatter for X axis labels
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;
const PAD_LEFT = 42;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;
const Y_TICKS = 5;
const MAX_X_LABELS = 6;

interface DataPoint {
  x: string;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  color: string;
  height?: number;
  showTrendline?: boolean;
  yLabel?: (v: number) => string;
  xLabel?: (s: string) => string;
  width?: number;
}

function linearReg(data: DataPoint[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  data.forEach((d, i) => {
    sumX += i; sumY += d.y; sumXY += i * d.y; sumXX += i * i;
  });
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function LineChart({
  data,
  color,
  height = 160,
  showTrendline = false,
  yLabel = (v) => String(Math.round(v)),
  xLabel = (s) => s,
  width,
}: LineChartProps) {
  const chartWidth = (width ?? SCREEN_W - 32) - PAD_LEFT - PAD_RIGHT;
  const chartHeight = height - PAD_TOP - PAD_BOTTOM;

  const { minY, maxY, points, trendPoints, yTicks, xIndices } = useMemo(() => {
    if (data.length === 0) return {
      minY: 0, maxY: 1,
      points: [] as { cx: number; cy: number }[],
      trendPoints: { tx1: 0, ty1: 0, tx2: 0, ty2: 0 },
      yTicks: [] as number[],
      xIndices: [] as number[],
    };

    const ys = data.map((d) => d.y);
    const rawMin = Math.min(...ys);
    const rawMax = Math.max(...ys);
    const padding = (rawMax - rawMin) * 0.12 || 1;
    const minY = rawMin - padding;
    const maxY = rawMax + padding;
    const range = maxY - minY;

    const toX = (i: number) => (i / (data.length - 1)) * chartWidth;
    const toY = (v: number) => chartHeight - ((v - minY) / range) * chartHeight;

    const points = data.map((d, i) => ({ cx: toX(i), cy: toY(d.y) }));

    // Smooth bezier path
    const pathParts: string[] = [];
    points.forEach((pt, i) => {
      if (i === 0) {
        pathParts.push(`M ${pt.cx} ${pt.cy}`);
      } else {
        const prev = points[i - 1];
        const cp1x = prev.cx + (pt.cx - prev.cx) / 3;
        const cp2x = pt.cx - (pt.cx - prev.cx) / 3;
        pathParts.push(`C ${cp1x} ${prev.cy} ${cp2x} ${pt.cy} ${pt.cx} ${pt.cy}`);
      }
    });

    // Fill area path
    const fillPath =
      pathParts.join(' ') +
      ` L ${toX(data.length - 1)} ${chartHeight} L ${toX(0)} ${chartHeight} Z`;

    // Trendline
    const { slope, intercept } = linearReg(data);
    const trendTx1 = toX(0);
    const trendTy1 = toY(intercept);
    const trendTx2 = toX(data.length - 1);
    const trendTy2 = toY(slope * (data.length - 1) + intercept);

    // Y ticks
    const step = (maxY - minY) / (Y_TICKS - 1);
    const yTicks = Array.from({ length: Y_TICKS }, (_, i) => minY + step * i).reverse();

    // X axis labels — evenly spaced, max MAX_X_LABELS
    const step2 = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));
    const xIndices = data.map((_, i) => i).filter((i) => i === 0 || i === data.length - 1 || i % step2 === 0);

    return {
      minY, maxY,
      points,
      trendPoints: { tx1: trendTx1, ty1: trendTy1, tx2: trendTx2, ty2: trendTy2 },
      yTicks,
      xIndices,
    };
  }, [data, chartWidth, chartHeight]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  const range = maxY - minY;
  const toX = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2);
  const toY = (v: number) => chartHeight - ((v - minY) / range) * chartHeight;

  // Paths
  const pathParts: string[] = [];
  points.forEach((pt, i) => {
    if (i === 0) {
      pathParts.push(`M ${pt.cx} ${pt.cy}`);
    } else {
      const prev = points[i - 1];
      const cp1x = prev.cx + (pt.cx - prev.cx) / 3;
      const cp2x = pt.cx - (pt.cx - prev.cx) / 3;
      pathParts.push(`C ${cp1x} ${prev.cy} ${cp2x} ${pt.cy} ${pt.cx} ${pt.cy}`);
    }
  });
  const linePath = pathParts.join(' ');
  const fillPath =
    linePath +
    ` L ${toX(data.length - 1)} ${chartHeight} L ${toX(0)} ${chartHeight} Z`;

  return (
    <View style={{ height, marginHorizontal: -4 }}>
      {/* Y-axis labels */}
      <View style={[StyleSheet.absoluteFill, { paddingLeft: 0, paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM }]}>
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
      </View>

      <Svg
        width={chartWidth + PAD_LEFT + PAD_RIGHT}
        height={height}
        style={{ marginLeft: 0 }}
      >
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <View>
          {/* Grid lines */}
          {yTicks.map((v, i) => (
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

          {/* Fill area */}
          <Path
            d={`M ${PAD_LEFT + (data.length > 1 ? 0 : chartWidth / 2)} ${PAD_TOP + toY(data[0].y)} ` + fillPath.slice(fillPath.indexOf(' '))}
            fill="url(#fill)"
          />

          {/* Trendline */}
          {showTrendline && data.length >= 3 && (
            <Line
              x1={PAD_LEFT + trendPoints.tx1}
              y1={PAD_TOP + trendPoints.ty1}
              x2={PAD_LEFT + trendPoints.tx2}
              y2={PAD_TOP + trendPoints.ty2}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="5,4"
              strokeOpacity={0.5}
            />
          )}

          {/* Line */}
          <Path
            d={`M ${PAD_LEFT + points[0].cx} ${PAD_TOP + points[0].cy}` + linePath.slice(linePath.indexOf(' '))}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((pt, i) => (
            <Circle
              key={i}
              cx={PAD_LEFT + pt.cx}
              cy={PAD_TOP + pt.cy}
              r={i === points.length - 1 ? 4.5 : 2.5}
              fill={i === points.length - 1 ? color : '#fff'}
              stroke={color}
              strokeWidth={2}
            />
          ))}

          {/* X-axis labels */}
          {xIndices.map((i) => (
            <SvgText
              key={i}
              x={PAD_LEFT + toX(i)}
              y={height - 6}
              fontSize={9}
              fill="#888"
              textAnchor="middle"
            >
              {xLabel(data[i].x)}
            </SvgText>
          ))}
        </View>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 13 },
  yLabel: { fontSize: 9, color: '#888' },
});
