/**
 * Firebase configuration and initialization.
 *
 * Setup:
 *  1. Create a project at https://console.firebase.google.com
 *  2. Enable Authentication → Email/Password
 *  3. Enable Firestore Database (start in production mode)
 *  4. Enable Storage (for progress photos)
 *  5. Add your config values to .env:
 *
 *     EXPO_PUBLIC_FIREBASE_API_KEY=...
 *     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *     EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
 *     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
 *     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
 *     EXPO_PUBLIC_FIREBASE_APP_ID=...
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';

// In Firebase v12 the RN persistence helper is exported at runtime but missing
// from the public type declarations. Use a typed re-export to keep TS happy.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: unknown) => import('firebase/auth').Persistence;
};
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────

const _apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';

/**
 * Returns true only when a real Firebase API key is present.
 * Rejects placeholders like 'YOUR_API_KEY' or the truncated 'AIzaSy...' from .env.example.
 */
export function isFirebaseConfigured(): boolean {
  return _apiKey.length >= 30 && !_apiKey.includes('...') && _apiKey !== 'YOUR_API_KEY';
}

// ─── Singleton init ───────────────────────────────────────────────────────────

// Only initialise Firebase when real credentials are present.
// This prevents auth/api-key-not-valid crashes when .env still has placeholder values.

/* eslint-disable @typescript-eslint/no-explicit-any */
let _app: ReturnType<typeof initializeApp> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;
let _storage: ReturnType<typeof getStorage> | null = null;

if (isFirebaseConfigured()) {
  const firebaseConfig = {
    apiKey:            _apiKey,
    authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN         ?? '',
    projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID          ?? '',
    storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET      ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID              ?? '',
  };

  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  try {
    _auth = initializeAuth(_app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(_app);
  }

  _db      = getFirestore(_app);
  _storage = getStorage(_app);
}

// firebaseAuthService always guards calls with isConfigured(), so null-casting is safe.
export const auth    = _auth    as ReturnType<typeof getAuth>;
export const db      = _db      as ReturnType<typeof getFirestore>;
export const storage = _storage as ReturnType<typeof getStorage>;
export default _app as ReturnType<typeof initializeApp>;

// ─── Firestore paths ──────────────────────────────────────────────────────────

export const COLLECTIONS = {
  users:        'users',
  workouts:     (uid: string) => `users/${uid}/workouts`,
  records:      (uid: string) => `users/${uid}/personal_records`,
  weightLog:    (uid: string) => `users/${uid}/weight_log`,
  measurements: (uid: string) => `users/${uid}/measurements`,
  photos:       (uid: string) => `users/${uid}/photos`,
  mealPlans:    (uid: string) => `users/${uid}/meal_plans`,
} as const;
