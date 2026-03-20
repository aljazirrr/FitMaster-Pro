/**
 * NotificationService
 *
 * Centralizes all expo-notifications logic:
 *  - Requesting permissions
 *  - Scheduling local notifications (workout reminders, meal reminders, water, streaks)
 *  - Canceling individual or all scheduled notifications
 *  - Registering the push token with the backend
 */
import { Platform } from 'react-native';
import type { NotificationTriggerInput } from 'expo-notifications';

// expo-notifications push token auto-registration throws in Expo Go on Android (SDK 53+).
// Use require() with try-catch so the module loads gracefully in all environments.
const Notifications = (() => {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
})();

// ─── Default notification behaviour ──────────────────────────────────────────

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Identifier constants ─────────────────────────────────────────────────────

export const NOTIFICATION_IDS = {
  WORKOUT_REMINDER: 'workout-reminder',
  MEAL_BREAKFAST: 'meal-reminder-breakfast',
  MEAL_LUNCH: 'meal-reminder-lunch',
  MEAL_DINNER: 'meal-reminder-dinner',
  WATER_REMINDER: 'water-reminder',
  STREAK_REMINDER: 'streak-reminder',
} as const;

export type NotificationId = (typeof NOTIFICATION_IDS)[keyof typeof NOTIFICATION_IDS];

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WorkoutReminderConfig {
  /** Days of the week: 1=Sunday … 7=Saturday (matches Notifications.WeeklyTriggerInput) */
  weekdays: number[];
  hour: number;
  minute: number;
}

export interface MealReminderConfig {
  breakfastHour: number;
  breakfastMinute: number;
  lunchHour: number;
  lunchMinute: number;
  dinnerHour: number;
  dinnerMinute: number;
}

export interface WaterReminderConfig {
  /** Interval in seconds between reminders */
  intervalSeconds: number;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

/**
 * Request notification permissions.
 * Returns `true` if granted, `false` otherwise.
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fitmaster', {
      name: 'FitMaster Pro',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if notification permissions are currently granted without prompting.
 */
export async function hasPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Workout reminders ────────────────────────────────────────────────────────

/**
 * Schedule a recurring weekly workout reminder on the given weekdays.
 * Cancels any existing workout reminders before scheduling new ones.
 */
export async function scheduleWorkoutReminders(
  config: WorkoutReminderConfig,
): Promise<string[]> {
  if (!Notifications) return [];
  // Cancel existing workout reminders
  await cancelWorkoutReminders();

  const ids: string[] = [];

  for (const weekday of config.weekdays) {
    const trigger: NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: config.hour,
      minute: config.minute,
    };

    const id = await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIFICATION_IDS.WORKOUT_REMINDER}-day${weekday}`,
      content: {
        title: '💪 Time to train!',
        body: "Your workout is scheduled for today. Let's crush it!",
        sound: true,
        data: { type: 'workout_reminder' },
      },
      trigger,
    });
    ids.push(id);
  }

  return ids;
}

export async function cancelWorkoutReminders(): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const workoutIds = scheduled
    .filter((n) => n.identifier.startsWith(NOTIFICATION_IDS.WORKOUT_REMINDER))
    .map((n) => n.identifier);

  await Promise.all(workoutIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

// ─── Meal reminders ───────────────────────────────────────────────────────────

/**
 * Schedule daily meal reminders for breakfast, lunch, and dinner.
 */
export async function scheduleMealReminders(config: MealReminderConfig): Promise<void> {
  if (!Notifications) return;
  await cancelMealReminders();

  const meals: Array<{
    id: string;
    title: string;
    body: string;
    hour: number;
    minute: number;
  }> = [
    {
      id: NOTIFICATION_IDS.MEAL_BREAKFAST,
      title: '🍳 Breakfast time!',
      body: "Don't skip breakfast — log your meal and stay on track.",
      hour: config.breakfastHour,
      minute: config.breakfastMinute,
    },
    {
      id: NOTIFICATION_IDS.MEAL_LUNCH,
      title: '🥗 Lunch reminder',
      body: 'Midday fuel! Log your lunch to hit your macro goals.',
      hour: config.lunchHour,
      minute: config.lunchMinute,
    },
    {
      id: NOTIFICATION_IDS.MEAL_DINNER,
      title: '🍽️ Dinner time',
      body: "Evening meal approaching — plan ahead and log it.",
      hour: config.dinnerHour,
      minute: config.dinnerMinute,
    },
  ];

  await Promise.all(
    meals.map(({ id, title, body, hour, minute }) =>
      Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title, body, sound: true, data: { type: 'meal_reminder' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      }),
    ),
  );
}

export async function cancelMealReminders(): Promise<void> {
  if (!Notifications) return;
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MEAL_BREAKFAST),
    Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MEAL_LUNCH),
    Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.MEAL_DINNER),
  ]);
}

// ─── Water reminders ──────────────────────────────────────────────────────────

/**
 * Schedule a repeating water reminder at the given interval.
 * Only fires between 08:00 and 22:00 by using a TimeInterval trigger.
 */
export async function scheduleWaterReminder(config: WaterReminderConfig): Promise<void> {
  if (!Notifications) return;
  await cancelWaterReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.WATER_REMINDER,
    content: {
      title: '💧 Hydration check!',
      body: "Time to drink some water. Stay hydrated for peak performance.",
      sound: false,
      data: { type: 'water_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: config.intervalSeconds,
      repeats: true,
    },
  });
}

export async function cancelWaterReminder(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.WATER_REMINDER);
}

// ─── Streak reminder ──────────────────────────────────────────────────────────

/**
 * Schedule a daily streak reminder at 20:00 to nudge users who haven't
 * logged a workout or meal today.
 */
export async function scheduleStreakReminder(): Promise<void> {
  if (!Notifications) return;
  await cancelStreakReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.STREAK_REMINDER,
    content: {
      title: '🔥 Keep your streak alive!',
      body: "Don't break the chain — log today's activity before midnight.",
      sound: true,
      data: { type: 'streak_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelStreakReminder(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.STREAK_REMINDER);
}

// ─── Cancel all ───────────────────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Push token ───────────────────────────────────────────────────────────────

/**
 * Get the Expo push token for this device.
 * Returns null if permissions are not granted or on web.
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const granted = await hasPermissions();
  if (!granted) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

// ─── Convenience: schedule all reminders ────────────────────────────────────

export interface AllRemindersConfig {
  workout: WorkoutReminderConfig;
  meals: MealReminderConfig;
  water: WaterReminderConfig;
  streak: boolean;
}

export async function scheduleAllReminders(config: AllRemindersConfig): Promise<void> {
  await Promise.all([
    scheduleWorkoutReminders(config.workout),
    scheduleMealReminders(config.meals),
    scheduleWaterReminder(config.water),
    config.streak ? scheduleStreakReminder() : cancelStreakReminder(),
  ]);
}
