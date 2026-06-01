import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';

// Phase 2 — placeholder only
export default function FriendsScreen() {
  return (
    <View style={s.root}>
      <Text style={s.label}>Friends</Text>
      <Text style={s.sub}>Coming in Phase 2</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontFamily: fonts.serifR, fontSize: 28, color: colors.ink100 },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink30 },
});
