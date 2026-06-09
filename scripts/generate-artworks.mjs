// Generates artwork tile data + bundled peek images for Mosaic challenges.
//
// For each public-domain painting we:
//   1. fetch a medium-res copy from Wikimedia Commons (Special:FilePath)
//   2. write an optimized ~480px "peek" JPEG into assets/artworks/
//   3. downscale the painting to each tier's grid (cols×rows) so every
//      destination pixel becomes one tile's average colour
//
// Output: lib/generated/artworkData.ts (committed, imported by the app).
//
// Run:  node scripts/generate-artworks.mjs
// Requires jimp on NODE_PATH (the npm script installs it in a temp dir).

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const Jimp = require('jimp');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ASSET_DIR = resolve(ROOT, 'assets/artworks');
const OUT_FILE = resolve(ROOT, 'lib/generated/artworkData.ts');

const TIERS = [100, 500, 1000, 1500, 2000, 3000];
const UA = 'MosaicApp/1.0 (daily colour photo app; educational)';

const ARTWORKS = [
  { id: 'starry-night',       title: 'The Starry Night',            artist: 'Vincent van Gogh',      year: 1889, file: 'Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg' },
  { id: 'sunflowers',         title: 'Sunflowers',                  artist: 'Vincent van Gogh',      year: 1888, file: 'Vincent_Willem_van_Gogh_127.jpg' },
  { id: 'great-wave',         title: 'The Great Wave off Kanagawa', artist: 'Katsushika Hokusai',    year: 1831, file: 'Tsunami_by_hokusai_19th_century.jpg' },
  { id: 'the-kiss',           title: 'The Kiss',                    artist: 'Gustav Klimt',          year: 1908, file: 'Gustav_Klimt_016.jpg' },
  { id: 'pearl-earring',      title: 'Girl with a Pearl Earring',   artist: 'Johannes Vermeer',      year: 1665, file: '1665_Girl_with_a_Pearl_Earring.jpg' },
  { id: 'grande-jatte',       title: 'A Sunday on La Grande Jatte', artist: 'Georges Seurat',        year: 1884, file: 'A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg' },
  { id: 'birth-of-venus',     title: 'The Birth of Venus',          artist: 'Sandro Botticelli',     year: 1485, file: 'Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg' },
  { id: 'impression-sunrise', title: 'Impression, Sunrise',         artist: 'Claude Monet',          year: 1872, file: 'Monet_-_Impression,_Sunrise.jpg' },
  { id: 'wanderer',           title: 'Wanderer above the Sea of Fog', artist: 'Caspar David Friedrich', year: 1818, file: 'Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg' },
  { id: 'water-lilies',       title: 'Water Lilies',                artist: 'Claude Monet',          year: 1906, file: 'Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg' },
];

const toHex = (n) => n.toString(16).padStart(2, '0');

// Pick a grid (cols×rows) whose tile count is near the tier target and whose
// shape roughly matches the painting's aspect ratio.
function gridFor(target, aspect) {
  // Cap raised to 80 so the highest tier (3000) keeps tiles near-square on wide
  // paintings instead of stretching into tall columns. 700px source ÷ 80 cols is
  // still ~9px per tile — ample for a single average colour.
  const cols = Math.min(80, Math.max(3, Math.round(Math.sqrt(target * aspect))));
  const rows = Math.max(3, Math.round(target / cols));
  return { cols, rows };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchImage(file) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=700`;
  // Wikimedia rate-limits bursts (429); back off and retry a few times.
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error(`suspiciously small (${buf.length}b)`);
    return buf;
  }
  throw new Error('HTTP 429 (gave up after retries)');
}

function tilesFromGrid(img, cols, rows) {
  const small = img.clone().resize(cols, rows); // bilinear → averaged downsample
  const colors = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const { r, g, b } = Jimp.intToRGBA(small.getPixelColor(x, y));
      colors.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    }
  }
  return colors;
}

async function processArtwork(meta) {
  const buf = await fetchImage(meta.file);
  const img = await Jimp.read(buf);
  const { width, height } = img.bitmap;
  const aspect = width / height;

  // Peek image — ~480px wide, modest quality, bundled with the app.
  const peek = img.clone();
  peek.resize(480, Jimp.AUTO).quality(72);
  await peek.writeAsync(resolve(ASSET_DIR, `${meta.id}.jpg`));

  const tiers = {};
  for (const target of TIERS) {
    const { cols, rows } = gridFor(target, aspect);
    tiers[target] = { tiles: cols * rows, cols, rows, colors: tilesFromGrid(img, cols, rows) };
  }
  return { ...meta, aspect: Number(aspect.toFixed(4)), tiers };
}

function emit(results) {
  const lines = [];
  lines.push('// AUTO-GENERATED by scripts/generate-artworks.mjs — do not edit by hand.');
  lines.push('// Per-tile average colours for each painting at every challenge tier.');
  lines.push('');
  lines.push('import type { ImageSourcePropType } from \'react-native\';');
  lines.push('');
  lines.push('export interface ArtworkTier {');
  lines.push('  tiles: number;');
  lines.push('  cols: number;');
  lines.push('  rows: number;');
  lines.push('  colors: string[];');
  lines.push('}');
  lines.push('');
  lines.push('export interface ArtworkMeta {');
  lines.push('  id: string;');
  lines.push('  title: string;');
  lines.push('  artist: string;');
  lines.push('  year: number;');
  lines.push('  aspect: number;');
  lines.push('  image: ImageSourcePropType;');
  lines.push('  tiers: Record<number, ArtworkTier>;');
  lines.push('}');
  lines.push('');
  lines.push(`export const TIER_TARGETS = [${TIERS.join(', ')}] as const;`);
  lines.push('');
  lines.push('export const ARTWORKS: ArtworkMeta[] = [');
  for (const a of results) {
    lines.push('  {');
    lines.push(`    id: ${JSON.stringify(a.id)},`);
    lines.push(`    title: ${JSON.stringify(a.title)},`);
    lines.push(`    artist: ${JSON.stringify(a.artist)},`);
    lines.push(`    year: ${a.year},`);
    lines.push(`    aspect: ${a.aspect},`);
    lines.push(`    image: require('../../assets/artworks/${a.id}.jpg'),`);
    lines.push('    tiers: {');
    for (const target of TIERS) {
      const t = a.tiers[target];
      lines.push(`      ${target}: { tiles: ${t.tiles}, cols: ${t.cols}, rows: ${t.rows}, colors: ${JSON.stringify(t.colors)} },`);
    }
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('];');
  lines.push('');
  writeFileSync(OUT_FILE, lines.join('\n'));
}

async function main() {
  mkdirSync(ASSET_DIR, { recursive: true });
  mkdirSync(dirname(OUT_FILE), { recursive: true });

  const results = [];
  for (const meta of ARTWORKS) {
    try {
      process.stdout.write(`• ${meta.title} … `);
      const r = await processArtwork(meta);
      results.push(r);
      const g = TIERS.map((t) => `${r.tiers[t].cols}×${r.tiers[t].rows}`).join(' ');
      console.log(`ok (aspect ${r.aspect}) grids: ${g}`);
    } catch (e) {
      console.log(`SKIP — ${e.message}`);
    }
    await sleep(1500); // be gentle between requests
  }

  if (!results.length) {
    console.error('\nNo artworks processed — aborting.');
    process.exit(1);
  }
  emit(results);
  console.log(`\nWrote ${results.length} artworks → ${OUT_FILE}`);
}

main();
