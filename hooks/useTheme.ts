import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/useSettings';
import { lightColors, darkColors, type Palette } from '@/lib/theme';

export interface Theme {
  colors: Palette;
  isDark: boolean;
}

/**
 * Resolves the active theme from the user's preference (System/Light/Dark)
 * combined with the OS colour scheme. Reactive: re-renders on either change.
 */
export function useTheme(): Theme {
  const pref = useSettings((s) => s.theme);
  const system = useColorScheme(); // 'light' | 'dark' | null
  const isDark = pref === 'Dark' || (pref === 'System' && system === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark };
}
