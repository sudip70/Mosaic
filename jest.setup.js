// Persisted Zustand stores read/write AsyncStorage; use its official in-memory
// mock so store logic can be unit-tested without a native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// expo-crypto is a native module; createChallenge() and the challenge store pull
// randomUUID through it. Provide a deterministic JS id so tests don't depend on
// native and ids stay unique within a run.
// Must be prefixed with `mock` — jest hoists the factory above other code and
// only allows out-of-scope refs that start with `mock`.
let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `test-uuid-${++mockUuidCounter}`,
}));
