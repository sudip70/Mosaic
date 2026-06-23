import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { usePressScale } from '@/hooks/usePressScale';
import { fonts, radius, spacing } from '@/lib/theme';
import { DialColumn, DIAL_H, ITEM_H } from './Dial';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 120;
// Newest year first so the wheel opens near recent dates with a short scroll up
// to today and a long scroll down into the past.
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => String(CURRENT_YEAR - i));

const daysInMonth = (monthIdx: number, year: number) => new Date(year, monthIdx + 1, 0).getDate();

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Parse a YYYY-MM-DD string into wheel indices, defaulting to Jan 1 2000 when
// absent or malformed.
function parseDate(iso?: string | null): { d: number; m: number; y: number } {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const fallbackYear = 2000;
  if (!match) {
    return { d: 0, m: 0, y: YEARS.indexOf(String(fallbackYear)) };
  }
  const year = Math.min(CURRENT_YEAR, Math.max(MIN_YEAR, parseInt(match[1], 10)));
  const monthIdx = Math.min(11, Math.max(0, parseInt(match[2], 10) - 1));
  const dayIdx = Math.max(0, parseInt(match[3], 10) - 1);
  const yIdx = YEARS.indexOf(String(year));
  return {
    d: Math.min(dayIdx, daysInMonth(monthIdx, year) - 1),
    m: monthIdx,
    y: yIdx >= 0 ? yIdx : YEARS.indexOf(String(fallbackYear)),
  };
}

function formatISO(dayIdx: number, monthIdx: number, yearIdx: number): string {
  const year = parseInt(YEARS[yearIdx], 10);
  const day = Math.min(dayIdx + 1, daysInMonth(monthIdx, year));
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface DatePickerProps {
  visible: boolean;
  /** Current value as YYYY-MM-DD, or null/undefined for the default. */
  current?: string | null;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export function DatePicker({ visible, current, onSelect, onClose }: DatePickerProps) {
  const { colors } = useTheme();
  const donePress = usePressScale(0.97);
  const init = parseDate(current);
  const [dayIdx, setDayIdx] = useState(init.d);
  const [monthIdx, setMonthIdx] = useState(init.m);
  const [yearIdx, setYearIdx] = useState(init.y);

  const year = parseInt(YEARS[yearIdx], 10);
  const dayCount = daysInMonth(monthIdx, year);
  const DAYS = Array.from({ length: dayCount }, (_, i) => String(i + 1));

  // Shorten the day so a month/year change never leaves an out-of-range day
  // (e.g. 31 → February). The day column is remounted via key so its track
  // length matches the new month.
  useEffect(() => {
    if (dayIdx > dayCount - 1) setDayIdx(dayCount - 1);
  }, [dayCount, dayIdx]);

  const previewDay = Math.min(dayIdx, dayCount - 1) + 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[s.card, { backgroundColor: colors.surface0, borderColor: colors.ink15 }]}>

          {/* Live date preview */}
          <View style={s.preview}>
            <Text style={[s.previewDay, { color: colors.ink100 }]}>{previewDay}</Text>
            <Text style={[s.previewRest, { color: colors.ink60 }]}>{MONTHS[monthIdx]} {year}</Text>
          </View>

          {/* Three dials: day · month · year */}
          <View style={s.dialsOuter}>
            <View style={s.dialsRow}>
              <DialColumn
                key={`d-${monthIdx}-${yearIdx}`}
                items={DAYS}
                selectedIndex={Math.min(dayIdx, dayCount - 1)}
                onChange={setDayIdx}
                inkColor={colors.ink100}
                loop={false}
                flex={1.4}
              />
              <DialColumn
                items={MONTHS_SHORT}
                selectedIndex={monthIdx}
                onChange={setMonthIdx}
                inkColor={colors.ink100}
                fontSize={22}
                flex={2.4}
              />
              <DialColumn
                items={YEARS}
                selectedIndex={yearIdx}
                onChange={setYearIdx}
                inkColor={colors.ink100}
                fontSize={22}
                loop={false}
                flex={2}
              />
            </View>

            {/* Centre selection band — hairline rules only, no fill */}
            <View
              pointerEvents="none"
              style={[s.selBand, {
                borderTopColor: colors.ink15,
                borderBottomColor: colors.ink15,
              }]}
            />
          </View>

          {/* Done */}
          <Pressable
            onPress={() => { onSelect(formatISO(dayIdx, monthIdx, yearIdx)); onClose(); }}
            onPressIn={donePress.onPressIn}
            onPressOut={donePress.onPressOut}
            accessibilityRole="button"
            accessibilityLabel="Confirm date of birth"
          >
            <Animated.View style={[s.doneBtn, { backgroundColor: colors.accent }, donePress.style]}>
              <Text style={[s.doneBtnLabel, { color: colors.onAccent }]}>Done</Text>
            </Animated.View>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(13,11,8,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: '82%',
    maxWidth: 320,
    borderRadius: radius.r24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },

  preview: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'center', gap: 8,
  },
  previewDay:  { fontFamily: fonts.serifR, fontSize: 44, letterSpacing: -1.4 },
  previewRest: { fontFamily: fonts.sansSb, fontSize: 14, letterSpacing: 0.4 },

  dialsOuter: { position: 'relative', height: DIAL_H },
  dialsRow:   { flexDirection: 'row', height: DIAL_H, alignItems: 'center' },

  selBand: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0, right: 0,
    height: ITEM_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  doneBtn: {
    borderRadius: radius.r16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnLabel: {
    fontFamily: fonts.sansSb, fontSize: 15, letterSpacing: 0.2,
  },
});
