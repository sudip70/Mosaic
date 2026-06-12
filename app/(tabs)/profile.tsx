import { View, ScrollView, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { MosaicGrid } from '@/components/ui/MosaicGrid';
import { useChallengeStore } from '@/store/useChallengeStore';
import { getArtwork } from '@/lib/artworks';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { useGrid } from '@/hooks/useGrid';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { localStore } from '@/lib/localStore';
import { Pin, Settings, User, ICON_STROKE } from '@/lib/icons';
import { fonts, radius, shadows, spacing, type Palette } from '@/lib/theme';

const SCREEN_W = Dimensions.get('window').width;
const CONTENT_W = SCREEN_W - spacing.xl * 2;            // profile content width (matches s.content padding)
const PINNED_W = Math.round((CONTENT_W - spacing.md) / 2); // ~half-width — matches the artwork-card size

export default function ProfileScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { trackScreen } = useAnalytics();
  const { user, isAnonymous } = useAuth();
  const { current, longest } = useStreak();
  const active = useChallengeStore((st) => st.active);
  const history = useChallengeStore((st) => st.history);
  const pinnedId = useChallengeStore((st) => st.pinnedId);

  // The one mosaic the user chose to show off — featured large at the top of the
  // showcase. Unlike the row below it, this can be an in-progress run, which is
  // the whole point of pinning an ongoing mosaic. Resolve from the live run or
  // history by id.
  const pinned = useMemo(
    () => (pinnedId ? (active?.id === pinnedId ? active : history.find((c) => c.id === pinnedId) ?? null) : null),
    [pinnedId, active, history]
  );
  // Showcase finished paintings only — set-aside/in-progress runs (which may
  // have zero filled tiles) live on the Mosaic tab, not here. The pinned one is
  // featured above, so keep it out of this row to avoid showing it twice.
  const mosaics = useMemo(
    () => history.filter((c) => c.status === 'completed' && c.id !== pinnedId),
    [history, pinnedId]
  );

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

        {/* Pinned showcase — the mosaic the user chose to show off. May be in
            progress, which is the point of pinning an ongoing run. Progress mode
            renders from filled + cols/rows, so it draws even for mosaics whose
            tier predates the current artwork data. */}
        {pinned && (
          <View style={s.section}>
            <View style={s.pinnedLabelRow}>
              <Pin size={11} color={colors.ink30} strokeWidth={ICON_STROKE} />
              <AppText variant="overline" style={s.sectionLabel}>Pinned</AppText>
            </View>
            {/* Just the mosaic — the same rounded progress grid the Mosaic tab
                shows, at half width. No frame or caption; the tiles speak for
                themselves. */}
            <Pressable
              style={s.pinnedTile}
              onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: pinned.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${pinned.artworkTitle} mosaic, pinned to your profile`}
            >
              <MosaicGrid
                width={PINNED_W}
                cols={pinned.cols}
                rows={pinned.rows}
                targetColors={getArtwork(pinned.artworkId)?.tiers[pinned.tier]?.colors ?? []}
                filled={pinned.filled}
                mode="progress"
              />
            </Pressable>
          </View>
        )}

        {/* Mosaics showcase */}
        {mosaics.length > 0 && (
          <View style={s.section}>
            <AppText variant="overline" style={s.sectionLabel}>Mosaics</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.mosaicRow}>
              {mosaics.map((c) => {
                const tier = getArtwork(c.artworkId)?.tiers[c.tier];
                if (!tier) return null;
                return (
                  <Pressable
                    key={c.id}
                    style={s.mosaicItem}
                    onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: c.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.artworkTitle} mosaic`}
                  >
                    <MosaicGrid width={104} cols={c.cols} rows={c.rows} targetColors={tier.colors} filled={c.filled} mode="progress" />
                    <AppText variant="caption" numberOfLines={1} style={s.mosaicTitle}>{c.artworkTitle}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

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

  section: { gap: spacing.sm },
  sectionLabel: {},
  pinnedLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pinnedTile: { alignSelf: 'flex-start' },
  mosaicRow: { gap: spacing.sm, paddingRight: spacing.xl },
  mosaicItem: { width: 104, gap: spacing.xs },
  mosaicTitle: { width: 104 },

  hint: { padding: spacing.xl, gap: 6 },
  hintTitle: { fontFamily: fonts.sansSb, fontSize: 14, color: c.ink100 },
  hintSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: c.ink60 },
});
