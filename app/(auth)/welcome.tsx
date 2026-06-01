// Phase 2
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <Typography variant="display">Mosaic</Typography>
        <Typography variant="body" className="text-center">
          One color. Every day. A mosaic of your life.
        </Typography>
      </View>
      <Section className="gap-3">
        <Button label="Get Started" onPress={() => router.push('/(auth)/signup')} fullWidth />
        <Button label="I have an account" onPress={() => router.push('/(auth)/login')} variant="ghost" fullWidth />
      </Section>
    </Screen>
  );
}
