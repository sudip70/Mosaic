import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { radius, shadows, fonts, type Palette } from '@/lib/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ColorHeroProps {
  hex: string;
  name: string;
  /** Small all-caps label above the name (e.g. "Today's colour"). */
  kicker?: string;
  /** Pill in the top-right corner (e.g. "Day 47"). */
  chip?: string;
  /** Footer line — left text (defaults to the hex value) and right text. */
  footLeft?: string;
  footRight?: string;
  /** Swatch height. Default 188 (Today). Day-detail uses 120. */
  height?: number;
  /** Name font size. Default 54 (Today). Day-detail uses 38. */
  nameSize?: number;
}

/**
 * The signature colour card — a saturated swatch with the colour's name set
 * in large Fraunces italic, over a surface footer showing the hex + a date.
 * Shared by the Today screen and the Day-detail screen.
 */
export function ColorHero({
  hex, name, kicker, chip, footLeft, footRight, height = 188, nameSize = 54,
}: ColorHeroProps) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.card}>
      <View style={[s.swatch, { backgroundColor: hex, height }]}>
        <View style={s.overlay} pointerEvents="none" />
        {(kicker || chip) && (
          <View style={s.topRow}>
            {kicker ? <AppText style={s.kicker}>{kicker}</AppText> : <View />}
            {chip && (
              <View style={s.chip}>
                <AppText style={s.chipText}>{chip}</AppText>
              </View>
            )}
          </View>
        )}
        <AppText style={[s.name, { fontSize: nameSize, lineHeight: nameSize * 0.96 }]}>
          {name}
        </AppText>
      </View>

      <View style={s.foot}>
        <View style={s.hexWrap}>
          <View style={[s.hexDot, { backgroundColor: hex }]} />
          <AppText style={s.hexVal}>{footLeft ?? hex.toUpperCase()}</AppText>
        </View>
        {footRight && <AppText style={s.footRight}>{footRight}</AppText>}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    borderRadius: radius.r24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: c.ink15,
    ...shadows.elev3,
  },
  swatch: { padding: 20, justifyContent: 'space-between' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: {
    fontFamily: fonts.sansSb, fontSize: 10, letterSpacing: 1.6,
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  chipText: { fontFamily: fonts.sansSb, fontSize: 10, color: 'rgba(255,255,255,0.78)', letterSpacing: 0.4 },
  name: {
    fontFamily: fonts.serif, color: '#fff', letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 16,
  },
  foot: {
    backgroundColor: c.surface0, paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: c.ink15,
  },
  hexWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hexDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 3, borderColor: c.surface0,
  },
  hexVal: { fontFamily: fonts.sansMd, fontSize: 12, color: c.ink60, letterSpacing: 0.6 },
  footRight: { fontFamily: fonts.sans, fontSize: 12, color: c.ink30 },
});
