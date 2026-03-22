/**
 * useHealthConnect
 *
 * Convenience hook that exposes glucose store state + actions alongside
 * derived UI-friendly properties (current reading color, trend arrow, etc.)
 */

import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useGlucoseStore } from '../stores/useGlucoseStore';
import healthService, { classifyGlucose } from '../services/healthService';
import type { GlucosePeriod, GlucoseTrend } from '../types/glucose';

// ─── Trend display helpers ────────────────────────────────────────────────────

export function trendArrow(trend?: GlucoseTrend): string {
  switch (trend) {
    case 'rising_rapidly':  return '↑↑';
    case 'rising':          return '↑';
    case 'flat':            return '→';
    case 'falling':         return '↓';
    case 'falling_rapidly': return '↓↓';
    default:                return '—';
  }
}

export function glucoseRangeColor(mgdl: number, colors: Record<string, string>): string {
  const range = classifyGlucose(mgdl);
  switch (range) {
    case 'very_low':  return colors.error   ?? '#EF4444';
    case 'low':       return '#F59E0B'; // amber
    case 'normal':    return colors.success ?? '#22C55E';
    case 'high':      return '#F59E0B'; // amber
    case 'very_high': return colors.error   ?? '#EF4444';
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHealthConnect() {
  const store = useGlucoseStore();

  /** Check platform availability once on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const available = await healthService.isAvailable();
      if (cancelled) return;

      const platform = Platform.OS === 'ios' ? 'apple_health' : 'health_connect';
      store.setConnection({
        platform: available ? platform : 'none',
      });
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(() => store.connectAsync(), [store]);

  const sync = useCallback(() => store.syncAsync(), [store]);

  const setPeriod = useCallback(
    (period: GlucosePeriod) => store.setSelectedPeriod(period),
    [store],
  );

  const currentReadings = store.readings[store.selectedPeriod];
  const lastReading = store.summary?.lastReading ?? null;

  return {
    // State
    readings: currentReadings,
    summary: store.summary,
    selectedPeriod: store.selectedPeriod,
    connection: store.connection,
    isSyncing: store.isSyncing,
    lastError: store.lastError,
    lastReading,

    // Derived
    isConnected: store.connection.permissionStatus === 'authorized',
    isAvailableOnPlatform: store.connection.platform !== 'none',
    platformLabel:
      store.connection.platform === 'apple_health'
        ? 'Apple Health'
        : store.connection.platform === 'health_connect'
        ? 'Health Connect'
        : null,

    // Actions
    connect,
    sync,
    setPeriod,
    clearReadings: store.clearReadings,
  };
}
