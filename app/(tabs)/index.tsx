import { View, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ColorHero } from '@/components/ui/ColorHero';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useToday } from '@/hooks/useToday';
import { useStreak } from '@/hooks/useStreak';
import { usePhotos } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, radius, shadows, spacing, type Palette } from '@/lib/theme';
import { Camera, Plus, Ellipsis, ICON_STROKE } from '@/lib/icons';
import { formatShort } from '@/lib/dates';

const formatTime = (iso: string) => format(parseISO(iso), 'HH:mm');

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  const { colors } = useTheme();
  const st = useThemedStyles(makeStyles);
  return (
    <Card style={st.statCard} padded={false}>
      <AppText variant="serifLg" color={accent ? colors.accent : colors.ink100}>{value}</AppText>
      <AppText variant="overline" style={st.statLabel}>{label}</AppText>
    </Card>
  );
}

export default function TodayScreen() {
  const { color, loading, error, today: date } = useToday();
  const { user } = useAuth();
  const { photos } = usePhotos(date, user?.id ?? '');
  const { current, longest } = useStreak();
  const { trackScreen } = useAnalytics();
  const { colors } = useTheme();
  const st = useThemedStyles(makeStyles);

  useEffect(() => { trackScreen('today'); }, []);

  // "Day N" = days since the account was created (1-indexed).
  const dayNumber = user?.created_at
    ? differenceInCalendarDays(new Date(), parseISO(user.created_at)) + 1
    : 1;

  return (
    <AppScreen>
      <ScreenHeader
        wordmark="Mosaic"
        right={{ icon: Ellipsis, accessibilityLabel: 'Settings', onPress: () => router.navigate('/settings') }}
      />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        {loading ? (
          <Card style={st.heroFallback} elevation={3}>
            <ActivityIndicator color={colors.ink30} />
          </Card>
        ) : error ? (
          <Card style={st.heroFallback} elevation={3}>
            <AppText variant="title" color={colors.ink60}>No colour available</AppText>
            <AppText variant="caption">{error}</AppText>
          </Card>
        ) : color ? (
          <ColorHero
            hex={color.hex}
            name={color.name}
            kicker="Today's colour"
            chip={`Day ${dayNumber}`}
            footRight={formatShort(date)}
          />
        ) : null}

        {/* Stats */}
        <View style={st.statsRow}>
          <Stat value={current} label="Streak" accent />
          <Stat value={photos.length} label="Today" />
          <Stat value={longest} label="Best" />
        </View>

        {/* Captures */}
        <View>
          <View style={st.secHead}>
            <AppText variant="title">Today's captures</AppText>
            {photos.length > 0 && (
              <Pressable onPress={() => router.push(`/day/${date}`)} hitSlop={8}>
                <AppText style={st.secLink}>See all</AppText>
              </Pressable>
            )}
          </View>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.thumbStrip}>
              {photos.map((p) => (
                <Pressable
                  key={p.id}
                  style={st.thumb}
                  onPress={() => router.push({ pathname: '/photo/[id]', params: { id: p.id, date } })}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="View capture"
                >
                  {p.url ? (
                    <Image source={{ uri: p.url }} style={st.thumbInner} resizeMode="cover" />
                  ) : (
                    <View style={[st.thumbInner, { backgroundColor: color?.hex ?? colors.surface2 }]} />
                  )}
                  {!!p.timestamp && !!p.created_at && (
                    <View style={st.thumbTime}>
                      <AppText style={st.thumbTimeText}>{formatTime(p.created_at)}</AppText>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Add tile — own row so it stays visible no matter how many captures */}
          <Pressable
            style={[st.thumbAdd, photos.length > 0 && st.thumbAddBelow]}
            onPress={() => color && router.push('/camera')}
            disabled={!color}
            accessibilityRole="button"
            accessibilityLabel="Add a capture"
          >
            <Plus size={22} color={colors.ink30} strokeWidth={ICON_STROKE} />
            <AppText variant="overline" style={st.thumbAddLabel}>Add</AppText>
          </Pressable>
        </View>
      </ScrollView>

      {/* Fixed CTA — pinned just above the tab bar */}
      <View style={st.footer}>
        <PrimaryButton
          label="Capture now"
          sublabel={color ? `Find ${color.name} around you →` : undefined}
          icon={Camera}
          iconColor={color?.hex}
          onPress={() => router.push('/camera')}
          disabled={!color || loading}
        />
      </View>
    </AppScreen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: c.surface0,
  },

  heroFallback: {
    height: 240, alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: c.surface1,
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  statLabel: { marginTop: 2 },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  secLink: { fontFamily: fonts.sansMd, fontSize: 12, color: c.accent },

  thumbStrip: { gap: spacing.sm },
  thumb: {
    width: 80, height: 80, borderRadius: radius.r16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', ...shadows.elev1,
  },
  thumbInner: { width: '100%', height: '100%' },
  thumbTime: {
    position: 'absolute', bottom: 5, left: 6,
    backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  thumbTimeText: { fontFamily: fonts.sansSb, fontSize: 8, color: 'rgba(255,255,255,0.85)' },
  thumbAdd: {
    width: 80, height: 80, borderRadius: radius.r16,
    borderWidth: 1.5, borderColor: c.ink15, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  thumbAddBelow: { marginTop: spacing.sm },
  thumbAddLabel: { fontSize: 8.5 },
});
