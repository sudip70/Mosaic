import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CameraSettings {
  timestamp: boolean;   // burn/show a timestamp on the shot
  grid: boolean;        // dotted rule-of-thirds overlay
  leveling: boolean;    // horizon level indicator
  toggle: (key: 'timestamp' | 'grid' | 'leveling') => void;
}

/**
 * Camera-only preferences, separate from the app Settings tab. Persisted so
 * the photographer's setup (grid, level, timestamp) sticks between sessions.
 */
export const useCameraSettings = create<CameraSettings>()(
  persist(
    (set) => ({
      timestamp: false,
      grid: false,
      leveling: false,
      toggle: (key) => set((state) => ({ [key]: !state[key] })),
    }),
    { name: 'camera_settings', storage: createJSONStorage(() => AsyncStorage) }
  )
);
