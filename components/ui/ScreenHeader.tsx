import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { layout, type Palette } from '@/lib/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface HeaderAction {
  icon: string;
  onPress?: () => void;
  accessibilityLabel: string;
}

interface ScreenHeaderProps {
  /** Large serif wordmark, left-aligned (Today, Grid). */
  wordmark?: string;
  /** Centered title — small serif, with balanced side slots (Settings, Day). */
  title?: string;
  left?: HeaderAction;
  right?: HeaderAction;
}

/**
 * Uniform top navigation bar. Two modes:
 *  - `wordmark`: large left-aligned serif + optional right action.
 *  - `title`: centered serif title with symmetric left/right slots.
 * Keeps nav padding identical on every screen.
 */
export function ScreenHeader({ wordmark, title, left, right }: ScreenHeaderProps) {
  const s = useThemedStyles(makeStyles);
  if (title) {
    return (
      <View style={s.bar}>
        <View style={s.slot}>
          {left ? <IconButton {...left} /> : <View style={s.spacer} />}
        </View>
        <AppText variant="wordmark" style={s.centerTitle}>{title}</AppText>
        <View style={[s.slot, s.slotRight]}>
          {right ? <IconButton {...right} /> : <View style={s.spacer} />}
        </View>
      </View>
    );
  }

  return (
    <View style={s.bar}>
      <AppText variant="wordmark">{wordmark}</AppText>
      {right ? <IconButton {...right} /> : <View style={s.spacer} />}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.navPadH,
    paddingTop: layout.navPadTop,
    paddingBottom: layout.navPadBottom,
    backgroundColor: c.surface0,
  },
  slot: { width: layout.iconBtn },
  slotRight: { alignItems: 'flex-end' },
  spacer: { width: layout.iconBtn, height: layout.iconBtn },
  centerTitle: { fontSize: 20 },
});
