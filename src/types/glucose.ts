/**
 * Glucose / CGM types
 *
 * All glucose values are stored in mg/dL internally.
 * Conversion: 1 mmol/L = 18.016 mg/dL
 *
 * Standard ranges (ADA 2024):
 *   Very Low  : < 54 mg/dL
 *   Low       : 54 – 69 mg/dL
 *   Normal    : 70 – 140 mg/dL  ← target "Time in Range"
 *   High      : 141 – 180 mg/dL
 *   Very High : > 180 mg/dL
 */

export type GlucoseUnit = 'mg/dL' | 'mmol/L';

/** CGM arrow-trend as reported by Dexcom / Libre / HealthKit */
export type GlucoseTrend =
  | 'rising_rapidly'   // > +3 mg/dL/min
  | 'rising'           // +1 to +3 mg/dL/min
  | 'flat'             // -1 to +1 mg/dL/min
  | 'falling'          // -3 to -1 mg/dL/min
  | 'falling_rapidly'  // < -3 mg/dL/min
  | 'unknown';

export type GlucoseRange = 'very_low' | 'low' | 'normal' | 'high' | 'very_high';

export type GlucosePeriod = '24h' | '7d' | '14d' | '30d';

/** Single CGM or fingerstick reading */
export interface GlucoseReading {
  id: string;
  /** Value in mg/dL */
  value: number;
  timestamp: string; // ISO 8601
  trend?: GlucoseTrend;
  /** e.g. "Dexcom G7", "Libre 3", "Apple Health", "Health Connect" */
  source?: string;
}

/**
 * Time-in-range breakdown for a set of readings.
 * Each field is a percentage (0–100) summing to ≈ 100.
 */
export interface TimeInRange {
  veryLow: number;  // < 54 mg/dL
  low: number;      // 54–69 mg/dL
  normal: number;   // 70–140 mg/dL
  high: number;     // 141–180 mg/dL
  veryHigh: number; // > 180 mg/dL
}

/** Aggregated stats for a given period */
export interface GlucoseSummary {
  period: GlucosePeriod;
  readingsCount: number;
  average: number;             // mg/dL
  /** Calculated as (average_mg_dL + 46.7) / 28.7 — GMI formula */
  estimatedA1C?: number;
  timeInRange: TimeInRange;
  lastReading: GlucoseReading | null;
}

/** Permission / connection state */
export type HealthPermissionStatus =
  | 'authorized'
  | 'denied'
  | 'not_determined'
  | 'unavailable';

/** Which platform health store the app is connected to */
export type HealthPlatform = 'apple_health' | 'health_connect' | 'none';

/** Persisted connection config */
export interface HealthConnectionConfig {
  platform: HealthPlatform;
  permissionStatus: HealthPermissionStatus;
  lastSyncedAt: string | null;
}
