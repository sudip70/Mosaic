import { View, ScrollView, StyleSheet, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { layout } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';

interface AppScreenProps {
  children: React.ReactNode;
  /** Wrap content in a vertical ScrollView with standard padding + gap. */
  scroll?: boolean;
  /** Background override — defaults to the active theme's surface colour. */
  background?: string;
  /** Override the edges that get safe-area inset. Default top only (tab bar handles bottom). */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * Root wrapper for every screen. Owns the safe area, the themed background,
 * and — when `scroll` is set — the standard 20px horizontal padding and
 * 14px inter-card gap so content blocks line up identically across screens.
 */
export function AppScreen({
  children,
  scroll = false,
  background,
  edges = ['top'],
  contentContainerStyle,
}: AppScreenProps) {
  const { colors } = useTheme();
  const bg = background ?? colors.surface0;
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={edges}>
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
