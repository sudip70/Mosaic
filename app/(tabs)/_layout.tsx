import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[s.tab, focused && s.tabActive]}>
      <Text style={[s.tabIcon, focused && s.tabIconActive]}>{icon}</Text>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{label}</Text>
      {focused && <View style={s.tabDot} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: s.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◉" label="Today" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="grid"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="▦" label="Grid" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◎" label="Friends" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(254,252,248,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.ink15,
    height: 72,
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    position: 'relative',
  },
  tabActive: { backgroundColor: colors.ink100 },
  tabIcon: { fontSize: 18, color: colors.ink30 },
  tabIconActive: { color: '#fff' },
  tabLabel: {
    fontFamily: fonts.sansMd,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink30,
  },
  tabLabelActive: { color: 'rgba(255,255,255,0.55)' },
  tabDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
