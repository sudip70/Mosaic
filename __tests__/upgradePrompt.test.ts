import { useUpgradePrompt } from '@/store/useUpgradePrompt';

const reset = () => useUpgradePrompt.setState({ dismissals: 0, lastShownAt: null });

beforeEach(reset);

describe('useUpgradePrompt.canPrompt', () => {
  it('allows a prompt on a fresh install', () => {
    expect(useUpgradePrompt.getState().canPrompt()).toBe(true);
  });

  it('blocks again within the cooldown window after being shown', () => {
    useUpgradePrompt.getState().markShown();
    expect(useUpgradePrompt.getState().canPrompt()).toBe(false);
  });

  it('allows again once the cooldown has elapsed', () => {
    // 4 days ago — past the 3-day cooldown.
    useUpgradePrompt.setState({ lastShownAt: Date.now() - 4 * 24 * 60 * 60 * 1000 });
    expect(useUpgradePrompt.getState().canPrompt()).toBe(true);
  });

  it('stops prompting once dismissed too many times, even after the cooldown', () => {
    useUpgradePrompt.setState({
      dismissals: 3,
      lastShownAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    });
    expect(useUpgradePrompt.getState().canPrompt()).toBe(false);
  });

  it('markDismissed increments the dismissal count', () => {
    useUpgradePrompt.getState().markDismissed();
    expect(useUpgradePrompt.getState().dismissals).toBe(1);
  });
});
