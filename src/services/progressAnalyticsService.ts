/**
 * progressAnalyticsService
 *
 * Combines local math (linear regression, statistics) with Claude claude-opus-4-6
 * to produce rich, personalised progress insights.
 */
import { callAI } from './aiServerClient';
import type { BodyMeasurements, FitnessGoal } from '../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeightEntry {
  date: string;  // ISO date YYYY-MM-DD
  value: number; // kg
}

export interface MeasurementEntry {
  date: string;
  measurements: BodyMeasurements;
}

export type ProgressTrend = 'positive' | 'plateau' | 'negative';

export interface AIProgressInsights {
  /** 2-3 sentence personalised analysis */
  summary: string;
  /** Overall trajectory */
  trend: ProgressTrend;
  /** Average kg change per week (negative = weight loss) */
  weeklyRate: number;
  /** Estimated ISO date to reach target (null if no target or not enough data) */
  projectedGoalDate: string | null;
  /** Estimated days remaining to reach target */
  daysToGoal: number | null;
  /** 2-3 actionable recommendations */
  recommendations: string[];
  /** Data quality score 0–100 based on log frequency */
  consistencyScore: number;
  /** ISO timestamp when insights were generated */
  generatedAt: string;
}

export interface AnalyticsInput {
  weightEntries: WeightEntry[];
  measurementEntries?: MeasurementEntry[];
  goal?: FitnessGoal;
  targetWeightKg?: number;
  language?: 'en' | 'ro';
}

// ─── Local math helpers ───────────────────────────────────────────────────────

/**
 * Simple linear regression over (dayIndex, weight) pairs.
 * Returns { slope (kg/day), intercept, r2 }.
 */
export function linearRegression(entries: WeightEntry[]): {
  slope: number;
  intercept: number;
  r2: number;
  startDay: number;
} {
  if (entries.length < 2) return { slope: 0, intercept: entries[0]?.value ?? 0, r2: 0, startDay: 0 };

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startMs = new Date(sorted[0].date).getTime();
  const startDay = startMs / 86_400_000;

  const xs = sorted.map((e) => new Date(e.date).getTime() / 86_400_000 - startDay);
  const ys = sorted.map((e) => e.value);
  const n = xs.length;

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0, startDay };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R²
  const yMean = sumY / n;
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2, startDay };
}

/**
 * Predict the date (ISO string) when linear trend reaches targetWeight.
 * Returns null if the target is already passed or the trend is moving away.
 */
export function predictGoalDate(
  entries: WeightEntry[],
  targetWeightKg: number,
): { date: string | null; daysFromNow: number | null } {
  if (entries.length < 3) return { date: null, daysFromNow: null };

  const { slope, intercept, startDay } = linearRegression(entries);

  // Slope must be heading toward target
  const currentLatest = entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0].value;
  const movingTowardTarget = slope < 0 ? targetWeightKg < currentLatest : targetWeightKg > currentLatest;
  if (!movingTowardTarget || slope === 0) return { date: null, daysFromNow: null };

  // targetWeight = slope * daysFromStart + intercept → daysFromStart = (target - intercept) / slope
  const daysFromStart = (targetWeightKg - intercept) / slope;
  const goalDateMs = (startDay + daysFromStart) * 86_400_000;
  const nowMs = Date.now();
  const daysFromNow = Math.ceil((goalDateMs - nowMs) / 86_400_000);

  if (daysFromNow < 0 || daysFromNow > 3650) return { date: null, daysFromNow: null };

  const goalDate = new Date(goalDateMs).toISOString().split('T')[0];
  return { date: goalDate, daysFromNow };
}

/**
 * Calculate the average weekly rate of weight change.
 */
export function weeklyRate(entries: WeightEntry[]): number {
  const { slope } = linearRegression(entries);
  return Math.round(slope * 7 * 100) / 100; // kg/week, 2 dp
}

/**
 * Calculate a consistency score 0–100 based on log frequency.
 * Perfect = daily. Score drops for missed days.
 */
export function consistencyScore(entries: WeightEntry[]): number {
  if (entries.length < 2) return entries.length === 1 ? 50 : 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const totalDays = Math.round(
    (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) /
      86_400_000,
  );
  if (totalDays === 0) return 100;
  // Max score if logging at least once a week
  const targetLogs = Math.ceil(totalDays / 7);
  const score = Math.min(100, Math.round((entries.length / targetLogs) * 100));
  return score;
}

/**
 * Classify the trend from the linear regression slope.
 */
export function classifyTrend(
  slope: number,
  goal: FitnessGoal | undefined,
): ProgressTrend {
  const absSlope = Math.abs(slope);
  if (absSlope < 0.03) return 'plateau'; // < ~0.2 kg/week
  if (goal === 'lose_weight') return slope < 0 ? 'positive' : 'negative';
  if (goal === 'build_muscle') return slope > 0 ? 'positive' : 'negative';
  return slope < 0 ? 'positive' : 'negative'; // default: losing weight is positive
}

function formatEntries(entries: WeightEntry[]): string {
  return entries
    .slice(-10)
    .map((e) => `${e.date}: ${e.value}kg`)
    .join(', ');
}

function measurementDelta(entries: MeasurementEntry[]): string {
  if (entries.length < 2) return 'No comparison available';
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const oldest = sorted[0].measurements;
  const newest = sorted[sorted.length - 1].measurements;
  const lines: string[] = [];
  if (oldest.waist && newest.waist) lines.push(`waist ${oldest.waist}→${newest.waist}cm`);
  if (oldest.chest && newest.chest) lines.push(`chest ${oldest.chest}→${newest.chest}cm`);
  if (oldest.biceps && newest.biceps) lines.push(`biceps ${oldest.biceps}→${newest.biceps}cm`);
  return lines.join(', ') || 'No changes recorded';
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate comprehensive AI progress insights using Claude claude-opus-4-6.
 *
 * Falls back gracefully if the API call fails or data is insufficient.
 */
export async function generateProgressInsights(
  input: AnalyticsInput,
): Promise<AIProgressInsights> {
  const { weightEntries, measurementEntries = [], goal, targetWeightKg, language = 'en' } = input;

  // ── Local math ────────────────────────────────────────────────────────────
  const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalChange = last ? +(last.value - (first?.value ?? last.value)).toFixed(1) : 0;
  const rate = weightEntries.length >= 2 ? weeklyRate(weightEntries) : 0;
  const { slope } = linearRegression(weightEntries);
  const trend = classifyTrend(slope, goal);
  const consistency = consistencyScore(weightEntries);
  const { date: projectedDate, daysFromNow } = targetWeightKg
    ? predictGoalDate(weightEntries, targetWeightKg)
    : { date: null, daysFromNow: null };

  // ── AI prompt ────────────────────────────────────────────────────────────
  const goalStr = goal ?? 'general fitness';
  const targetStr = targetWeightKg ? `Target: ${targetWeightKg}kg` : 'No specific target set';
  const predStr = projectedDate
    ? `Predicted to reach target on ${projectedDate} (${daysFromNow} days)`
    : 'Target date cannot be predicted with current data';
  const measStr = measurementEntries.length >= 2 ? measurementDelta(measurementEntries) : 'No measurements';

  const prompt =
    language === 'ro'
      ? `Ești un analist de fitness expert. Analizează progresul utilizatorului:

Ultimele 10 înregistrări de greutate: ${formatEntries(sorted)}
Schimbare totală: ${totalChange}kg
Ritm mediu: ${rate}kg/săptămână
Trend: ${trend}
Scor consistență: ${consistency}/100
Obiectiv: ${goalStr}
${targetStr}
${predStr}
Măsurători: ${measStr}

Răspunde NUMAI cu un JSON valid (fără text extra) cu această structură exactă:
{
  "summary": "2-3 propoziții în română care analizează progresul",
  "recommendations": ["sfat 1", "sfat 2", "sfat 3"]
}`
      : `You are an expert fitness analyst. Analyze the user's progress:

Last 10 weight entries: ${formatEntries(sorted)}
Total change: ${totalChange}kg
Average rate: ${rate}kg/week
Trend: ${trend}
Consistency score: ${consistency}/100
Goal: ${goalStr}
${targetStr}
${predStr}
Measurements: ${measStr}

Reply ONLY with valid JSON (no extra text) matching this exact structure:
{
  "summary": "2-3 personalised sentences analyzing their progress",
  "recommendations": ["tip 1", "tip 2", "tip 3"]
}`;

  // ── Claude call ───────────────────────────────────────────────────────────
  let summary = '';
  let recommendations: string[] = [];

  try {
    let raw = (await callAI('/ai/progress-insights', { prompt }, 60_000)).trim();
    const fenceMatch = raw.match(/```(?:json)?\n?([\s\S]*?)```/);
    if (fenceMatch) raw = fenceMatch[1].trim();
    const parsed = JSON.parse(raw) as { summary?: string; recommendations?: string[] };
    summary = parsed.summary ?? '';
    recommendations = parsed.recommendations ?? [];
  } catch {
    // Use generic fallback
  }

  // Fallback text if AI failed
  if (!summary) {
    summary =
      language === 'ro'
        ? `Ai înregistrat o schimbare de ${totalChange}kg cu un ritm de ${rate}kg/săptămână. ${trend === 'positive' ? 'Ești pe drumul cel bun!' : trend === 'plateau' ? 'Progresul a stagnat — poate fi momentul să ajustezi ceva.' : 'Trendul nu merge în direcția dorită.'}`
        : `You've recorded a ${totalChange}kg change at ${rate}kg/week. ${trend === 'positive' ? 'You are on track!' : trend === 'plateau' ? 'Progress has stalled — consider adjusting your approach.' : 'The trend is not moving in the desired direction.'}`;
  }
  if (recommendations.length === 0) {
    recommendations =
      language === 'ro'
        ? ['Menține consistența logurilor zilnice', 'Asigură-te că bei suficientă apă', 'Somnul de calitate accelerează progresul']
        : ['Maintain consistency with daily logging', 'Ensure adequate hydration', 'Quality sleep accelerates progress'];
  }

  return {
    summary,
    trend,
    weeklyRate: rate,
    projectedGoalDate: projectedDate,
    daysToGoal: daysFromNow,
    recommendations: recommendations.slice(0, 3),
    consistencyScore: consistency,
    generatedAt: new Date().toISOString(),
  };
}
