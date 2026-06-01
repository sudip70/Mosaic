import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { format, parseISO, getMonth, getYear } from 'date-fns';
import { useGrid } from '@/hooks/useGrid';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { useToday } from '@/hooks/useToday';
import { useAnalytics } from '@/hooks/useAnalytics';
import { colors, fonts, shadows, radius } from '@/lib/theme';
import type { GridDay } from '@/types';

const COLUMNS = 10;
const TILE_SIZE = 26;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Groups days by year-month for the month label row
function getVisibleMonths(days: GridDay[]): string[] {
  const seen = new Set<string>();
  for (const d of days) {
    const dt = parseISO(d.date);
    seen.add(`${MONTHS[getMonth(dt)]}`);
  }
  return Array.from(seen);
}

function StreakRing({ current, longest }: { current: number; longest: number }) {
  const max = Math.max(longest, 1);
  const fraction = Math.min(current / max, 1);
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference * (1 - fraction);

  // Render a simple arc representation with a View-based approach
  const pips = Array.from({ length: 14 }, (_, i) => i);

  return (
    <View style={sr.card}>
      {/* Ring placeholder (SVG not available in RN without library — use pips instead) */}
      <View style={sr.ringWrap}>
        <View style={sr.ring}>
          <View style={[sr.ringFill, { borderColor: colors.accent, borderWidth: 4 * fraction + 0 }]} />
        </View>
        <View style={sr.ringCenter}>
          <Text style={sr.ringNum}>{current}</Text>
          <Text style={sr.ringUnit}>days</Text>
        </View>
      </View>
      <View style={sr.info}>
        <Text style={sr.infoTitle}>Current streak</Text>
        <View style={sr.pips}>
          {pips.map((i) => (
            <View key={i} style={[sr.pip, i < current && sr.pipOn, i === current - 1 && sr.pipNow]} />
          ))}
        </View>
        <Text style={sr.best}>Best: <Text style={sr.bestVal}>{longest} days</Text></Text>
      </View>
    </View>
  );
}

export default function GridScreen() {
  const { user } = useAuth();
  const { trackScreen } = useAnalytics();
  const { current: streakCurrent, longest: streakLongest } = useStreak();
  const { color: todayColor, today: todayDate } = useToday();

  const startDate = user?.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const { days, loading } = useGrid(user?.id ?? '', startDate);

  useEffect(() => { trackScreen('grid'); }, []);

  const visibleMonths = useMemo(() => getVisibleMonths(days), [days]);
  const currentMonth = MONTHS[getMonth(new Date())];

  return (
    <View style={s.root}>
      {/* Top nav */}
      <View style={s.topNav}>
        <Text style={s.wordmark}>My Mosaic</Text>
        <Pressable style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Export">
          <Text style={s.iconBtnLabel}>↓</Text>
        </Pressable>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Streak card */}
        <StreakRing current={streakCurrent} longest={streakLongest} />

        {/* Grid */}
        <View>
          <View style={s.gridHead}>
            <Text style={s.gridTitle}>{days.length} days</Text>
            {days.length > 0 && (
              <Text style={s.gridSub}>
                {format(parseISO(days[0].date), 'MMM')} – {format(parseISO(days[days.length - 1].date), 'MMM yyyy')}
              </Text>
            )}
          </View>

          {/* Tile grid */}
          <View style={s.grid}>
            {days.map((day) => (
              <Pressable
                key={day.date}
                style={[
                  s.tile,
                  { backgroundColor: day.hex },
                  !day.hasPhotos && s.tileEmpty,
                  day.isToday && s.tileToday,
                ]}
                onPress={() => router.push(`/day/${day.date}`)}
                accessibilityRole="button"
                accessibilityLabel={`${day.date}${day.hasPhotos ? ', has photos' : ''}`}
              />
            ))}
          </View>

          {/* Month labels */}
          <View style={s.monthRow}>
            {visibleMonths.map((m) => (
              <Pressable key={m} style={[s.mChip, m === currentMonth && s.mChipCurrent]}>
                <Text style={[s.mChipText, m === currentMonth && s.mChipTextCurrent]}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Today nudge */}
        {todayColor && (
          <Pressable
            style={s.nudge}
            onPress={() => router.push('/')}
            accessibilityRole="button"
            accessibilityLabel={`${todayColor.name} today`}
          >
            <View style={[s.nudgeIcon, { backgroundColor: todayColor.hex }]}>
              <Text style={{ fontSize: 18 }}>🎯</Text>
            </View>
            <View>
              <Text style={s.nudgeTitle}>{todayColor.name} today</Text>
              <Text style={s.nudgeSub}>
                {streakCurrent > 0 ? 'keep the streak going' : 'capture your first photo'}
              </Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// Streak ring styles
const sr = StyleSheet.create({
  card: {
    backgroundColor: colors.surface0, borderRadius: radius.r24,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: colors.ink15, ...shadows.elev2,
  },
  ringWrap: { position: 'relative', width: 64, height: 64, flexShrink: 0 },
  ring: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 4, borderColor: colors.surface2,
    position: 'absolute',
  },
  ringFill: {
    width: 64, height: 64, borderRadius: 32,
    position: 'absolute', borderColor: colors.accent,
  },
  ringCenter: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringNum: { fontFamily: fonts.serifR, fontSize: 22, color: colors.accent, lineHeight: 22 },
  ringUnit: { fontFamily: fonts.sansSb, fontSize: 8, color: colors.ink30, letterSpacing: 0.8, textTransform: 'uppercase' },
  info: { flex: 1 },
  infoTitle: { fontFamily: fonts.sansSb, fontSize: 14, color: colors.ink100, marginBottom: 6 },
  pips: { flexDirection: 'row', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  pip: { height: 6, width: 20, borderRadius: 3, backgroundColor: colors.surface2 },
  pipOn: { backgroundColor: colors.accent },
  pipNow: { backgroundColor: colors.ink100 },
  best: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink30 },
  bestVal: { fontFamily: fonts.sansSb, color: colors.ink60 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },

  topNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12,
  },
  wordmark: { fontFamily: fonts.serifR, fontSize: 24, color: colors.ink100, letterSpacing: -0.3 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.ink15,
    alignItems: 'center', justifyContent: 'center', ...shadows.elev1,
  },
  iconBtnLabel: { fontFamily: fonts.sansMd, fontSize: 14, color: colors.ink60 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },

  gridHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  gridTitle: { fontFamily: fonts.serifR, fontSize: 38, color: colors.ink100, letterSpacing: -1.2, lineHeight: 38 },
  gridSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink30 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    width: TILE_SIZE, height: TILE_SIZE, borderRadius: 10,
  },
  tileEmpty: { opacity: 0.25 },
  tileToday: {
    shadowColor: colors.ink100, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 0,
    borderWidth: 2.5, borderColor: colors.ink100,
  },

  monthRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 14, paddingHorizontal: 2,
  },
  mChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.r8 },
  mChipCurrent: {
    backgroundColor: colors.surface0, borderWidth: 1, borderColor: colors.ink15,
    borderRadius: radius.full, paddingHorizontal: 12, ...shadows.elev1,
  },
  mChipText: { fontFamily: fonts.sansMd, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.ink30 },
  mChipTextCurrent: { fontFamily: fonts.sansSb, color: colors.ink100, fontSize: 11 },

  nudge: {
    backgroundColor: colors.accentSoft, borderRadius: radius.r20,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(196,96,74,0.15)',
  },
  nudgeIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  nudgeTitle: { fontFamily: fonts.sansSb, fontSize: 13, color: colors.accent },
  nudgeSub: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(196,96,74,0.6)', marginTop: 1 },
});
