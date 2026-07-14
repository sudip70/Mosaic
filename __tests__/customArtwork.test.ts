import { gridFor, tileAverages } from '@/lib/customArtwork';

// A tiny RGBA bitmap helper: rows of [r,g,b] pixels.
const rgba = (pixels: number[][]) => {
  const out = new Uint8Array(pixels.length * 4);
  pixels.forEach(([r, g, b], i) => {
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = 255;
  });
  return out;
};

describe('gridFor', () => {
  it('matches the generator script: tile count near target, shape near aspect', () => {
    const { cols, rows } = gridFor(1000, 1.5);
    expect(cols).toBe(Math.round(Math.sqrt(1000 * 1.5)));
    expect(cols * rows).toBeGreaterThan(900);
    expect(cols * rows).toBeLessThan(1100);
  });

  it('caps cols at 80 and floors both axes at 3', () => {
    expect(gridFor(3000, 10).cols).toBe(80);
    expect(gridFor(100, 0.01).cols).toBe(3);
    expect(gridFor(9, 100).rows).toBe(3);
  });
});

describe('tileAverages', () => {
  it('averages each tile’s pixel block', () => {
    // 2×1 image, two 1-px tiles: colours pass through untouched.
    const img = rgba([[255, 0, 0], [0, 0, 255]]);
    expect(tileAverages(img, 2, 1, 2, 1)).toEqual(['#ff0000', '#0000ff']);
  });

  it('averages within a block', () => {
    // 2×1 image squeezed into one tile: the mean of red and blue.
    const img = rgba([[255, 0, 0], [0, 0, 255]]);
    expect(tileAverages(img, 2, 1, 1, 1)).toEqual(['#800080']);
  });

  it('splits a 2×2 image into quadrant tiles', () => {
    const img = rgba([
      [255, 0, 0], [0, 255, 0],
      [0, 0, 255], [255, 255, 255],
    ]);
    expect(tileAverages(img, 2, 2, 2, 2)).toEqual(['#ff0000', '#00ff00', '#0000ff', '#ffffff']);
  });
});
