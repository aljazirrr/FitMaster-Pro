import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';
type Language = 'en' | 'ro';
type Units = 'metric' | 'imperial';

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  units: Units;
  notifications: boolean;
}

interface SettingsActions {
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  setUnits: (units: Units) => void;
  toggleNotifications: () => void;
}

const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      // State
      theme: 'dark',
      language: 'en',
      units: 'metric',
      notifications: true,

      // Actions
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setLanguage: (language: Language) => set({ language }),

      setUnits: (units: Units) => set({ units }),

      toggleNotifications: () =>
        set((state) => ({
          notifications: !state.notifications,
        })),
    }),
    {
      name: 'fitmaster-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useSettingsStore;
