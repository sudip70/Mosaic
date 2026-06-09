import { useMemo } from 'react';
import { useChallengeStore } from '@/store/useChallengeStore';
import { getArtwork, getTier, nextTileIndexFor } from '@/lib/artworks';
import { nearestColorName } from '@/lib/colorUtils';
import { today as todayStr } from '@/lib/dates';
import type { Color } from '@/types';

// Resolves the active challenge into everything a screen needs: the next tile
// to chase, its prompt colour, progress, and the per-tile target/filled data
// the mosaic grid renders. Self-paced — there is no calendar; each captured
// photo fills the next tile in sequence. Returns `challenge: null` when idle.
export function useChallenge() {
  const active = useChallengeStore((s) => s.active);

  return useMemo(() => {
    if (!active) {
      return {
        challenge: null,
        artwork: undefined,
        tier: undefined,
        currentTileIndex: null as number | null,
        todayColor: null as Color | null,
        filledCount: 0,
        progress: 0,
        isComplete: false,
      };
    }

    const artwork = getArtwork(active.artworkId);
    const tier = artwork ? getTier(artwork, active.tier) : undefined;

    const filledCount = Object.keys(active.filled).length;
    const isComplete = filledCount >= active.totalTiles;

    // The tile the user is currently chasing — null once the run is complete.
    const currentTileIndex = nextTileIndexFor(active);

    let todayColor: Color | null = null;
    if (currentTileIndex != null && tier) {
      // A run created by an older build can carry a tile index past the current
      // tier's colour array. Guard the lookup so a missing colour leaves
      // todayColor null (the screens fall back to the "earlier version" card)
      // instead of feeding undefined into nearestColorName → a crash.
      const hex = tier.colors[currentTileIndex];
      if (hex) {
        todayColor = {
          id: `challenge:${active.id}:${currentTileIndex}`,
          date: todayStr(),
          name: nearestColorName(hex),
          hex,
        };
      }
    }

    return {
      challenge: active,
      artwork,
      tier,
      currentTileIndex,
      todayColor,
      filledCount,
      progress: active.totalTiles ? filledCount / active.totalTiles : 0,
      isComplete,
    };
  }, [active]);
}
