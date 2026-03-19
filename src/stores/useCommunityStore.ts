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
      posts: [
        {
          id: '1',
          userId: 'user-demo-1',
          userName: 'Alex Fitness',
          content: 'Just hit a new PR on bench press! 100kg x 5 reps',
          likes: 24,
          comments: [
            { id: 'c1', userId: 'user-demo-2', userName: 'Maria Runner', content: 'Amazing work!', createdAt: new Date(Date.now() - 3000000).toISOString() },
            { id: 'c2', userId: 'user-demo-3', userName: 'Dan Strong', content: 'Keep pushing!', createdAt: new Date(Date.now() - 2400000).toISOString() },
          ],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          userId: 'user-demo-2',
          userName: 'Maria Runner',
          content: 'Completed my first 10K run today! Feeling amazing',
          likes: 42,
          comments: [
            { id: 'c4', userId: 'user-demo-1', userName: 'Alex Fitness', content: 'Well done!', createdAt: new Date(Date.now() - 6000000).toISOString() },
          ],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '3',
          userId: 'user-demo-3',
          userName: 'Dan Strong',
          content: 'Meal prep Sunday done! 5 days of clean eating ready to go',
          likes: 15,
          comments: [],
          createdAt: new Date(Date.now() - 14400000).toISOString(),
        },
      ],
      challenges: [
        { id: 'c1', name: '30-Day Plank Challenge', nameRo: 'Provocare Plank 30 Zile', description: 'Hold a plank every day, increasing duration each week', descriptionRo: 'Ține planul în fiecare zi, crescând durata săptămânal', type: 'daily', duration: 30, target: 30, participants: 156, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString() },
        { id: 'c2', name: '100 Push-Ups a Day', nameRo: '100 Flotări pe Zi', description: 'Complete 100 push-ups every day for 2 weeks', descriptionRo: 'Completează 100 de flotări în fiecare zi timp de 2 săptămâni', type: 'daily', duration: 14, target: 14, participants: 89, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 14 * 86400000).toISOString() },
        { id: 'c3', name: 'Weight Loss Challenge', nameRo: 'Provocare Pierdere în Greutate', description: 'Lose 5kg in 8 weeks with consistent training and nutrition', descriptionRo: 'Pierde 5kg în 8 săptămâni cu antrenament și nutriție consistente', type: 'weekly', duration: 56, target: 5, participants: 234, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 56 * 86400000).toISOString() },
      ],
      leaderboard: [
        { rank: 1, userId: 'u1', userName: 'Andrei Power', score: 45200, label: 'kg volume' },
        { rank: 2, userId: 'u2', userName: 'Elena Fit', score: 38900, label: 'kg volume' },
        { rank: 3, userId: 'u3', userName: 'Mihai Lift', score: 35100, label: 'kg volume' },
        { rank: 4, userId: 'u4', userName: 'Sofia Strong', score: 31200, label: 'kg volume' },
        { rank: 5, userId: 'u5', userName: 'Cristian G', score: 28800, label: 'kg volume' },
      ],
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
