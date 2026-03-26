/**
 * Firestore Data Sync Service
 *
 * Handles two-way sync between local Zustand stores and Firestore.
 * All operations are no-ops when Firebase is not configured (dev mode).
 *
 * Collections per user:
 *   users/{uid}/workouts          — WorkoutSession[]
 *   users/{uid}/personal_records  — PersonalRecord[]
 *   users/{uid}/weight_log        — WeightEntry[]
 *   users/{uid}/measurements      — MeasurementEntry[]
 *   users/{uid}/photos            — PhotoEntry[]
 *   users/{uid}/meal_plans        — AIMealPlan[]
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage, COLLECTIONS, isFirebaseConfigured } from './firebase';
import type { WorkoutSession, PersonalRecord } from '../types/workout';
import type { AIMealPlan } from './aiMealPlanService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isConfigured = isFirebaseConfigured;

function uid(): string {
  const u = auth.currentUser?.uid;
  if (!u) throw new Error('Not authenticated');
  return u;
}

function colRef(path: string) {
  return collection(db, path);
}

// Strip Firestore Timestamps from objects (convert back to ISO strings)
function cleanDoc<T>(data: any): T {
  const out: any = { ...data };
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Timestamp) {
      out[k] = (v as Timestamp).toDate().toISOString();
    }
  }
  return out as T;
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  if (!isConfigured()) return;
  const path = COLLECTIONS.workouts(uid());
  await setDoc(doc(db, path, session.id), {
    ...session,
    syncedAt: serverTimestamp(),
  });
}

export async function fetchWorkoutHistory(limitN = 100): Promise<WorkoutSession[]> {
  if (!isConfigured()) return [];
  const path = COLLECTIONS.workouts(uid());
  const q = query(colRef(path), orderBy('date', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map((d) => cleanDoc<WorkoutSession>(d.data()));
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  if (!isConfigured()) return;
  await deleteDoc(doc(db, COLLECTIONS.workouts(uid()), id));
}

// ─── Personal Records ─────────────────────────────────────────────────────────

export async function savePersonalRecord(pr: PersonalRecord): Promise<void> {
  if (!isConfigured()) return;
  const path = COLLECTIONS.records(uid());
  await setDoc(doc(db, path, pr.id), {
    ...pr,
    syncedAt: serverTimestamp(),
  });
}

export async function fetchPersonalRecords(): Promise<PersonalRecord[]> {
  if (!isConfigured()) return [];
  const snap = await getDocs(colRef(COLLECTIONS.records(uid())));
  return snap.docs.map((d) => cleanDoc<PersonalRecord>(d.data()));
}

// ─── Weight log ───────────────────────────────────────────────────────────────

export interface WeightEntry { date: string; value: number; id?: string }

export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  if (!isConfigured()) return;
  const id = entry.id ?? entry.date;
  await setDoc(doc(db, COLLECTIONS.weightLog(uid()), id), {
    ...entry,
    id,
    syncedAt: serverTimestamp(),
  });
}

export async function fetchWeightLog(): Promise<WeightEntry[]> {
  if (!isConfigured()) return [];
  const q = query(colRef(COLLECTIONS.weightLog(uid())), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => cleanDoc<WeightEntry>(d.data()));
}

// ─── Measurements ─────────────────────────────────────────────────────────────

export interface MeasurementEntry { date: string; measurements: Record<string, number>; id?: string }

export async function saveMeasurement(entry: MeasurementEntry): Promise<void> {
  if (!isConfigured()) return;
  const id = entry.id ?? entry.date;
  await setDoc(doc(db, COLLECTIONS.measurements(uid()), id), {
    ...entry,
    id,
    syncedAt: serverTimestamp(),
  });
}

export async function fetchMeasurements(): Promise<MeasurementEntry[]> {
  if (!isConfigured()) return [];
  const q = query(colRef(COLLECTIONS.measurements(uid())), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => cleanDoc<MeasurementEntry>(d.data()));
}

// ─── Progress photos ──────────────────────────────────────────────────────────

export async function uploadProgressPhoto(localUri: string, date: string): Promise<string> {
  if (!isConfigured()) return localUri;

  const userId = uid();
  const filename = `${Date.now()}.jpg`;
  const storageRef = ref(storage, `users/${userId}/photos/${filename}`);

  // Fetch the local file and upload as blob
  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const id = `${date}-${Date.now()}`;
  await setDoc(doc(db, COLLECTIONS.photos(userId), id), {
    id, date, uri: downloadUrl, localUri,
    syncedAt: serverTimestamp(),
  });

  return downloadUrl;
}

export async function deleteProgressPhoto(photoId: string, uri: string): Promise<void> {
  if (!isConfigured()) return;
  await deleteDoc(doc(db, COLLECTIONS.photos(uid()), photoId));
  // Best-effort delete from Storage
  try {
    const storageRef = ref(storage, uri);
    await deleteObject(storageRef);
  } catch {
    // ignore — might be a local URI
  }
}

export async function fetchPhotos(): Promise<{ id: string; date: string; uri: string }[]> {
  if (!isConfigured()) return [];
  const q = query(colRef(COLLECTIONS.photos(uid())), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => cleanDoc<{ id: string; date: string; uri: string }>(d.data()));
}

// ─── AI Meal Plans ────────────────────────────────────────────────────────────

export async function saveMealPlanToFirestore(plan: AIMealPlan): Promise<void> {
  if (!isConfigured()) return;
  await setDoc(doc(db, COLLECTIONS.mealPlans(uid()), plan.id), {
    ...plan,
    syncedAt: serverTimestamp(),
  });
}

export async function fetchMealPlans(): Promise<AIMealPlan[]> {
  if (!isConfigured()) return [];
  const q = query(colRef(COLLECTIONS.mealPlans(uid())), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => cleanDoc<AIMealPlan>(d.data()));
}

export const firestoreService = {
  isConfigured,
  saveWorkoutSession,
  fetchWorkoutHistory,
  deleteWorkoutSession,
  savePersonalRecord,
  fetchPersonalRecords,
  saveWeightEntry,
  fetchWeightLog,
  saveMeasurement,
  fetchMeasurements,
  uploadProgressPhoto,
  deleteProgressPhoto,
  fetchPhotos,
  saveMealPlanToFirestore,
  fetchMealPlans,
};

export default firestoreService;
