import { useEffect } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ColorHero } from '@/components/ui/ColorHero';
import { AppText } from '@/components/ui/AppText';
import { usePhotos } from '@/hooks/usePhotos';
import { useDateColor } from '@/hooks/useDateColor';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { colors, fonts, radius, shadows, spacing } from '@/lib/theme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const safeDate = date ?? '';
  const isValid = DATE_RE.test(safeDate);

  const { user } = useAuth();
  const { photos } = usePhotos(isValid ? safeDate : '', user?.id ?? '');
  const color = useDateColor(isValid ? safeDate : '');
  const { track } = useAnalytics();

  // Hooks must run unconditionally — guard inside the effect, not around it.
  useEffect(() => {
    if (isValid) track('day_viewed', { date: safeDate });
  }, [safeDate, isValid]);

  if (!isValid) {
    return (
      <AppScreen>
        <ScreenHeader
          title="Day"
          left={{ icon: '←', accessibilityLabel: 'Back', onPress: () => router.back() }}
        />
        <View style={st.emptyWrap}>
          <AppText variant="title" color={colors.ink60}>Invalid date</AppText>
          <AppText variant="caption">This day doesn't exist.</AppText>
        </View>
      </AppScreen>
    );
  }

  const heroPhoto = photos[0];
  const restPhotos = photos.slice(1);

  return (
    <AppScreen>
      <ScreenHeader
        title={format(parseISO(safeDate), 'MMM d')}
        left={{ icon: '←', accessibilityLabel: 'Back', onPress: () => router.back() }}
      />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {color && (
          <ColorHero
            hex={color.hex}
            name={color.name}
            height={120}
            nameSize={38}
            footLeft={format(parseISO(safeDate), 'EEEE, d MMMM yyyy')}
            footRight={`${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}
          />
        )}

        {photos.length === 0 ? (
          <View style={st.emptyWrap}>
            <AppText variant="title" color={colors.ink60}>No photos this day</AppText>
            <AppText variant="caption">This colour slipped by uncaptured.</AppText>
          </View>
        ) : (
          <View style={st.grid}>
            {/* Hero photo — full width */}
            <PhotoCell photo={heroPhoto} hero />
            {/* Remaining — 2 columns */}
            <View style={st.gridRow}>
              {restPhotos.map((p) => (
                <PhotoCell key={p.id} photo={p} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function PhotoCell({ photo, hero }: { photo: { id: string; url?: string; created_at: string }; hero?: boolean }) {
  const time = photo.created_at ? format(parseISO(photo.created_at), 'HH:mm') : '';
  return (
    <Pressable
      style={[st.cell, hero ? st.cellHero : st.cellHalf]}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo at ${time}`}
    >
      {photo.url ? (
        <Image source={{ uri: photo.url }} style={st.cellImg} resizeMode="cover" />
      ) : (
        <View style={[st.cellImg, st.cellEmpty]} />
      )}
      {!!time && (
        <View style={st.timeBadge}>
          <AppText style={st.timeText}>{time}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const GAP = spacing.sm;

const st = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.x3, gap: spacing.lg },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 64 },

  grid: { gap: GAP },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },

  cell: {
    borderRadius: radius.r16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...shadows.elev1,
  },
  cellHero: { width: '100%', aspectRatio: 1.4 },
  cellHalf: { width: `${50}%`, aspectRatio: 1, flexGrow: 1, flexBasis: '47%' },
  cellImg: { width: '100%', height: '100%' },
  cellEmpty: { backgroundColor: colors.surface2 },

  timeBadge: {
    position: 'absolute', bottom: 7, right: 8,
    backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  timeText: { fontFamily: fonts.sansSb, fontSize: 9, color: 'rgba(255,255,255,0.85)' },
});
