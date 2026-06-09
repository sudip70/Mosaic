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
