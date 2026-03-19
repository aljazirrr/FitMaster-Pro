import workoutService from '../../services/workoutService';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import client from '../../services/api';
const mockClient = client as jest.Mocked<typeof client>;

const mockSession = {
  id: 'w1',
  name: 'Push Day',
  date: '2026-03-19',
  startTime: '2026-03-19T09:00:00Z',
  endTime: '2026-03-19T10:00:00Z',
  duration: 3600,
  exercises: [],
  completed: true,
};

beforeEach(() => jest.clearAllMocks());

describe('workoutService', () => {
  describe('getHistory', () => {
    it('calls GET /workouts and returns sessions', async () => {
      mockClient.get.mockResolvedValueOnce([mockSession]);
      const result = await workoutService.getHistory();
      expect(mockClient.get).toHaveBeenCalledWith('/workouts');
      expect(result).toEqual([mockSession]);
    });
  });

  describe('getById', () => {
    it('calls GET /workouts/:id', async () => {
      mockClient.get.mockResolvedValueOnce(mockSession);
      const result = await workoutService.getById('w1');
      expect(mockClient.get).toHaveBeenCalledWith('/workouts/w1');
      expect(result).toEqual(mockSession);
    });
  });

  describe('save', () => {
    it('calls POST /workouts with session payload', async () => {
      const payload = {
        name: 'Push Day',
        date: '2026-03-19',
        startTime: '2026-03-19T09:00:00Z',
        endTime: '2026-03-19T10:00:00Z',
        duration: 3600,
        exercises: [],
      };
      mockClient.post.mockResolvedValueOnce(mockSession);
      const result = await workoutService.save(payload);
      expect(mockClient.post).toHaveBeenCalledWith('/workouts', payload);
      expect(result).toEqual(mockSession);
    });
  });

  describe('delete', () => {
    it('calls DELETE /workouts/:id', async () => {
      mockClient.delete.mockResolvedValueOnce(undefined);
      await workoutService.delete('w1');
      expect(mockClient.delete).toHaveBeenCalledWith('/workouts/w1');
    });
  });

  describe('getPersonalRecords', () => {
    it('calls GET /workouts/personal-records', async () => {
      const records = [{ id: 'pr1', exerciseId: 'bench-press', weight: 100, reps: 5, date: '2026-03-19', oneRepMax: 117 }];
      mockClient.get.mockResolvedValueOnce(records);
      const result = await workoutService.getPersonalRecords();
      expect(mockClient.get).toHaveBeenCalledWith('/workouts/personal-records');
      expect(result).toEqual(records);
    });
  });
});
