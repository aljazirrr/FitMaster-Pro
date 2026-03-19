/**
 * Jest manual mock for Firebase SDK.
 * All Firebase operations are no-ops in test environment.
 */

const mockApp = { name: '[DEFAULT]', options: {} };
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(() => () => {}),
};
const mockDb = {};
const mockStorage = {};

// firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => mockApp),
}));

// firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  initializeAuth: jest.fn(() => mockAuth),
  getReactNativePersistence: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com', displayName: 'Test' } })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com', displayName: 'Test' } })),
  signOut: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => () => {}),
}));

// firebase/auth/react-native
jest.mock('firebase/auth/react-native', () => ({
  getReactNativePersistence: jest.fn(() => ({})),
}), { virtual: true });

// firebase/firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  deleteDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn((col) => col),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  serverTimestamp: jest.fn(() => new Date().toISOString()),
  Timestamp: { fromDate: jest.fn((d) => d) },
}));

// firebase/storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => mockStorage),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mock-url.com/photo.jpg')),
  deleteObject: jest.fn(() => Promise.resolve()),
}));

module.exports = {};
