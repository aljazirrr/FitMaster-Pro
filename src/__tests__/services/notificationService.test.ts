import * as Notifications from 'expo-notifications';
import {
  requestPermissions,
  hasPermissions,
  scheduleWorkoutReminders,
  cancelWorkoutReminders,
  scheduleMealReminders,
  cancelMealReminders,
  scheduleWaterReminder,
  cancelWaterReminder,
  scheduleStreakReminder,
  cancelStreakReminder,
  cancelAllNotifications,
  scheduleAllReminders,
  getPushToken,
  NOTIFICATION_IDS,
} from '../../services/notificationService';

// Cast for test helper access
const NotifMock = Notifications as typeof Notifications & {
  _reset: () => void;
  _getScheduled: () => { identifier: string; content: unknown; trigger: unknown }[];
};

beforeEach(() => {
  jest.clearAllMocks();
  NotifMock._reset();
});

describe('requestPermissions', () => {
  it('returns true when permissions are granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    const result = await requestPermissions();
    expect(result).toBe(true);
  });

  it('requests permissions when not already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    const result = await requestPermissions();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns false when user denies permissions', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const result = await requestPermissions();
    expect(result).toBe(false);
  });
});

describe('hasPermissions', () => {
  it('returns true if status is granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    expect(await hasPermissions()).toBe(true);
  });

  it('returns false if status is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    expect(await hasPermissions()).toBe(false);
  });
});

describe('scheduleWorkoutReminders', () => {
  it('schedules one notification per weekday', async () => {
    const ids = await scheduleWorkoutReminders({ weekdays: [2, 4, 6], hour: 8, minute: 0 });
    expect(ids).toHaveLength(3);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
  });

  it('uses WEEKLY trigger with correct hour and minute', async () => {
    await scheduleWorkoutReminders({ weekdays: [2], hour: 9, minute: 30 });
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.trigger.type).toBe('weekly');
    expect(call.trigger.hour).toBe(9);
    expect(call.trigger.minute).toBe(30);
    expect(call.trigger.weekday).toBe(2);
  });

  it('prefixes identifiers with workout-reminder', async () => {
    await scheduleWorkoutReminders({ weekdays: [3], hour: 7, minute: 0 });
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.identifier).toContain(NOTIFICATION_IDS.WORKOUT_REMINDER);
  });

  it('cancels existing workout reminders before scheduling', async () => {
    // Pre-populate with an existing reminder
    NotifMock._getScheduled().push({ identifier: `${NOTIFICATION_IDS.WORKOUT_REMINDER}-day2`, content: {}, trigger: {} });
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce(
      NotifMock._getScheduled(),
    );

    await scheduleWorkoutReminders({ weekdays: [2], hour: 8, minute: 0 });
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      `${NOTIFICATION_IDS.WORKOUT_REMINDER}-day2`,
    );
  });
});

describe('cancelWorkoutReminders', () => {
  it('cancels all notifications with workout-reminder prefix', async () => {
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([
      { identifier: `${NOTIFICATION_IDS.WORKOUT_REMINDER}-day2` },
      { identifier: `${NOTIFICATION_IDS.WORKOUT_REMINDER}-day4` },
      { identifier: NOTIFICATION_IDS.MEAL_BREAKFAST },
    ]);
    await cancelWorkoutReminders();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      `${NOTIFICATION_IDS.WORKOUT_REMINDER}-day2`,
    );
  });
});

describe('scheduleMealReminders', () => {
  it('schedules three meal notifications', async () => {
    await scheduleMealReminders({
      breakfastHour: 8, breakfastMinute: 0,
      lunchHour: 12, lunchMinute: 30,
      dinnerHour: 19, dinnerMinute: 0,
    });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
  });

  it('uses DAILY trigger', async () => {
    await scheduleMealReminders({
      breakfastHour: 8, breakfastMinute: 0,
      lunchHour: 12, lunchMinute: 30,
      dinnerHour: 19, dinnerMinute: 0,
    });
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    calls.forEach(([arg]) => {
      expect(arg.trigger.type).toBe('daily');
    });
  });

  it('uses correct identifiers for each meal', async () => {
    await scheduleMealReminders({
      breakfastHour: 8, breakfastMinute: 0,
      lunchHour: 12, lunchMinute: 30,
      dinnerHour: 19, dinnerMinute: 0,
    });
    const identifiers = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(
      ([arg]) => arg.identifier,
    );
    expect(identifiers).toContain(NOTIFICATION_IDS.MEAL_BREAKFAST);
    expect(identifiers).toContain(NOTIFICATION_IDS.MEAL_LUNCH);
    expect(identifiers).toContain(NOTIFICATION_IDS.MEAL_DINNER);
  });
});

describe('cancelMealReminders', () => {
  it('cancels all 3 meal notification IDs', async () => {
    await cancelMealReminders();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(NOTIFICATION_IDS.MEAL_BREAKFAST);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(NOTIFICATION_IDS.MEAL_LUNCH);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(NOTIFICATION_IDS.MEAL_DINNER);
  });
});

describe('scheduleWaterReminder', () => {
  it('schedules a TIME_INTERVAL repeating notification', async () => {
    await scheduleWaterReminder({ intervalSeconds: 7200 });
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.identifier).toBe(NOTIFICATION_IDS.WATER_REMINDER);
    expect(call.trigger.type).toBe('timeInterval');
    expect(call.trigger.seconds).toBe(7200);
    expect(call.trigger.repeats).toBe(true);
  });
});

describe('scheduleStreakReminder', () => {
  it('schedules a DAILY notification at 20:00', async () => {
    await scheduleStreakReminder();
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.identifier).toBe(NOTIFICATION_IDS.STREAK_REMINDER);
    expect(call.trigger.type).toBe('daily');
    expect(call.trigger.hour).toBe(20);
    expect(call.trigger.minute).toBe(0);
  });
});

describe('cancelAllNotifications', () => {
  it('calls cancelAllScheduledNotificationsAsync', async () => {
    await cancelAllNotifications();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});

describe('scheduleAllReminders', () => {
  it('schedules workout + meals + water + streak', async () => {
    await scheduleAllReminders({
      workout: { weekdays: [2, 4], hour: 8, minute: 0 },
      meals: { breakfastHour: 8, breakfastMinute: 0, lunchHour: 12, lunchMinute: 30, dinnerHour: 19, dinnerMinute: 0 },
      water: { intervalSeconds: 7200 },
      streak: true,
    });
    // 2 workout + 3 meals + 1 water + 1 streak = 7 calls
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
  });

  it('skips streak when streak=false', async () => {
    await scheduleAllReminders({
      workout: { weekdays: [2], hour: 8, minute: 0 },
      meals: { breakfastHour: 8, breakfastMinute: 0, lunchHour: 12, lunchMinute: 30, dinnerHour: 19, dinnerMinute: 0 },
      water: { intervalSeconds: 7200 },
      streak: false,
    });
    const identifiers = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(
      ([arg]) => arg.identifier,
    );
    expect(identifiers).not.toContain(NOTIFICATION_IDS.STREAK_REMINDER);
  });
});

describe('getPushToken', () => {
  it('returns the token string when permissions are granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    const token = await getPushToken();
    expect(token).toBe('ExponentPushToken[test-token]');
  });

  it('returns null when permissions are not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const token = await getPushToken();
    expect(token).toBeNull();
  });

  it('returns null when getExpoPushTokenAsync throws', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(new Error('No project ID'));
    const token = await getPushToken();
    expect(token).toBeNull();
  });
});
