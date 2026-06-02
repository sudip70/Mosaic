import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, shadows, layout } from '@/lib/theme';

interface IconButtonProps {
  icon: string;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Render a transparent button (no fill/border) — for placement balance. */
  ghost?: boolean;
}

/**
 * Circular header button used in the top nav of every screen.
 * Single source of truth for the 36px round icon affordance.
 */
export function IconButton({ icon, onPress, accessibilityLabel, ghost }: IconButtonProps) {
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
          <Text style={s.icon}>{icon}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: layout.iconBtn,
    height: layout.iconBtn,
    borderRadius: layout.iconBtn / 2,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.ink15,
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
  pressed: { backgroundColor: colors.surface2 },
  icon: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.ink60 },
});
