import { create } from 'zustand';
import type { Photo } from '@/types';

interface PhotoStore {
  photosByDate: Record<string, Photo[]>;
  addPhoto: (date: string, photo: Photo) => void;
  setPhotos: (date: string, photos: Photo[]) => void;
  removePhoto: (date: string, id: string) => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photosByDate: {},

  addPhoto: (date, photo) =>
    set((state) => ({
      photosByDate: {
        ...state.photosByDate,
        [date]: [...(state.photosByDate[date] ?? []), photo],
      },
    })),

  setPhotos: (date, photos) =>
    set((state) => ({
      photosByDate: { ...state.photosByDate, [date]: photos },
    })),

  removePhoto: (date, id) =>
    set((state) => ({
      photosByDate: {
        ...state.photosByDate,
        [date]: (state.photosByDate[date] ?? []).filter((p) => p.id !== id),
      },
    })),
}));
