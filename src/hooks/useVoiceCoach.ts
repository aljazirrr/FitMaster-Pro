/**
 * useVoiceCoach
 *
 * Manages Text-to-Speech and AI coaching throughout a workout.
 *
 * Features:
 *  - Enabled/disabled toggle (persisted in settings store)
 *  - speakSetComplete()  — instant static message after a set
 *  - speakPR()           — celebration for a personal record
 *  - speakWorkoutStart() — motivational opener
 *  - requestSummary()    — async Claude wrap-up at workout end
 *  - requestCoachTip()   — async Claude on-demand tip
 *  - isSpeaking / isLoadingTip / lastTip observable state
 */
import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import useSettingsStore from '../stores/useSettingsStore';
import {
  getSetCompleteMessage,
  getWorkoutStartMessage,
  generateWorkoutSummary,
  generateOnDemandCoachTip,
  type SetCompletionContext,
  type WorkoutEndContext,
  type OnDemandCoachContext,
} from '../services/voiceCoachService';

export interface UseVoiceCoachReturn {
  /** Whether the voice coach is currently active */
  isEnabled: boolean;
  /** Toggle voice coach on/off */
  toggleEnabled: () => void;
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Whether an AI tip is being generated */
  isLoadingTip: boolean;
  /** The last AI-generated tip text (for display in UI) */
  lastTip: string | null;
  /** Speak a set-completion message (instant, Tier 1) */
  speakSetComplete: (ctx: SetCompletionContext) => void;
  /** Speak a PR celebration (instant, Tier 1) */
  speakPR: (exerciseName: string) => void;
  /** Speak a workout start message (instant, Tier 1) */
  speakWorkoutStart: () => void;
  /** Generate + speak a personalised workout summary (async, Tier 2) */
  requestSummary: (ctx: WorkoutEndContext) => Promise<string>;
  /** Generate + speak an on-demand coaching tip (async, Tier 2) */
  requestCoachTip: (ctx: OnDemandCoachContext) => Promise<void>;
  /** Stop any ongoing speech */
  stop: () => void;
}

// ─── Local storage key for coach toggle ──────────────────────────────────────
// We store coach enabled state separately from main settings so it doesn't
// conflict with the notifications flag.
const COACH_ENABLED_KEY = 'voiceCoachEnabled';

export function useVoiceCoach(): UseVoiceCoachReturn {
  const { language } = useSettingsStore();
  const lang = (language === 'ro' ? 'ro' : 'en') as 'en' | 'ro';

  // ── Local state ───────────────────────────────────────────────────────────
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [lastTip, setLastTip] = useState<string | null>(null);

  const speakingRef = useRef(false);

  // ── TTS helpers ───────────────────────────────────────────────────────────

  function speak(text: string) {
    if (!isEnabled || !text) return;

    Speech.stop();
    speakingRef.current = true;
    setIsSpeaking(true);

    Speech.speak(text, {
      language: lang === 'ro' ? 'ro-RO' : 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      },
      onStopped: () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      },
      onError: () => {
        speakingRef.current = false;
        setIsSpeaking(false);
      },
    });
  }

  function stop() {
    Speech.stop();
    speakingRef.current = false;
    setIsSpeaking(false);
  }

  // ── Toggle ────────────────────────────────────────────────────────────────

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      if (prev) Speech.stop();
      return !prev;
    });
  }, []);

  // ── Tier 1: Instant messages ─────────────────────────────────────────────

  const speakSetComplete = useCallback(
    (ctx: SetCompletionContext) => {
      const msg = getSetCompleteMessage(ctx, lang);
      speak(msg);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEnabled, lang],
  );

  const speakPR = useCallback(
    (exerciseName: string) => {
      const msg = getSetCompleteMessage({ exerciseName, setIndex: 0, weight: 0, reps: 0, isPR: true }, lang);
      speak(msg);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEnabled, lang],
  );

  const speakWorkoutStart = useCallback(() => {
    const msg = getWorkoutStartMessage(lang);
    speak(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, lang]);

  // ── Tier 2: AI messages ───────────────────────────────────────────────────

  const requestSummary = useCallback(
    async (ctx: WorkoutEndContext): Promise<string> => {
      setIsLoadingTip(true);
      try {
        const summary = await generateWorkoutSummary({ ...ctx, language: lang });
        setLastTip(summary);
        speak(summary);
        return summary;
      } catch {
        const fallback =
          lang === 'ro'
            ? 'Antrenament fantastic! Recuperarea începe acum. Bravo!'
            : 'Amazing workout! Recovery starts now. Well done!';
        speak(fallback);
        return fallback;
      } finally {
        setIsLoadingTip(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEnabled, lang],
  );

  const requestCoachTip = useCallback(
    async (ctx: OnDemandCoachContext): Promise<void> => {
      if (isLoadingTip) return;
      setIsLoadingTip(true);
      try {
        const tip = await generateOnDemandCoachTip({ ...ctx, language: lang });
        setLastTip(tip);
        speak(tip);
      } catch {
        const fallback = "Keep going! Stay tight and breathe with each rep.";
        setLastTip(fallback);
        speak(fallback);
      } finally {
        setIsLoadingTip(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEnabled, isLoadingTip, lang],
  );

  return {
    isEnabled,
    toggleEnabled,
    isSpeaking,
    isLoadingTip,
    lastTip,
    speakSetComplete,
    speakPR,
    speakWorkoutStart,
    requestSummary,
    requestCoachTip,
    stop,
  };
}
