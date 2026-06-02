import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { format, parseISO, getMonth } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useGrid } from '@/hooks/useGrid';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { useToday } from '@/hooks/useToday';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSettings } from '@/store/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fonts, shadows, radius, spacing, type Palette } from '@/lib/theme';
import type { GridDay } from '@/types';

const TILE_SIZE = { Comfortable: 30 } as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIP_COUNT = 14;

// ─── Compact grid ─────────────────────────────────────────────────────────────

function CompactGrid({ days }: { days: GridDay[] }) {
  const { colors } = useTheme();
  const st = useThemedStyles(makeStyles);
  return (
    <View style={st.compactGrid}>
      {days.map((day) => (
        <Pressable
          key={day.date}
          style={[
            st.compactTile,
            { backgroundColor: day.hex },
            !day.hasPhotos && st.tileEmpty,
            day.isToday && [st.tileToday, { borderColor: colors.ink100 }],
          ]}
          onPress={() => router.push(`/day/${day.date}`)}
          accessibilityRole="button"
          accessibilityLabel={`${day.date}${day.hasPhotos ? ', has photos' : ''}`}
        />
      ))}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVisibleMonths(days: GridDay[]): string[] {
  const seen = new Set<string>();
  for (const d of days) seen.add(MONTHS[getMonth(parseISO(d.date))]);
  return Array.from(seen);
}

function StreakRing({ current, longest }: { current: number; longest: number }) {
  const { colors } = useTheme();
  const sr = useThemedStyles(makeRingStyles);
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const fraction = Math.min(current / Math.max(longest, 1), 1);
  const dashOffset = circumference * (1 - fraction);
  const pips = Array.from({ length: PIP_COUNT }, (_, i) => i);

  return (
    <Card style={sr.card}>
      <View style={sr.ringWrap}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={r} fill="none" stroke={colors.surface2} strokeWidth={4} />
          <Circle
            cx={32} cy={32} r={r} fill="none" stroke={colors.accent} strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform="rotate(-90 32 32)"
          />
        </Svg>
        <View style={sr.ringCenter}>
          <AppText style={sr.ringNum}>{current}</AppText>
          <AppText style={sr.ringUnit}>days</AppText>
        </View>
      </View>

      <View style={sr.info}>
        <AppText variant="title" style={sr.infoTitle}>Current streak</AppText>
        <View style={sr.pips}>
          {pips.map((i) => (
            <View key={i} style={[sr.pip, i < current && sr.pipOn, i === current - 1 && sr.pipNow]} />
          ))}
        </View>
        <AppText style={sr.best}>Best: <AppText style={sr.bestVal}>{longest} days</AppText></AppText>
      </View>
    </Card>
  );
}

export default function GridScreen() {
  const { user } = useAuth();
  const { trackScreen } = useAnalytics();
  const { current: streakCurrent, longest: streakLongest } = useStreak();
  const { color: todayColor } = useToday();
  const gridDensity = useSettings((s) => s.gridDensity);
  const st = useThemedStyles(makeStyles);

  const startDate = user?.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const { days, reload } = useGrid(user?.id ?? '', startDate);

  // Re-read photo presence each time the tab regains focus — picks up new captures.
  useFocusEffect(
    useCallback(() => {
      trackScreen('grid');
      reload();
    }, [reload])
  );

  const visibleMonths = useMemo(() => getVisibleMonths(days), [days]);
  const currentMonth = MONTHS[getMonth(new Date())];

  return (
    <AppScreen>
      <ScreenHeader wordmark="My Mosaic" />

      <ScrollView style={st.scroll} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <StreakRing current={streakCurrent} longest={streakLongest} />

        <View>
          <View style={st.gridHead}>
            <AppText variant="display">{days.length} days</AppText>
            {days.length > 0 && (
              <AppText variant="caption">
                {format(parseISO(days[0].date), 'MMM')} – {format(parseISO(days[days.length - 1].date), 'MMM yyyy')}
              </AppText>
            )}
          </View>

          {gridDensity === 'Compact' ? (
            <CompactGrid days={days} />
          ) : (
            <>
              <View style={st.grid}>
                {days.map((day) => (
                  <Pressable
                    key={day.date}
                    style={[
                      st.tile,
                      { width: TILE_SIZE.Comfortable, height: TILE_SIZE.Comfortable, backgroundColor: day.hex },
                      !day.hasPhotos && st.tileEmpty,
                      day.isToday && st.tileToday,
                    ]}
                    onPress={() => router.push(`/day/${day.date}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.date}${day.hasPhotos ? ', has photos' : ''}`}
                  />
                ))}
              </View>

              <View style={st.monthRow}>
                {visibleMonths.map((m) => (
                  <View key={m} style={[st.mChip, m === currentMonth && st.mChipCurrent]}>
                    <AppText style={[st.mChipText, m === currentMonth && st.mChipTextCurrent]}>{m}</AppText>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {todayColor && (
          <Pressable
            onPress={() => router.navigate('/')}
            accessibilityRole="button"
            accessibilityLabel={`${todayColor.name} today`}
          >
            <View style={st.nudge}>
              <View style={[st.nudgeIcon, { backgroundColor: todayColor.hex }]}>
                <AppText style={{ fontSize: 18 }}>🎯</AppText>
              </View>
              <View>
                <AppText style={st.nudgeTitle}>{todayColor.name} today</AppText>
                <AppText style={st.nudgeSub}>
                  {streakCurrent > 0 ? 'keep the streak going' : 'capture your first photo'}
                </AppText>
              </View>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </AppScreen>
  );
}


const makeRingStyles = (c: Palette) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl, borderRadius: radius.r24 },
  ringWrap: { width: 64, height: 64 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontFamily: fonts.serifR, fontSize: 22, color: c.accent, lineHeight: 22 },
  ringUnit: { fontFamily: fonts.sansSb, fontSize: 8, color: c.ink30, letterSpacing: 0.8, textTransform: 'uppercase' },
  info: { flex: 1 },
  infoTitle: { marginBottom: 6 },
  pips: { flexDirection: 'row', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  pip: { height: 6, width: 20, borderRadius: 3, backgroundColor: c.surface2 },
  pipOn: { backgroundColor: c.accent },
  pipNow: { backgroundColor: c.ink100 },
  best: { fontFamily: fonts.sans, fontSize: 11, color: c.ink30 },
  bestVal: { fontFamily: fonts.sansSb, color: c.ink60 },
});

const makeStyles = (c: Palette) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.x3, gap: spacing.lg },

  gridHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.lg },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { borderRadius: 10 },
  tileEmpty: { opacity: 0.25 },
  tileToday: { borderWidth: 2.5, borderColor: c.ink100 },

  compactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  compactTile: { width: 16, height: 16, borderRadius: 4 },

  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingHorizontal: 2 },
  mChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.r8 },
  mChipCurrent: {
    backgroundColor: c.surface0, borderWidth: 1, borderColor: c.ink15,
    borderRadius: radius.full, paddingHorizontal: 12, ...shadows.elev1,
  },
  mChipText: { fontFamily: fonts.sansMd, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: c.ink30 },
  mChipTextCurrent: { fontFamily: fonts.sansSb, color: c.ink100 },

  nudge: {
    backgroundColor: c.accentSoft, borderRadius: radius.r20, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: c.accent15,
  },
  nudgeIcon: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    shadowColor: c.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  nudgeTitle: { fontFamily: fonts.sansSb, fontSize: 13, color: c.accent },
  nudgeSub: { fontFamily: fonts.sans, fontSize: 11, color: c.accent, marginTop: 1 },
});
