/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Mirror the tsconfig "@/*" path alias so tests can import like the app does.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Only run our own unit tests, not anything inside installed packages.
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  // The persisted Zustand stores kick off async AsyncStorage hydration on import,
  // which leaves a harmless open handle after the (synchronous) assertions finish.
  // Force a clean exit rather than warn on every run.
  forceExit: true,
};
