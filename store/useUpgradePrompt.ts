import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Throttles the contextual "create an account" nudge so a high-intent moment
// (a streak milestone, a finished mosaic) can invite conversion without nagging.
// Once someone has an account the caller stops checking entirely; this store
// only governs how often we ask while still anonymous.

const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // wait 3 days between asks
const MAX_DISMISSALS = 3;                     // then stop nudging; Settings remains

interface UpgradePromptState {
  dismissals: number;
  lastShownAt: number | null;
  /** True when enough time has passed and we haven't been waved off too often. */
  canPrompt: () => boolean;
  markShown: () => void;
  markDismissed: () => void;
}

export const useUpgradePrompt = create<UpgradePromptState>()(
  persist(
    (set, get) => ({
      dismissals: 0,
      lastShownAt: null,
      canPrompt: () => {
        const { dismissals, lastShownAt } = get();
        if (dismissals >= MAX_DISMISSALS) return false;
        if (lastShownAt && Date.now() - lastShownAt < COOLDOWN_MS) return false;
        return true;
      },
      markShown: () => set({ lastShownAt: Date.now() }),
      markDismissed: () => set((s) => ({ dismissals: s.dismissals + 1 })),
    }),
    { name: 'upgrade_prompt', storage: createJSONStorage(() => AsyncStorage) }
  )
);
