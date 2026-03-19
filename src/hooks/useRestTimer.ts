/**
 * useRestTimer — countdown rest timer between sets
 *
 * Usage:
 *   const timer = useRestTimer();
 *   timer.start(90);           // start 90-second countdown
 *   timer.skip();              // dismiss immediately
 *   timer.addTime(15);         // add 15s while running
 *   timer.isRunning            // true while counting down
 *   timer.secondsLeft          // current remaining seconds
 *   timer.totalSeconds         // duration the timer was started with
 *   timer.onFinish             // callback fired when countdown reaches 0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration, Platform } from 'react-native';

export interface RestTimerState {
  isRunning: boolean;
  secondsLeft: number;
  totalSeconds: number;
  progress: number; // 0 → 1 (filled as time passes)
}

export interface RestTimerControls {
  start: (seconds: number) => void;
  skip: () => void;
  addTime: (seconds: number) => void;
  reset: () => void;
}

export type UseRestTimerReturn = RestTimerState & RestTimerControls;

const DEFAULT_STATE: RestTimerState = {
  isRunning: false,
  secondsLeft: 0,
  totalSeconds: 0,
  progress: 0,
};

export function useRestTimer(onFinish?: () => void): UseRestTimerReturn {
  const [state, setState] = useState<RestTimerState>(DEFAULT_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick every second
  useEffect(() => {
    if (!state.isRunning) return;

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.isRunning) return prev;

        const next = prev.secondsLeft - 1;

        if (next <= 0) {
          // Timer finished
          clearInterval(intervalRef.current!);
          intervalRef.current = null;

          // Vibrate to signal rest is over
          if (Platform.OS !== 'web') {
            Vibration.vibrate(Platform.OS === 'android' ? [0, 200, 100, 200] : [0, 300]);
          }

          // Fire callback after state update
          setTimeout(() => onFinishRef.current?.(), 0);

          return { ...prev, isRunning: false, secondsLeft: 0, progress: 1 };
        }

        return {
          ...prev,
          secondsLeft: next,
          progress: 1 - next / prev.totalSeconds,
        };
      });
    }, 1000);

    return clearInterval_;
  }, [state.isRunning, clearInterval_]);

  // Clean up on unmount
  useEffect(() => () => clearInterval_(), [clearInterval_]);

  const start = useCallback((seconds: number) => {
    clearInterval_();
    const clamped = Math.max(1, Math.round(seconds));
    setState({
      isRunning: true,
      secondsLeft: clamped,
      totalSeconds: clamped,
      progress: 0,
    });
  }, [clearInterval_]);

  const skip = useCallback(() => {
    clearInterval_();
    setState(DEFAULT_STATE);
  }, [clearInterval_]);

  const addTime = useCallback((seconds: number) => {
    setState((prev) => {
      if (!prev.isRunning) return prev;
      const newLeft = prev.secondsLeft + seconds;
      const newTotal = Math.max(prev.totalSeconds, newLeft);
      return {
        ...prev,
        secondsLeft: newLeft,
        totalSeconds: newTotal,
        progress: 1 - newLeft / newTotal,
      };
    });
  }, []);

  const reset = useCallback(() => {
    clearInterval_();
    setState(DEFAULT_STATE);
  }, [clearInterval_]);

  return { ...state, start, skip, addTime, reset };
}
