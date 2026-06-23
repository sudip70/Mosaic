import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from '@/lib/constants';

interface AppStore {
  // null = not yet read from storage; boolean = known state
  onboarded: boolean | null;
  setOnboarded: (v: boolean) => void;
}

/**
 * Lightweight app-level flags shared between the root layout and screens.
 * Keeping `onboarded` here (rather than local state in the layout) lets the
 * onboarding screen flip it synchronously, avoiding a redirect loop.
 */
export const useAppStore = create<AppStore>((set) => ({
  onboarded: null,
  setOnboarded: (onboarded) => set({ onboarded }),
}));

/**
 * Marks onboarding complete: flips the in-memory flag synchronously (so the
 * root layout won't redirect back) and persists it. Shared by the onboarding
 * screen and the auth screens, since an account can be created mid-onboarding.
 */
export async function markOnboarded() {
  useAppStore.getState().setOnboarded(true);
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
