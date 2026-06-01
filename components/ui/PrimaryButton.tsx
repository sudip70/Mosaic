import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, fonts } from '@/lib/theme';

interface PrimaryButtonProps {
  label: string;
  sublabel?: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * The dark pill call-to-action with an accent circle icon on the right.
 * Used for the headline action on a screen (Capture now, Begin today…).
 */
export function PrimaryButton({ label, sublabel, icon, onPress, disabled }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, pressed && s.pressed, disabled && s.disabled]}
    >
      <View style={s.copy}>
        <AppText style={s.label}>{label}</AppText>
        {sublabel && <AppText style={s.sub}>{sublabel}</AppText>}
      </View>
      {icon && (
        <View style={s.icon}>
          <AppText style={s.iconText}>{icon}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.ink100,
    borderRadius: radius.r20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: colors.ink100,
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
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 4,
  },
  iconText: { fontSize: 19 },
});
