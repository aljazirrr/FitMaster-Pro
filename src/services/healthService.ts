/**
 * HealthService — unified HealthKit (iOS) + Health Connect (Android) abstraction
 *
 * Native module requirements:
 *   iOS   : react-native-health ^1.19  (needs HealthKit entitlement in app.json)
 *   Android: react-native-health-connect ^3.5  (needs plugin in app.json)
 *
 * Both packages require a custom dev build; they are NOT available in Expo Go.
 * When the native module is absent the service falls back to returning empty arrays
 * and reporting "unavailable" so the UI can display a "set up" prompt instead of crashing.
 */

import { Platform } from 'react-native';
import type {
  GlucoseReading,
  GlucoseSummary,
  GlucosePeriod,
  HealthPermissionStatus,
  HealthPlatform,
  TimeInRange,
} from '../types/glucose';

// ─── Constants ────────────────────────────────────────────────────────────────

const MMOL_TO_MGDL = 18.016;

/** ms offsets for each period */
const PERIOD_MS: Record<GlucosePeriod, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d':  7  * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// ─── Lazy native module loaders ───────────────────────────────────────────────

function loadHealthKit(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-health').default;
  } catch {
    return null;
  }
}

function loadHealthConnect(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-health-connect');
  } catch {
    return null;
  }
}

// ─── Glucose range helpers ────────────────────────────────────────────────────

export function classifyGlucose(mgdl: number): 'very_low' | 'low' | 'normal' | 'high' | 'very_high' {
  if (mgdl < 54) return 'very_low';
  if (mgdl < 70) return 'low';
  if (mgdl <= 140) return 'normal';
  if (mgdl <= 180) return 'high';
  return 'very_high';
}

export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / MMOL_TO_MGDL) * 10) / 10;
}

export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * MMOL_TO_MGDL);
}

/** Glucose Management Indicator (GMI) from average mg/dL — approximates HbA1c */
export function calcEstimatedA1C(avgMgdl: number): number {
  return Math.round(((avgMgdl + 46.7) / 28.7) * 10) / 10;
}

export function calcTimeInRange(readings: GlucoseReading[]): TimeInRange {
  if (readings.length === 0) {
    return { veryLow: 0, low: 0, normal: 0, high: 0, veryHigh: 0 };
  }
  const counts = { veryLow: 0, low: 0, normal: 0, high: 0, veryHigh: 0 };
  for (const r of readings) {
    const range = classifyGlucose(r.value);
    if (range === 'very_low') counts.veryLow++;
    else if (range === 'low') counts.low++;
    else if (range === 'normal') counts.normal++;
    else if (range === 'high') counts.high++;
    else counts.veryHigh++;
  }
  const total = readings.length;
  return {
    veryLow:  Math.round((counts.veryLow  / total) * 100),
    low:      Math.round((counts.low      / total) * 100),
    normal:   Math.round((counts.normal   / total) * 100),
    high:     Math.round((counts.high     / total) * 100),
    veryHigh: Math.round((counts.veryHigh / total) * 100),
  };
}

export function summarizeReadings(
  readings: GlucoseReading[],
  period: GlucosePeriod,
): GlucoseSummary {
  if (readings.length === 0) {
    return {
      period,
      readingsCount: 0,
      average: 0,
      timeInRange: { veryLow: 0, low: 0, normal: 0, high: 0, veryHigh: 0 },
      lastReading: null,
    };
  }
  const sum = readings.reduce((acc, r) => acc + r.value, 0);
  const average = Math.round(sum / readings.length);
  const sorted = [...readings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return {
    period,
    readingsCount: readings.length,
    average,
    estimatedA1C: calcEstimatedA1C(average),
    timeInRange: calcTimeInRange(readings),
    lastReading: sorted[0] ?? null,
  };
}

// ─── Platform detection ────────────────────────────────────────────────────────

export function getHealthPlatform(): HealthPlatform {
  if (Platform.OS === 'ios') return 'apple_health';
  if (Platform.OS === 'android') return 'health_connect';
  return 'none';
}

// ─── iOS HealthKit implementation ─────────────────────────────────────────────

async function iosCheckAvailable(): Promise<boolean> {
  const HK = loadHealthKit();
  if (!HK) return false;
  return new Promise((resolve) => {
    HK.isAvailable((err: Error | null, available: boolean) => {
      resolve(!err && available);
    });
  });
}

async function iosRequestPermissions(): Promise<HealthPermissionStatus> {
  const HK = loadHealthKit();
  if (!HK) return 'unavailable';

  const permissions = {
    permissions: {
      read: [
        HK.Constants.Permissions.BloodGlucose,
        HK.Constants.Permissions.StepCount,
      ],
      write: [],
    },
  };

  return new Promise((resolve) => {
    HK.initHealthKit(permissions, (err: Error | null) => {
      if (err) {
        resolve('denied');
      } else {
        resolve('authorized');
      }
    });
  });
}

async function iosGetGlucoseReadings(
  startDate: Date,
  endDate: Date,
): Promise<GlucoseReading[]> {
  const HK = loadHealthKit();
  if (!HK) return [];

  const options = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    ascending: true,
    limit: 2000,
  };

  return new Promise((resolve) => {
    HK.getBloodGlucoseSamples(options, (err: Error | null, results: any[]) => {
      if (err || !Array.isArray(results)) {
        resolve([]);
        return;
      }
      const readings: GlucoseReading[] = results.map((r) => ({
        id: r.id ?? `hk-${r.startDate}`,
        // HealthKit returns mg/dL by default
        value: Math.round(r.value),
        timestamp: r.startDate,
        source: r.sourceName ?? 'Apple Health',
      }));
      resolve(readings);
    });
  });
}

// ─── Android Health Connect implementation ────────────────────────────────────

async function androidCheckAvailable(): Promise<boolean> {
  const HC = loadHealthConnect();
  if (!HC) return false;
  try {
    const status = await HC.getSdkStatus();
    return status === HC.SdkAvailabilityStatus?.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

async function androidRequestPermissions(): Promise<HealthPermissionStatus> {
  const HC = loadHealthConnect();
  if (!HC) return 'unavailable';

  try {
    await HC.initialize();
    const granted: any[] = await HC.requestPermission([
      { accessType: 'read', recordType: 'BloodGlucose' },
      { accessType: 'read', recordType: 'Steps' },
    ]);
    const hasBloodGlucose = granted.some(
      (p) => p.recordType === 'BloodGlucose' && p.accessType === 'read',
    );
    return hasBloodGlucose ? 'authorized' : 'denied';
  } catch {
    return 'denied';
  }
}

async function androidGetGlucoseReadings(
  startDate: Date,
  endDate: Date,
): Promise<GlucoseReading[]> {
  const HC = loadHealthConnect();
  if (!HC) return [];

  try {
    await HC.initialize();
    const result = await HC.readRecords('BloodGlucose', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    const records: any[] = result?.records ?? result ?? [];
    return records.map((r) => ({
      id: r.metadata?.id ?? `hc-${r.time}`,
      // Health Connect uses mmol/L — convert to mg/dL
      value: mmolToMgdl(r.level?.inMillimolesPerLiter ?? 0),
      timestamp: r.time,
      source: r.metadata?.dataOrigin?.packageName ?? 'Health Connect',
    }));
  } catch {
    return [];
  }
}

// ─── Steps — iOS ──────────────────────────────────────────────────────────────

async function iosGetStepsToday(): Promise<number> {
  const HK = loadHealthKit();
  if (!HK) return 0;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  return new Promise((resolve) => {
    HK.getStepCount(
      { date: now.toISOString(), includeManuallyAdded: true },
      (err: Error | null, result: { value: number }) => {
        if (err || result == null) {
          // Fallback: sum step samples for today
          HK.getDailyStepCountSamples(
            {
              startDate: startOfDay.toISOString(),
              endDate: now.toISOString(),
            },
            (e: Error | null, samples: Array<{ value: number }>) => {
              if (e || !Array.isArray(samples)) {
                resolve(0);
                return;
              }
              resolve(samples.reduce((sum, s) => sum + (s.value ?? 0), 0));
            },
          );
        } else {
          resolve(Math.round(result.value ?? 0));
        }
      },
    );
  });
}

// ─── Steps — Android ──────────────────────────────────────────────────────────

async function androidGetStepsToday(): Promise<number> {
  const HC = loadHealthConnect();
  if (!HC) return 0;

  try {
    await HC.initialize();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const result = await HC.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      },
    });

    const records: any[] = result?.records ?? result ?? [];
    return records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
  } catch {
    return 0;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const healthService = {
  /** True if the platform's health store is present on this device */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'ios') return iosCheckAvailable();
    if (Platform.OS === 'android') return androidCheckAvailable();
    return false;
  },

  /** Request blood glucose + step count read permissions */
  async requestPermissions(): Promise<HealthPermissionStatus> {
    if (Platform.OS === 'ios') return iosRequestPermissions();
    if (Platform.OS === 'android') return androidRequestPermissions();
    return 'unavailable';
  },

  /** Request only step count permission (for activity tracking without CGM).
   *  MUST be called from a user interaction (button press) on Android. */
  async requestStepsPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const HK = loadHealthKit();
      if (!HK) return false;
      const permissions = {
        permissions: {
          read: [HK.Constants.Permissions.StepCount],
          write: [],
        },
      };
      return new Promise((resolve) => {
        HK.initHealthKit(permissions, (err: Error | null) => resolve(!err));
      });
    }
    if (Platform.OS === 'android') {
      const HC = loadHealthConnect();
      if (!HC) return false;
      try {
        // Check availability before doing anything — avoids native crash when
        // Health Connect is not installed (Android 9–13 without the HC app).
        const status = await HC.getSdkStatus();
        const isAvailable =
          status === HC.SdkAvailabilityStatus?.SDK_AVAILABLE ||
          status === 3; // SDK_AVAILABLE numeric fallback
        if (!isAvailable) return false;

        await HC.initialize();
        const granted: any[] = await HC.requestPermission([
          { accessType: 'read', recordType: 'Steps' },
        ]);
        return Array.isArray(granted) &&
          granted.some((p) => p.recordType === 'Steps' && p.accessType === 'read');
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Fetch glucose readings for a period ending now.
   * Returns readings sorted oldest-first in mg/dL.
   */
  async getGlucoseReadings(period: GlucosePeriod): Promise<GlucoseReading[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - PERIOD_MS[period]);

    let readings: GlucoseReading[] = [];
    if (Platform.OS === 'ios') {
      readings = await iosGetGlucoseReadings(startDate, endDate);
    } else if (Platform.OS === 'android') {
      readings = await androidGetGlucoseReadings(startDate, endDate);
    }

    // Sort oldest-first for charting
    return readings.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  },

  /** Convenience: fetch readings AND compute summary stats */
  async getGlucoseSummary(period: GlucosePeriod): Promise<GlucoseSummary> {
    const readings = await this.getGlucoseReadings(period);
    return summarizeReadings(readings, period);
  },

  /** Fetch total step count for today (midnight → now). Returns 0 if unavailable. */
  async getStepsToday(): Promise<number> {
    if (Platform.OS === 'ios') return iosGetStepsToday();
    if (Platform.OS === 'android') return androidGetStepsToday();
    return 0;
  },
};

export default healthService;
