import * as ImageManipulator from 'expo-image-manipulator';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as jpeg from 'jpeg-js';
import { reportError } from '@/lib/reportError';

// ─── Hex ⇄ RGB ────────────────────────────────────────────────────────────────

export interface RGB { r: number; g: number; b: number; }

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// ─── Dominant colour of a photo ───────────────────────────────────────────────
// Pure JS, no native module: downscale the photo to a small thumbnail, decode it
// with jpeg-js, and pick the most prominent colour bucket (weighted toward
// saturated pixels, so a red door beats a grey wall). Best-effort — returns null
// on any failure and the tile simply won't fill.

const SAMPLE_WIDTH = 32; // thumbnail width fed to the decoder

export async function extractDominantColor(uri: string): Promise<string | null> {
  try {
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: SAMPLE_WIDTH } }],
      { base64: true, compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    if (!out.base64) return null;

    const bytes = new Uint8Array(decodeBase64(out.base64));
    const { data } = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    return dominantFromRGBA(data);
  } catch (e) {
    reportError(e, { scope: 'extractDominantColor' });
    return null;
  }
}

// Bucket pixels into a coarse colour cube, weight each by saturation so vivid
// tones outweigh muddy greys, then return the average colour of the heaviest
// bucket — a cheap, stable "dominant" colour.
function dominantFromRGBA(data: Uint8Array): string {
  const buckets = new Map<number, { r: number; g: number; b: number; w: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const weight = 1 + sat * 3;
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5); // 3 bits/channel
    const bkt = buckets.get(key);
    if (bkt) { bkt.r += r * weight; bkt.g += g * weight; bkt.b += b * weight; bkt.w += weight; }
    else buckets.set(key, { r: r * weight, g: g * weight, b: b * weight, w: weight });
  }

  let best: { r: number; g: number; b: number; w: number } | null = null;
  for (const bkt of buckets.values()) {
    if (!best || bkt.w > best.w) best = bkt;
  }
  if (!best || best.w === 0) return '#888888';
  return rgbToHex(best.r / best.w, best.g / best.w, best.b / best.w);
}

// ─── Nearest colour name ──────────────────────────────────────────────────────
// A small curated palette so a challenge tile's prompt reads as a name, not a
// raw hex. Closest match by squared RGB distance.

const NAMED: { name: string; hex: string }[] = [
  { name: 'Charcoal', hex: '#2B2B2B' },
  { name: 'Slate', hex: '#5A6470' },
  { name: 'Ash', hex: '#9099A1' },
  { name: 'Bone', hex: '#E7E1D4' },
  { name: 'Ivory', hex: '#F5EFE2' },
  { name: 'Sand', hex: '#D9C2A0' },
  { name: 'Ochre', hex: '#C68A2E' },
  { name: 'Amber', hex: '#E0A030' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Rust', hex: '#9E4A2E' },
  { name: 'Terracotta', hex: '#C16A4F' },
  { name: 'Coral', hex: '#E8735A' },
  { name: 'Crimson', hex: '#B5283B' },
  { name: 'Rose', hex: '#D98AA0' },
  { name: 'Plum', hex: '#6E3D5E' },
  { name: 'Lavender', hex: '#9D8FC4' },
  { name: 'Indigo', hex: '#3B4286' },
  { name: 'Cobalt', hex: '#2E5A9E' },
  { name: 'Sky', hex: '#6FA8D6' },
  { name: 'Teal', hex: '#2E8B8B' },
  { name: 'Sage', hex: '#9CAE8A' },
  { name: 'Forest', hex: '#3E6B4F' },
  { name: 'Moss', hex: '#6B7A3A' },
  { name: 'Olive', hex: '#7A7A3C' },
];

export function nearestColorName(hex: string): string {
  const c = hexToRgb(hex);
  let best = NAMED[0];
  let bestDist = Infinity;
  for (const candidate of NAMED) {
    const t = hexToRgb(candidate.hex);
    const d = (c.r - t.r) ** 2 + (c.g - t.g) ** 2 + (c.b - t.b) ** 2;
    if (d < bestDist) { bestDist = d; best = candidate; }
  }
  return best.name;
}
