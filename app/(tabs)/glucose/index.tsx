/**
 * Glucose (CGM) Screen
 *
 * Pulls data from Apple HealthKit (iOS) or Health Connect (Android).
 * Features:
 *  - Last CGM reading with trend arrow + colour coding
 *  - Period selector: 24 h / 7 d / 14 d / 30 d
 *  - SVG glucose chart with coloured range bands
 *  - Time-in-Range bar chart
 *  - Estimated A1C (GMI)
 *  - Recent readings list
 *  - Pull-to-refresh
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Rect,
  Path,
  Circle,
  Line as SvgLine,
  Text as SvgText,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { useHealthConnect, trendArrow, glucoseRangeColor } from '../../../src/hooks/useHealthConnect';
import { classifyGlucose, mgdlToMmol } from '../../../src/services/healthService';
import type { GlucosePeriod, GlucoseReading } from '../../../src/types/glucose';

// ─── Layout constants ─────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get('window').width;
const CHART_H = 200;
const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;
const CHART_W = SCREEN_W - 32 - PAD_L - PAD_R; // card padding = 16 on each side

// Glucose axis min/max (mg/dL)
const G_MIN = 40;
const G_MAX = 280;
const G_RANGE = G_MAX - G_MIN;

// Zone band colours
const ZONE_COLORS = {
  veryLow:  '#EF444430',
  low:      '#F59E0B30',
  normal:   '#22C55E30',
  high:     '#F59E0B30',
  veryHigh: '#EF444430',
};
const ZONE_BORDERS = {
  veryLow:  '#EF4444',
  low:      '#F59E0B',
  normal:   '#22C55E',
  high:     '#F59E0B',
  veryHigh: '#EF4444',
};

const PERIODS: GlucosePeriod[] = ['24h', '7d', '14d', '30d'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toChartY(mgdl: number, chartH: number): number {
  const clamped = Math.max(G_MIN, Math.min(G_MAX, mgdl));
  return chartH - ((clamped - G_MIN) / G_RANGE) * chartH;
}

function formatTimestamp(iso: string, period: GlucosePeriod): string {
  const d = new Date(iso);
  if (period === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Glucose Chart ────────────────────────────────────────────────────────────

function GlucoseChart({
  readings,
  period,
  lineColor,
}: {
  readings: GlucoseReading[];
  period: GlucosePeriod;
  lineColor: string;
}) {
  const cH = CHART_H - PAD_T - PAD_B;
  const cW = CHART_W;

  const { points, linePath, xIndices } = useMemo(() => {
    if (readings.length < 2) {
      return { points: [], linePath: '', xIndices: [] as number[] };
    }
    const toX = (i: number) => (i / (readings.length - 1)) * cW;
    const pts = readings.map((r, i) => ({
      cx: toX(i),
      cy: toChartY(r.value, cH),
    }));

    const parts: string[] = [];
    pts.forEach((pt, i) => {
      if (i === 0) {
        parts.push(`M ${pt.cx} ${pt.cy}`);
      } else {
        const prev = pts[i - 1];
        const cpx = (prev.cx + pt.cx) / 2;
        parts.push(`C ${cpx} ${prev.cy} ${cpx} ${pt.cy} ${pt.cx} ${pt.cy}`);
      }
    });

    const step = Math.max(1, Math.ceil(readings.length / 6));
    const xIdx = readings
      .map((_, i) => i)
      .filter((i) => i === 0 || i === readings.length - 1 || i % step === 0);

    return { points: pts, linePath: parts.join(' '), xIndices: xIdx };
  }, [readings, cH, cW]);

  // Zone band Y coords (all in chart space)
  const yVeryLow  = toChartY(54, cH);
  const yLow      = toChartY(70, cH);
  const yHigh     = toChartY(140, cH);
  const yVeryHigh = toChartY(180, cH);

  return (
    <View style={{ height: CHART_H }}>
      {/* Y-axis labels */}
      {[G_MIN, 70, 100, 140, 180, G_MAX].map((v) => (
        <Text
          key={v}
          style={[
            styles.yLabel,
            { top: PAD_T + toChartY(v, cH) - 7 },
          ]}
        >
          {v}
        </Text>
      ))}

      <Svg
        width={cW + PAD_L + PAD_R}
        height={CHART_H}
        style={{ position: 'absolute', left: 0 }}
      >
        {/* ── Zone bands ────────────────────────────────────────────── */}
        {/* Very High (> 180) */}
        <Rect
          x={PAD_L} y={PAD_T}
          width={cW} height={yVeryHigh}
          fill={ZONE_COLORS.veryHigh}
        />
        {/* High (140–180) */}
        <Rect
          x={PAD_L} y={PAD_T + yVeryHigh}
          width={cW} height={yHigh - yVeryHigh}
          fill={ZONE_COLORS.high}
        />
        {/* Normal (70–140) */}
        <Rect
          x={PAD_L} y={PAD_T + yHigh}
          width={cW} height={yLow - yHigh}
          fill={ZONE_COLORS.normal}
        />
        {/* Low (54–70) */}
        <Rect
          x={PAD_L} y={PAD_T + yLow}
          width={cW} height={yVeryLow - yLow}
          fill={ZONE_COLORS.low}
        />
        {/* Very Low (< 54) */}
        <Rect
          x={PAD_L} y={PAD_T + yVeryLow}
          width={cW} height={cH - yVeryLow}
          fill={ZONE_COLORS.veryLow}
        />

        {/* ── Zone boundary lines ───────────────────────────────────── */}
        {[yLow, yHigh, yVeryHigh].map((y, i) => (
          <SvgLine
            key={i}
            x1={PAD_L} y1={PAD_T + y}
            x2={PAD_L + cW} y2={PAD_T + y}
            stroke="#33333340"
            strokeWidth={1}
            strokeDasharray="4,3"
          />
        ))}

        {/* ── Glucose line ──────────────────────────────────────────── */}
        {linePath ? (
          <Path
            d={`M ${PAD_L + points[0].cx} ${PAD_T + points[0].cy}` +
               linePath.slice(linePath.indexOf(' '))}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* ── Data points ───────────────────────────────────────────── */}
        {points.map((pt, i) => {
          const reading = readings[i];
          const isLast = i === points.length - 1;
          const dotColor = glucoseRangeColor(reading.value, {
            error: '#EF4444',
            success: '#22C55E',
          });
          return (
            <Circle
              key={i}
              cx={PAD_L + pt.cx}
              cy={PAD_T + pt.cy}
              r={isLast ? 5.5 : readings.length > 48 ? 0 : 2.5}
              fill={isLast ? dotColor : '#fff'}
              stroke={dotColor}
              strokeWidth={2}
            />
          );
        })}

        {/* ── X-axis labels ─────────────────────────────────────────── */}
        {xIndices.map((i) => {
          const x = PAD_L + (readings.length > 1 ? (i / (readings.length - 1)) * cW : cW / 2);
          return (
            <SvgText
              key={i}
              x={x}
              y={CHART_H - 8}
              fontSize={9}
              fill="#888"
              textAnchor="middle"
            >
              {formatTimestamp(readings[i].timestamp, period)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Time-in-Range Bar ────────────────────────────────────────────────────────

function TimeInRangeBar({
  tir,
  colors,
}: {
  tir: { veryLow: number; low: number; normal: number; high: number; veryHigh: number };
  colors: any;
}) {
  const segments = [
    { key: 'veryHigh', value: tir.veryHigh, color: '#EF4444', label: '>180' },
    { key: 'high',     value: tir.high,     color: '#F59E0B', label: '140-180' },
    { key: 'normal',   value: tir.normal,   color: '#22C55E', label: '70-140' },
    { key: 'low',      value: tir.low,      color: '#F59E0B', label: '54-70' },
    { key: 'veryLow',  value: tir.veryLow,  color: '#EF4444', label: '<54' },
  ];

  return (
    <View>
      {/* Stacked bar */}
      <View style={{ flexDirection: 'row', height: 24, borderRadius: 6, overflow: 'hidden' }}>
        {segments.map((s) =>
          s.value > 0 ? (
            <View key={s.key} style={{ flex: s.value, backgroundColor: s.color }} />
          ) : null,
        )}
      </View>
      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
        {segments.map((s) => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {s.label}: {s.value}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GlucoseScreen() {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { t } = useTranslation();

  const {
    readings,
    summary,
    selectedPeriod,
    connection,
    isSyncing,
    lastError,
    lastReading,
    isConnected,
    isAvailableOnPlatform,
    platformLabel,
    connect,
    sync,
    setPeriod,
  } = useHealthConnect();

  const onRefresh = useCallback(() => {
    if (isConnected) sync();
  }, [isConnected, sync]);

  const lastReadingColor = lastReading
    ? glucoseRangeColor(lastReading.value, colors as any)
    : colors.textSecondary;

  // Thin the readings for display if there are too many (keep ≤ 288 pts for chart)
  const chartReadings = useMemo(() => {
    if (readings.length <= 288) return readings;
    const step = Math.ceil(readings.length / 288);
    return readings.filter((_, i) => i % step === 0);
  }, [readings]);

  const recentReadings = useMemo(() => readings.slice(-20).reverse(), [readings]);

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    syncBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
    },
    syncBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    periodRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    periodBtn: {
      flex: 1,
      paddingVertical: spacing.xs + 2,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    periodBtnActive: { backgroundColor: colors.primary },
    periodBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    periodBtnTextActive: { color: '#fff' },
    bigReading: { fontSize: 64, fontWeight: '800', lineHeight: 72 },
    trendArrow: { fontSize: 28, fontWeight: '700', marginLeft: 8, alignSelf: 'flex-end', marginBottom: 4 },
    unitLabel: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
    rangeLabel: { fontSize: 14, marginTop: 4, fontWeight: '600' },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    connectCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: spacing.xl,
      marginHorizontal: spacing.lg,
      alignItems: 'center',
      gap: spacing.md,
    },
    connectIcon: { fontSize: 52 },
    connectTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
    connectSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    connectBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    unavailableText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    recentDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
    recentValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    recentUnit: { fontSize: 12, color: colors.textSecondary, marginLeft: 3 },
    recentTime: { fontSize: 12, color: colors.textSecondary, marginLeft: 'auto' },
    errorText: { color: colors.error, fontSize: 13, textAlign: 'center', marginTop: spacing.xs },
    syncedAt: { fontSize: 11, color: colors.textTertiary, textAlign: 'center', marginTop: 4 },
  });

  // ── Not connected / not available ──────────────────────────────────────────
  if (!isConnected) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>{t('glucose.title', 'Glucose')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
        >
          <View style={s.connectCard}>
            <Text style={s.connectIcon}>🩸</Text>
            <Text style={s.connectTitle}>
              {t('glucose.connectTitle', 'Connect to CGM Data')}
            </Text>

            {isAvailableOnPlatform ? (
              <>
                <Text style={s.connectSubtitle}>
                  {t(
                    'glucose.connectSubtitle',
                    'FitMaster Pro can read your continuous glucose monitor data from {{platform}}. Connect to see real-time readings, trends, and time-in-range analysis.',
                    { platform: platformLabel ?? '' },
                  )}
                </Text>

                {connection.permissionStatus === 'denied' && (
                  <Text style={s.errorText}>
                    {t(
                      'glucose.permissionDenied',
                      'Permission denied. Enable Health access in your device settings.',
                    )}
                  </Text>
                )}

                <TouchableOpacity
                  style={s.connectBtn}
                  activeOpacity={0.8}
                  onPress={connect}
                >
                  <Text style={s.connectBtnText}>
                    {t('glucose.connectBtn', 'Connect {{platform}}', {
                      platform: platformLabel ?? '',
                    })}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={s.unavailableText}>
                {Platform.OS === 'ios'
                  ? t('glucose.unavailableIos', 'Apple Health is not available on this device.')
                  : t(
                      'glucose.unavailableAndroid',
                      'Health Connect is not installed. Install it from the Play Store to sync CGM data.',
                    )}
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Connected: show data ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>{t('glucose.title', 'Glucose')}</Text>
          {connection.lastSyncedAt && (
            <Text style={s.syncedAt}>
              {t('glucose.lastSynced', 'Synced {{time}}', {
                time: formatRelative(connection.lastSyncedAt),
              })}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={s.syncBtn}
          activeOpacity={0.7}
          onPress={sync}
          disabled={isSyncing}
        >
          <Text style={s.syncBtnText}>
            {isSyncing
              ? t('glucose.syncing', 'Syncing…')
              : t('glucose.refresh', 'Refresh')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Last Reading ──────────────────────────────────────────── */}
        {lastReading && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>
              {t('glucose.currentReading', 'Current Reading')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={[s.bigReading, { color: lastReadingColor }]}>
                {lastReading.value}
              </Text>
              {lastReading.trend && (
                <Text style={[s.trendArrow, { color: lastReadingColor }]}>
                  {trendArrow(lastReading.trend)}
                </Text>
              )}
            </View>
            <Text style={s.unitLabel}>mg/dL · {mgdlToMmol(lastReading.value)} mmol/L</Text>
            <Text style={[s.rangeLabel, { color: lastReadingColor }]}>
              {t(
                `glucose.range.${classifyGlucose(lastReading.value)}`,
                classifyGlucose(lastReading.value).replace('_', ' '),
              )}
            </Text>
            <Text style={[s.syncedAt, { textAlign: 'left', marginTop: 6 }]}>
              {formatRelative(lastReading.timestamp)}
            </Text>
          </View>
        )}

        {/* ── Period selector ───────────────────────────────────────── */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.periodBtn, selectedPeriod === p && s.periodBtnActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.8}
            >
              <Text style={[s.periodBtnText, selectedPeriod === p && s.periodBtnTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Chart ─────────────────────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            {t('glucose.glucoseTrend', 'Glucose Trend')}
          </Text>
          {chartReadings.length >= 2 ? (
            <GlucoseChart
              readings={chartReadings}
              period={selectedPeriod}
              lineColor={colors.primary}
            />
          ) : (
            <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {t('glucose.noReadings', 'No readings for this period')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        {summary && summary.readingsCount > 0 && (
          <View style={s.card}>
            <View style={s.statRow}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{summary.average}</Text>
                <Text style={s.statLabel}>{t('glucose.average', 'Avg mg/dL')}</Text>
              </View>
              <View style={[s.statBox, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                <Text style={[s.statValue, { color: '#22C55E' }]}>
                  {summary.timeInRange.normal}%
                </Text>
                <Text style={s.statLabel}>{t('glucose.timeInRange', 'Time in Range')}</Text>
              </View>
              {summary.estimatedA1C !== undefined && (
                <View style={[s.statBox, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                  <Text style={s.statValue}>{summary.estimatedA1C}%</Text>
                  <Text style={s.statLabel}>{t('glucose.estA1C', 'Est. A1C (GMI)')}</Text>
                </View>
              )}
            </View>
            <Text style={[s.syncedAt, { marginTop: 8 }]}>
              {summary.readingsCount}{' '}
              {t('glucose.readingsCount', 'readings over {{period}}', {
                period: selectedPeriod,
              })}
            </Text>
          </View>
        )}

        {/* ── Time in Range ─────────────────────────────────────────── */}
        {summary && summary.readingsCount > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>
              {t('glucose.timeInRangeTitle', 'Time in Range')}
            </Text>
            <TimeInRangeBar tir={summary.timeInRange} colors={colors} />
          </View>
        )}

        {/* ── Recent Readings ───────────────────────────────────────── */}
        {recentReadings.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>
              {t('glucose.recentReadings', 'Recent Readings')}
            </Text>
            {recentReadings.map((r, i) => {
              const dotColor = glucoseRangeColor(r.value, colors as any);
              return (
                <View
                  key={r.id}
                  style={[
                    s.recentRow,
                    i === recentReadings.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[s.recentDot, { backgroundColor: dotColor }]} />
                  <Text style={s.recentValue}>{r.value}</Text>
                  <Text style={s.recentUnit}>mg/dL</Text>
                  {r.trend && (
                    <Text style={{ color: dotColor, fontSize: 14, marginLeft: 6, fontWeight: '600' }}>
                      {trendArrow(r.trend)}
                    </Text>
                  )}
                  <Text style={s.recentTime}>{formatRelative(r.timestamp)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Error */}
        {lastError && <Text style={s.errorText}>{lastError}</Text>}

        {/* Bottom padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  yLabel: {
    position: 'absolute',
    left: 2,
    width: 36,
    fontSize: 9,
    color: '#888',
    textAlign: 'right',
  },
});
