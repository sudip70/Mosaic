import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { usePressScale } from '@/hooks/usePressScale';
import { fonts, radius, spacing } from '@/lib/theme';
import { DialColumn, ITEM_H, DIAL_H } from './Dial';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(t: string): { h: number; m: number; p: number } {
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { h: 7, m: 30, p: 0 };
  return {
    h: parseInt(match[1], 10) - 1,
    m: parseInt(match[2], 10),
    p: match[3].toUpperCase() === 'AM' ? 0 : 1,
  };
}

function formatTime(h: number, m: number, p: number): string {
  return `${HOURS[h]}:${MINUTES[m]} ${PERIODS[p]}`;
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface TimePickerProps {
  visible: boolean;
  current: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}

export function TimePicker({ visible, current, onSelect, onClose }: TimePickerProps) {
  const { colors } = useTheme();
  const donePress = usePressScale(0.97);
  const init = parseTime(current);
  const [hourIdx, setHourIdx] = useState(init.h);
  const [minIdx,  setMinIdx]  = useState(init.m);
  const [perIdx,  setPerIdx]  = useState(init.p);

  const [hPart, pPart] = formatTime(hourIdx, minIdx, perIdx).split(' ');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[s.card, { backgroundColor: colors.surface0, borderColor: colors.ink15 }]}>

          {/* Live time preview */}
          <View style={s.preview}>
            <Text style={[s.previewTime, { color: colors.ink100 }]}>{hPart}</Text>
            <Text style={[s.previewPeriod, { color: colors.ink60 }]}>{pPart}</Text>
          </View>

          {/* Three dials */}
          <View style={s.dialsOuter}>
            <View style={s.dialsRow}>
              <DialColumn items={HOURS} selectedIndex={hourIdx} onChange={setHourIdx} inkColor={colors.ink100} />
              <Text style={[s.colon, { color: colors.ink30 }]}>:</Text>
              <DialColumn items={MINUTES} selectedIndex={minIdx} onChange={setMinIdx} inkColor={colors.ink100} />
              <View style={[s.sep, { backgroundColor: colors.ink15 }]} />
              <DialColumn
                items={PERIODS}
                selectedIndex={perIdx}
                onChange={setPerIdx}
                inkColor={colors.ink100}
                fontSize={16}
                fontFamily={fonts.sansSb}
                flex={1}
                loop={false}
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
            onPress={() => { onSelect(formatTime(hourIdx, minIdx, perIdx)); onClose(); }}
            onPressIn={donePress.onPressIn}
            onPressOut={donePress.onPressOut}
            accessibilityRole="button"
            accessibilityLabel="Confirm reminder time"
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
  previewTime:   { fontFamily: fonts.serifR, fontSize: 44, letterSpacing: -1.4 },
  previewPeriod: { fontFamily: fonts.sansSb, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase' },

  dialsOuter: { position: 'relative', height: DIAL_H },
  dialsRow:   { flexDirection: 'row', height: DIAL_H, alignItems: 'center' },
  colon:      { fontFamily: fonts.serifR, fontSize: 22, paddingHorizontal: 2, marginBottom: 2 },
  sep:        { width: StyleSheet.hairlineWidth, height: DIAL_H * 0.38, marginHorizontal: 6 },

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
