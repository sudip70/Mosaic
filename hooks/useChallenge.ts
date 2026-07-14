import { useMemo } from 'react';
import { useChallengeStore } from '@/store/useChallengeStore';
import { getArtwork, getTier } from '@/lib/artworks';
import { dominantHexes, nearestColorName } from '@/lib/colorUtils';
import { useArtworkStore } from '@/store/useArtworkStore';

// Resolves the active challenge into everything a screen needs: progress, the
// per-tile target/filled data the mosaic grid renders, and the compass — the
// colour the painting needs most right now (the dominant colour family among
// its unfilled tiles). Chasing the compass fills the biggest remaining region;
// on a compass-mode run any other colour still lands wherever it belongs, while
// a hunt-mode run only accepts close matches. Returns `challenge: null` when
// idle.
export function useChallenge() {
  const active = useChallengeStore((s) => s.active);
  // Custom artworks rehydrate from AsyncStorage after first render; subscribing
  // makes getArtwork re-resolve once they land (a custom run would otherwise
  // look like a missing artwork until an unrelated re-render).
  const custom = useArtworkStore((s) => s.custom);

  return useMemo(() => {
    if (!active) {
      return {
        challenge: null,
        artwork: undefined,
        tier: undefined,
        compass: null as { hex: string; name: string } | null,
        filledCount: 0,
        progress: 0,
        isComplete: false,
      };
    }

    const artwork = getArtwork(active.artworkId);
    const tier = artwork ? getTier(artwork, active.tier) : undefined;
    const filledCount = Object.keys(active.filled).length;
    const isComplete = filledCount >= active.totalTiles;

    // No compass when the run is done or its tier colour data no longer matches
    // (those runs fill by sequence fallback and have nothing to suggest).
    // Rotate through the biggest remaining colour families, keyed off the fill
    // count, so the prompt advances with every stroke — a pure "needs most"
    // argmax would park on the single largest region for dozens of captures.
    let compass: { hex: string; name: string } | null = null;
    if (!isComplete && tier && tier.colors.length === active.totalTiles) {
      const families = dominantHexes(tier.colors.filter((_, i) => active.filled[i] === undefined));
      if (families.length) {
        const hex = families[filledCount % families.length];
        compass = { hex, name: nearestColorName(hex) };
      }
    }

    return {
      challenge: active,
      artwork,
      tier,
      compass,
      filledCount,
      progress: active.totalTiles ? filledCount / active.totalTiles : 0,
      isComplete,
    };
  }, [active, custom]);
}
