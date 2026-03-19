import useSettingsStore from '../../stores/useSettingsStore';
import * as Notifications from 'expo-notifications';

const NotifMock = Notifications as typeof Notifications & {
  _reset: () => void;
};

const defaultState = {
  theme: 'dark' as const,
  language: 'en' as const,
  units: 'metric' as const,
  notifications: true,
  notificationsPermissionGranted: false,
  schedule: {
    workoutReminder: { weekdays: [2, 4, 6], hour: 8, minute: 0 },
    mealReminder: { breakfastHour: 8, breakfastMinute: 0, lunchHour: 12, lunchMinute: 30, dinnerHour: 19, dinnerMinute: 0 },
    waterReminder: { intervalSeconds: 7200 },
    streakReminder: true,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  NotifMock._reset();
  useSettingsStore.setState(defaultState);
});

describe('useSettingsStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.language).toBe('en');
      expect(state.units).toBe('metric');
      expect(state.notifications).toBe(true);
    });
  });

  describe('toggleTheme', () => {
    it('toggles from dark to light', () => {
      useSettingsStore.getState().toggleTheme();
      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('toggles from light back to dark', () => {
      useSettingsStore.setState({ theme: 'light' });
      useSettingsStore.getState().toggleTheme();
      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('toggles twice to return to original', () => {
      useSettingsStore.getState().toggleTheme();
      useSettingsStore.getState().toggleTheme();
      expect(useSettingsStore.getState().theme).toBe('dark');
    });
  });

  describe('setLanguage', () => {
    it('sets language to ro', () => {
      useSettingsStore.getState().setLanguage('ro');
      expect(useSettingsStore.getState().language).toBe('ro');
    });

    it('sets language back to en', () => {
      useSettingsStore.setState({ language: 'ro' });
      useSettingsStore.getState().setLanguage('en');
      expect(useSettingsStore.getState().language).toBe('en');
    });
  });

  describe('setUnits', () => {
    it('sets units to imperial', () => {
      useSettingsStore.getState().setUnits('imperial');
      expect(useSettingsStore.getState().units).toBe('imperial');
    });

    it('sets units back to metric', () => {
      useSettingsStore.setState({ units: 'imperial' });
      useSettingsStore.getState().setUnits('metric');
      expect(useSettingsStore.getState().units).toBe('metric');
    });
  });

  describe('setSchedule', () => {
    it('merges partial schedule update', () => {
      useSettingsStore.getState().setSchedule({ streakReminder: false });
      expect(useSettingsStore.getState().schedule.streakReminder).toBe(false);
      // Other fields unchanged
      expect(useSettingsStore.getState().schedule.workoutReminder.hour).toBe(8);
    });

    it('updates workout weekdays', () => {
      useSettingsStore.getState().setSchedule({
        workoutReminder: { weekdays: [1, 3, 5, 7], hour: 7, minute: 30 },
      });
      expect(useSettingsStore.getState().schedule.workoutReminder.weekdays).toEqual([1, 3, 5, 7]);
    });
  });

  describe('enableNotificationsAsync', () => {
    it('sets notifications=true and permissionGranted=true when granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      useSettingsStore.setState({ notifications: false, notificationsPermissionGranted: false });
      const result = await useSettingsStore.getState().enableNotificationsAsync();
      expect(result).toBe(true);
      expect(useSettingsStore.getState().notifications).toBe(true);
      expect(useSettingsStore.getState().notificationsPermissionGranted).toBe(true);
    });

    it('sets notifications=false when permissions denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
      const result = await useSettingsStore.getState().enableNotificationsAsync();
      expect(result).toBe(false);
      expect(useSettingsStore.getState().notifications).toBe(false);
    });

    it('calls scheduleNotificationAsync when granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      await useSettingsStore.getState().enableNotificationsAsync();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('disableNotificationsAsync', () => {
    it('cancels all notifications and sets notifications=false', async () => {
      await useSettingsStore.getState().disableNotificationsAsync();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(useSettingsStore.getState().notifications).toBe(false);
    });
  });

  describe('toggleNotificationsAsync', () => {
    it('disables when currently enabled', async () => {
      useSettingsStore.setState({ notifications: true });
      await useSettingsStore.getState().toggleNotificationsAsync();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(useSettingsStore.getState().notifications).toBe(false);
    });

    it('enables when currently disabled', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      useSettingsStore.setState({ notifications: false });
      await useSettingsStore.getState().toggleNotificationsAsync();
      expect(useSettingsStore.getState().notifications).toBe(true);
    });
  });

  describe('applyScheduleAsync', () => {
    it('does nothing when notifications are disabled', async () => {
      useSettingsStore.setState({ notifications: false });
      await useSettingsStore.getState().applyScheduleAsync();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('schedules when notifications are enabled', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
      useSettingsStore.setState({ notifications: true });
      await useSettingsStore.getState().applyScheduleAsync();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });
});
