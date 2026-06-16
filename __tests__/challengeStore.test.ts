import { useChallengeStore } from '@/store/useChallengeStore';
import type { Challenge, FilledTile } from '@/types';

// A small 3-tile run so completion is easy to drive.
const mkChallenge = (over: Partial<Challenge> = {}): Challenge => ({
  id: 'c1',
  artworkId: 'starry-night',
  artworkTitle: 'The Starry Night',
  artworkArtist: 'Vincent van Gogh',
  tier: 100,
  totalTiles: 3,
  cols: 3,
  rows: 1,
  order: 'sequential',
  sequence: [0, 1, 2],
  startDate: '2026-01-01',
  status: 'active',
  filled: {},
  ...over,
});

const tile = (over: Partial<FilledTile> = {}): FilledTile => ({
  date: '2026-01-02',
  hex: '#abc123',
  photoCount: 1,
  ...over,
});

beforeEach(() => {
  useChallengeStore.setState({ active: null, history: [], pinnedIds: [] });
});

describe('fillNextTile', () => {
  it('is a no-op (false) when there is no active run', () => {
    expect(useChallengeStore.getState().fillNextTile(tile())).toBe(false);
  });

  it('fills tiles in sequence order and stores the photo uri', () => {
    useChallengeStore.setState({ active: mkChallenge() });
    const ok = useChallengeStore.getState().fillNextTile(tile({ uri: 'file://0.jpg' }));
    expect(ok).toBe(true);
    expect(useChallengeStore.getState().active!.filled[0]).toEqual(tile({ uri: 'file://0.jpg' }));

    useChallengeStore.getState().fillNextTile(tile({ uri: 'file://1.jpg' }));
    expect(Object.keys(useChallengeStore.getState().active!.filled)).toEqual(['0', '1']);
  });

  it('auto-completes the run on the final tile (active cleared, moved to history)', () => {
    useChallengeStore.setState({ active: mkChallenge() });
    const fill = useChallengeStore.getState().fillNextTile;
    expect(fill(tile())).toBe(true);
    expect(fill(tile())).toBe(true);
    expect(fill(tile())).toBe(true); // third of three

    const { active, history } = useChallengeStore.getState();
    expect(active).toBeNull();
    expect(history[0].status).toBe('completed');
    expect(history[0].completedAt).toBeTruthy();
    expect(Object.keys(history[0].filled)).toHaveLength(3);
  });
});

describe('clearTilePhoto', () => {
  it('drops the photo uri but keeps the tile colour on the active run', () => {
    useChallengeStore.setState({
      active: mkChallenge({ filled: { 0: tile({ uri: 'file://x.jpg' }) } }),
    });
    useChallengeStore.getState().clearTilePhoto('c1', 0);

    const t = useChallengeStore.getState().active!.filled[0];
    expect(t.uri).toBeUndefined();
    expect(t).toEqual({ date: '2026-01-02', hex: '#abc123', photoCount: 1 });
  });

  it('works on a run in history', () => {
    useChallengeStore.setState({
      active: null,
      history: [mkChallenge({ id: 'h1', status: 'completed', filled: { 2: tile({ uri: 'file://y.jpg' }) } })],
    });
    useChallengeStore.getState().clearTilePhoto('h1', 2);

    const t = useChallengeStore.getState().history[0].filled[2];
    expect(t.uri).toBeUndefined();
    expect(t.hex).toBe('#abc123');
  });

  it('is a no-op when the tile has no photo', () => {
    useChallengeStore.setState({ active: mkChallenge({ filled: { 0: tile() } }) });
    const before = useChallengeStore.getState().active;
    useChallengeStore.getState().clearTilePhoto('c1', 0);
    // unchanged reference is not required, but contents must match
    expect(useChallengeStore.getState().active!.filled[0]).toEqual(tile());
    expect(before).toBeTruthy();
  });
});
