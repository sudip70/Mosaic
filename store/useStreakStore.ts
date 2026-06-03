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
  // Recompute the current streak from the set of dates that still have photos
  // (used after a delete, which can shorten the streak).
  recompute: (presentDates: string[]) => void;
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

      recompute: (presentDates: string[]) =>
        set((state) => {
          const present = new Set(presentDates);
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

          // Streak is "alive" if today or yesterday has a photo.
          let cursor = present.has(todayStr)
            ? todayStr
            : present.has(yesterdayStr)
            ? yesterdayStr
            : null;

          if (!cursor) return { current: 0, lastActiveDate: null };

          let count = 0;
          let c = cursor;
          while (present.has(c)) {
            count++;
            c = format(subDays(parseISO(c), 1), 'yyyy-MM-dd');
          }
          return {
            current: count,
            longest: Math.max(state.longest, count),
            lastActiveDate: cursor,
          };
        }),
    }),
    { name: 'streak', storage: createJSONStorage(() => AsyncStorage) }
  )
);
