import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import { today } from '@/lib/dates';
import { localStore } from '@/lib/localStore';
import type { GridDay } from '@/types';

export function useGrid(userId: string, startDate: string) {
  const [days, setDays] = useState<GridDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function build() {
      const todayStr = today();
      const allDates = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(todayStr),
      }).map((d) => format(d, 'yyyy-MM-dd'));

      // 1. Build from local data first — works offline
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

      // 2. Fetch from Supabase and merge (updates colors cache + cloud photo presence)
      try {
        const [{ data: colors }, { data: photos }] = await Promise.all([
          supabase.from('colors').select('date,hex,name,id').in('date', allDates),
          userId ? supabase.from('photos').select('date').eq('user_id', userId) : Promise.resolve({ data: [] }),
        ]);

        if (colors) await localStore.cacheColors(colors as any);

        const cloudDates = new Set(photos?.map((p) => p.date) ?? []);
        const mergedPresence = new Set([...localPresent, ...cloudDates]);

        const freshColorCache = await localStore.getColorCache();

        setDays(
          allDates.map((date) => ({
            date,
            hex: freshColorCache[date]?.hex ?? '#CCCCCC',
            name: freshColorCache[date]?.name ?? '',
            hasPhotos: mergedPresence.has(date),
            isToday: date === todayStr,
          }))
        );
      } catch {
        // Offline — already showing local grid above
      }
    }

    build();
  }, [userId, startDate]);

  return { days, loading };
}
