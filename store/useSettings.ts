import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'System' | 'Light' | 'Dark';
export type GridDensity = 'Comfortable' | 'Compact';

interface Settings {
  morningReminder: boolean;
  reminderTime: string;        // e.g. "8:30 AM"
  theme: ThemePref;            // persisted; full dark-mode rendering is a future feature
  gridDensity: GridDensity;    // applied to the grid tile size
  setMorningReminder: (v: boolean) => void;
  cycleTheme: () => void;
  cycleGridDensity: () => void;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      morningReminder: true,
      reminderTime: '8:30 AM',
      theme: 'System',
      gridDensity: 'Comfortable',
      setMorningReminder: (morningReminder) => set({ morningReminder }),
      cycleTheme: () =>
        set((s) => ({ theme: s.theme === 'System' ? 'Light' : s.theme === 'Light' ? 'Dark' : 'System' })),
      cycleGridDensity: () =>
        set((s) => ({ gridDensity: s.gridDensity === 'Comfortable' ? 'Compact' : 'Comfortable' })),
    }),
    { name: 'app_settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
