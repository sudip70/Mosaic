import { ScrollView, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, radius, spacing, type Palette } from '@/lib/theme';

const LAST_UPDATED = 'June 1, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.section}>
      <AppText style={s.sectionTitle}>{title}</AppText>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  const s = useThemedStyles(makeStyles);
  return <AppText style={s.paragraph}>{children}</AppText>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.bulletRow}>
      <View style={s.bulletDot} />
      <AppText style={s.bulletText}>{children}</AppText>
    </View>
  );
}

export default function PrivacyScreen() {
  const s = useThemedStyles(makeStyles);
  return (
    <AppScreen>
      <ScreenHeader
        title="Privacy"
        left={{ icon: '←', accessibilityLabel: 'Back', onPress: () => router.back() }}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={s.intro}>
          <AppText style={s.introTitle}>Your world, kept private</AppText>
          <AppText style={s.introBody}>
            Mosaic is built to be calm and personal. We collect as little as
            possible, and your photos belong to you. Here's exactly how it works.
          </AppText>
          <AppText style={s.updated}>Last updated · {LAST_UPDATED}</AppText>
        </View>

        <Section title="The short version">
          <Bullet>No account, email, or name is required to use Mosaic.</Bullet>
          <Bullet>Your photos are private by default — only you can see them.</Bullet>
          <Bullet>We don't sell your data or show ads.</Bullet>
          <Bullet>Analytics are anonymous and never include your photos.</Bullet>
        </Section>

        <Section title="Your account">
          <P>
            On first launch, Mosaic creates an anonymous account for you. It is a
            random identifier with no email, phone number, or name attached. It
            exists so your photos and streak can sync securely to your own private
            cloud storage.
          </P>
        </Section>

        <Section title="Your photos">
          <P>
            Photos you capture are saved on your device and uploaded to private
            cloud storage tied to your anonymous account. They are protected so
            that only your account can read them. We never look at, share, or use
            your photos for any purpose.
          </P>
        </Section>

        <Section title="What we collect">
          <P>
            To keep Mosaic working and improve it, we collect a small amount of
            anonymous, non-identifying information:
          </P>
          <Bullet>Crash reports — so we can fix bugs. These contain device type and app version, never personal data.</Bullet>
          <Bullet>Anonymous usage events — for example, that a photo was captured or a screen was viewed. These never include your photos, their contents, or any way to identify you.</Bullet>
        </Section>

        <Section title="What we never do">
          <Bullet>We never sell or rent your data.</Bullet>
          <Bullet>We never show third-party advertising.</Bullet>
          <Bullet>We never attach your identity to analytics events.</Bullet>
          <Bullet>We never access the contents of your photos.</Bullet>
        </Section>

        <Section title="Your control">
          <P>
            You can clear cached data any time from Settings → Storage. Deleting
            the app removes the photos stored on your device. Because Phase 1
            accounts are anonymous, your data is not linked to any personal
            identity.
          </P>
        </Section>

        <Section title="Changes to this policy">
          <P>
            If this policy changes in a meaningful way, we'll update the date above
            and surface it in the app. Continued use of Mosaic means you accept the
            current policy.
          </P>
        </Section>

        <Section title="Contact">
          <P>
            Questions about your privacy? Reach us at privacy@mosaicapp.com.
          </P>
        </Section>

        <View style={s.footer}>
          <AppText style={s.footerLogo}>Mosaic</AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.x4, gap: spacing.xxl },

  intro: {
    backgroundColor: c.accentSoft, borderRadius: radius.r20,
    padding: spacing.xl, gap: spacing.sm,
    borderWidth: 1, borderColor: c.accent15,
  },
  introTitle: { fontFamily: fonts.serifR, fontSize: 22, color: c.ink100, letterSpacing: -0.4 },
  introBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: c.ink60 },
  updated: { fontFamily: fonts.sansMd, fontSize: 11, color: c.ink30, marginTop: spacing.xs },

  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.sansSb, fontSize: 15, color: c.ink100 },
  paragraph: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: c.ink60 },

  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: c.accent,
    marginTop: 7,
  },
  bulletText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: c.ink60 },

  footer: { alignItems: 'center', paddingTop: spacing.sm },
  footerLogo: { fontFamily: fonts.serifR, fontSize: 18, color: c.ink30, letterSpacing: -0.2 },
});
