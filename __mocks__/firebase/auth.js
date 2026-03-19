const mockAuth = { currentUser: null };
module.exports = {
  getAuth: jest.fn(() => mockAuth),
  initializeAuth: jest.fn(() => mockAuth),
  getReactNativePersistence: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com', displayName: 'Test User' } }),
  ),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com', displayName: 'Test User' } }),
  ),
  signOut: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(() => () => {}),
};
