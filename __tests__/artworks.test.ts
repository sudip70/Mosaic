import {
  buildSequence,
  strokeSize,
  strokeTiles,
  progressPhase,
  progressPct,
  tierLabel,
  formatTileCount,
  createChallenge,
  ARTWORKS,
} from '@/lib/artworks';

describe('buildSequence', () => {
  it('returns tiles in order for "sequential"', () => {
    expect(buildSequence(5, 'sequential')).toEqual([0, 1, 2, 3, 4]);
  });

  it('returns a valid permutation of the same indices for "random"', () => {
    const seq = buildSequence(50, 'random');
    expect(seq).toHaveLength(50);
    // Same set of indices, just reordered.
    expect([...seq].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i)
    );
  });

  it('handles the empty case', () => {
    expect(buildSequence(0, 'sequential')).toEqual([]);
  });
});

describe('strokeSize', () => {
  it('sizes the stroke so every run finishes in ~100 photos', () => {
    expect(strokeSize(100)).toBe(1);
    expect(strokeSize(500)).toBe(5);
    expect(strokeSize(3000)).toBe(30);
  });

  it('never drops below one tile per photo', () => {
    expect(strokeSize(1)).toBe(1);
    expect(strokeSize(99)).toBe(1);
  });
});

describe('strokeTiles', () => {
  it('picks the unfilled tiles nearest the captured colour, closest first', () => {
    const targets = ['#ff0000', '#00ff00', '#fe0100', '#0000ff'];
    expect(strokeTiles('#ff0000', targets, {}, 2)).toEqual([0, 2]);
  });

  it('skips already-filled tiles', () => {
    const targets = ['#ff0000', '#00ff00', '#fe0100'];
    expect(strokeTiles('#ff0000', targets, { 0: true }, 2)).toEqual([2, 1]);
  });

  it('clamps to however many tiles remain', () => {
    const targets = ['#ff0000', '#00ff00'];
    expect(strokeTiles('#ff0000', targets, { 0: true }, 5)).toEqual([1]);
    expect(strokeTiles('#ff0000', targets, { 0: true, 1: true }, 5)).toEqual([]);
  });
});

describe('progressPhase / progressPct', () => {
  it('describes the journey by fraction filled', () => {
    expect(progressPhase(0, 100)).toBe('Blank canvas');
    expect(progressPhase(100, 100)).toBe('Complete');
    expect(progressPhase(50, 100)).toBe('Coming into focus');
  });

  it('floors the bar at a visible minimum once any tile is placed', () => {
    expect(progressPct(0, 100)).toBe(0);
    expect(progressPct(1, 100)).toBeGreaterThanOrEqual(3); // small floor
    expect(progressPct(100, 100)).toBe(100);
    expect(progressPct(50, 100)).toBe(50);
  });
});

describe('tierLabel / formatTileCount', () => {
  it('labels by tile count bracket', () => {
    expect(tierLabel(100)).toBe('Loose');
    expect(tierLabel(3000)).toBe('Masterwork');
  });

  it('formats thousands with separators', () => {
    expect(formatTileCount(1000)).toBe('1,000');
    expect(formatTileCount(999)).toBe('999');
  });
});

describe('createChallenge', () => {
  it('builds a fresh active run from an artwork + tier', () => {
    const artwork = ARTWORKS[0];
    // tiers is keyed by tier target (100/500/…), not 0-indexed.
    const tierKey = Number(Object.keys(artwork.tiers)[0]);
    const c = createChallenge(artwork, tierKey, 'sequential');
    expect(c.status).toBe('active');
    expect(c.mode).toBe('compass'); // forgiving capture is the default
    expect(c.artworkId).toBe(artwork.id);
    expect(c.filled).toEqual({});
    expect(c.totalTiles).toBe(artwork.tiers[tierKey].tiles);
    expect(c.sequence).toHaveLength(artwork.tiers[tierKey].tiles);
    expect(c.id).toBeTruthy();
  });
});
