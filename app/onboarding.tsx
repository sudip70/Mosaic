import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, radius, shadows, spacing, type Palette } from '@/lib/theme';
import { ArrowRight, ICON_STROKE } from '@/lib/icons';
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
  const { colors, isDark } = useTheme();
  const s = useThemedStyles(makeStyles);
  const ctaBg = isDark ? colors.surface2 : '#1A1714';

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

        {/* Steps — same uniform gap as the rest of the top content */}
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

        {/* Spacer pushes the CTA to the bottom */}
        <View style={s.spacer} />

        {/* CTA — pinned to the bottom */}
        <Pressable onPress={begin} accessibilityRole="button" accessibilityLabel="Begin today">
          {({ pressed }) => (
            <View style={[s.cta, { backgroundColor: ctaBg }, pressed && s.ctaPressed]}>
              <View>
                <AppText style={s.ctaMain}>Begin today</AppText>
                <AppText style={s.ctaNote}>No account needed · 10 seconds to start</AppText>
              </View>
              <View style={s.ctaArrow}>
                <ArrowRight size={21} color="#fff" strokeWidth={ICON_STROKE} />
              </View>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  // Single uniform gap so the colour swatches and the three points share the
  // same vertical rhythm; the spacer below pushes the CTA to the bottom.
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.x4, gap: spacing.lg },
  spacer: { flex: 1 },

  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.accent },
  tag: { fontFamily: fonts.sansSb, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.accent },

  headline: { fontFamily: fonts.serifR, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: c.ink100 },
  headlineAccent: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: c.accent },
  sub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: c.ink60 },

  swatches: { flexDirection: 'row', gap: 6, height: 52 },
  swatch: { flex: 1, borderRadius: radius.r12, ...shadows.elev1 },

  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepIcon: {
    width: 38, height: 38, borderRadius: radius.r12,
    alignItems: 'center', justifyContent: 'center', ...shadows.elev1,
  },
  stepCopy: { flex: 1 },
  stepTitle: { fontFamily: fonts.sansSb, fontSize: 14, color: c.ink100, marginBottom: 2 },
  stepDesc: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: c.ink60 },

  cta: {
    borderRadius: radius.r24, padding: spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  ctaMain: { fontFamily: fonts.serifR, fontSize: 22, color: '#fff', letterSpacing: -0.2 },
  ctaNote: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  ctaArrow: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 4,
  },
});
