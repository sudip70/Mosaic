import { useChallengeStore } from '@/store/useChallengeStore';
import { ARTWORKS, createChallenge } from '@/lib/artworks';
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
  useChallengeStore.setState({ active: null, history: [], pinnedIds: [], lastStroke: null });
});

describe('fillStroke', () => {
  it('is a no-op when there is no active run', () => {
    expect(useChallengeStore.getState().fillStroke(tile())).toBe('no-op');
  });

  // The test challenge's tile count doesn't match its artwork's tier data, so
  // these runs exercise the sequence fallback (one tile per photo on small runs).
  it('fills tiles in sequence order and stores the photo uri', () => {
    useChallengeStore.setState({ active: mkChallenge() });
    const placed = useChallengeStore.getState().fillStroke(tile({ uri: 'file://0.jpg' }));
    expect(placed).toBe('filled');
    expect(useChallengeStore.getState().active!.filled[0]).toEqual(tile({ uri: 'file://0.jpg' }));

    useChallengeStore.getState().fillStroke(tile({ uri: 'file://1.jpg' }));
    expect(Object.keys(useChallengeStore.getState().active!.filled)).toEqual(['0', '1']);
  });

  it('paints a multi-tile stroke on large runs, with the photo uri on the anchor only', () => {
    useChallengeStore.setState({
      active: mkChallenge({
        artworkId: 'not-a-real-artwork',
        totalTiles: 300,
        cols: 30,
        rows: 10,
        sequence: Array.from({ length: 300 }, (_, i) => i),
      }),
    });
    const placed = useChallengeStore.getState().fillStroke(tile({ uri: 'file://a.jpg' }));
    expect(placed).toBe('filled');

    const filled = useChallengeStore.getState().active!.filled;
    expect(Object.keys(filled)).toHaveLength(3); // ceil(300 / 100) tiles per photo
    expect(filled[0].uri).toBe('file://a.jpg');
    expect(filled[1].uri).toBeUndefined();
    expect(filled[2].uri).toBeUndefined();
    expect(filled[1].hex).toBe('#abc123');
    // The stroke is remembered so the grid can glow where it landed.
    expect(useChallengeStore.getState().lastStroke).toEqual({
      challengeId: 'c1',
      indices: [0, 1, 2],
    });
  });

  it('hunt mode rejects a colour with no close tile match, compass mode accepts it', () => {
    const artwork = ARTWORKS[0];
    const tierKey = Number(Object.keys(artwork.tiers)[0]);
    // Neon magenta appears in no muted painting palette; an exact target always lands.
    const magenta = '#ff00ff';
    const target = artwork.tiers[tierKey].colors[0];

    useChallengeStore.setState({ active: createChallenge(artwork, tierKey, 'sequential', 'hunt') });
    expect(useChallengeStore.getState().fillStroke(tile({ hex: magenta }))).toBe('no-match');
    expect(useChallengeStore.getState().active!.filled).toEqual({});
    expect(useChallengeStore.getState().fillStroke(tile({ hex: target }))).toBe('filled');

    useChallengeStore.setState({ active: createChallenge(artwork, tierKey, 'sequential', 'compass') });
    expect(useChallengeStore.getState().fillStroke(tile({ hex: magenta }))).toBe('filled');
  });

  it('auto-completes the run on the final tile (active cleared, moved to history)', () => {
    useChallengeStore.setState({ active: mkChallenge() });
    const fill = useChallengeStore.getState().fillStroke;
    expect(fill(tile())).toBe('filled');
    expect(fill(tile())).toBe('filled');
    expect(fill(tile())).toBe('filled'); // third of three

    const { active, history } = useChallengeStore.getState();
    expect(active).toBeNull();
    expect(history[0].status).toBe('completed');
    expect(history[0].completedAt).toBeTruthy();
    expect(Object.keys(history[0].filled)).toHaveLength(3);
  });
});

describe('rename', () => {
  it('retitles the active run, trimming whitespace', () => {
    useChallengeStore.setState({ active: mkChallenge() });
    useChallengeStore.getState().rename('c1', '  Our Night Sky  ');
    expect(useChallengeStore.getState().active!.artworkTitle).toBe('Our Night Sky');
  });

  it('retitles a run in history', () => {
    useChallengeStore.setState({ history: [mkChallenge({ id: 'h1', status: 'completed' })] });
    useChallengeStore.getState().rename('h1', 'Summer piece');
    expect(useChallengeStore.getState().history[0].artworkTitle).toBe('Summer piece');
  });

  it('ignores an empty title', () => {
    useChallengeStore.setState({ active: mkChallenge() });
    useChallengeStore.getState().rename('c1', '   ');
    expect(useChallengeStore.getState().active!.artworkTitle).toBe('The Starry Night');
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
