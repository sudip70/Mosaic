import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArtworkMeta } from '@/lib/generated/artworkData';

// User-created artworks (photo → mosaic). Same shape as the built-ins, with
// `image` as a { uri } into the app's documents instead of a bundled asset, so
// everything downstream (cards, grids, fills) treats them identically.
// ponytail: each artwork persists ~150KB of tier colours in AsyncStorage; move
// the colours to files if users start hoarding dozens.
interface ArtworkStore {
  custom: ArtworkMeta[];
  add: (artwork: ArtworkMeta) => void;
  remove: (id: string) => void;
  /** Retitle a custom artwork so the setup shelf matches a renamed run. */
  rename: (id: string, title: string) => void;
}

export const useArtworkStore = create<ArtworkStore>()(
  persist(
    (set) => ({
      custom: [],
      add: (artwork) => set((s) => ({ custom: [artwork, ...s.custom] })),
      remove: (id) => set((s) => ({ custom: s.custom.filter((a) => a.id !== id) })),
      rename: (id, title) =>
        set((s) => ({
          custom: s.custom.map((a) => (a.id === id ? { ...a, title } : a)),
        })),
    }),
    {
      name: 'custom-artworks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
