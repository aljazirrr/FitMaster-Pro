import client from './api';
import { ENDPOINTS } from '../constants/api';
import type { Post, Challenge, LeaderboardEntry, Comment } from '../types/community';

export interface CreatePostPayload {
  content: string;
  imageUrl?: string;
}

export interface AddCommentPayload {
  content: string;
}

export interface FeedParams {
  page?: number;
  limit?: number;
}

const communityService = {
  // ── Feed / Posts ────────────────────────────────────────────────────────────

  /**
   * Fetch the community feed (paginated).
   */
  async getFeed(params: FeedParams = {}): Promise<Post[]> {
    return client.get<Post[]>(ENDPOINTS.community.feed, {
      params: { page: params.page ?? 1, limit: params.limit ?? 20 },
    });
  },

  /**
   * Create a new community post.
   */
  async createPost(payload: CreatePostPayload): Promise<Post> {
    return client.post<Post>(ENDPOINTS.community.posts, payload);
  },

  /**
   * Toggle a like on a post. Backend returns updated like count.
   */
  async likePost(postId: string): Promise<{ likes: number }> {
    return client.post<{ likes: number }>(ENDPOINTS.community.likePost(postId));
  },

  /**
   * Add a comment to a post.
   */
  async addComment(postId: string, payload: AddCommentPayload): Promise<Comment> {
    return client.post<Comment>(
      ENDPOINTS.community.comments(postId),
      payload,
    );
  },

  // ── Challenges ──────────────────────────────────────────────────────────────

  /**
   * Fetch all active challenges.
   */
  async getChallenges(): Promise<Challenge[]> {
    return client.get<Challenge[]>(ENDPOINTS.community.challenges);
  },

  /**
   * Join a challenge. Backend returns the updated challenge (participant count ++).
   */
  async joinChallenge(challengeId: string): Promise<Challenge> {
    return client.post<Challenge>(ENDPOINTS.community.joinChallenge(challengeId));
  },

  // ── Leaderboard ─────────────────────────────────────────────────────────────

  /**
   * Fetch the current leaderboard.
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return client.get<LeaderboardEntry[]>(ENDPOINTS.community.leaderboard);
  },
};

export default communityService;
