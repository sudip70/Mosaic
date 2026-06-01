import { Tabs } from 'expo-router';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '@/lib/theme';

const TABS: Record<string, { icon: string; label: string }> = {
  index:    { icon: '◉', label: 'Today' },
  grid:     { icon: '▦', label: 'Grid' },
  friends:  { icon: '◎', label: 'Friends' },
  settings: { icon: '⚙', label: 'Settings' },
};

function MosaicTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={s.cell}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={meta.label}
          >
            <View style={[s.pill, focused && s.pillActive]}>
              <Text style={[s.icon, focused && s.iconActive]}>{meta.icon}</Text>
              <Text style={[s.label, focused && s.labelActive]}>{meta.label}</Text>
              {focused && <View style={s.dot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MosaicTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="grid" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface0,
    borderTopWidth: 1,
    borderTopColor: colors.ink15,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cell: { flex: 1, alignItems: 'center' },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    minWidth: 64,
  },
  pillActive: { backgroundColor: colors.ink100 },
  icon: { fontSize: 17, lineHeight: 20, color: colors.ink30 },
  iconActive: { color: '#fff' },
  label: {
    fontFamily: fonts.sansMd,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink30,
  },
  labelActive: { color: 'rgba(255,255,255,0.6)' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 1 },
});
