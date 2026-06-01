import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
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
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { initAnalytics } from '@/lib/analytics';
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

  // Block render until fonts are ready — prevents font flash on first frame
  if (!fontsLoaded || loading) {
    return <View style={{ flex: 1, backgroundColor: '#F4EFE6' }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
