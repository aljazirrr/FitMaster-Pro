/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.ts', '**/src/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-router$': '<rootDir>/__mocks__/expo-router.js',
    '^@anthropic-ai/sdk$': '<rootDir>/__mocks__/@anthropic-ai/sdk.js',
    '^expo-speech$': '<rootDir>/__mocks__/expo-speech.js',
    '^expo-camera$': '<rootDir>/__mocks__/expo-camera.js',
    // Firebase — mock all sub-modules in tests
    '^firebase/app$': '<rootDir>/__mocks__/firebase/app.js',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase/auth.js',
    '^firebase/auth/react-native$': '<rootDir>/__mocks__/firebase/auth-react-native.js',
    '^firebase/firestore$': '<rootDir>/__mocks__/firebase/firestore.js',
    '^firebase/storage$': '<rootDir>/__mocks__/firebase/storage.js',
  },
  // Don't transform node_modules except zustand (ESM)
  transformIgnorePatterns: [
    'node_modules/(?!(zustand)/)',
  ],
};
