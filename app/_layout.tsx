import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import {
  Fraunces_300Light_Italic,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { initAnalytics } from '@/lib/analytics';
import { ONBOARDING_KEY } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';
import '../global.css';

initAnalytics();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_300Light_Italic,
    Fraunces_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const { loading } = useAuth();
  useSync();
  useNotifications();
  const { colors, isDark } = useTheme();

  const router = useRouter();
  const segments = useSegments();
  const onboarded = useAppStore((s) => s.onboarded);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  // Read the first-launch flag once into the shared store.
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => setOnboarded(v === 'true'));
  }, []);

  // Redirect to onboarding on first launch, once everything is ready.
  useEffect(() => {
    if (onboarded === null || !fontsLoaded || loading) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !onOnboarding) {
      router.replace('/onboarding');
    }
  }, [onboarded, fontsLoaded, loading, segments]);

  // Block render until fonts, auth, and the onboarding flag are all ready.
  if (!fontsLoaded || loading || onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
