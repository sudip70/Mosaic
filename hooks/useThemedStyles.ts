import { useMemo } from 'react';
import type { Palette } from '@/lib/theme';
import { useTheme } from './useTheme';

/**
 * Builds a StyleSheet from the active palette and memoizes it per theme.
 * Usage:
 *   const makeStyles = (c: Palette) => StyleSheet.create({ box: { backgroundColor: c.surface0 } });
 *   const s = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
