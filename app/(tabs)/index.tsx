import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useToday } from '@/hooks/useToday';
import { useStreak } from '@/hooks/useStreak';
import { usePhotos } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { colors, fonts, shadows, radius } from '@/lib/theme';
import { formatDisplay, formatShort } from '@/lib/dates';

export default function TodayScreen() {
  const { color, loading, error, today: date } = useToday();
  const { user } = useAuth();
  const { photos } = usePhotos(date, user?.id ?? '');
  const { current, longest } = useStreak();
  const { trackScreen } = useAnalytics();

  useEffect(() => { trackScreen('today'); }, []);

  return (
    <View style={s.root}>
      {/* ── Top nav ── */}
      <View style={s.topNav}>
        <Text style={s.wordmark}>Mosaic</Text>
        <Pressable style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <Text style={s.iconBtnLabel}>···</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ── */}
        {loading ? (
          <View style={[s.heroCard, s.heroLoading]}>
            <ActivityIndicator color={colors.ink30} />
          </View>
        ) : error ? (
          <View style={[s.heroCard, s.heroLoading]}>
            <Text style={s.errorText}>No colour available</Text>
            <Text style={s.errorSub}>{error}</Text>
          </View>
        ) : color ? (
          <View style={s.heroCard}>
            {/* Swatch */}
            <View style={[s.heroSwatch, { backgroundColor: color.hex }]}>
              <View style={s.swatchOverlay} />
              <View style={s.heroTopRow}>
                <Text style={s.heroKicker}>Today's colour</Text>
                <View style={s.dayChip}>
                  <Text style={s.dayChipText}>Day {current > 0 ? current : 1}</Text>
                </View>
              </View>
              <Text style={s.heroColorName}>{color.name}</Text>
            </View>
            {/* Footer */}
            <View style={s.heroFoot}>
              <View style={s.heroHex}>
                <View style={[s.hexDot, { backgroundColor: color.hex }]} />
                <Text style={s.hexVal}>{color.hex.toUpperCase()}</Text>
              </View>
              <Text style={s.heroDate}>{formatShort(date)}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.accent }]}>{current}</Text>
            <Text style={s.statLabel}>Streak</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{photos.length}</Text>
            <Text style={s.statLabel}>Today</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{longest}</Text>
            <Text style={s.statLabel}>Best</Text>
          </View>
        </View>

        {/* ── Today's captures ── */}
        <View>
          <View style={s.secHead}>
            <Text style={s.secTitle}>Today's captures</Text>
            {photos.length > 0 && (
              <Pressable onPress={() => router.push(`/day/${date}`)}>
                <Text style={s.secLink}>See all</Text>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbStrip}>
            {photos.map((p) => (
              <Pressable
                key={p.id}
                style={s.thumb}
                onPress={() => router.push(`/day/${date}`)}
                accessibilityRole="imagebutton"
                accessibilityLabel="View photo"
              >
                <View style={[s.thumbInner, { backgroundColor: color?.hex ?? colors.surface2 }]} />
              </Pressable>
            ))}
            <Pressable
              style={s.thumbAdd}
              onPress={() => color && router.push('/camera')}
              disabled={!color}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <Text style={s.thumbAddPlus}>+</Text>
              <Text style={s.thumbAddLabel}>Add</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── Primary CTA ── */}
        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && s.primaryBtnPressed]}
          onPress={() => router.push('/camera')}
          disabled={!color || loading}
          accessibilityRole="button"
          accessibilityLabel="Capture now"
        >
          <View>
            <Text style={s.pbLabel}>Capture now</Text>
            {color && (
              <Text style={s.pbSub}>Find {color.name} around you →</Text>
            )}
          </View>
          <View style={s.pbIcon}>
            <Text style={{ fontSize: 19 }}>📷</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },

  // Top nav
  topNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12,
  },
  wordmark: {
    fontFamily: fonts.serifR, fontSize: 24, color: colors.ink100, letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.ink15,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.elev1,
  },
  iconBtnLabel: { fontFamily: fonts.sansMd, fontSize: 14, color: colors.ink60 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },

  // Hero card
  heroCard: {
    borderRadius: radius.r24, overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', ...shadows.elev3,
  },
  heroLoading: {
    height: 240, backgroundColor: colors.surface1,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  heroSwatch: { height: 188, padding: 20, justifyContent: 'space-between' },
  swatchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Subtle gradient effect via layering
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroKicker: {
    fontFamily: fonts.sansSb, fontSize: 10, letterSpacing: 1.6,
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
  },
  dayChip: {
    backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  dayChipText: {
    fontFamily: fonts.sansSb, fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.4,
  },
  heroColorName: {
    fontFamily: fonts.serif, fontSize: 54, color: '#fff',
    lineHeight: 52, letterSpacing: -1,
  },
  heroFoot: {
    backgroundColor: colors.surface0, paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.ink15,
  },
  heroHex: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hexDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 3, borderColor: colors.surface0,
    // ring effect: use shadow
    shadowColor: colors.ink15, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 1,
  },
  hexVal: { fontFamily: fonts.sansMd, fontSize: 12, color: colors.ink60, letterSpacing: 0.6 },
  heroDate: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink30 },

  errorText: { fontFamily: fonts.sansMd, fontSize: 15, color: colors.ink60 },
  errorSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink30, marginTop: 4 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, backgroundColor: colors.surface0, borderRadius: radius.r20,
    padding: 14, borderWidth: 1, borderColor: colors.ink15,
    ...shadows.elev1,
  },
  statValue: {
    fontFamily: fonts.serifR, fontSize: 30, color: colors.ink100,
    lineHeight: 30, letterSpacing: -0.6,
  },
  statLabel: {
    fontFamily: fonts.sansMd, fontSize: 10, color: colors.ink30,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2,
  },

  // Captures
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle: { fontFamily: fonts.sansSb, fontSize: 14, color: colors.ink100 },
  secLink: { fontFamily: fonts.sansMd, fontSize: 12, color: colors.accent },

  thumbStrip: { flexDirection: 'row' },
  thumb: {
    width: 80, height: 80, borderRadius: radius.r16, marginRight: 8,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    ...shadows.elev1,
  },
  thumbInner: { flex: 1 },
  thumbAdd: {
    width: 80, height: 80, borderRadius: radius.r16, marginRight: 8,
    borderWidth: 1.5, borderColor: colors.ink15, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  thumbAddPlus: { fontSize: 22, color: colors.ink15 },
  thumbAddLabel: {
    fontFamily: fonts.sansSb, fontSize: 8.5, letterSpacing: 0.8,
    textTransform: 'uppercase', color: colors.ink30,
  },

  // Primary button
  primaryBtn: {
    backgroundColor: colors.ink100, borderRadius: radius.r20,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: colors.ink100, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  primaryBtnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  pbLabel: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
  pbSub: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  pbIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 4,
  },
});
