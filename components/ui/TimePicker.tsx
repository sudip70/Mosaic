import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { fonts, radius } from '@/lib/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H  = 48;
const VISIBLE = 5;
const DIAL_H  = ITEM_H * VISIBLE;   // 240
const CARD_W  = 300;

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

// ─── DialItem ─────────────────────────────────────────────────────────────────

interface DialItemProps {
  index: number;
  label: string;
  offset: SharedValue<number>;
  inkColor: string;
  fontSize: number;
  fontFamily: string;
}

function DialItem({ index, label, offset, inkColor, fontSize, fontFamily }: DialItemProps) {
  const style = useAnimatedStyle(() => {
    const center = -offset.value / ITEM_H;
    const dist = Math.abs(index - center);
    return {
      opacity: interpolate(dist, [0, 0.3, 1.1, 2.1], [1, 0.96, 0.18, 0.04], Extrapolation.CLAMP),
      transform: [{
        scale: interpolate(dist, [0, 0.3, 1.1, 2.1], [1.05, 1, 0.78, 0.62], Extrapolation.CLAMP),
      }],
    };
  });

  return (
    <Animated.View style={[s.item, style]}>
      <Text style={{ fontFamily, fontSize, letterSpacing: -0.3, color: inkColor }}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── DialColumn ───────────────────────────────────────────────────────────────

interface DialColumnProps {
  items: readonly string[];
  selectedIndex: number;
  onChange: (i: number) => void;
  inkColor: string;
  fontSize?: number;
  fontFamily?: string;
  flex?: number;
}

function DialColumn({
  items, selectedIndex, onChange, inkColor,
  fontSize = 26, fontFamily = fonts.sansMd, flex = 2,
}: DialColumnProps) {
  const N      = items.length;
  const looped = [...items, ...items, ...items]; // 3 reps → seamless wrap

  // Start in the middle repetition so there's room to scroll in both directions
  const offset      = useSharedValue(-(selectedIndex + N) * ITEM_H);
  const startOffset = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      cancelAnimation(offset);
      startOffset.value = offset.value;
    })
    .onUpdate((e) => {
      const raw = startOffset.value + e.translationY;
      // Soft-clamp at the edges of the tripled list
      offset.value = Math.max(-(looped.length - 1) * ITEM_H, Math.min(0, raw));
    })
    .onEnd(() => {
      const rawIdx  = Math.round(-offset.value / ITEM_H);
      const clamped = Math.max(0, Math.min(looped.length - 1, rawIdx));
      const original = ((clamped % N) + N) % N;
      const middle   = original + N; // target repetition after normalization

      // Pick the closest equivalent in the looped array (avoids backward springs)
      const c0 = original, c1 = original + N, c2 = original + 2 * N;
      const closest = [c0, c1, c2].reduce((best, c) =>
        Math.abs(c - clamped) < Math.abs(best - clamped) ? c : best,
      );

      offset.value = withSpring(
        -closest * ITEM_H,
        { damping: 22, stiffness: 300, mass: 0.8 },
        (finished) => {
          'worklet';
          // Silently jump to the middle rep — visually identical, resets headroom
          if (finished) offset.value = -middle * ITEM_H;
        },
      );

      runOnJS(onChange)(original);
    });

  const trackStyle = useAnimatedStyle(() => ({
    // Offset + 2 × ITEM_H shifts the track so item[0] lands on the centre slot
    transform: [{ translateY: offset.value + ITEM_H * 2 }],
  }));

  return (
    <View style={{ flex, height: DIAL_H, overflow: 'hidden' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={trackStyle}>
          {looped.map((label, i) => (
            <DialItem
              key={i}
              index={i}
              label={label}
              offset={offset}
              inkColor={inkColor}
              fontSize={fontSize}
              fontFamily={fontFamily}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
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
  const init = parseTime(current);
  const [hourIdx, setHourIdx] = useState(init.h);
  const [minIdx,  setMinIdx]  = useState(init.m);
  const [perIdx,  setPerIdx]  = useState(init.p);

  const [hPart, pPart] = formatTime(hourIdx, minIdx, perIdx).split(' ');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop — tapping outside dismisses */}
      <View style={s.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[s.card, { backgroundColor: colors.surface0, borderColor: colors.ink15 }]}>

          {/* Live time preview */}
          <View style={s.preview}>
            <Text style={[s.previewTime, { color: colors.ink100 }]}>{hPart}</Text>
            <Text style={[s.previewPeriod, { color: colors.accent }]}>{pPart}</Text>
          </View>

          {/* Three dials */}
          <View style={s.dialsOuter}>
            <View style={s.dialsRow}>
              <DialColumn
                items={HOURS}
                selectedIndex={hourIdx}
                onChange={setHourIdx}
                inkColor={colors.ink100}
              />
              <Text style={[s.colon, { color: colors.ink30 }]}>:</Text>
              <DialColumn
                items={MINUTES}
                selectedIndex={minIdx}
                onChange={setMinIdx}
                inkColor={colors.ink100}
              />
              <View style={[s.sep, { backgroundColor: colors.ink15 }]} />
              <DialColumn
                items={PERIODS}
                selectedIndex={perIdx}
                onChange={setPerIdx}
                inkColor={colors.ink100}
                fontSize={15}
                fontFamily={fonts.sansSb}
                flex={1}
              />
            </View>

            {/* Centre selection band */}
            <View
              pointerEvents="none"
              style={[s.selBand, {
                backgroundColor: colors.accent08,
                borderTopColor: colors.ink15,
                borderBottomColor: colors.ink15,
              }]}
            />
          </View>

          {/* Done */}
          <Pressable
            style={[s.doneBtn, { backgroundColor: colors.accent }]}
            onPress={() => { onSelect(formatTime(hourIdx, minIdx, perIdx)); onClose(); }}
            accessibilityRole="button"
            accessibilityLabel="Confirm reminder time"
          >
            <Text style={s.doneBtnLabel}>Done</Text>
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
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    width: CARD_W,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  },

  preview: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'center', gap: 6,
  },
  previewTime:   { fontFamily: fonts.serifR, fontSize: 40, letterSpacing: -1.5 },
  previewPeriod: { fontFamily: fonts.sansSb, fontSize: 16, letterSpacing: 0.5 },

  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },

  dialsOuter: { position: 'relative', height: DIAL_H },
  dialsRow:   { flexDirection: 'row', height: DIAL_H, alignItems: 'center' },
  colon:      { fontFamily: fonts.sansMd, fontSize: 22, paddingHorizontal: 2, marginBottom: 2 },
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
    borderRadius: radius.r12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnLabel: {
    fontFamily: fonts.sansSb, fontSize: 14, color: '#fff', letterSpacing: 0.2,
  },
});
