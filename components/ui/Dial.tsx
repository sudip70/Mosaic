import { View, Text, StyleSheet } from 'react-native';
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
import { fonts } from '@/lib/theme';

// Shared scroll-wheel ("clock dial") primitive. Drives both the TimePicker and
// the DatePicker so they look and feel identical. A column shows VISIBLE rows
// with the centre one selected; an optional `loop` makes the values wrap.

export const ITEM_H = 44;
export const VISIBLE = 5;
export const DIAL_H = ITEM_H * VISIBLE; // 220

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

export interface DialColumnProps {
  items: readonly string[];
  selectedIndex: number;
  onChange: (i: number) => void;
  inkColor: string;
  fontSize?: number;
  fontFamily?: string;
  flex?: number;
  loop?: boolean;
}

export function DialColumn({
  items, selectedIndex, onChange, inkColor,
  fontSize = 26, fontFamily = fonts.serifR, flex = 2, loop = true,
}: DialColumnProps) {
  const N      = items.length;
  const track  = loop ? [...items, ...items, ...items] : [...items];
  const initIdx = loop ? selectedIndex + N : selectedIndex;

  const offset      = useSharedValue(-initIdx * ITEM_H);
  const startOffset = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      cancelAnimation(offset);
      startOffset.value = offset.value;
    })
    .onUpdate((e) => {
      const raw = startOffset.value + e.translationY;
      offset.value = Math.max(-(track.length - 1) * ITEM_H, Math.min(0, raw));
    })
    .onEnd(() => {
      const rawIdx  = Math.round(-offset.value / ITEM_H);
      const clamped = Math.max(0, Math.min(track.length - 1, rawIdx));

      if (loop) {
        const original = ((clamped % N) + N) % N;
        const middle   = original + N;
        const c0 = original, c1 = original + N, c2 = original + 2 * N;
        const closest = [c0, c1, c2].reduce((best, c) =>
          Math.abs(c - clamped) < Math.abs(best - clamped) ? c : best,
        );
        offset.value = withSpring(
          -closest * ITEM_H,
          { damping: 22, stiffness: 300, mass: 0.8 },
          (finished) => {
            'worklet';
            if (finished) offset.value = -middle * ITEM_H;
          },
        );
        runOnJS(onChange)(original);
      } else {
        offset.value = withSpring(-clamped * ITEM_H, { damping: 22, stiffness: 300, mass: 0.8 });
        runOnJS(onChange)(clamped);
      }
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value + ITEM_H * 2 }],
  }));

  return (
    <View style={{ flex, height: DIAL_H, overflow: 'hidden' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={trackStyle}>
          {track.map((label, i) => (
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

const s = StyleSheet.create({
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
});
