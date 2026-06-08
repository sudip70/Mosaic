import { View, ScrollView, StyleSheet } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { useGrid } from '@/hooks/useGrid';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { localStore } from '@/lib/localStore';
import { Settings, User, ICON_STROKE } from '@/lib/icons';
import { fonts, radius, shadows, spacing, type Palette } from '@/lib/theme';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { trackScreen } = useAnalytics();
  const { user, isAnonymous } = useAuth();
  const { current, longest } = useStreak();

  const startDate = user?.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const { days, reload } = useGrid(user?.id ?? '', startDate);
  const daysCaptured = useMemo(() => days.filter((d) => d.hasPhotos).length, [days]);
  const since = user?.created_at ? format(parseISO(user.created_at), 'MMM yyyy') : '';

  const [totalImages, setTotalImages] = useState(0);

  useFocusEffect(
    useCallback(() => {
      trackScreen('profile');
      reload();
    }, [reload])
  );

  // Total images = sum of all photos across every day in the mosaic.
  useFocusEffect(
    useCallback(() => {
      if (!days.length) return;
      localStore.countPhotosForDates(days.map((d) => d.date)).then(setTotalImages);
    }, [days])
  );

  return (
    <AppScreen>
      <ScreenHeader
        wordmark="Profile"
        right={{ icon: Settings, accessibilityLabel: 'Settings', onPress: () => router.push('/settings') }}
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={s.identity}>
          <View style={s.avatar}>
            <User size={36} color={colors.onAccent} strokeWidth={ICON_STROKE} />
          </View>
          <AppText variant="display" style={s.name}>You</AppText>
          <AppText style={s.sub}>
            {isAnonymous ? 'Anonymous account' : user?.email ?? ''}
            {since ? ` · since ${since}` : ''}
          </AppText>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          <Stat value={`${current}`} unit="days" label="Current streak" />
          <Stat value={`${longest}`} unit="days" label="Best streak" />
          <Stat value={`${daysCaptured}`} unit="total" label="Days captured" />
          <Stat value={`${totalImages}`} unit="total" label="Images captured" />
        </View>

        {/* Phase 2 hint */}
        <Card style={s.hint}>
          <AppText style={s.hintTitle}>Make it yours</AppText>
          <AppText style={s.hintSub}>
            In Phase 2 you'll add a name and email so your mosaic stays safe and follows you across devices.
          </AppText>
        </Card>
      </ScrollView>
    </AppScreen>
  );
}

function Stat({ value, unit, label }: { value: string; unit: string; label: string }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.statCard}>
      <AppText style={s.statValue}>{value}</AppText>
      <AppText style={s.statUnit}>{unit}</AppText>
      <AppText style={s.statLabel}>{label}</AppText>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.x3, gap: spacing.xxl },

  identity: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: c.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
    shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  name: {},
  sub: { fontFamily: fonts.sans, fontSize: 13, color: c.ink30 },

  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: c.surface0, borderRadius: radius.r16,
    borderWidth: 1, borderColor: c.ink15, paddingVertical: spacing.md, paddingHorizontal: 4,
    alignItems: 'center', ...shadows.elev1,
  },
  statValue: { fontFamily: fonts.serifR, fontSize: 26, color: c.accent, lineHeight: 28 },
  statUnit: { fontFamily: fonts.sansSb, fontSize: 8, letterSpacing: 0.6, textTransform: 'uppercase', color: c.ink30 },
  statLabel: { fontFamily: fonts.sansMd, fontSize: 10, color: c.ink60, marginTop: 6, textAlign: 'center' },

  hint: { padding: spacing.xl, gap: 6 },
  hintTitle: { fontFamily: fonts.sansSb, fontSize: 14, color: c.ink100 },
  hintSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: c.ink60 },
});
