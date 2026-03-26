/**
 * Firebase Authentication Service
 *
 * Drop-in replacement for authService when EXPO_PUBLIC_FIREBASE_API_KEY is set.
 * Falls back gracefully to local mock mode when Firebase is not configured.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, COLLECTIONS, isFirebaseConfigured } from './firebase';
import type { UserProfile } from '../types/user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isConfigured = isFirebaseConfigured;

function fbUserToProfile(fbUser: FirebaseUser, extra?: Partial<UserProfile>): UserProfile {
  return {
    id: fbUser.uid,
    name: fbUser.displayName ?? extra?.name ?? 'User',
    email: fbUser.email ?? '',
    avatar: fbUser.photoURL ?? undefined,
    goals: extra?.goals ?? ['build_muscle'],
    measurements: extra?.measurements ?? {
      weight: 75, height: 175, age: 25, gender: 'male',
    },
    experience: extra?.experience ?? 'intermediate',
    activityLevel: extra?.activityLevel ?? 'active',
    equipment: extra?.equipment ?? [],
    dietPreference: extra?.dietPreference ?? 'standard',
    language: extra?.language ?? 'en',
    theme: extra?.theme ?? 'dark',
    unitSystem: extra?.unitSystem ?? 'metric',
    isPremium: extra?.isPremium ?? false,
    streakDays: extra?.streakDays ?? 0,
    achievements: extra?.achievements ?? [],
    joinDate: extra?.joinDate ?? new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const firebaseAuthService = {
  /**
   * Register with email + password. Creates a Firestore user document.
   */
  async register(name: string, email: string, password: string): Promise<UserProfile> {
    if (!isConfigured()) throw new Error('Firebase not configured');

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const profile = fbUserToProfile(cred.user, { name, joinDate: new Date().toISOString() });

    // Persist profile to Firestore
    await setDoc(doc(db, COLLECTIONS.users, cred.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return profile;
  },

  /**
   * Sign in with email + password.
   */
  async login(email: string, password: string): Promise<UserProfile> {
    if (!isConfigured()) throw new Error('Firebase not configured');

    const cred = await signInWithEmailAndPassword(auth, email, password);
    return this.getProfile(cred.user.uid);
  },

  /**
   * Sign out the current user.
   */
  async logout(): Promise<void> {
    if (!isConfigured()) return;
    await signOut(auth);
  },

  /**
   * Fetch user profile from Firestore.
   */
  async getProfile(uid?: string): Promise<UserProfile> {
    if (!isConfigured()) throw new Error('Firebase not configured');

    const id = uid ?? auth.currentUser?.uid;
    if (!id) throw new Error('Not authenticated');

    const snap = await getDoc(doc(db, COLLECTIONS.users, id));
    if (!snap.exists()) {
      // Profile missing — rebuild from Firebase Auth
      const fbUser = auth.currentUser!;
      return fbUserToProfile(fbUser);
    }
    return snap.data() as UserProfile;
  },

  /**
   * Update the current user's profile in Firestore.
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!isConfigured()) throw new Error('Firebase not configured');

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    await updateDoc(doc(db, COLLECTIONS.users, uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return this.getProfile(uid);
  },

  /**
   * Subscribe to Firebase auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (!isConfigured()) return () => {};

    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      try {
        const profile = await firebaseAuthService.getProfile(fbUser.uid);
        callback(profile);
      } catch {
        callback(fbUserToProfile(fbUser));
      }
    });
  },

  /** True when a real Firebase project is configured */
  isConfigured,
};

export default firebaseAuthService;
