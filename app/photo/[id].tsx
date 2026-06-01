import { useEffect, useState } from 'react';
import { View, Image, Pressable, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { AppText } from '@/components/ui/AppText';
import { usePhotoStore } from '@/store/usePhotoStore';
import { localStore } from '@/lib/localStore';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import { colors, fonts, radius, spacing, shadows } from '@/lib/theme';
import type { Photo } from '@/types';

export default function PhotoViewer() {
  const { id, date } = useLocalSearchParams<{ id: string; date: string }>();
  const fromStore = usePhotoStore((s) => (date ? s.photosByDate[date] : undefined));
  const { download, share, remove, busy } = usePhotoActions();

  const [photo, setPhoto] = useState<Photo | null>(
    () => fromStore?.find((p) => p.id === id) ?? null
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fall back to local storage if the photo isn't in memory.
  useEffect(() => {
    if (photo || !date || !id) return;
    localStore.getPhotos(date).then((list) => {
      const found = list.find((p) => p.id === id);
      if (found) setPhoto(found);
    });
  }, [date, id]);

  function showToast(msg: string) {
    if (!msg) return;
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function onDownload() {
    if (!photo) return;
    const res = await download(photo);
    showToast(res.message);
  }

  async function onShare() {
    if (!photo) return;
    const res = await share(photo);
    if (!res.ok && res.message) showToast(res.message);
  }

  async function onConfirmDelete() {
    if (!photo) return;
    setConfirmDelete(false);
    const res = await remove(photo);
    if (res.ok) router.back();
    else showToast(res.message);
  }

  const stampTime = photo?.timestamp && photo.created_at
    ? format(parseISO(photo.created_at), 'yyyy-MM-dd  HH:mm:ss')
    : null;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.iconBtn} onPress={() => router.back()} accessibilityLabel="Close">
            <AppText style={s.iconBtnText}>✕</AppText>
          </Pressable>
          {date && <AppText style={s.headerDate}>{format(parseISO(date), 'MMM d, yyyy')}</AppText>}
          <View style={s.iconBtn} />
        </View>

        {/* Image */}
        <View style={s.imageWrap}>
          {photo?.url ? (
            <Image source={{ uri: photo.url }} style={s.image} resizeMode="contain" />
          ) : (
            <ActivityIndicator color="#fff" />
          )}
          {stampTime && (
            <View style={s.stamp} pointerEvents="none">
              <AppText style={s.stampText}>{stampTime}</AppText>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Action icon="⬇" label="Download" onPress={onDownload} disabled={busy || !photo} />
          <Action icon="↗" label="Share" onPress={onShare} disabled={busy || !photo} />
          <Action icon="🗑" label="Delete" onPress={() => setConfirmDelete(true)} disabled={busy || !photo} danger />
        </View>
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

      {/* Delete confirmation — themed in-app modal */}
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <Pressable style={s.dialogBackdrop} onPress={() => setConfirmDelete(false)}>
          <Pressable style={s.dialog} onPress={() => {}}>
            <View style={s.dialogIcon}>
              <AppText style={{ fontSize: 24 }}>🗑</AppText>
            </View>
            <AppText style={s.dialogTitle}>Delete this photo?</AppText>
            <AppText style={s.dialogBody}>
              This permanently removes it from your grid. This can't be undone.
            </AppText>
            <View style={s.dialogActions}>
              <Pressable
                style={({ pressed }) => [s.dialogBtn, s.dialogCancel, pressed && s.pressed]}
                onPress={() => setConfirmDelete(false)}
              >
                <AppText style={s.dialogCancelText}>Cancel</AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.dialogBtn, s.dialogDelete, pressed && s.pressed]}
                onPress={onConfirmDelete}
              >
                <AppText style={s.dialogDeleteText}>Delete</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  stamp: { position: 'absolute', bottom: 16, right: 18 },
  stampText: {
    fontFamily: fonts.sansSb, fontSize: 13, letterSpacing: 0.5,
    color: 'rgba(255,200,90,0.92)',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

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

  toast: {
    position: 'absolute', bottom: 120, alignSelf: 'center',
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

  // Themed delete dialog
  dialogBackdrop: {
    flex: 1, backgroundColor: 'rgba(15,14,13,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  dialog: {
    width: '100%', maxWidth: 340,
    backgroundColor: colors.surface0, borderRadius: radius.r24,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.ink15, ...shadows.elev3,
  },
  dialogIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFEBEE',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  dialogTitle: { fontFamily: fonts.serifR, fontSize: 22, color: colors.ink100, letterSpacing: -0.4, textAlign: 'center' },
  dialogBody: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.ink60, textAlign: 'center' },
  dialogActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignSelf: 'stretch' },
  dialogBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.r16, alignItems: 'center' },
  pressed: { opacity: 0.85 },
  dialogCancel: { backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.ink15 },
  dialogCancelText: { fontFamily: fonts.sansSb, fontSize: 15, color: colors.ink100 },
  dialogDelete: { backgroundColor: '#C62828' },
  dialogDeleteText: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
});
