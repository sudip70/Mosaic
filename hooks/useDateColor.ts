import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { localStore } from '@/lib/localStore';
import type { Color } from '@/types';

/**
 * Resolves the assigned colour for any given date — cache first, then network.
 * Used by the Day-detail screen where the date may be in the past.
 */
export function useDateColor(date: string) {
  const [color, setColor] = useState<Color | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!date) return;
      const cached = await localStore.getCachedColor(date);
      if (cached && active) setColor(cached);

      try {
        const { data } = await supabase
          .from('colors')
          .select('*')
          .eq('date', date)
          .single();
        if (data && active) {
          setColor(data);
          await localStore.cacheColors([data]);
        }
      } catch {
        // Offline — cached value (if any) already shown
      }
    }
    load();
    return () => { active = false; };
  }, [date]);

  return color;
}
