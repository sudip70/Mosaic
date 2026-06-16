import { nearestColorName } from '@/lib/colorUtils';

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
