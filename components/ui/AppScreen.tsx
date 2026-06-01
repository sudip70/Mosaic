import { View, ScrollView, StyleSheet, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout } from '@/lib/theme';

interface AppScreenProps {
  children: React.ReactNode;
  /** Wrap content in a vertical ScrollView with standard padding + gap. */
  scroll?: boolean;
  /** Background — defaults to the warm off-white surface. */
  background?: string;
  /** Override the edges that get safe-area inset. Default top only (tab bar handles bottom). */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * Root wrapper for every screen. Owns the safe area, the canvas background,
 * and — when `scroll` is set — the standard 20px horizontal padding and
 * 14px inter-card gap so content blocks line up identically across screens.
 */
export function AppScreen({
  children,
  scroll = false,
  background = colors.surface0,
  edges = ['top'],
  contentContainerStyle,
}: AppScreenProps) {
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={s.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: layout.screenPadH,
    paddingBottom: layout.screenPadH + 12,
    gap: layout.cardGap,
  },
});
