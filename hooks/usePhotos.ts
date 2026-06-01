import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import { getPhotoUrl } from '@/lib/storage';
import { usePhotoStore } from '@/store/usePhotoStore';
import type { Photo } from '@/types';

// Stable empty array — returned by the Zustand selector when a date has no photos.
// Must live outside the hook so its reference never changes between renders,
// otherwise useSyncExternalStore sees a new object every call and loops infinitely.
const EMPTY_PHOTOS: Photo[] = [];

export function usePhotos(date: string, userId: string) {
  const [loading, setLoading] = useState(true);
  const photos = usePhotoStore((s) => s.photosByDate[date] ?? EMPTY_PHOTOS);
  const setPhotos = usePhotoStore((s) => s.setPhotos);

  useEffect(() => {
    async function load() {
      // 1. Show local data immediately — works offline, zero wait
      const local = await localStore.getPhotos(date);
      if (local.length > 0) {
        setPhotos(date, local);
        setLoading(false);
      }

      // 2. Fetch from Supabase and merge in background — skip if no auth yet
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('photos')
          .select('*')
          .eq('date', date)
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!data || data.length === 0) {
          setLoading(false);
          return;
        }

        const withUrls = await Promise.all(
          data.map(async (p: Photo) => {
            const cached = local.find((l) => l.id === p.id);
            return {
              ...p,
              local_uri: cached?.local_uri,
              // timestamp is local-only metadata (no DB column) — carry it from cache
              timestamp: cached?.timestamp ?? p.timestamp,
              sync_status: 'synced' as const,
              // Prefer local file — avoids network round-trip for display
              url: cached?.local_uri ?? (await getPhotoUrl(p.storage_path)),
            };
          })
        );

        // Keep any pending-only items (not yet in Supabase)
        const pendingOnly = local.filter(
          (l) => l.sync_status === 'pending' && !data.find((d) => d.id === l.id)
        );

        const merged = [...withUrls, ...pendingOnly];
        setPhotos(date, merged);

        // Update local cache with synced status
        for (const photo of withUrls) {
          await localStore.savePhoto(date, photo);
        }
      } catch {
        // Offline — already showing local data above
      }

      setLoading(false);
    }

    load();
  }, [date, userId]);

  return { photos, loading };
}
