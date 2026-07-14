import { dominantHexes, nearestColorName } from '@/lib/colorUtils';

describe('nearestColorName', () => {
  it('returns a stable, non-empty name for a hex', () => {
    const name = nearestColorName('#FF0000');
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
    // Deterministic for the same input.
    expect(nearestColorName('#FF0000')).toBe(name);
  });

  it('maps distinct hues to distinct names', () => {
    expect(nearestColorName('#FFFFFF')).not.toBe(nearestColorName('#000000'));
  });
});

describe('dominantHexes', () => {
  it('returns colour families heaviest first, each averaged', () => {
    expect(dominantHexes(['#ff0000', '#fe0202', '#00ff00'])).toEqual(['#ff0101', '#00ff00']);
  });

  it('caps the list at max', () => {
    expect(dominantHexes(['#ff0000', '#00ff00', '#0000ff'], 2)).toHaveLength(2);
  });

  it('returns an empty list for an empty input', () => {
    expect(dominantHexes([])).toEqual([]);
  });
});
