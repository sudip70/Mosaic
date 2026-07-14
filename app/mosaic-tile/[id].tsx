import { useRef, useState } from 'react';
import {
  View, Image, Pressable, ActivityIndicator, StyleSheet, FlatList, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { format, parseISO } from 'date-fns';
import { AppText } from '@/components/ui/AppText';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { X, Download, Share2, Trash2, ICON_STROKE, type LucideIcon } from '@/lib/icons';
import { useChallengeStore } from '@/store/useChallengeStore';
import { reportError } from '@/lib/reportError';
import { fonts, radius } from '@/lib/theme';
import type { Challenge } from '@/types';

// A revisitable tile: the index it filled, the image that completed it, and when.
interface TilePhoto {
  tileIndex: number;
  uri: string;
  date: string;
}

// Filled tiles that kept an image, newest day first. Placement is colour-
// matched, so fill order doesn't follow `sequence` — sort by fill date instead.
// A stroke's photo lives only on its anchor tile, and tiles filled before the
// separate capture flow carry a hex only; both kinds of uri-less tiles are
// skipped, so each photo appears once.
function buildTilePhotos(challenge: Challenge | null | undefined): TilePhoto[] {
  if (!challenge) return [];
  return Object.entries(challenge.filled)
    .filter(([, tile]) => tile.uri)
    .map(([idx, tile]) => ({ tileIndex: Number(idx), uri: tile.uri!, date: tile.date }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Full-screen pager over a mosaic's saved tile images, with the same download /
// share / delete actions as the daily photo viewer. Delete removes the photo but
// leaves the tile's colour in the painting (see clearTilePhoto).
export default function MosaicTileViewer() {
  const { id, tileIndex } = useLocalSearchParams<{ id: string; tileIndex?: string }>();
  const { width } = useWindowDimensions();
  const clearTilePhoto = useChallengeStore((s) => s.clearTilePhoto);

  // Snapshot the tile photos once, then manage the pager locally so deletes slide
  // smoothly without the list re-deriving underneath the current index.
  const [photos, setPhotos] = useState<TilePhoto[]>(() => {
    const { active, history } = useChallengeStore.getState();
    const challenge = active?.id === id ? active : history.find((c) => c.id === id);
    return buildTilePhotos(challenge);
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (tileIndex == null) return 0;
    const wanted = Number(tileIndex);
    const i = photos.findIndex((p) => p.tileIndex === wanted);
    return i >= 0 ? i : 0;
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<TilePhoto>>(null);

  const current = photos[currentIndex] ?? null;

  function showToast(msg: string) {
    if (!msg) return;
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function onMomentumEnd(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== currentIndex && i >= 0 && i < photos.length) setCurrentIndex(i);
  }

  async function onDownload() {
    if (!current) return;
    setBusy(true);
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) { showToast('Photo library permission denied'); return; }
      await MediaLibrary.saveToLibraryAsync(current.uri);
      showToast('Saved to your photos');
    } catch (e) {
      reportError(e, { scope: 'tileDownload' });
      showToast('Could not save photo');
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!current) return;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        showToast('Sharing is not available on this device');
        return;
      }
      await Sharing.shareAsync(current.uri, { mimeType: 'image/jpeg', dialogTitle: 'Share photo' });
    } catch (e) {
      reportError(e, { scope: 'tileShare' });
      showToast('Could not share photo');
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmDelete() {
    const target = current;
    if (!target) return;
    setConfirmDelete(false);
    setBusy(true);
    try {
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
      // Keep the tile's colour in the painting; only the photo goes.
      clearTilePhoto(id!, target.tileIndex);

      const remaining = photos.filter((p) => p.tileIndex !== target.tileIndex);
      if (remaining.length === 0) {
        router.back();
        return;
      }
      const wasLast = currentIndex >= remaining.length;
      const nextIndex = Math.min(currentIndex, remaining.length - 1);
      setPhotos(remaining);
      setCurrentIndex(nextIndex);
      if (wasLast) {
        requestAnimationFrame(() =>
          listRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true })
        );
      }
      showToast('Photo deleted');
    } catch (e) {
      reportError(e, { scope: 'tileDelete' });
      showToast('Could not delete photo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.iconBtn} onPress={() => router.back()} accessibilityLabel="Close">
            <X size={18} color="#fff" strokeWidth={ICON_STROKE} />
          </Pressable>
          {current && <AppText style={s.headerDate}>{format(parseISO(current.date), 'MMM d, yyyy')}</AppText>}
          {photos.length > 1 ? (
            <View style={s.countPill}>
              <AppText style={s.countText}>{currentIndex + 1}/{photos.length}</AppText>
            </View>
          ) : (
            <View style={s.headerSpacer} />
          )}
        </View>

        {/* Swipeable pager */}
        <View style={s.imageWrap}>
          {photos.length > 0 ? (
            <FlatList
              ref={listRef}
              data={photos}
              keyExtractor={(p) => String(p.tileIndex)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              onMomentumScrollEnd={onMomentumEnd}
              renderItem={({ item }) => (
                <View style={[s.page, { width }]}>
                  <Image source={{ uri: item.uri }} style={s.image} resizeMode="contain" />
                </View>
              )}
            />
          ) : (
            <View style={s.empty}>
              <AppText style={s.emptyText}>No tile photos to show yet.</AppText>
            </View>
          )}
        </View>

        {/* Actions */}
        {photos.length > 0 && (
          <View style={s.actions}>
            <Action icon={Download} label="Download" onPress={onDownload} disabled={busy || !current} />
            <Action icon={Share2} label="Share" onPress={onShare} disabled={busy || !current} />
            <Action icon={Trash2} label="Delete" onPress={() => setConfirmDelete(true)} disabled={busy || !current} danger />
          </View>
        )}
      </SafeAreaView>

      {/* Toast */}
      {toast && (
        <View style={s.toast} pointerEvents="none">
          <AppText style={s.toastText}>{toast}</AppText>
        </View>
      )}

      {/* Busy spinner */}
      {busy && (
        <View style={s.busyOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={confirmDelete}
        icon="🗑"
        iconBg="#FFEBEE"
        title="Delete this photo?"
        body="This removes the saved photo for this tile. The tile keeps its colour in the mosaic."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

function Action({
  icon: Icon, label, onPress, disabled, danger,
}: { icon: LucideIcon; label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.action, pressed && s.actionPressed, disabled && s.actionDisabled]}
    >
      <View style={[s.actionIcon, danger && s.actionIconDanger]}>
        <Icon size={22} color={danger ? '#FF6B6B' : '#fff'} strokeWidth={ICON_STROKE} />
      </View>
      <AppText style={[s.actionLabel, danger && s.actionLabelDanger]}>{label}</AppText>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0E0D' },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSpacer: { width: 36, height: 36 },
  headerDate: { fontFamily: fonts.sansMd, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  countPill: {
    minWidth: 36, height: 36, borderRadius: 18, paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontFamily: fonts.sansSb, fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  imageWrap: { flex: 1 },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  actions: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 24,
  },
  action: { alignItems: 'center', gap: 8, width: 80 },
  actionPressed: { opacity: 0.6 },
  actionDisabled: { opacity: 0.4 },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconDanger: { backgroundColor: 'rgba(198,40,40,0.22)' },
  actionLabel: { fontFamily: fonts.sansMd, fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  actionLabelDanger: { color: '#FF6B6B' },

  toast: {
    position: 'absolute', bottom: 130, alignSelf: 'center',
    backgroundColor: 'rgba(22,20,19,0.95)', borderRadius: radius.full,
    paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  toastText: { fontFamily: fonts.sansMd, fontSize: 13, color: '#fff' },

  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
});
