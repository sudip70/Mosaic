import { useEffect, useState } from 'react';
import { View, Image, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppText } from '@/components/ui/AppText';
import { usePhotoStore } from '@/store/usePhotoStore';
import { localStore } from '@/lib/localStore';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import { colors, fonts, radius } from '@/lib/theme';
import type { Photo } from '@/types';

export default function PhotoViewer() {
  const { id, date } = useLocalSearchParams<{ id: string; date: string }>();
  const fromStore = usePhotoStore((s) => (date ? s.photosByDate[date] : undefined));
  const { download, share, remove, busy } = usePhotoActions();

  const [photo, setPhoto] = useState<Photo | null>(
    () => fromStore?.find((p) => p.id === id) ?? null
  );

  // Fall back to local storage if the photo isn't in memory.
  useEffect(() => {
    if (photo || !date || !id) return;
    localStore.getPhotos(date).then((list) => {
      const found = list.find((p) => p.id === id);
      if (found) setPhoto(found);
    });
  }, [date, id]);

  async function onDownload() {
    if (!photo) return;
    const res = await download(photo);
    Alert.alert(res.ok ? 'Saved' : 'Couldn’t save', res.message);
  }

  async function onShare() {
    if (!photo) return;
    const res = await share(photo);
    if (!res.ok && res.message) Alert.alert('Couldn’t share', res.message);
  }

  function onDelete() {
    if (!photo) return;
    Alert.alert(
      'Delete photo?',
      'This permanently removes it from your grid.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await remove(photo);
            if (res.ok) router.back();
            else Alert.alert('Couldn’t delete', res.message);
          },
        },
      ]
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.iconBtn} onPress={() => router.back()} accessibilityLabel="Close">
            <AppText style={s.iconBtnText}>✕</AppText>
          </Pressable>
          {date && (
            <AppText style={s.headerDate}>{format(parseISO(date), 'MMM d, yyyy')}</AppText>
          )}
          <View style={s.iconBtn} />
        </View>

        {/* Image */}
        <View style={s.imageWrap}>
          {photo?.url ? (
            <Image source={{ uri: photo.url }} style={s.image} resizeMode="contain" />
          ) : (
            <ActivityIndicator color="#fff" />
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Action icon="⬇" label="Download" onPress={onDownload} disabled={busy || !photo} />
          <Action icon="↗" label="Share" onPress={onShare} disabled={busy || !photo} />
          <Action icon="🗑" label="Delete" onPress={onDelete} disabled={busy || !photo} danger />
        </View>
      </SafeAreaView>

      {busy && (
        <View style={s.busyOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
    </View>
  );
}

function Action({
  icon, label, onPress, disabled, danger,
}: { icon: string; label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.action, pressed && s.actionPressed, disabled && s.actionDisabled]}
    >
      <View style={[s.actionIcon, danger && s.actionIconDanger]}>
        <AppText style={s.actionIconText}>{icon}</AppText>
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
  iconBtnText: { fontSize: 14, color: '#fff', fontFamily: fonts.sans },
  headerDate: { fontFamily: fonts.sansMd, fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },

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
  actionIconText: { fontSize: 22 },
  actionLabel: { fontFamily: fonts.sansMd, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  actionLabelDanger: { color: '#FF6B6B' },

  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
});
