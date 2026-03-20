import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import {
  requestPermissions,
  cancelAllNotifications,
  scheduleAllReminders,
  type WorkoutReminderConfig,
  type MealReminderConfig,
  type WaterReminderConfig,
} from '../services/notificationService';

type ThemeMode = 'dark' | 'light';
type Language = 'en' | 'ro';
type Units = 'metric' | 'imperial';

// ─── Notification schedule ────────────────────────────────────────────────────

export interface NotificationSchedule {
  workoutReminder: WorkoutReminderConfig;
  mealReminder: MealReminderConfig;
  waterReminder: WaterReminderConfig;
  streakReminder: boolean;
}

const DEFAULT_SCHEDULE: NotificationSchedule = {
  workoutReminder: {
    weekdays: [2, 4, 6], // Mon, Wed, Fri
    hour: 8,
    minute: 0,
  },
  mealReminder: {
    breakfastHour: 8,
    breakfastMinute: 0,
    lunchHour: 12,
    lunchMinute: 30,
    dinnerHour: 19,
    dinnerMinute: 0,
  },
  waterReminder: {
    intervalSeconds: 7200, // Every 2 hours
  },
  streakReminder: true,
};

// ─── State / Actions types ────────────────────────────────────────────────────

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  units: Units;
  notifications: boolean;
  notificationsPermissionGranted: boolean;
  schedule: NotificationSchedule;
}

interface SettingsActions {
  // ── Sync ────────────────────────────────────────────────────────────────────
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  setUnits: (units: Units) => void;
  setSchedule: (schedule: Partial<NotificationSchedule>) => void;

  // ── Async ───────────────────────────────────────────────────────────────────
  /** Request permissions and enable all reminders if granted. */
  enableNotificationsAsync: () => Promise<boolean>;
  /** Cancel all scheduled notifications and disable. */
  disableNotificationsAsync: () => Promise<void>;
  /** Toggle notifications on/off (requests permissions if enabling). */
  toggleNotificationsAsync: () => Promise<void>;
  /** Re-apply the current schedule (call after changing schedule settings). */
  applyScheduleAsync: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      theme: 'dark',
      language: 'en',
      units: 'metric',
      notifications: false,
      notificationsPermissionGranted: false,
      schedule: DEFAULT_SCHEDULE,

      // ── Sync actions ────────────────────────────────────────────────────────

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },

      setUnits: (units) => set({ units }),

      setSchedule: (partial) =>
        set((state) => ({ schedule: { ...state.schedule, ...partial } })),

      // ── Async actions ────────────────────────────────────────────────────────

      enableNotificationsAsync: async () => {
        const granted = await requestPermissions();
        if (!granted) {
          set({ notifications: false, notificationsPermissionGranted: false });
          return false;
        }
        const { schedule } = get();
        await scheduleAllReminders({
          workout: schedule.workoutReminder,
          meals: schedule.mealReminder,
          water: schedule.waterReminder,
          streak: schedule.streakReminder,
        });
        set({ notifications: true, notificationsPermissionGranted: true });
        return true;
      },

      disableNotificationsAsync: async () => {
        await cancelAllNotifications();
        set({ notifications: false });
      },

      toggleNotificationsAsync: async () => {
        const { notifications } = get();
        if (notifications) {
          await get().disableNotificationsAsync();
        } else {
          await get().enableNotificationsAsync();
        }
      },

      applyScheduleAsync: async () => {
        const { notifications, schedule } = get();
        if (!notifications) return;
        await scheduleAllReminders({
          workout: schedule.workoutReminder,
          meals: schedule.mealReminder,
          water: schedule.waterReminder,
          streak: schedule.streakReminder,
        });
      },
    }),
    {
      name: 'fitmaster-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          i18n.changeLanguage(state.language);
        }
      },
    },
  ),
);

export default useSettingsStore;
