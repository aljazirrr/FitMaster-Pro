import communityService from '../../services/communityService';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import client from '../../services/api';
const mockClient = client as jest.Mocked<typeof client>;

const mockPost = {
  id: 'p1',
  userId: 'u1',
  userName: 'Alex',
  content: 'Test post',
  likes: 0,
  comments: [],
  createdAt: '2026-03-19T10:00:00Z',
};

const mockChallenge = {
  id: 'c1',
  name: 'Plank',
  nameRo: 'Plank',
  description: 'Hold a plank',
  descriptionRo: 'Ține planul',
  type: 'daily' as const,
  duration: 30,
  target: 30,
  participants: 100,
  startDate: '2026-03-01T00:00:00Z',
  endDate: '2026-03-31T00:00:00Z',
};

beforeEach(() => jest.clearAllMocks());

describe('communityService', () => {
  describe('getFeed', () => {
    it('calls GET /community/feed with default pagination', async () => {
      mockClient.get.mockResolvedValueOnce([mockPost]);
      const result = await communityService.getFeed();
      expect(mockClient.get).toHaveBeenCalledWith('/community/feed', {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual([mockPost]);
    });

    it('passes custom page and limit', async () => {
      mockClient.get.mockResolvedValueOnce([]);
      await communityService.getFeed({ page: 3, limit: 10 });
      expect(mockClient.get).toHaveBeenCalledWith('/community/feed', {
        params: { page: 3, limit: 10 },
      });
    });
  });

  describe('createPost', () => {
    it('calls POST /community/posts', async () => {
      mockClient.post.mockResolvedValueOnce(mockPost);
      const result = await communityService.createPost({ content: 'Test post' });
      expect(mockClient.post).toHaveBeenCalledWith('/community/posts', { content: 'Test post' });
      expect(result).toEqual(mockPost);
    });
  });

  describe('likePost', () => {
    it('calls POST /community/posts/:id/like', async () => {
      mockClient.post.mockResolvedValueOnce({ likes: 5 });
      const result = await communityService.likePost('p1');
      expect(mockClient.post).toHaveBeenCalledWith('/community/posts/p1/like');
      expect(result).toEqual({ likes: 5 });
    });
  });

  describe('addComment', () => {
    it('calls POST /community/posts/:id/comments', async () => {
      const comment = { id: 'c1', userId: 'u2', userName: 'Maria', content: 'Great!', createdAt: '2026-03-19T11:00:00Z' };
      mockClient.post.mockResolvedValueOnce(comment);
      const result = await communityService.addComment('p1', { content: 'Great!' });
      expect(mockClient.post).toHaveBeenCalledWith('/community/posts/p1/comments', { content: 'Great!' });
      expect(result).toEqual(comment);
    });
  });

  describe('getChallenges', () => {
    it('calls GET /community/challenges', async () => {
      mockClient.get.mockResolvedValueOnce([mockChallenge]);
      const result = await communityService.getChallenges();
      expect(mockClient.get).toHaveBeenCalledWith('/community/challenges');
      expect(result).toEqual([mockChallenge]);
    });
  });

  describe('joinChallenge', () => {
    it('calls POST /community/challenges/:id/join', async () => {
      const updated = { ...mockChallenge, participants: 101 };
      mockClient.post.mockResolvedValueOnce(updated);
      const result = await communityService.joinChallenge('c1');
      expect(mockClient.post).toHaveBeenCalledWith('/community/challenges/c1/join');
      expect(result.participants).toBe(101);
    });
  });

  describe('getLeaderboard', () => {
    it('calls GET /community/leaderboard', async () => {
      const entries = [{ rank: 1, userId: 'u1', userName: 'Alex', score: 5000, label: 'pts' }];
      mockClient.get.mockResolvedValueOnce(entries);
      const result = await communityService.getLeaderboard();
      expect(mockClient.get).toHaveBeenCalledWith('/community/leaderboard');
      expect(result).toEqual(entries);
    });
  });
});
