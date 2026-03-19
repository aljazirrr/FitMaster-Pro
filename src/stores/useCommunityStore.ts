import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post, Challenge, LeaderboardEntry, Comment } from '../types/community';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

interface CommunityState {
  posts: Post[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
}

interface CommunityActions {
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  joinChallenge: (challengeId: string) => void;
  setPosts: (posts: Post[]) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
}

export const useCommunityStore = create<CommunityState & CommunityActions>()(
  persist(
    (set) => ({
      // State
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
            { id: 'c3', userId: 'user-demo-4', userName: 'Elena Fit', content: 'Inspirational!', createdAt: new Date(Date.now() - 1800000).toISOString() },
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
          comments: [
            { id: 'c5', userId: 'user-demo-2', userName: 'Maria Runner', content: 'Share the recipes!', createdAt: new Date(Date.now() - 12000000).toISOString() },
            { id: 'c6', userId: 'user-demo-1', userName: 'Alex Fitness', content: 'Consistency is key', createdAt: new Date(Date.now() - 10000000).toISOString() },
          ],
          createdAt: new Date(Date.now() - 14400000).toISOString(),
        },
      ],
      challenges: [
        {
          id: 'c1',
          name: '30-Day Plank Challenge',
          nameRo: 'Provocare Plank 30 Zile',
          description: 'Hold a plank every day, increasing duration each week',
          descriptionRo: 'Ține planul în fiecare zi, crescând durata săptămânal',
          type: 'daily',
          duration: 30,
          target: 30,
          participants: 156,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        {
          id: 'c2',
          name: '100 Push-Ups a Day',
          nameRo: '100 Flotări pe Zi',
          description: 'Complete 100 push-ups every day for 2 weeks',
          descriptionRo: 'Completează 100 de flotări în fiecare zi timp de 2 săptămâni',
          type: 'daily',
          duration: 14,
          target: 14,
          participants: 89,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        },
        {
          id: 'c3',
          name: 'Weight Loss Challenge',
          nameRo: 'Provocare Pierdere în Greutate',
          description: 'Lose 5kg in 8 weeks with consistent training and nutrition',
          descriptionRo: 'Pierde 5kg în 8 săptămâni cu antrenament și nutriție consistente',
          type: 'weekly',
          duration: 56,
          target: 5,
          participants: 234,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 56 * 86400000).toISOString(),
        },
      ],
      leaderboard: [
        { rank: 1, userId: 'u1', userName: 'Andrei Power', score: 45200, label: 'kg volume' },
        { rank: 2, userId: 'u2', userName: 'Elena Fit', score: 38900, label: 'kg volume' },
        { rank: 3, userId: 'u3', userName: 'Mihai Lift', score: 35100, label: 'kg volume' },
        { rank: 4, userId: 'u4', userName: 'Sofia Strong', score: 31200, label: 'kg volume' },
        { rank: 5, userId: 'u5', userName: 'Cristian G', score: 28800, label: 'kg volume' },
        { rank: 6, userId: 'u6', userName: 'Ana Maria', score: 26400, label: 'kg volume' },
        { rank: 7, userId: 'u7', userName: 'Radu Muscle', score: 24100, label: 'kg volume' },
        { rank: 8, userId: 'u8', userName: 'Ioana Run', score: 22300, label: 'kg volume' },
        { rank: 9, userId: 'u9', userName: 'Dan Vegan', score: 19800, label: 'kg volume' },
        { rank: 10, userId: 'u10', userName: 'Laura Coach', score: 17500, label: 'kg volume' },
      ],

      // Actions
      addPost: (postData) =>
        set((state) => {
          const newPost: Post = {
            ...postData,
            id: generateId(),
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString(),
          };
          return { posts: [newPost, ...state.posts] };
        }),

      likePost: (postId: string) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p,
          ),
        })),

      addComment: (postId: string, commentData) =>
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            const newComment: Comment = {
              ...commentData,
              id: generateId(),
              createdAt: new Date().toISOString(),
            };
            return { ...p, comments: [...p.comments, newComment] };
          }),
        })),

      joinChallenge: (challengeId: string) =>
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === challengeId
              ? { ...c, participants: c.participants + 1 }
              : c,
          ),
        })),

      setPosts: (posts: Post[]) => set({ posts }),
      setChallenges: (challenges: Challenge[]) => set({ challenges }),
      setLeaderboard: (entries: LeaderboardEntry[]) => set({ leaderboard: entries }),
    }),
    {
      name: 'fitmaster-community',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useCommunityStore;
