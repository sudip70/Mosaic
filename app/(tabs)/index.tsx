import { View, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors, fonts, radius, shadows, spacing } from '@/lib/theme';
import { formatShort } from '@/lib/dates';

const formatTime = (iso: string) => format(parseISO(iso), 'HH:mm');

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
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
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => { trackScreen('today'); }, []);

  return (
    <AppScreen>
      <ScreenHeader
        wordmark="Mosaic"
        right={{ icon: '···', accessibilityLabel: 'Menu', onPress: () => router.push('/settings') }}
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
            chip={`Day ${current > 0 ? current : 1}`}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.thumbStrip}>
            {photos.map((p) => (
              <Pressable
                key={p.id}
                style={st.thumb}
                onPress={() => router.push(`/day/${date}`)}
                accessibilityRole="imagebutton"
                accessibilityLabel="View capture"
              >
                {p.url ? (
                  <Image source={{ uri: p.url }} style={st.thumbInner} resizeMode="cover" />
                ) : (
                  <View style={[st.thumbInner, { backgroundColor: color?.hex ?? colors.surface2 }]} />
                )}
                {!!p.created_at && (
                  <View style={st.thumbTime}>
                    <AppText style={st.thumbTimeText}>{formatTime(p.created_at)}</AppText>
                  </View>
                )}
              </Pressable>
            ))}
            <Pressable
              style={st.thumbAdd}
              onPress={() => color && router.push('/camera')}
              disabled={!color}
              accessibilityRole="button"
              accessibilityLabel="Add a capture"
            >
              <AppText style={st.thumbAddPlus}>+</AppText>
              <AppText variant="overline" style={st.thumbAddLabel}>Add</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Fixed CTA — pinned just above the tab bar */}
      <View style={[st.footer, { paddingBottom: tabBarHeight + spacing.sm }]}>
        <PrimaryButton
          label="Capture now"
          sublabel={color ? `Find ${color.name} around you →` : undefined}
          icon="📷"
          onPress={() => router.push('/camera')}
          disabled={!color || loading}
        />
      </View>
    </AppScreen>
  );
}

const st = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface0,
  },

  heroFallback: {
    height: 240, alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.surface1,
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  statLabel: { marginTop: 2 },

  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  secLink: { fontFamily: fonts.sansMd, fontSize: 12, color: colors.accent },

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
    borderWidth: 1.5, borderColor: colors.ink15, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  thumbAddPlus: { fontSize: 22, color: colors.ink15, fontFamily: fonts.sans },
  thumbAddLabel: { fontSize: 8.5 },
});
