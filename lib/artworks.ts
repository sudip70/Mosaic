import { randomUUID } from 'expo-crypto';
import { ARTWORKS, TIER_TARGETS, type ArtworkMeta, type ArtworkTier } from '@/lib/generated/artworkData';
import { today } from '@/lib/dates';
import type { Challenge, TileOrder } from '@/types';

export { ARTWORKS, TIER_TARGETS };
export type { ArtworkMeta, ArtworkTier };

export function getArtwork(id: string): ArtworkMeta | undefined {
  return ARTWORKS.find((a) => a.id === id);
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

// A one-line "vibe + honest time-feel" for each rung, so the picker sells what a
// detail level *feels* like instead of quoting a tile count. Positive framing
// keeps the small tiers aspirational — that's where first-timers actually reach
// completion. Brackets match tierLabel().
export function tierBlurb(tiles: number): string {
  if (tiles <= 150) return 'Bold and impressionistic · a few good outings';
  if (tiles <= 750) return 'Soft detail · a relaxed painting';
  if (tiles <= 1250) return 'A clear likeness · a season’s project';
  if (tiles <= 1750) return 'Sharp detail · a long, slow pursuit';
  if (tiles <= 2500) return 'Rich nuance · a serious commitment';
  return 'Every brushstroke · a lifetime piece';
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

// Day offset → tile index. Sequential reads the painting top-left to bottom-right;
// random shuffles so the image emerges unpredictably. The result is persisted on
// the challenge, so the shuffle only needs to run once at start.
export function buildSequence(total: number, order: TileOrder): number[] {
  const seq = Array.from({ length: total }, (_, i) => i);
  if (order === 'sequential') return seq;
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

// The next tile a challenge is waiting on — the prompt the user is chasing.
// Self-paced: tiles fill one per photo in sequence order, so the next tile is
// simply the one at the current filled count. Null once the run is complete.
export function nextTileIndexFor(challenge: Challenge): number | null {
  const filledCount = Object.keys(challenge.filled).length;
  if (filledCount >= challenge.sequence.length) return null;
  return challenge.sequence[filledCount];
}

// Build a fresh challenge from a chosen artwork + tier + order. Resolves the
// tier's real grid and freezes the tile order so the run is deterministic.
export function createChallenge(artwork: ArtworkMeta, tier: number, order: TileOrder): Challenge {
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
    sequence: buildSequence(t.tiles, order),
    startDate: today(),
    status: 'active',
    filled: {},
  };
}
