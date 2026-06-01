import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays, parseISO } from 'date-fns';

interface StreakStore {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  // Pass today's date string so increment is idempotent and date-aware.
  increment: (date: string) => void;
  reset: () => void;
}

export const useStreakStore = create<StreakStore>()(
  persist(
    (set) => ({
      current: 0,
      longest: 0,
      lastActiveDate: null,

      increment: (date: string) =>
        set((state) => {
          // Already counted today — idempotent.
          if (state.lastActiveDate === date) return state;

          const yesterday = format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
          const isConsecutive = state.lastActiveDate === yesterday;
          const next = isConsecutive ? state.current + 1 : 1;

          return {
            current: next,
            longest: Math.max(next, state.longest),
            lastActiveDate: date,
          };
        }),

      reset: () => set({ current: 0, lastActiveDate: null }),
    }),
    { name: 'streak', storage: createJSONStorage(() => AsyncStorage) }
  )
);
