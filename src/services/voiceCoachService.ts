/**
 * voiceCoachService
 *
 * Two-tier coaching approach:
 *
 *  Tier 1 — Instant (static pool):
 *    Set completion, rest reminders, PR detection.
 *    No network latency — best UX during active lifts.
 *
 *  Tier 2 — AI (Claude claude-opus-4-6):
 *    Workout summary at the end, on-demand coaching insights.
 *    Context-aware, personalised. Called asynchronously.
 */
import { callAI } from './aiServerClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetCompletionContext {
  exerciseName: string;
  setIndex: number;       // 0-based
  weight: number;         // kg
  reps: number;
  isPR?: boolean;
}

export interface WorkoutEndContext {
  workoutName: string;
  totalSets: number;
  completedSets: number;
  durationSeconds: number;
  topExercise?: string;
  newPRs?: string[];
  language?: 'en' | 'ro';
}

export interface OnDemandCoachContext {
  exerciseName: string;
  setsCompleted: number;
  totalSets: number;
  weight: number;
  reps: number;
  workoutDurationSeconds: number;
  language?: 'en' | 'ro';
}

// ─── Tier 1: Static message pools ────────────────────────────────────────────

const MESSAGES = {
  setComplete: [
    "Great set! Rest up and go again.",
    "Strong work! Keep that energy up.",
    "Nice! Take your rest, you earned it.",
    "Perfect form matters. You got it.",
    "One more set closer to your goal.",
    "That's the way. Stay focused.",
  ],
  setCompleteRo: [
    "Serie bună! Odihnește-te și continuă.",
    "Muncă grozavă! Păstrează energia.",
    "Excelent! Ia-ți pauza bine meritată.",
    "Formă perfectă. Continuă tot așa.",
    "Încă o serie spre obiectivul tău.",
  ],
  prAchieved: [
    "NEW PERSONAL RECORD! That's what you're made of!",
    "PR ALERT! All that hard work just paid off!",
    "You just broke your record! Incredible effort!",
    "Personal best! You got stronger today!",
  ],
  prAchievedRo: [
    "RECORD PERSONAL NOU! Asta înseamnă să dai totul!",
    "RECORD BĂTUT! Toată munca ta a dat roade!",
    "Ai depășit recordul! Efort incredibil!",
  ],
  workoutStart: [
    "Let's crush this workout! You've got this!",
    "Time to get stronger. Focus on form today.",
    "Another day, another chance to be better. Let's go!",
    "The bar is loaded. Let's move some weight!",
  ],
  workoutStartRo: [
    "Hai să zdrobim antrenamentul! Tu poți!",
    "Timp să devii mai puternic. Concentrează-te pe formă.",
    "O nouă zi, o nouă șansă să fii mai bun!",
  ],
} as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Tier 1 API ───────────────────────────────────────────────────────────────

export function getSetCompleteMessage(ctx: SetCompletionContext, language: 'en' | 'ro' = 'en'): string {
  if (ctx.isPR) {
    return pick(language === 'ro' ? MESSAGES.prAchievedRo : MESSAGES.prAchieved);
  }
  return pick(language === 'ro' ? MESSAGES.setCompleteRo : MESSAGES.setComplete);
}

export function getWorkoutStartMessage(language: 'en' | 'ro' = 'en'): string {
  return pick(language === 'ro' ? MESSAGES.workoutStartRo : MESSAGES.workoutStart);
}

// ─── Tier 2: AI via backend server ───────────────────────────────────────────
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/**
 * Generate a personalised workout wrap-up message using Claude.
 * Called once when the user taps "Finish Workout".
 */
export async function generateWorkoutSummary(ctx: WorkoutEndContext): Promise<string> {
  const lang = ctx.language ?? 'en';
  const prs = ctx.newPRs && ctx.newPRs.length > 0
    ? `New PRs achieved: ${ctx.newPRs.join(', ')}.`
    : '';

  const prompt = lang === 'ro'
    ? `Ești un antrenor personal motivațional. Utilizatorul tocmai a terminat antrenamentul "${ctx.workoutName}".
Statistici: ${ctx.completedSets}/${ctx.totalSets} serii completate, durată ${formatDuration(ctx.durationSeconds)}. ${prs}
Exercițiu principal: ${ctx.topExercise ?? 'diverse'}.
Scrie un mesaj de felicitare personalizat de 2-3 propoziții în română. Fii energic și motivațional.`
    : `You are an enthusiastic personal trainer. The user just finished their workout "${ctx.workoutName}".
Stats: ${ctx.completedSets}/${ctx.totalSets} sets completed, duration ${formatDuration(ctx.durationSeconds)}. ${prs}
Top exercise: ${ctx.topExercise ?? 'various'}.
Write a personalised 2-3 sentence congratulatory wrap-up in English. Be energetic and motivational.`;

  const fallback = lang === 'ro'
    ? 'Antrenament fantastic! Recuperarea începe acum. Bravo!'
    : 'Amazing workout! Recovery starts now. Well done!';

  try {
    return (await callAI('/ai/voice-coach', { prompt, maxTokens: 256 })).trim() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Generate an on-demand coaching tip for the current exercise.
 * Called when the user taps the "Coach" button during a workout.
 */
export async function generateOnDemandCoachTip(ctx: OnDemandCoachContext): Promise<string> {
  const lang = ctx.language ?? 'en';

  const prompt = lang === 'ro'
    ? `Ești un antrenor personal expert. Utilizatorul face "${ctx.exerciseName}" — ${ctx.setsCompleted} din ${ctx.totalSets} serii completate.
Ultima serie: ${ctx.weight}kg × ${ctx.reps} reps. Durata antrenamentului: ${formatDuration(ctx.workoutDurationSeconds)}.
Dă un sfat rapid de 1-2 propoziții: tehnică, motivație sau ajustare. Fii direct și concis.`
    : `You are an expert personal trainer. The user is doing "${ctx.exerciseName}" — ${ctx.setsCompleted} of ${ctx.totalSets} sets done.
Last set: ${ctx.weight}kg × ${ctx.reps} reps. Workout duration: ${formatDuration(ctx.workoutDurationSeconds)}.
Give a quick 1-2 sentence coaching tip: technique, motivation, or adjustment. Be direct and concise.`;

  const fallback = "Stay tight, breathe out on the push. You've got this!";
  try {
    return (await callAI('/ai/voice-coach', { prompt, maxTokens: 128 })).trim() || fallback;
  } catch {
    return fallback;
  }
}
