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

  start: (challenge: Challenge) => void;
  /**
   * Fill the next unfilled tile in sequence with `fill`, computing the index
   * atomically inside the store update so concurrent captures can't collide on
   * the same tile. Auto-completes the run when the last tile is filled, so
   * completion never depends on a particular screen being mounted. No-op when
   * nothing is active or the run is already full.
   */
  fillNextTile: (fill: FilledTile) => void;
  /** Pause the live run and keep it whole — resumable later. */
  setAside: () => void;
  /** Make a set-aside run live again, continuing from where it left off. */
  resume: (id: string) => void;
  /** Make a past run live again from scratch — clears its tiles, fresh dates. */
  restart: (id: string) => void;
  /** Permanently delete a run, whether it's the active one or in history. */
  remove: (id: string) => void;
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

      // Starting a new run sets the current one aside automatically — you never
      // lose progress just by beginning another painting.
      start: (challenge) =>
        set((state) => ({
          active: challenge,
          history: pauseActive(state.active, state.history),
        })),

      fillNextTile: (fill) =>
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
        }),

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
        })),
    }),
    { name: 'challenge', storage: createJSONStorage(() => AsyncStorage) }
  )
);
