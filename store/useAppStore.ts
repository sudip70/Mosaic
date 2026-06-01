import { create } from 'zustand';

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
