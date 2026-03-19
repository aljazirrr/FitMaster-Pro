/**
 * API configuration constants.
 * Set EXPO_PUBLIC_API_URL in your .env file to point at your backend.
 * Example: EXPO_PUBLIC_API_URL=https://api.fitmaster.pro/v1
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'https://api.fitmaster.pro/v1';

export const API_TIMEOUT_MS = 15_000;

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  // Workouts
  workouts: {
    list: '/workouts',
    create: '/workouts',
    byId: (id: string) => `/workouts/${id}`,
    personalRecords: '/workouts/personal-records',
  },
  // Nutrition
  nutrition: {
    dailyLog: (date: string) => `/nutrition/log/${date}`,
    mealEntry: (date: string, mealType: string) =>
      `/nutrition/log/${date}/meals/${mealType}`,
    mealEntryById: (date: string, mealType: string, entryId: string) =>
      `/nutrition/log/${date}/meals/${mealType}/${entryId}`,
    water: (date: string) => `/nutrition/log/${date}/water`,
    targets: (date: string) => `/nutrition/log/${date}/targets`,
    foodSearch: '/nutrition/foods/search',
  },
  // Community
  community: {
    feed: '/community/feed',
    posts: '/community/posts',
    postById: (id: string) => `/community/posts/${id}`,
    likePost: (id: string) => `/community/posts/${id}/like`,
    comments: (postId: string) => `/community/posts/${postId}/comments`,
    challenges: '/community/challenges',
    joinChallenge: (id: string) => `/community/challenges/${id}/join`,
    leaderboard: '/community/leaderboard',
  },
  // Progress
  progress: {
    weight: '/progress/weight',
    measurements: '/progress/measurements',
    photos: '/progress/photos',
  },
} as const;

/** AsyncStorage key for the JWT access token */
export const TOKEN_STORAGE_KEY = 'fitmaster-access-token';
/** AsyncStorage key for the refresh token */
export const REFRESH_TOKEN_STORAGE_KEY = 'fitmaster-refresh-token';
