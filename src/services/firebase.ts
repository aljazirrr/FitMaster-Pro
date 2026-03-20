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
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY             ?? 'YOUR_API_KEY',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN         ?? 'fitmaster-pro.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID          ?? 'fitmaster-pro',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET      ?? 'fitmaster-pro.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_SENDER_ID',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID              ?? 'YOUR_APP_ID',
};

// ─── Singleton init ───────────────────────────────────────────────────────────

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with AsyncStorage persistence on mobile
let _auth: ReturnType<typeof getAuth>;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  _auth = getAuth(app);
}

export const auth    = _auth;
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;

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
