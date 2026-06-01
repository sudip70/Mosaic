import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Section } from '@/components/layout/Section';
import { DayGallery } from '@/components/features/DayGallery';
import { EmptyState } from '@/components/ui/EmptyState';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { usePhotos } from '@/hooks/usePhotos';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatDisplay } from '@/lib/dates';

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { user } = useAuth();
  const { photos, loading } = usePhotos(date ?? '', user?.id ?? '');
  const { track } = useAnalytics();

  // Guard: malformed URL param (e.g. /day/invalid)
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? '');
  if (!isValidDate) {
    return (
      <Screen>
        <Section>
          <Button label="Back" onPress={() => router.back()} variant="ghost" />
        </Section>
        <EmptyState title="Invalid date" subtitle="This day doesn't exist." />
      </Screen>
    );
  }

  useEffect(() => { track('day_viewed', { date }); }, [date]);

  return (
    <Screen>
      <Section className="flex-row items-center justify-between">
        <Typography variant="title">{formatDisplay(date)}</Typography>
        <Button label="Back" onPress={() => router.back()} variant="ghost" />
      </Section>

      {photos.length > 0 ? (
        <DayGallery photos={photos} />
      ) : (
        <EmptyState
          title="No photos for this day"
          subtitle="Go back and capture something!"
        />
      )}
    </Screen>
  );
}
