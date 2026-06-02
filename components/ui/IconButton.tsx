import { Pressable, View, StyleSheet } from 'react-native';
import { shadows, layout, type Palette } from '@/lib/theme';
import { ICON_STROKE, type LucideIcon } from '@/lib/icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Render a transparent button (no fill/border) — for placement balance. */
  ghost?: boolean;
}

/**
 * Circular header button used in the top nav of every screen.
 * Single source of truth for the 36px round icon affordance.
 */
export function IconButton({ icon: Icon, onPress, accessibilityLabel, ghost }: IconButtonProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {({ pressed }) => (
        // Visual lives on a child View so the circular fill isn't dropped by
        // Pressable style resolution on the New Architecture.
        <View style={[s.btn, ghost && s.ghost, pressed && onPress && s.pressed]}>
          <Icon size={18} color={colors.ink60} strokeWidth={ICON_STROKE} />
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  btn: {
    width: layout.iconBtn,
    height: layout.iconBtn,
    borderRadius: layout.iconBtn / 2,
    backgroundColor: c.surface1,
    borderWidth: 1,
    borderColor: c.ink15,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elev1,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: { backgroundColor: c.surface2 },
});
