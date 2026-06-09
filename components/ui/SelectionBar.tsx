import { useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, fonts } from '@/lib/theme';
import { Download, Share2, Trash2, ICON_STROKE, type LucideIcon } from '@/lib/icons';

interface Props {
  visible: boolean;
  count: number;
  /** Pixels from the bottom of the screen. Tab screens pass useBottomTabBarHeight();
   *  stack screens pass useSafeAreaInsets().bottom. */
  bottomOffset: number;
  onCancel: () => void;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
}

const DARK_PILL = '#1A1714';

export function SelectionBar({ visible, count, bottomOffset, onCancel, onDownload, onShare, onDelete }: Props) {
  const { colors, isDark } = useTheme();
  const pillBg    = isDark ? colors.surface2 : DARK_PILL;
  const borderCol = isDark ? colors.ink15 : 'rgba(255,255,255,0.06)';

  const ty  = useSharedValue(120);
  const opa = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opa.value = withTiming(1, { duration: 120 });
      ty.value  = withSpring(0, { damping: 20, stiffness: 240, mass: 0.8 });
    } else {
      opa.value = withTiming(0, { duration: 150 });
      ty.value  = withTiming(120, { duration: 200 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: opa.value,
  }));

  return (
    <Animated.View
      style={[s.wrapper, { bottom: bottomOffset }]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Animated.View style={animStyle}>
        <View style={[s.pill, { backgroundColor: pillBg, borderColor: borderCol }]}>
          <Pressable style={s.copy} onPress={onCancel} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel selection">
            <AppText style={s.label}>{count} selected</AppText>
            <AppText style={s.sub}>Tap to cancel</AppText>
          </Pressable>
          <View style={s.actions}>
            <ActionCircle icon={Download} label="Save"   onPress={onDownload} bg="rgba(255,255,255,0.10)" />
            <ActionCircle icon={Share2}   label="Share"  onPress={onShare}    bg="rgba(255,255,255,0.10)" />
            <ActionCircle icon={Trash2}   label="Delete" onPress={onDelete}   bg="rgba(224,88,79,0.18)" tint="#E0584F" />
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function ActionCircle({ icon: Icon, label, onPress, bg, tint }: {
  icon: LucideIcon; label: string; onPress: () => void; bg: string; tint?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [s.circle, { backgroundColor: bg, opacity: pressed ? 0.6 : 1 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={18} color={tint ?? '#fff'} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
  },
  pill: {
    borderRadius: radius.r20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  copy: { flex: 1 },
  label: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
  sub:   { fontFamily: fonts.sans,   fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.md },
  circle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
});
