import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post, Challenge, LeaderboardEntry, Comment } from '../types/community';
import communityService from '../services/communityService';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface CommunityState {
  posts: Post[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  isSyncing: boolean;
  page: number;
  hasMore: boolean;
}

interface CommunityActions {
  // ── Local (sync) actions ──────────────────────────────────────────────────
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  joinChallenge: (challengeId: string) => void;
  setPosts: (posts: Post[]) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;

  // ── Async actions ─────────────────────────────────────────────────────────
  fetchFeedAsync: (refresh?: boolean) => Promise<void>;
  createPostAsync: (content: string, imageUrl?: string) => Promise<void>;
  likePostAsync: (postId: string) => Promise<void>;
  addCommentAsync: (postId: string, content: string) => Promise<void>;
  fetchChallengesAsync: () => Promise<void>;
  joinChallengeAsync: (challengeId: string) => Promise<void>;
  fetchLeaderboardAsync: () => Promise<void>;
}

export const useCommunityStore = create<CommunityState & CommunityActions>()(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────────
      posts: [],
      challenges: [],
      leaderboard: [],
      isSyncing: false,
      page: 1,
      hasMore: true,

      // ── Local actions ──────────────────────────────────────────────────────

      addPost: (postData) =>
        set((state) => ({
          posts: [
            { ...postData, id: generateId(), likes: 0, comments: [], createdAt: new Date().toISOString() },
            ...state.posts,
          ],
        })),

      likePost: (postId) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)),
        })),

      addComment: (postId, commentData) =>
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            const newComment: Comment = { ...commentData, id: generateId(), createdAt: new Date().toISOString() };
            return { ...p, comments: [...p.comments, newComment] };
          }),
        })),

      joinChallenge: (challengeId) =>
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === challengeId ? { ...c, participants: c.participants + 1 } : c,
          ),
        })),

      setPosts: (posts) => set({ posts }),
      setChallenges: (challenges) => set({ challenges }),
      setLeaderboard: (entries) => set({ leaderboard: entries }),

      // ── Async actions ──────────────────────────────────────────────────────

      fetchFeedAsync: async (refresh = false) => {
        const { page } = get();
        const nextPage = refresh ? 1 : page;
        set({ isSyncing: true });
        try {
          const newPosts = await communityService.getFeed({ page: nextPage, limit: 20 });
          set((state) => ({
            posts: refresh ? newPosts : [...state.posts, ...newPosts],
            page: nextPage + 1,
            hasMore: newPosts.length === 20,
            isSyncing: false,
          }));
        } catch {
          set({ isSyncing: false });
        }
      },

      createPostAsync: async (content, imageUrl) => {
        // Optimistic local post
        get().addPost({ userId: 'me', userName: 'You', content, imageUrl });
        try {
          const serverPost = await communityService.createPost({ content, imageUrl });
          // Swap the optimistic entry with the server's canonical post
          set((state) => ({
            posts: [serverPost, ...state.posts.slice(1)],
          }));
        } catch {
          // Remove optimistic post on failure
          set((state) => ({ posts: state.posts.slice(1) }));
          throw new Error('Failed to create post');
        }
      },

      likePostAsync: async (postId) => {
        // Optimistic
        get().likePost(postId);
        try {
          const { likes } = await communityService.likePost(postId);
          set((state) => ({
            posts: state.posts.map((p) => (p.id === postId ? { ...p, likes } : p)),
          }));
        } catch {
          // Undo optimistic like
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p,
            ),
          }));
        }
      },

      addCommentAsync: async (postId, content) => {
        try {
          const comment = await communityService.addComment(postId, { content });
          set((state) => ({
            posts: state.posts.map((p) => {
              if (p.id !== postId) return p;
              return { ...p, comments: [...p.comments, comment] };
            }),
          }));
        } catch {
          throw new Error('Failed to add comment');
        }
      },

      fetchChallengesAsync: async () => {
        try {
          const challenges = await communityService.getChallenges();
          set({ challenges });
        } catch {
          // Keep local data
        }
      },

      joinChallengeAsync: async (challengeId) => {
        // Optimistic
        get().joinChallenge(challengeId);
        try {
          const updated = await communityService.joinChallenge(challengeId);
          set((state) => ({
            challenges: state.challenges.map((c) => (c.id === challengeId ? updated : c)),
          }));
        } catch {
          // Undo optimistic join
          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === challengeId ? { ...c, participants: c.participants - 1 } : c,
            ),
          }));
          throw new Error('Failed to join challenge');
        }
      },

      fetchLeaderboardAsync: async () => {
        try {
          const leaderboard = await communityService.getLeaderboard();
          set({ leaderboard });
        } catch {
          // Keep local data
        }
      },
    }),
    {
      name: 'fitmaster-community',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        posts: state.posts,
        challenges: state.challenges,
        leaderboard: state.leaderboard,
      }),
    },
  ),
);

export default useCommunityStore;
