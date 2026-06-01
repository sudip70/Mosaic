import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { PhotoCapture } from '@/components/features/PhotoCapture';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useColorStore } from '@/store/useColorStore';

export default function CameraScreen() {
  const todayColor = useColorStore((s) => s.todayColor);

  return (
    <Screen>
      <Section className="flex-row items-center justify-between">
        <Typography variant="subtitle">Capture</Typography>
        <Button label="Done" onPress={() => router.back()} variant="ghost" />
      </Section>

      {todayColor && (
        <View className="items-center py-6">
          <ColorSwatch hex={todayColor.hex} name={todayColor.name} size="md" />
        </View>
      )}

      <PhotoCapture />
    </Screen>
  );
}
