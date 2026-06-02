import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'System' | 'Light' | 'Dark';
export type GridDensity = 'Comfortable' | 'Compact';

interface Settings {
  morningReminder: boolean;
  reminderTime: string;        // e.g. "8:30 AM"
  theme: ThemePref;
  gridDensity: GridDensity;
  setMorningReminder: (v: boolean) => void;
  setReminderTime: (v: string) => void;
  cycleTheme: () => void;
  cycleGridDensity: () => void;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      morningReminder: false,
      reminderTime: '8:30 AM',
      theme: 'System',
      gridDensity: 'Comfortable',
      setMorningReminder: (morningReminder) => set({ morningReminder }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
      cycleTheme: () =>
        set((s) => ({ theme: s.theme === 'System' ? 'Light' : s.theme === 'Light' ? 'Dark' : 'System' })),
      cycleGridDensity: () =>
        set((s) => ({ gridDensity: s.gridDensity === 'Comfortable' ? 'Compact' : 'Comfortable' })),
    }),
    { name: 'app_settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
