import useSettingsStore from '../../stores/useSettingsStore';

// Reset store state before each test
beforeEach(() => {
  useSettingsStore.setState({
    theme: 'dark',
    language: 'en',
    units: 'metric',
    notifications: true,
  });
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

  describe('toggleNotifications', () => {
    it('toggles notifications off', () => {
      useSettingsStore.getState().toggleNotifications();
      expect(useSettingsStore.getState().notifications).toBe(false);
    });

    it('toggles notifications back on', () => {
      useSettingsStore.setState({ notifications: false });
      useSettingsStore.getState().toggleNotifications();
      expect(useSettingsStore.getState().notifications).toBe(true);
    });

    it('toggles twice to return to original', () => {
      useSettingsStore.getState().toggleNotifications();
      useSettingsStore.getState().toggleNotifications();
      expect(useSettingsStore.getState().notifications).toBe(true);
    });
  });
});
