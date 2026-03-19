import progressService from '../../services/progressService';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import client from '../../services/api';
const mockClient = client as jest.Mocked<typeof client>;

const mockMeasurements = {
  weight: 80,
  height: 178,
  age: 28,
  gender: 'male' as const,
  chest: 102,
  waist: 82,
  hips: 98,
  biceps: 36,
  thighs: 58,
};

beforeEach(() => jest.clearAllMocks());

describe('progressService', () => {
  describe('getWeightHistory', () => {
    it('calls GET /progress/weight', async () => {
      mockClient.get.mockResolvedValueOnce([{ date: '2026-03-19', value: 80 }]);
      const result = await progressService.getWeightHistory();
      expect(mockClient.get).toHaveBeenCalledWith('/progress/weight');
      expect(result[0].value).toBe(80);
    });
  });

  describe('addWeight', () => {
    it('calls POST /progress/weight with value', async () => {
      mockClient.post.mockResolvedValueOnce({ date: '2026-03-19', value: 79.5 });
      const result = await progressService.addWeight(79.5);
      expect(mockClient.post).toHaveBeenCalledWith('/progress/weight', { value: 79.5 });
      expect(result.value).toBe(79.5);
    });
  });

  describe('getMeasurements', () => {
    it('calls GET /progress/measurements', async () => {
      mockClient.get.mockResolvedValueOnce([{ date: '2026-03-01', measurements: mockMeasurements }]);
      const result = await progressService.getMeasurements();
      expect(mockClient.get).toHaveBeenCalledWith('/progress/measurements');
      expect(result[0].measurements).toEqual(mockMeasurements);
    });
  });

  describe('addMeasurement', () => {
    it('calls POST /progress/measurements with measurements', async () => {
      mockClient.post.mockResolvedValueOnce({ date: '2026-03-19', measurements: mockMeasurements });
      const result = await progressService.addMeasurement(mockMeasurements);
      expect(mockClient.post).toHaveBeenCalledWith('/progress/measurements', { measurements: mockMeasurements });
      expect(result.measurements).toEqual(mockMeasurements);
    });
  });

  describe('getPhotos', () => {
    it('calls GET /progress/photos', async () => {
      mockClient.get.mockResolvedValueOnce([{ date: '2026-03-19', uri: 'file:///photos/a.jpg' }]);
      const result = await progressService.getPhotos();
      expect(mockClient.get).toHaveBeenCalledWith('/progress/photos');
      expect(result[0].uri).toBe('file:///photos/a.jpg');
    });
  });

  describe('addPhoto', () => {
    it('calls POST /progress/photos with uri', async () => {
      mockClient.post.mockResolvedValueOnce({ date: '2026-03-19', uri: 'file:///photos/a.jpg' });
      const result = await progressService.addPhoto('file:///photos/a.jpg');
      expect(mockClient.post).toHaveBeenCalledWith('/progress/photos', { uri: 'file:///photos/a.jpg' });
      expect(result.uri).toBe('file:///photos/a.jpg');
    });
  });
});
