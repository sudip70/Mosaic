import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import { today } from '@/lib/dates';
import { localStore } from '@/lib/localStore';
import type { GridDay } from '@/types';

// Photo presence is local-only in Phase 1. The daily *colours* are still fetched
// from Supabase — they're a global, public, server-seeded palette, not user data.
export function useGrid(_userId: string, startDate: string) {
  const [days, setDays] = useState<GridDay[]>([]);
  const [loading, setLoading] = useState(true);

  const build = useCallback(async () => {
    const todayStr = today();
    const allDates = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(todayStr),
    }).map((d) => format(d, 'yyyy-MM-dd'));

    // 1. Build from local data first — instant, works offline
    const colorCache = await localStore.getColorCache();
    const localPresent = await localStore.getPhotosPresenceForDates(allDates);

    setDays(
      allDates.map((date) => ({
        date,
        hex: colorCache[date]?.hex ?? '#CCCCCC',
        name: colorCache[date]?.name ?? '',
        hasPhotos: localPresent.has(date),
        isToday: date === todayStr,
      }))
    );
    setLoading(false);

    // 2. Refresh the global colour palette from Supabase (public read). Photo
    //    presence stays local — captures never touch the cloud in Phase 1.
    try {
      const { data: colors } = await supabase.from('colors').select('date,hex,name,id').in('date', allDates);
      if (!colors) return;
      await localStore.cacheColors(colors as any);
      const freshColorCache = await localStore.getColorCache();

      setDays(
        allDates.map((date) => ({
          date,
          hex: freshColorCache[date]?.hex ?? '#CCCCCC',
          name: freshColorCache[date]?.name ?? '',
          hasPhotos: localPresent.has(date),
          isToday: date === todayStr,
        }))
      );
    } catch {
      // Offline — already showing local grid above
    }
  }, [startDate]);

  useEffect(() => { build(); }, [build]);

  // `reload` lets the screen refresh on focus after a new capture.
  return { days, loading, reload: build };
}
