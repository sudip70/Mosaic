import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { today } from '@/lib/dates';
import { buildSequence, getArtwork } from '@/lib/artworks';
import type { Challenge, FilledTile } from '@/types';

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

  start: (challenge: Challenge) => void;
  /**
   * Fill the next unfilled tile in sequence with `fill`, computing the index
   * atomically inside the store update so concurrent captures can't collide on
   * the same tile. Auto-completes the run when the last tile is filled, so
   * completion never depends on a particular screen being mounted. No-op when
   * nothing is active or the run is already full. Returns whether a tile was
   * actually placed, so the caller can clean up an unused image on a no-op.
   */
  fillNextTile: (fill: FilledTile) => boolean;
  /** Pause the live run and keep it whole — resumable later. */
  setAside: () => void;
  /** Make a set-aside run live again, continuing from where it left off. */
  resume: (id: string) => void;
  /** Make a past run live again from scratch — clears its tiles, fresh dates. */
  restart: (id: string) => void;
  /** Permanently delete a run, whether it's the active one or in history. */
  remove: (id: string) => void;
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

      // Starting a new run sets the current one aside automatically — you never
      // lose progress just by beginning another painting.
      start: (challenge) =>
        set((state) => ({
          active: challenge,
          history: pauseActive(state.active, state.history),
        })),

      fillNextTile: (fill) => {
        let didFill = false;
        set((state) => {
          const active = state.active;
          if (!active || active.status !== 'active') return state;

          // The next position is the current filled count — computed here,
          // inside set(), so two near-simultaneous captures each read the
          // already-committed count rather than a stale snapshot.
          const filledCount = Object.keys(active.filled).length;
          if (filledCount >= active.sequence.length) return state; // run complete
          const tileIndex = active.sequence[filledCount];
          if (active.filled[tileIndex] !== undefined) return state; // already filled

          didFill = true;
          const filled = { ...active.filled, [tileIndex]: fill };

          // Filling the last tile retires the run immediately, wherever the
          // capture happened — no screen-bound completion effect required.
          if (Object.keys(filled).length >= active.totalTiles) {
            const finished: Challenge = {
              ...active,
              filled,
              status: 'completed',
              completedAt: new Date().toISOString(),
            };
            return { active: null, history: [finished, ...state.history] };
          }
          return { active: { ...active, filled } };
        });
        return didFill;
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
