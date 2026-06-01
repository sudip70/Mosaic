import { useStreakStore } from '@/store/useStreakStore';

export function useStreak() {
  const current = useStreakStore((s) => s.current);
  const longest = useStreakStore((s) => s.longest);
  const lastActiveDate = useStreakStore((s) => s.lastActiveDate);
  const increment = useStreakStore((s) => s.increment);
  const reset = useStreakStore((s) => s.reset);

  return { current, longest, lastActiveDate, increment, reset };
}
