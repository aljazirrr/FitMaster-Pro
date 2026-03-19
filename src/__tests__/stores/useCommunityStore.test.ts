import useCommunityStore from '../../stores/useCommunityStore';

const emptyState = {
  posts: [],
  challenges: [],
  leaderboard: [],
};

beforeEach(() => {
  useCommunityStore.setState(emptyState);
});

describe('useCommunityStore', () => {
  describe('setPosts / setChallenges / setLeaderboard', () => {
    it('replaces posts array', () => {
      const posts = [
        { id: '1', userId: 'u1', userName: 'Alex', content: 'Hello', likes: 5, comments: [], createdAt: new Date().toISOString() },
      ];
      useCommunityStore.getState().setPosts(posts);
      expect(useCommunityStore.getState().posts).toEqual(posts);
    });

    it('replaces challenges array', () => {
      const challenges = [
        { id: 'c1', name: 'Challenge', nameRo: 'Provocare', description: 'Desc', descriptionRo: 'Desc', type: 'daily' as const, duration: 30, target: 30, participants: 10, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
      ];
      useCommunityStore.getState().setChallenges(challenges);
      expect(useCommunityStore.getState().challenges).toEqual(challenges);
    });

    it('replaces leaderboard array', () => {
      const entries = [{ rank: 1, userId: 'u1', userName: 'Alex', score: 5000, label: 'pts' }];
      useCommunityStore.getState().setLeaderboard(entries);
      expect(useCommunityStore.getState().leaderboard).toEqual(entries);
    });
  });

  describe('addPost', () => {
    it('prepends a new post with generated id, 0 likes, empty comments', () => {
      useCommunityStore.getState().addPost({ userId: 'u1', userName: 'Alex', content: 'First post!' });
      const { posts } = useCommunityStore.getState();
      expect(posts).toHaveLength(1);
      expect(posts[0].content).toBe('First post!');
      expect(posts[0].likes).toBe(0);
      expect(posts[0].comments).toEqual([]);
      expect(posts[0].id).toBeTruthy();
      expect(posts[0].createdAt).toBeTruthy();
    });

    it('prepends to existing posts', () => {
      useCommunityStore.getState().addPost({ userId: 'u1', userName: 'Alex', content: 'First' });
      useCommunityStore.getState().addPost({ userId: 'u2', userName: 'Maria', content: 'Second' });
      const { posts } = useCommunityStore.getState();
      expect(posts[0].content).toBe('Second');
      expect(posts[1].content).toBe('First');
    });

    it('assigns unique ids to posts', () => {
      useCommunityStore.getState().addPost({ userId: 'u1', userName: 'Alex', content: 'Post A' });
      useCommunityStore.getState().addPost({ userId: 'u1', userName: 'Alex', content: 'Post B' });
      const { posts } = useCommunityStore.getState();
      expect(posts[0].id).not.toBe(posts[1].id);
    });
  });

  describe('likePost', () => {
    it('increments likes on the correct post', () => {
      useCommunityStore.getState().setPosts([
        { id: 'p1', userId: 'u1', userName: 'Alex', content: 'Hello', likes: 5, comments: [], createdAt: new Date().toISOString() },
        { id: 'p2', userId: 'u2', userName: 'Maria', content: 'World', likes: 2, comments: [], createdAt: new Date().toISOString() },
      ]);
      useCommunityStore.getState().likePost('p1');
      const { posts } = useCommunityStore.getState();
      expect(posts.find((p) => p.id === 'p1')?.likes).toBe(6);
      expect(posts.find((p) => p.id === 'p2')?.likes).toBe(2);
    });

    it('can like multiple times', () => {
      useCommunityStore.getState().setPosts([
        { id: 'p1', userId: 'u1', userName: 'Alex', content: 'Hi', likes: 0, comments: [], createdAt: new Date().toISOString() },
      ]);
      useCommunityStore.getState().likePost('p1');
      useCommunityStore.getState().likePost('p1');
      expect(useCommunityStore.getState().posts[0].likes).toBe(2);
    });
  });

  describe('addComment', () => {
    beforeEach(() => {
      useCommunityStore.getState().setPosts([
        { id: 'p1', userId: 'u1', userName: 'Alex', content: 'Hello', likes: 0, comments: [], createdAt: new Date().toISOString() },
      ]);
    });

    it('adds comment to the correct post', () => {
      useCommunityStore.getState().addComment('p1', { userId: 'u2', userName: 'Maria', content: 'Great!' });
      const post = useCommunityStore.getState().posts[0];
      expect(post.comments).toHaveLength(1);
      expect(post.comments[0].content).toBe('Great!');
      expect(post.comments[0].id).toBeTruthy();
      expect(post.comments[0].createdAt).toBeTruthy();
    });

    it('appends multiple comments', () => {
      useCommunityStore.getState().addComment('p1', { userId: 'u2', userName: 'Maria', content: 'First comment' });
      useCommunityStore.getState().addComment('p1', { userId: 'u3', userName: 'Dan', content: 'Second comment' });
      expect(useCommunityStore.getState().posts[0].comments).toHaveLength(2);
    });

    it('does not affect other posts', () => {
      useCommunityStore.getState().setPosts([
        { id: 'p1', userId: 'u1', userName: 'Alex', content: 'Post 1', likes: 0, comments: [], createdAt: new Date().toISOString() },
        { id: 'p2', userId: 'u2', userName: 'Maria', content: 'Post 2', likes: 0, comments: [], createdAt: new Date().toISOString() },
      ]);
      useCommunityStore.getState().addComment('p1', { userId: 'u3', userName: 'Dan', content: 'Hi' });
      expect(useCommunityStore.getState().posts[1].comments).toHaveLength(0);
    });
  });

  describe('joinChallenge', () => {
    beforeEach(() => {
      useCommunityStore.getState().setChallenges([
        { id: 'c1', name: 'Plank', nameRo: 'Plank', description: 'Desc', descriptionRo: 'Desc', type: 'daily', duration: 30, target: 30, participants: 100, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
        { id: 'c2', name: 'Run', nameRo: 'Alergare', description: 'Desc', descriptionRo: 'Desc', type: 'weekly', duration: 14, target: 5, participants: 50, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
      ]);
    });

    it('increments participants for the correct challenge', () => {
      useCommunityStore.getState().joinChallenge('c1');
      const challenges = useCommunityStore.getState().challenges;
      expect(challenges.find((c) => c.id === 'c1')?.participants).toBe(101);
      expect(challenges.find((c) => c.id === 'c2')?.participants).toBe(50);
    });

    it('can join multiple times', () => {
      useCommunityStore.getState().joinChallenge('c1');
      useCommunityStore.getState().joinChallenge('c1');
      expect(useCommunityStore.getState().challenges[0].participants).toBe(102);
    });
  });
});
