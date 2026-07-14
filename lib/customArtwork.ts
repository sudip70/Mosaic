import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as jpeg from 'jpeg-js';
import { randomUUID } from 'expo-crypto';
import { TIER_TARGETS, type ArtworkMeta, type ArtworkTier } from '@/lib/generated/artworkData';

// Runtime twin of scripts/generate-artworks.mjs: turn a user's photo into a
// full ArtworkMeta — a bundled-style peek image on disk plus per-tile average
// colours for every tier — so a custom mosaic behaves exactly like a built-in.

export const CUSTOM_ART_DIR = `${FileSystem.documentDirectory}custom-artworks/`;

// Width of the thumbnail the colour math reads. The widest tier grid is 80
// cols, so ~3px per tile — plenty for an average.
const SAMPLE_WIDTH = 256;

// Same grid-picking rule as the generator script: tile count near the tier
// target, shape near the image's aspect ratio, cols capped so tiles on the
// biggest tier stay near-square.
export function gridFor(target: number, aspect: number): { cols: number; rows: number } {
  const cols = Math.min(80, Math.max(3, Math.round(Math.sqrt(target * aspect))));
  const rows = Math.max(3, Math.round(target / cols));
  return { cols, rows };
}

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

// One tile = the mean colour of its pixel block in the RGBA bitmap. Pure box
// average — the runtime stand-in for the script's bilinear downsample.
export function tileAverages(
  data: Uint8Array,
  width: number,
  height: number,
  cols: number,
  rows: number
): string[] {
  const colors: string[] = [];
  for (let ty = 0; ty < rows; ty++) {
    const y0 = Math.floor((ty * height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((ty + 1) * height) / rows));
    for (let tx = 0; tx < cols; tx++) {
      const x0 = Math.floor((tx * width) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((tx + 1) * width) / cols));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
      }
      colors.push(`#${toHex(r / n)}${toHex(g / n)}${toHex(b / n)}`);
    }
  }
  return colors;
}

// Build a full custom artwork from a photo: persist a ~480px peek JPEG under
// the app's documents (so it survives the picker's temp files), decode a small
// thumbnail once, and derive every tier's grid colours from it.
export async function createCustomArtwork(uri: string, title: string): Promise<ArtworkMeta> {
  const id = `custom-${randomUUID()}`;

  const dirInfo = await FileSystem.getInfoAsync(CUSTOM_ART_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CUSTOM_ART_DIR, { intermediates: true });
  }
  // The peek (bundled-style thumbnail) and the colour-sample downscale read the
  // same source and don't depend on each other — run both passes at once so the
  // user waits for one decode, not two back to back.
  const [peek, sample] = await Promise.all([
    ImageManipulator.manipulateAsync(uri, [{ resize: { width: 480 } }], {
      compress: 0.72,
      format: ImageManipulator.SaveFormat.JPEG,
    }),
    ImageManipulator.manipulateAsync(uri, [{ resize: { width: SAMPLE_WIDTH } }], {
      base64: true,
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    }),
  ]);
  const peekUri = `${CUSTOM_ART_DIR}${id}.jpg`;
  await FileSystem.copyAsync({ from: peek.uri, to: peekUri });
  if (!sample.base64) throw new Error('Could not read that photo. Try another one.');
  const bytes = new Uint8Array(decodeBase64(sample.base64));
  const { data, width, height } = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
  const aspect = width / height;

  const tiers: Record<number, ArtworkTier> = {};
  for (const target of TIER_TARGETS) {
    const { cols, rows } = gridFor(target, aspect);
    tiers[target] = { tiles: cols * rows, cols, rows, colors: tileAverages(data, width, height, cols, rows) };
  }

  return {
    id,
    title,
    artist: 'You',
    year: new Date().getFullYear(),
    aspect: Number(aspect.toFixed(4)),
    image: { uri: peekUri },
    tiers,
  };
}

// Best-effort removal of a custom artwork's peek image.
export async function deleteCustomArtworkImage(id: string): Promise<void> {
  await FileSystem.deleteAsync(`${CUSTOM_ART_DIR}${id}.jpg`, { idempotent: true }).catch(() => {});
}
