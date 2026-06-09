// Generates placeholder app icons + splash for Mosaic so `expo prebuild` can run.
// A small mosaic of warm tiles on the brand canvas — replace with final art later.
//
// Run:  NODE_PATH=<jimp> node scripts/generate-app-icons.mjs

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const Jimp = require('jimp');

const ASSET_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
mkdirSync(ASSET_DIR, { recursive: true });

const CANVAS = '#F2EEE3';
const TILES = [
  '#C16A4F', '#E0A030', '#3E6B4F', '#2E5A9E',
  '#9D8FC4', '#B5283B', '#6FA8D6', '#9CAE8A',
  '#D98AA0', '#2E8B8B', '#C68A2E', '#6E3D5E',
  '#3B4286', '#E8735A', '#6B7A3A', '#5A6470',
];

const hexInt = (hex) => {
  const h = hex.replace('#', '');
  return Jimp.rgbaToInt(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255);
};

// Draw a 4×4 grid of tiles, centred, covering `span` px of a `size`-px image.
function drawMosaic(img, size, span) {
  const cols = 4;
  const gap = Math.round(span * 0.04);
  const tile = Math.round((span - gap * (cols - 1)) / cols);
  const origin = Math.round((size - (tile * cols + gap * (cols - 1))) / 2);
  for (let i = 0; i < cols * cols; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const x = origin + cx * (tile + gap);
    const y = origin + cy * (tile + gap);
    const swatch = new Jimp(tile, tile, hexInt(TILES[i % TILES.length]));
    img.composite(swatch, x, y);
  }
}

async function make(file, size, span, bg) {
  const img = new Jimp(size, size, bg);
  drawMosaic(img, size, span);
  await img.writeAsync(resolve(ASSET_DIR, file));
  console.log(`• ${file} (${size}×${size})`);
}

async function makeSplash() {
  const w = 1242, h = 2436;
  const img = new Jimp(w, h, hexInt(CANVAS));
  // Reuse the square mosaic, centred vertically.
  const square = new Jimp(w, w, hexInt(CANVAS));
  drawMosaic(square, w, Math.round(w * 0.4));
  img.composite(square, 0, Math.round((h - w) / 2));
  await img.writeAsync(resolve(ASSET_DIR, 'splash.png'));
  console.log(`• splash.png (${w}×${h})`);
}

async function main() {
  await make('icon.png', 1024, Math.round(1024 * 0.62), hexInt(CANVAS));        // full-bleed iOS icon
  await make('adaptive-icon.png', 1024, Math.round(1024 * 0.5), 0x00000000);    // Android foreground, safe-zone, transparent
  await makeSplash();
  console.log('\nPlaceholder assets written to assets/.');
}

main();
