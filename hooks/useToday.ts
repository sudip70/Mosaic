import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { today } from '@/lib/dates';
import { localStore } from '@/lib/localStore';
import { reportError } from '@/lib/reportError';
import { useColorStore } from '@/store/useColorStore';
import type { Color } from '@/types';

// Dedupe the network fetch across concurrent callers (Today + Grid both use
// this hook on mount) so today's colour is only requested once.
const inflight: Record<string, Promise<Color | null>> = {};

function fetchTodayColor(date: string): Promise<Color | null> {
  if (!inflight[date]) {
    inflight[date] = (async () => {
      try {
        const { data } = await supabase.from('colors').select('*').eq('date', date).single();
        return (data as Color | null) ?? null;
      } finally {
        // Allow a fresh attempt later (e.g. after coming back online).
        delete inflight[date];
      }
    })();
  }
  return inflight[date];
}

export function useToday() {
  const [color, setColor] = useState<Color | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const date = today();
  const setTodayColor = useColorStore((s) => s.setTodayColor);

  useEffect(() => {
    let active = true;

    async function load() {
      // 1. Show cached colour immediately if available.
      const cached = await localStore.getCachedColor(date);
      if (cached && active) {
        setColor(cached);
        setTodayColor(cached);
        setLoading(false);
      }

      // 2. Fetch fresh (deduped) and refresh the cache.
      try {
        const data = await fetchTodayColor(date);
        if (data && active) {
          setColor(data);
          setTodayColor(data);
          await localStore.cacheColors([data]);
        } else if (!data && !cached && active) {
          setError('No colour assigned for today');
        }
      } catch (e) {
        reportError(e, { scope: 'useToday', date });
        if (!cached && active) setError('No colour available offline yet');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [date]);

  return { color, loading, error, today: date };
}
