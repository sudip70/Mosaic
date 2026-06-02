import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, shadows, spacing } from '@/lib/theme';
import { ONBOARDING_KEY } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';

const SWATCHES = [
  { name: 'Coral', hex: '#C4604A' },
  { name: 'Steel', hex: '#5B8DB8' },
  { name: 'Sage', hex: '#6BAF6B' },
  { name: 'Amber', hex: '#D4A843' },
  { name: 'Mauve', hex: '#A0668A' },
  { name: 'Teal', hex: '#4A9B8F' },
];

const STEPS = [
  { icon: '🎨', bg: '#FFF0EC', title: 'Get a colour', desc: 'A fresh colour every morning. Yours to find in the world around you.' },
  { icon: '📷', bg: '#EDF4FF', title: 'Photograph it', desc: 'As many shots as you like — no rules, no pressure. Just colour.' },
  { icon: '✦', bg: '#F0FAF0', title: 'Build your mosaic', desc: 'Each day becomes a tile. A year becomes something beautiful.' },
];

export default function OnboardingScreen() {
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  async function begin() {
    // Flip the shared flag first so the root layout won't redirect back here.
    setOnboarded(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/');
  }

  return (
    <AppScreen background={colors.surface0}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Eyebrow */}
        <View style={s.eyebrow}>
          <View style={s.dot} />
          <AppText style={s.tag}>Welcome to Mosaic</AppText>
        </View>

        {/* Headline */}
        <AppText style={s.headline}>
          See the world{'\n'}in <AppText style={s.headlineAccent}>colour.</AppText>
        </AppText>
        <AppText style={s.sub}>
          One colour every day. Photograph it wherever you find it.
          Build a diary of your life without even trying.
        </AppText>

        {/* Swatch strip */}
        <View style={s.swatches}>
          {SWATCHES.map((sw) => (
            <View key={sw.name} style={[s.swatch, { backgroundColor: sw.hex }]} />
          ))}
        </View>

        {/* Steps */}
        <View style={s.steps}>
          {STEPS.map((step) => (
            <View key={step.title} style={s.step}>
              <View style={[s.stepIcon, { backgroundColor: step.bg }]}>
                <AppText style={{ fontSize: 18 }}>{step.icon}</AppText>
              </View>
              <View style={s.stepCopy}>
                <AppText style={s.stepTitle}>{step.title}</AppText>
                <AppText style={s.stepDesc}>{step.desc}</AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Flexible spacer pushes the CTA toward the bottom on tall screens */}
        <View style={s.spacer} />

        {/* CTA */}
        <Pressable onPress={begin} accessibilityRole="button" accessibilityLabel="Begin today">
          {({ pressed }) => (
            <View style={[s.cta, pressed && s.ctaPressed]}>
              <View>
                <AppText style={s.ctaMain}>Begin today</AppText>
                <AppText style={s.ctaNote}>No account needed · 10 seconds to start</AppText>
              </View>
              <View style={s.ctaArrow}>
                <AppText style={s.ctaArrowIcon}>→</AppText>
              </View>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.x3, gap: spacing.lg },
  spacer: { flex: 1, minHeight: spacing.lg },

  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  tag: { fontFamily: fonts.sansSb, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },

  headline: { fontFamily: fonts.serifR, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: colors.ink100 },
  headlineAccent: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: colors.accent },
  sub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.ink60 },

  swatches: { flexDirection: 'row', gap: 6, height: 52 },
  swatch: { flex: 1, borderRadius: radius.r12, ...shadows.elev1 },

  steps: { gap: spacing.md, marginTop: spacing.xs },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepIcon: {
    width: 38, height: 38, borderRadius: radius.r12,
    alignItems: 'center', justifyContent: 'center', ...shadows.elev1,
  },
  stepCopy: { flex: 1 },
  stepTitle: { fontFamily: fonts.sansSb, fontSize: 14, color: colors.ink100, marginBottom: 2 },
  stepDesc: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.ink60 },

  cta: {
    backgroundColor: colors.ink100, borderRadius: radius.r24, padding: spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.ink100, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  ctaMain: { fontFamily: fonts.serifR, fontSize: 22, color: '#fff', letterSpacing: -0.2 },
  ctaNote: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  ctaArrow: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 4,
  },
  ctaArrowIcon: { fontSize: 21, color: '#fff' },
});
