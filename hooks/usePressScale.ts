import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Strong ease-out (Emil Kowalski): cubic-bezier(0.23, 1, 0.32, 1). The built-in
// curves are too weak to feel intentional; this one starts fast so a press
// reads as instant feedback.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Smooth press-scale feedback for any tappable element.
 *
 * Rest state is always scale(1), so nothing's visibility depends on the
 * animation firing. Press-in is quick (snappy acknowledgement); release is a
 * touch slower but still under the radar. reduceMotion follows the system
 * default, so motion-sensitive users get an instant state change instead.
 */
export function usePressScale(to = 0.97) {
  const p = useSharedValue(0); // 0 = released, 1 = pressed

  // p is a stable shared-value ref, so the handlers never need to change.
  const onPressIn = useCallback(() => {
    p.value = withTiming(1, { duration: 120, easing: EASE_OUT });
  }, []);

  const onPressOut = useCallback(() => {
    p.value = withTiming(0, { duration: 180, easing: EASE_OUT });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - to) * p.value }],
  }));

  return { onPressIn, onPressOut, style };
}
