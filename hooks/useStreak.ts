import { useStreakStore } from '@/store/useStreakStore';

/** Read-only streak values for display. Mutations go through the store directly. */
export function useStreak() {
  const current = useStreakStore((s) => s.current);
  const longest = useStreakStore((s) => s.longest);
  return { current, longest };
}
