import {
  buildSequence,
  nextTileIndexFor,
  progressPhase,
  progressPct,
  tierLabel,
  formatTileCount,
  createChallenge,
  ARTWORKS,
} from '@/lib/artworks';
import type { Challenge } from '@/types';

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

describe('nextTileIndexFor', () => {
  const make = (total: number, filledCount: number): Challenge => ({
    id: 'c1',
    artworkId: 'a',
    artworkTitle: 't',
    artworkArtist: 'x',
    tier: 0,
    totalTiles: total,
    cols: total,
    rows: 1,
    order: 'sequential',
    sequence: Array.from({ length: total }, (_, i) => i),
    startDate: '2026-01-01',
    status: 'active',
    filled: Object.fromEntries(
      Array.from({ length: filledCount }, (_, i) => [i, { date: '2026-01-01', hex: '#000', photoCount: 1 }])
    ),
  });

  it('points at the tile at the current filled count', () => {
    expect(nextTileIndexFor(make(10, 0))).toBe(0);
    expect(nextTileIndexFor(make(10, 3))).toBe(3);
  });

  it('returns null once every tile is filled', () => {
    expect(nextTileIndexFor(make(4, 4))).toBeNull();
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
    expect(c.artworkId).toBe(artwork.id);
    expect(c.filled).toEqual({});
    expect(c.totalTiles).toBe(artwork.tiers[tierKey].tiles);
    expect(c.sequence).toHaveLength(artwork.tiers[tierKey].tiles);
    expect(c.id).toBeTruthy();
  });
});
