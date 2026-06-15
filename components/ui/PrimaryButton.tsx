import { Pressable, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppText } from './AppText';
import { radius, fonts } from '@/lib/theme';
import type { ComponentType } from 'react';
import { ICON_STROKE } from '@/lib/icons';
import { useTheme } from '@/hooks/useTheme';
import { usePressScale } from '@/hooks/usePressScale';

interface PrimaryButtonProps {
  label: string;
  sublabel?: string;
  icon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** Colour of the icon circle (and its glow). Defaults to the brand accent. */
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
}

// Tonal pills — a lifted shade of each theme's own tone, so the primary action
// reads as the most-elevated surface and stays distinct from the cards around it
// without inverting to a stark colour. Dark: a charcoal lighter than every card.
// Light: a clean white brighter than the cream canvas.
const PILL_DARK = '#3A3A3A';
const PILL_LIGHT = '#FFFFFF';

/**
 * The pill call-to-action with a coloured circle icon on the right.
 * Used for the headline action on a screen (Capture now, Begin today…).
 */
export function PrimaryButton({ label, sublabel, icon: Icon, iconColor, onPress, disabled }: PrimaryButtonProps) {
  const { colors, isDark } = useTheme();
  const press = usePressScale(0.97);
  const pillBg = isDark ? PILL_DARK : PILL_LIGHT;
  // ink100 is the theme's primary foreground — white in dark, near-black in
  // light — so it contrasts with the tonal pill in either mode; ink60 dims the
  // sub the same way.
  const onPill = colors.ink100;
  const subColor = colors.ink60;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : colors.ink15;
  // The icon coin contrasts with the pill on its own: the accent coin (white in
  // dark, near-black in light) with an onAccent glyph. A custom iconColor (e.g.
  // the day's colour on Today) always wins.
  const iconBg = iconColor ?? colors.accent;
  const iconGlyph = iconColor ? '#fff' : colors.onAccent;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      {/* Visual container is a plain View — keeps the fill + row layout from
          being dropped by Pressable style resolution on the New Architecture.
          The Animated.View wrapper carries only the press-scale transform. */}
      <Animated.View style={press.style}>
        <View style={[s.btn, { backgroundColor: pillBg, borderColor }, disabled && s.disabled]}>
          <View style={s.copy}>
            <AppText style={[s.label, { color: onPill }]}>{label}</AppText>
            {sublabel && <AppText style={[s.sub, { color: subColor }]}>{sublabel}</AppText>}
          </View>
          {Icon && (
            <View style={[s.icon, { backgroundColor: iconBg, shadowColor: iconBg }]}>
              <Icon size={20} color={iconGlyph} strokeWidth={ICON_STROKE} />
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: radius.r20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  disabled: { opacity: 0.45 },
  copy: { flex: 1 },
  label: { fontFamily: fonts.sansSb, fontSize: 15 },
  sub: { fontFamily: fonts.sans, fontSize: 11, marginTop: 2 },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 4,
  },
});
