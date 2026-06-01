// Phase 2 — account entry point (not reachable in Phase 1)
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, spacing } from '@/lib/theme';

export default function WelcomeScreen() {
  return (
    <AppScreen>
      <View style={s.body}>
        <AppText variant="hero" style={s.title}>Mosaic</AppText>
        <AppText variant="body" style={s.sub}>
          One colour. Every day. A mosaic of your life.
        </AppText>
      </View>
      <View style={s.actions}>
        <PrimaryButton
          label="Create account"
          sublabel="Save your grid across devices →"
          icon="→"
          onPress={() => router.push('/(auth)/signup')}
        />
      </View>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.x3 },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center', color: colors.ink60 },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
});
