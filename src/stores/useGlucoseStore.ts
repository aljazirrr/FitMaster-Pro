import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import healthService, { summarizeReadings } from '../services/healthService';
import type {
  GlucoseReading,
  GlucoseSummary,
  GlucosePeriod,
  HealthConnectionConfig,
  HealthPermissionStatus,
} from '../types/glucose';

interface GlucoseState {
  /** Cached readings per period key */
  readings: Record<GlucosePeriod, GlucoseReading[]>;
  summary: GlucoseSummary | null;
  selectedPeriod: GlucosePeriod;
  connection: HealthConnectionConfig;
  isSyncing: boolean;
  lastError: string | null;
}

interface GlucoseActions {
  setSelectedPeriod: (period: GlucosePeriod) => void;
  setConnection: (config: Partial<HealthConnectionConfig>) => void;
  /** Request permissions and update connection status */
  connectAsync: () => Promise<HealthPermissionStatus>;
  /** Pull fresh readings for the selected period */
  syncAsync: () => Promise<void>;
  clearReadings: () => void;
}

const EMPTY_READINGS: Record<GlucosePeriod, GlucoseReading[]> = {
  '24h':  [],
  '7d':   [],
  '14d':  [],
  '30d':  [],
};

export const useGlucoseStore = create<GlucoseState & GlucoseActions>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      readings: EMPTY_READINGS,
      summary: null,
      selectedPeriod: '24h',
      connection: {
        platform: 'none',
        permissionStatus: 'not_determined',
        lastSyncedAt: null,
      },
      isSyncing: false,
      lastError: null,

      // ── Actions ────────────────────────────────────────────────────────────

      setSelectedPeriod: (period) => {
        set({ selectedPeriod: period });
        // Recompute summary from cached readings
        const cached = get().readings[period];
        set({ summary: summarizeReadings(cached, period) });
      },

      setConnection: (config) =>
        set((s) => ({ connection: { ...s.connection, ...config } })),

      connectAsync: async () => {
        const platform = healthService ? (
          (await import('react-native')).Platform.OS === 'ios'
            ? 'apple_health'
            : 'health_connect'
        ) : 'none';

        set((s) => ({
          connection: {
            ...s.connection,
            platform: platform as any,
            permissionStatus: 'not_determined',
          },
          lastError: null,
        }));

        let status: HealthPermissionStatus = 'unavailable';
        try {
          status = await healthService.requestPermissions();
        } catch (e: any) {
          set({ lastError: e?.message ?? 'Could not connect to health service' });
          set((s) => ({
            connection: { ...s.connection, permissionStatus: 'denied' },
          }));
          return 'denied';
        }

        set((s) => ({
          connection: {
            ...s.connection,
            permissionStatus: status,
          },
        }));

        if (status === 'authorized') {
          // Kick off first sync automatically
          get().syncAsync();
        }

        return status;
      },

      syncAsync: async () => {
        const { selectedPeriod, connection } = get();
        if (connection.permissionStatus !== 'authorized') return;

        set({ isSyncing: true, lastError: null });
        try {
          const fresh = await healthService.getGlucoseReadings(selectedPeriod);
          const newSummary = summarizeReadings(fresh, selectedPeriod);
          set((s) => ({
            readings: { ...s.readings, [selectedPeriod]: fresh },
            summary: newSummary,
            isSyncing: false,
            connection: {
              ...s.connection,
              lastSyncedAt: new Date().toISOString(),
            },
          }));
        } catch (e: any) {
          set({ isSyncing: false, lastError: e?.message ?? 'Sync failed' });
        }
      },

      clearReadings: () =>
        set({ readings: EMPTY_READINGS, summary: null }),
    }),
    {
      name: 'fitmaster-glucose',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useGlucoseStore;
