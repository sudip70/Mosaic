import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { today } from '@/lib/dates';
import { localStore } from '@/lib/localStore';
import { useColorStore } from '@/store/useColorStore';
import type { Color } from '@/types';

export function useToday() {
  const [color, setColor] = useState<Color | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const date = today();
  const setTodayColor = useColorStore((s) => s.setTodayColor);

  useEffect(() => {
    async function fetchColor() {
      // 1. Show cached color immediately if available
      const cached = await localStore.getCachedColor(date);
      if (cached) {
        setColor(cached);
        setTodayColor(cached);
        setLoading(false);
      }

      // 2. Fetch fresh from Supabase (updates cache for future offline use)
      try {
        const { data, error: fetchError } = await supabase
          .from('colors')
          .select('*')
          .eq('date', date)
          .single();

        if (data) {
          setColor(data);
          setTodayColor(data);
          await localStore.cacheColors([data]);
        } else if (fetchError && !cached) {
          setError(fetchError.message);
        }
      } catch {
        // Offline — already showing cached color if we had one
        if (!cached) setError('No color available offline yet');
      }

      setLoading(false);
    }

    fetchColor();
  }, [date]);

  return { color, loading, error, today: date };
}
