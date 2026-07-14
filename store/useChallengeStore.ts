import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { today } from '@/lib/dates';
import { buildSequence, getArtwork, strokeSize, strokeTiles, HUNT_MATCH_DISTANCE } from '@/lib/artworks';
import { colorDistance } from '@/lib/colorUtils';
import type { Challenge, FilledTile } from '@/types';

// What a fillStroke attempt did: painted, rejected by the hunt-mode colour
// gate, or nothing to do (no active run / run already full).
export type StrokeResult = 'filled' | 'no-match' | 'no-op';

interface ChallengeStore {
  active: Challenge | null;
  // Set-aside, completed, and abandoned runs, newest first. Set-aside runs stay
  // resumable; completed ones power the showcase.
  history: Challenge[];
  // The mosaics the user has chosen to show off on their profile, by id, in the
  // order they were pinned. Tracked by id (not a flag on the challenge) so a pin
  // survives every active⇄paused⇄completed transition — those keep the same id.
  // Empty when nothing is pinned.
  pinnedIds: string[];
  // The tiles the most recent stroke landed on — lets the grid glow where the
  // last photo went, so cause-and-effect is visible when the user returns from
  // the camera. Transient: excluded from persistence, cleared on relaunch.
  lastStroke: { challengeId: string; indices: number[] } | null;

  start: (challenge: Challenge) => void;
  /**
   * Paint one photo's stroke: fill the unfilled tiles whose target colours sit
   * nearest `fill.hex` (strokeSize of them), computed atomically inside the
   * store update so concurrent captures can't collide on the same tiles. The
   * photo's uri lives on the stroke's anchor tile only (the closest match), so
   * the tile viewer shows each photo once. On a hunt-mode run the stroke is
   * rejected ('no-match') when even the best remaining tile sits too far from
   * the captured colour. Auto-completes the run when the last tile is filled,
   * so completion never depends on a particular screen being mounted. 'no-op'
   * when nothing is active or the run is already full, so the caller can clean
   * up an unused image.
   */
  fillStroke: (fill: FilledTile) => StrokeResult;
  /** Pause the live run and keep it whole — resumable later. */
  setAside: () => void;
  /** Make a set-aside run live again, continuing from where it left off. */
  resume: (id: string) => void;
  /** Make a past run live again from scratch — clears its tiles, fresh dates. */
  restart: (id: string) => void;
  /** Permanently delete a run, whether it's the active one or in history. */
  remove: (id: string) => void;
  /**
   * Rename a run's painting title (active or history). artworkTitle is already
   * denormalised per run, so renaming never touches the artwork data — a
   * built-in keeps its real name on the setup shelf.
   */
  rename: (id: string, title: string) => void;
  /**
   * Drop the saved photo for a single filled tile, keeping the tile's colour in
   * the painting. Used when the user deletes a mosaic capture from the viewer —
   * the photo goes, but the tile stays filled so the artwork is never holed
   * (which would also be unrecoverable on a completed run). Works on the active
   * run or any in history.
   */
  clearTilePhoto: (challengeId: string, tileIndex: number) => void;
  /** Feature a mosaic on the profile. No-op if it's already pinned. */
  pin: (id: string) => void;
  /** Stop featuring a pinned mosaic on the profile. */
  unpin: (id: string) => void;
}

// Move the live run to history as a paused run. Progress lives entirely in
// `filled`, so resuming just continues from the next unfilled tile — no dates to
// rebase. A no-op when nothing is active.
function pauseActive(active: Challenge | null, history: Challenge[]): Challenge[] {
  if (!active) return history;
  const paused: Challenge = { ...active, status: 'paused', completedAt: undefined };
  return [paused, ...history];
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set) => ({
      active: null,
      history: [],
      pinnedIds: [],
      lastStroke: null,

      // Starting a new run sets the current one aside automatically — you never
      // lose progress just by beginning another painting.
      start: (challenge) =>
        set((state) => ({
          active: challenge,
          history: pauseActive(state.active, state.history),
        })),

      fillStroke: (fill) => {
        let result: StrokeResult = 'no-op';
        set((state) => {
          const active = state.active;
          if (!active || active.status !== 'active') return state;

          // Colour-matched placement: the stroke lands on the unfilled tiles
          // whose target colours sit nearest the captured colour. Runs whose
          // tier colour data no longer matches (created by an older build) fall
          // back to the frozen sequence order. Computed inside set(), so two
          // near-simultaneous captures each read the already-committed fills.
          const count = strokeSize(active.totalTiles);
          const targets = getArtwork(active.artworkId)?.tiers[active.tier]?.colors;
          const matched = !!targets && targets.length === active.totalTiles;
          const indices = matched
            ? strokeTiles(fill.hex, targets, active.filled, count)
            : active.sequence.filter((i) => active.filled[i] === undefined).slice(0, count);
          if (indices.length === 0) return state; // run complete

          // Hunt mode only accepts colours with a genuinely close home. The
          // anchor is the best remaining match, so gating on it gates the lot.
          if (
            active.mode === 'hunt' &&
            matched &&
            colorDistance(fill.hex, targets[indices[0]]) > HUNT_MATCH_DISTANCE
          ) {
            result = 'no-match';
            return state;
          }

          result = 'filled';
          const filled = { ...active.filled };
          // Anchor tile carries the photo; the rest of the stroke is colour only.
          indices.forEach((tileIndex, k) => {
            filled[tileIndex] =
              k === 0 ? fill : { date: fill.date, hex: fill.hex, photoCount: fill.photoCount };
          });
          const lastStroke = { challengeId: active.id, indices };

          // Filling the last tile retires the run immediately, wherever the
          // capture happened — no screen-bound completion effect required.
          if (Object.keys(filled).length >= active.totalTiles) {
            const finished: Challenge = {
              ...active,
              filled,
              status: 'completed',
              completedAt: new Date().toISOString(),
            };
            return { active: null, history: [finished, ...state.history], lastStroke };
          }
          return { active: { ...active, filled }, lastStroke };
        });
        return result;
      },

      setAside: () =>
        set((state) =>
          state.active
            ? { active: null, history: pauseActive(state.active, state.history) }
            : state
        ),

      resume: (id) =>
        set((state) => {
          const target = state.history.find((c) => c.id === id);
          // Only set-aside runs are resumable. A completed run has every tile
          // filled, so "resuming" it would just bounce straight back to
          // completed — restart() is the right path to replay it.
          if (!target || target.status === 'completed') return state;
          const rest = state.history.filter((c) => c.id !== id);
          const resumed: Challenge = { ...target, status: 'active', completedAt: undefined };
          return { active: resumed, history: pauseActive(state.active, rest) };
        }),

      restart: (id) =>
        set((state) => {
          const target = state.history.find((c) => c.id === id);
          if (!target) return state;
          const rest = state.history.filter((c) => c.id !== id);
          // Re-resolve the grid against current artwork data: a run created by
          // an older build may carry a tile count/shape that no longer matches
          // today's tier definition, and restarting is the moment to realign it
          // (its colour prompts come from current data). Fall back to the
          // stored shape if the artwork/tier is gone.
          const t = getArtwork(target.artworkId)?.tiers[target.tier];
          const totalTiles = t?.tiles ?? target.totalTiles;
          const fresh: Challenge = {
            ...target,
            totalTiles,
            cols: t?.cols ?? target.cols,
            rows: t?.rows ?? target.rows,
            status: 'active',
            startDate: today(),
            sequence: buildSequence(totalTiles, target.order),
            filled: {},
            completedAt: undefined,
          };
          return { active: fresh, history: pauseActive(state.active, rest) };
        }),

      remove: (id) =>
        set((state) => ({
          active: state.active?.id === id ? null : state.active,
          history: state.history.filter((c) => c.id !== id),
          // A deleted mosaic can no longer be shown off — drop its pin with it.
          pinnedIds: state.pinnedIds.filter((p) => p !== id),
        })),

      rename: (id, title) =>
        set((state) => {
          const trimmed = title.trim();
          if (!trimmed) return state;
          if (state.active?.id === id) {
            return { active: { ...state.active, artworkTitle: trimmed } };
          }
          const idx = state.history.findIndex((c) => c.id === id);
          if (idx < 0) return state;
          const history = [...state.history];
          history[idx] = { ...history[idx], artworkTitle: trimmed };
          return { history };
        }),

      clearTilePhoto: (challengeId, tileIndex) =>
        set((state) => {
          // Keep the tile filled (date/hex/photoCount) but drop its image, so
          // the painting is untouched and only the revisitable photo is removed.
          const strip = (c: Challenge): Challenge => {
            const tile = c.filled[tileIndex];
            if (!tile?.uri) return c;
            return {
              ...c,
              filled: {
                ...c.filled,
                [tileIndex]: { date: tile.date, hex: tile.hex, photoCount: tile.photoCount },
              },
            };
          };
          if (state.active?.id === challengeId) {
            return { active: strip(state.active) };
          }
          const idx = state.history.findIndex((c) => c.id === challengeId);
          if (idx < 0) return state;
          const history = [...state.history];
          history[idx] = strip(history[idx]);
          return { history };
        }),

      pin: (id) =>
        set((state) =>
          state.pinnedIds.includes(id)
            ? state
            : { pinnedIds: [...state.pinnedIds, id] }
        ),
      unpin: (id) =>
        set((state) => ({ pinnedIds: state.pinnedIds.filter((p) => p !== id) })),
    }),
    {
      name: 'challenge',
      storage: createJSONStorage(() => AsyncStorage),
      // lastStroke is a per-session visual cue — never persist it.
      partialize: (s) => ({ active: s.active, history: s.history, pinnedIds: s.pinnedIds }),
      // v1 turned the single `pinnedId` into a `pinnedIds` list so more than one
      // mosaic can be featured at once. Carry an existing pin forward.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown> | undefined;
        if (state && version < 1) {
          const { pinnedId, ...rest } = state;
          return { ...rest, pinnedIds: pinnedId ? [pinnedId] : [] };
        }
        return state;
      },
    }
  )
);
