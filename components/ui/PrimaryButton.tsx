import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { radius, fonts } from '@/lib/theme';
import { ICON_STROKE, type LucideIcon } from '@/lib/icons';
import { useTheme } from '@/hooks/useTheme';

interface PrimaryButtonProps {
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  /** Colour of the icon circle (and its glow). Defaults to the brand accent. */
  iconColor?: string;
  onPress: () => void;
  disabled?: boolean;
}

// The pill stays dark in light mode; in dark mode it lifts to an elevated
// surface so it still reads against the dark canvas. Text is white in both.
const DARK_PILL = '#1A1714';

/**
 * The pill call-to-action with a coloured circle icon on the right.
 * Used for the headline action on a screen (Capture now, Begin today…).
 */
export function PrimaryButton({ label, sublabel, icon: Icon, iconColor, onPress, disabled }: PrimaryButtonProps) {
  const { colors, isDark } = useTheme();
  const pillBg = isDark ? colors.surface2 : DARK_PILL;
  const borderColor = isDark ? colors.ink15 : 'rgba(255,255,255,0.06)';
  const iconBg = iconColor ?? colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      {({ pressed }) => (
        // Visual container is a plain View — keeps the fill + row layout from
        // being dropped by Pressable style resolution on the New Architecture.
        <View style={[s.btn, { backgroundColor: pillBg, borderColor }, pressed && s.pressed, disabled && s.disabled]}>
          <View style={s.copy}>
            <AppText style={s.label}>{label}</AppText>
            {sublabel && <AppText style={s.sub}>{sublabel}</AppText>}
          </View>
          {Icon && (
            <View style={[s.icon, { backgroundColor: iconBg, shadowColor: iconBg }]}>
              <Icon size={20} color="#fff" strokeWidth={ICON_STROKE} />
            </View>
          )}
        </View>
      )}
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
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  copy: { flex: 1 },
  label: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
  sub: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 4,
  },
});
