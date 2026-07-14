import { randomUUID } from 'expo-crypto';
import { ARTWORKS, TIER_TARGETS, type ArtworkMeta, type ArtworkTier } from '@/lib/generated/artworkData';
import { colorDistance } from '@/lib/colorUtils';
import { useArtworkStore } from '@/store/useArtworkStore';
import { today } from '@/lib/dates';
import type { Challenge, ChallengeMode, TileOrder } from '@/types';

export { ARTWORKS, TIER_TARGETS };
export type { ArtworkMeta, ArtworkTier };

export function getArtwork(id: string): ArtworkMeta | undefined {
  return (
    ARTWORKS.find((a) => a.id === id) ??
    useArtworkStore.getState().custom.find((a) => a.id === id)
  );
}

export function getTier(artwork: ArtworkMeta, tier: number): ArtworkTier | undefined {
  return artwork.tiers[tier];
}

// Friendly label for a tier by its real tile count (which varies per artwork's
// aspect ratio — a "100" tier may resolve to 99 or 104 tiles). Brackets the
// round ladder 100 / 500 / 1000 / 1500 / 2000 / 3000.
export function tierLabel(tiles: number): string {
  if (tiles <= 150) return 'Loose';
  if (tiles <= 750) return 'Balanced';
  if (tiles <= 1250) return 'Detailed';
  if (tiles <= 1750) return 'Fine';
  if (tiles <= 2500) return 'Intricate';
  return 'Masterwork';
}

// A one-line vibe for each rung. Pace is no longer the tier's job — every run
// finishes in about PHOTOS_PER_MOSAIC strokes — so the blurb only sells how the
// finished painting will read. Brackets match tierLabel().
export function tierBlurb(tiles: number): string {
  if (tiles <= 150) return 'Bold and impressionistic';
  if (tiles <= 750) return 'Soft, readable detail';
  if (tiles <= 1250) return 'A clear likeness';
  if (tiles <= 1750) return 'Sharp detail';
  if (tiles <= 2500) return 'Rich nuance';
  return 'Every brushstroke';
}

// The painting's emergence phase by fraction filled — the friendly stand-in for
// "X of 3000". Phase names carry momentum without ever quoting a scary
// denominator, and stay encouraging even on the largest tiers.
export function progressPhase(filled: number, total: number): string {
  if (total <= 0 || filled <= 0) return 'Blank canvas';
  if (filled >= total) return 'Complete';
  const frac = filled / total;
  if (frac < 0.15) return 'First strokes';
  if (frac < 0.4) return 'Taking shape';
  if (frac < 0.7) return 'Coming into focus';
  return 'Almost there';
}

// Progress-bar fill percent with a small visible floor once any tile is placed,
// so even a 1-of-3000 mosaic shows momentum rather than an empty track.
export function progressPct(filled: number, total: number): number {
  if (total <= 0 || filled <= 0) return 0;
  return Math.min(100, Math.max((filled / total) * 100, 3));
}

// Thousands separator that never depends on Intl/Hermes locale support — used
// only for the demoted, honest "of ~3,000 tiles" cues.
export function formatTileCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Fallback fill order, persisted on the challenge. Placement is normally
// colour-matched (strokeTiles); the sequence is only consumed when a run's tier
// colour data no longer matches (created by an older build).
export function buildSequence(total: number, order: TileOrder): number[] {
  const seq = Array.from({ length: total }, (_, i) => i);
  if (order === 'sequential') return seq;
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

// ─── Strokes ─────────────────────────────────────────────────────────────────
// One capture paints a stroke: the K unfilled tiles whose target colours sit
// nearest the photo's dominant colour. Tile count is purely visual resolution;
// every run finishes in about PHOTOS_PER_MOSAIC captures regardless of tier.
export const PHOTOS_PER_MOSAIC = 100;

export function strokeSize(totalTiles: number): number {
  return Math.max(1, Math.ceil(totalTiles / PHOTOS_PER_MOSAIC));
}

// The unfilled tile indices a captured colour should land on — nearest first,
// so the first index is the stroke's anchor (best match). Clamps to however
// many tiles remain.
export function strokeTiles(
  hex: string,
  targetColors: string[],
  filled: Record<number, unknown>,
  count: number
): number[] {
  const candidates: { i: number; d: number }[] = [];
  for (let i = 0; i < targetColors.length; i++) {
    if (filled[i] === undefined) candidates.push({ i, d: colorDistance(hex, targetColors[i]) });
  }
  candidates.sort((a, b) => a.d - b.d);
  return candidates.slice(0, count).map((c) => c.i);
}

// How close a captured colour must sit to its best remaining tile for a
// hunt-mode stroke to land — roughly "same colour family".
// ponytail: naive squared-RGB gate (~60 per channel); swap for a perceptual
// deltaE if hunts start rejecting colours that look right to the eye.
export const HUNT_MATCH_DISTANCE = 60 * 60 * 3;

// Build a fresh challenge from a chosen artwork + tier + capture mode. Resolves
// the tier's real grid and freezes the fallback tile order.
export function createChallenge(
  artwork: ArtworkMeta,
  tier: number,
  order: TileOrder,
  mode: ChallengeMode = 'compass'
): Challenge {
  const t = artwork.tiers[tier];
  return {
    id: randomUUID(),
    artworkId: artwork.id,
    artworkTitle: artwork.title,
    artworkArtist: artwork.artist,
    tier,
    totalTiles: t.tiles,
    cols: t.cols,
    rows: t.rows,
    order,
    mode,
    sequence: buildSequence(t.tiles, order),
    startDate: today(),
    status: 'active',
    filled: {},
  };
}
