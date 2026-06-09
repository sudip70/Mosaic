import { useEffect } from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ColorHero } from '@/components/ui/ColorHero';
import { AppText } from '@/components/ui/AppText';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SelectionBar } from '@/components/ui/SelectionBar';
import { Toast } from '@/components/ui/Toast';
import { usePhotos } from '@/hooks/usePhotos';
import { useDateColor } from '@/hooks/useDateColor';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { fonts, radius, shadows, spacing, type Palette } from '@/lib/theme';
import { ChevronLeft, Check } from '@/lib/icons';
import type { Photo } from '@/types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const safeDate = date ?? '';
  const isValid = DATE_RE.test(safeDate);

  const { user } = useAuth();
  const { photos } = usePhotos(isValid ? safeDate : '', user?.id ?? '');
  const color = useDateColor(isValid ? safeDate : '');
  const { track } = useAnalytics();
  const { colors } = useTheme();
  const st = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  // Day reads photos from the reactive photo store, so remove() refreshes the
  // list with no manual reload.
  const {
    selectedIds, isSelecting, displayCount,
    toggleSelected, enterSelection, clearSelection,
    toast, confirmDelete, setConfirmDelete,
    handleDownload, handleShare, handleDelete,
  } = useMultiSelect(photos);

  // Hooks must run unconditionally — guard inside the effect, not around it.
  useEffect(() => {
    if (isValid) track('day_viewed', { date: safeDate });
  }, [safeDate, isValid]);

  if (!isValid) {
    return (
      <AppScreen>
        <ScreenHeader
          title="Day"
          left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }}
        />
        <View style={st.emptyWrap}>
          <AppText variant="title" color={colors.ink60}>Invalid date</AppText>
          <AppText variant="caption">This day doesn't exist.</AppText>
        </View>
      </AppScreen>
    );
  }

  const heroPhoto = photos[0] as Photo | undefined;
  const restPhotos = photos.slice(1) as Photo[];

  return (
    <AppScreen>
      <ScreenHeader
        title={format(parseISO(safeDate), 'MMM d')}
        left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }}
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
            {heroPhoto && (
              <PhotoCell
                photo={heroPhoto}
                hero
                isSelecting={isSelecting}
                isSelected={selectedIds.has(heroPhoto.id)}
                onPress={() => {
                  if (isSelecting) toggleSelected(heroPhoto.id);
                  else router.push({ pathname: '/photo/[id]', params: { id: heroPhoto.id, date: safeDate } });
                }}
                onLongPress={() => enterSelection(heroPhoto.id)}
                colors={colors}
                st={st}
              />
            )}
            {/* Remaining — 2 columns */}
            <View style={st.gridRow}>
              {restPhotos.map((p) => (
                <PhotoCell
                  key={p.id}
                  photo={p}
                  isSelecting={isSelecting}
                  isSelected={selectedIds.has(p.id)}
                  onPress={() => {
                    if (isSelecting) toggleSelected(p.id);
                    else router.push({ pathname: '/photo/[id]', params: { id: p.id, date: safeDate } });
                  }}
                  onLongPress={() => enterSelection(p.id)}
                  colors={colors}
                  st={st}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Toast message={toast} bottomOffset={insets.bottom + spacing.xxl} />

      <SelectionBar
        visible={isSelecting}
        count={displayCount}
        bottomOffset={insets.bottom + spacing.sm}
        onCancel={clearSelection}
        onDownload={handleDownload}
        onShare={handleShare}
        onDelete={() => setConfirmDelete(true)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete ${displayCount} photo${displayCount !== 1 ? 's' : ''}?`}
        body="This permanently removes them from your grid. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppScreen>
  );
}

// ─── PhotoCell ────────────────────────────────────────────────────────────────

function PhotoCell({
  photo, hero,
  isSelecting, isSelected,
  onPress, onLongPress,
  colors, st,
}: {
  photo: Photo;
  hero?: boolean;
  isSelecting: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: Palette;
  st: ReturnType<typeof makeStyles>;
}) {
  const time = photo.created_at ? format(parseISO(photo.created_at), 'HH:mm') : '';
  const showStamp = !!photo.timestamp && !!time;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[
        st.cell,
        hero ? st.cellHero : st.cellHalf,
        isSelecting && !isSelected && st.cellDimmed,
      ]}
      accessibilityRole="imagebutton"
      accessibilityLabel={showStamp ? `Photo at ${time}` : 'Photo'}
    >
      {photo.url ? (
        <Image source={{ uri: photo.url }} style={st.cellImg} resizeMode="cover" />
      ) : (
        <View style={[st.cellImg, st.cellEmpty]} />
      )}
      {showStamp && (
        <View style={st.timeBadge}>
          <AppText style={st.timeText}>{time}</AppText>
        </View>
      )}
      {/* Selection ring + checkmark */}
      {isSelecting && (
        <View style={[
          st.selCircle,
          isSelected && { backgroundColor: colors.ink100, borderColor: colors.ink100 },
        ]}>
          {isSelected && <Check size={12} color={colors.onAccent} strokeWidth={3} />}
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GAP = spacing.sm;

const makeStyles = (c: Palette) => StyleSheet.create({
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
  cellEmpty: { backgroundColor: c.surface2 },
  cellDimmed: { opacity: 0.45 },

  selCircle: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  timeBadge: {
    position: 'absolute', bottom: 7, right: 8,
    backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  timeText: { fontFamily: fonts.sansSb, fontSize: 9, color: 'rgba(255,255,255,0.85)' },
});
