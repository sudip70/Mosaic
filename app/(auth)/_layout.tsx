// Phase 2 — auth screens are not reachable in Phase 1
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
