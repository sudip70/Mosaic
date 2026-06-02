import { View, StyleSheet } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, radius, spacing, type Palette } from '@/lib/theme';

// Phase 2 — intentional "coming soon" state, not an empty screen.
const PREVIEW_COLORS = ['#C4604A', '#5B8DB8', '#6BAF6B', '#D4A843', '#A0668A'];

export default function FriendsScreen() {
  const s = useThemedStyles(makeStyles);
  return (
    <AppScreen>
      <ScreenHeader wordmark="Friends" />

      <View style={s.body}>
        {/* Overlapping avatar preview */}
        <View style={s.avatars}>
          {PREVIEW_COLORS.map((c, i) => (
            <View
              key={c}
              style={[s.avatar, { backgroundColor: c, marginLeft: i === 0 ? 0 : -14, zIndex: PREVIEW_COLORS.length - i }]}
            />
          ))}
        </View>

        <View style={s.lockPill}>
          <AppText style={s.lockText}>🔒  Phase 2</AppText>
        </View>

        <AppText variant="display" style={s.title}>Share your colour</AppText>
        <AppText variant="body" style={s.sub}>
          Soon you'll be able to add a small circle of friends and see how everyone
          captured the same colour on the same day. Quiet, private, no follower counts.
        </AppText>
      </View>
    </AppScreen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.x3, gap: spacing.lg },
  avatars: { flexDirection: 'row', marginBottom: spacing.xs },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: c.surface0,
  },
  lockPill: {
    backgroundColor: c.surface1, borderWidth: 1, borderColor: c.ink15,
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  lockText: { fontFamily: fonts.sansSb, fontSize: 11, color: c.ink30, letterSpacing: 0.4 },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center', lineHeight: 21, color: c.ink60 },
});
