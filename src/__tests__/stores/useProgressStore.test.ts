import useProgressStore from '../../stores/useProgressStore';
import type { BodyMeasurements } from '../../types/user';

const emptyState = {
  weightEntries: [],
  measurementEntries: [],
  photos: [],
};

beforeEach(() => {
  useProgressStore.setState(emptyState);
});

describe('useProgressStore', () => {
  describe('initial state', () => {
    it('starts empty after reset', () => {
      const state = useProgressStore.getState();
      expect(state.weightEntries).toHaveLength(0);
      expect(state.measurementEntries).toHaveLength(0);
      expect(state.photos).toHaveLength(0);
    });
  });

  describe('addWeight', () => {
    it('adds a weight entry', () => {
      useProgressStore.getState().addWeight(80);
      const { weightEntries } = useProgressStore.getState();
      expect(weightEntries).toHaveLength(1);
      expect(weightEntries[0].value).toBe(80);
    });

    it('stores today date in ISO format', () => {
      useProgressStore.getState().addWeight(75);
      const { weightEntries } = useProgressStore.getState();
      const today = new Date().toISOString().split('T')[0];
      expect(weightEntries[0].date).toBe(today);
    });

    it('appends multiple entries in order', () => {
      useProgressStore.getState().addWeight(80);
      useProgressStore.getState().addWeight(79.5);
      const { weightEntries } = useProgressStore.getState();
      expect(weightEntries).toHaveLength(2);
      expect(weightEntries[0].value).toBe(80);
      expect(weightEntries[1].value).toBe(79.5);
    });
  });

  describe('addMeasurement', () => {
    const measurements: BodyMeasurements = {
      weight: 80,
      height: 178,
      age: 28,
      gender: 'male',
      chest: 102,
      waist: 82,
      hips: 98,
      biceps: 36,
      thighs: 58,
    };

    it('adds a measurement entry', () => {
      useProgressStore.getState().addMeasurement(measurements);
      const { measurementEntries } = useProgressStore.getState();
      expect(measurementEntries).toHaveLength(1);
      expect(measurementEntries[0].measurements).toEqual(measurements);
    });

    it('prepends new measurement at the beginning', () => {
      useProgressStore.getState().addMeasurement({ ...measurements, weight: 82 });
      useProgressStore.getState().addMeasurement({ ...measurements, weight: 80 });
      const { measurementEntries } = useProgressStore.getState();
      expect(measurementEntries[0].measurements.weight).toBe(80);
      expect(measurementEntries[1].measurements.weight).toBe(82);
    });

    it('stores today date', () => {
      useProgressStore.getState().addMeasurement(measurements);
      const today = new Date().toISOString().split('T')[0];
      expect(useProgressStore.getState().measurementEntries[0].date).toBe(today);
    });
  });

  describe('addPhoto', () => {
    it('adds a photo entry', () => {
      useProgressStore.getState().addPhoto('file:///photos/progress.jpg');
      const { photos } = useProgressStore.getState();
      expect(photos).toHaveLength(1);
      expect(photos[0].uri).toBe('file:///photos/progress.jpg');
    });

    it('prepends new photos at the beginning', () => {
      useProgressStore.getState().addPhoto('uri1');
      useProgressStore.getState().addPhoto('uri2');
      const { photos } = useProgressStore.getState();
      expect(photos[0].uri).toBe('uri2');
      expect(photos[1].uri).toBe('uri1');
    });

    it('stores today date', () => {
      useProgressStore.getState().addPhoto('test-uri');
      const today = new Date().toISOString().split('T')[0];
      expect(useProgressStore.getState().photos[0].date).toBe(today);
    });
  });
});
