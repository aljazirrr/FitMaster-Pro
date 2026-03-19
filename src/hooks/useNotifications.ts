/**
 * useNotifications
 *
 * Central hook that:
 *  1. Registers foreground/background notification handlers on mount
 *  2. Captures the last received notification and the last user tap
 *  3. Re-schedules notifications whenever the schedule changes in settings
 *  4. Provides convenience helpers for the UI (enable, disable, toggle)
 */
import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import type { Subscription } from 'expo-notifications';
import { router } from 'expo-router';
import useSettingsStore from '../stores/useSettingsStore';
import { getPushToken } from '../services/notificationService';

export interface UseNotificationsReturn {
  /** Request permissions and schedule reminders */
  enable: () => Promise<boolean>;
  /** Cancel all reminders */
  disable: () => Promise<void>;
  /** Toggle on/off */
  toggle: () => Promise<void>;
  /** Re-apply current schedule without changing enabled state */
  applySchedule: () => Promise<void>;
  /** Retrieve the device's Expo push token */
  getPushToken: () => Promise<string | null>;
}

export function useNotifications(): UseNotificationsReturn {
  const { enableNotificationsAsync, disableNotificationsAsync, toggleNotificationsAsync, applyScheduleAsync } =
    useSettingsStore();

  const receivedSub = useRef<Subscription | null>(null);
  const responseSub = useRef<Subscription | null>(null);

  useEffect(() => {
    // Handle notification received while app is in foreground
    receivedSub.current = Notifications.addNotificationReceivedListener((notification) => {
      const type = notification.request.content.data?.type as string | undefined;
      // Could trigger in-app toast here based on type
      console.log('[Notification received]', type);
    });

    // Handle user tapping a notification
    responseSub.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type as string | undefined;
      handleNotificationTap(type);
    });

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);

  const enable = useCallback(() => enableNotificationsAsync(), [enableNotificationsAsync]);
  const disable = useCallback(() => disableNotificationsAsync(), [disableNotificationsAsync]);
  const toggle = useCallback(() => toggleNotificationsAsync(), [toggleNotificationsAsync]);
  const applySchedule = useCallback(() => applyScheduleAsync(), [applyScheduleAsync]);

  return { enable, disable, toggle, applySchedule, getPushToken };
}

// ─── Deep-link routing on notification tap ────────────────────────────────────

function handleNotificationTap(type: string | undefined): void {
  switch (type) {
    case 'workout_reminder':
      router.push('/(tabs)/track');
      break;
    case 'meal_reminder':
      router.push('/(tabs)/nutrition');
      break;
    case 'water_reminder':
      router.push('/(tabs)/nutrition');
      break;
    case 'streak_reminder':
      router.push('/(tabs)');
      break;
    default:
      break;
  }
}
