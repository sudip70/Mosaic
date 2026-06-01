import { create } from 'zustand';
import type { Color } from '@/types';

interface ColorStore {
  todayColor: Color | null;
  setTodayColor: (color: Color) => void;
}

export const useColorStore = create<ColorStore>((set) => ({
  todayColor: null,
  setTodayColor: (color) => set({ todayColor: color }),
}));
