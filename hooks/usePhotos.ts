import { useEffect, useState } from 'react';
import { localStore } from '@/lib/localStore';
import { usePhotoStore } from '@/store/usePhotoStore';
import type { Photo } from '@/types';

// Stable empty array — returned by the Zustand selector when a date has no photos.
// Must live outside the hook so its reference never changes between renders,
// otherwise useSyncExternalStore sees a new object every call and loops infinitely.
const EMPTY_PHOTOS: Photo[] = [];

// Most-recent first.
const byNewest = (a: Photo, b: Photo) =>
  b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id);

// Phase 1 is local-only: a day's photos come entirely from device storage.
// Cloud reads (own backup restore, friends' shared photos) arrive in Phase 2.
export function usePhotos(date: string, _userId: string) {
  const [loading, setLoading] = useState(true);
  const photos = usePhotoStore((s) => s.photosByDate[date] ?? EMPTY_PHOTOS);
  const setPhotos = usePhotoStore((s) => s.setPhotos);

  useEffect(() => {
    let active = true;
    async function load() {
      const local = await localStore.getPhotos(date);
      if (active) {
        setPhotos(date, [...local].sort(byNewest));
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [date]);

  return { photos, loading };
}
