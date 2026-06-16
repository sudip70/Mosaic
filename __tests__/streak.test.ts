import { format, subDays } from 'date-fns';
import { useStreakStore } from '@/store/useStreakStore';

// Relative date helper: d(0) = today, d(1) = yesterday, …
const d = (offset: number) => format(subDays(new Date(), offset), 'yyyy-MM-dd');

beforeEach(() => {
  useStreakStore.setState({ current: 0, longest: 0, lastActiveDate: null });
});

describe('increment', () => {
  it('starts a streak at 1 on the first active day', () => {
    useStreakStore.getState().increment('2026-01-01');
    expect(useStreakStore.getState()).toMatchObject({ current: 1, longest: 1, lastActiveDate: '2026-01-01' });
  });

  it('grows on consecutive days', () => {
    useStreakStore.getState().increment('2026-01-01');
    useStreakStore.getState().increment('2026-01-02');
    expect(useStreakStore.getState()).toMatchObject({ current: 2, longest: 2 });
  });

  it('resets to 1 after a gap but keeps the longest', () => {
    useStreakStore.getState().increment('2026-01-01');
    useStreakStore.getState().increment('2026-01-02'); // current 2, longest 2
    useStreakStore.getState().increment('2026-01-05'); // gap
    expect(useStreakStore.getState()).toMatchObject({ current: 1, longest: 2 });
  });

  it('is idempotent for the same day', () => {
    useStreakStore.getState().increment('2026-01-05');
    useStreakStore.getState().increment('2026-01-05');
    expect(useStreakStore.getState().current).toBe(1);
  });
});

describe('recompute', () => {
  it('counts back through consecutive days when today is present', () => {
    useStreakStore.getState().recompute([d(0), d(1), d(2)]);
    expect(useStreakStore.getState().current).toBe(3);
  });

  it('keeps the streak alive when only yesterday is present', () => {
    useStreakStore.getState().recompute([d(1)]);
    expect(useStreakStore.getState().current).toBe(1);
  });

  it('drops to 0 when neither today nor yesterday is present', () => {
    useStreakStore.getState().recompute([d(3), d(4)]);
    expect(useStreakStore.getState()).toMatchObject({ current: 0, lastActiveDate: null });
  });

  it('never lowers the recorded longest', () => {
    useStreakStore.setState({ current: 0, longest: 5, lastActiveDate: null });
    useStreakStore.getState().recompute([d(0)]);
    expect(useStreakStore.getState()).toMatchObject({ current: 1, longest: 5 });
  });
});
