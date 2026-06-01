import { useRef, useState, useCallback } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { useUpload } from '@/hooks/useUpload';
import { useAuth } from '@/hooks/useAuth';
import { useColorStore } from '@/store/useColorStore';
import { today } from '@/lib/dates';
import { colors, fonts, radius } from '@/lib/theme';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();
  const { uploadPhoto, uploading } = useUpload();
  const todayColor = useColorStore((s) => s.todayColor);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  // Thumbnails captured in this session — drives the strip + counter.
  const [sessionShots, setSessionShots] = useState<string[]>([]);

  const canCapture = !!user && !!todayColor && !uploading;

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current || !canCapture) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (!photo?.uri) return;
    setSessionShots((prev) => [photo.uri, ...prev]);
    await uploadPhoto(photo.uri, user!.id, today(), todayColor!.id);
  }, [canCapture, user, todayColor, uploadPhoto]);

  const handleLibrary = useCallback(async () => {
    if (!canCapture) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSessionShots((prev) => [uri, ...prev]);
      await uploadPhoto(uri, user!.id, today(), todayColor!.id);
    }
  }, [canCapture, user, todayColor, uploadPhoto]);

  // ── Permission gates ────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={s.dark}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.dark, s.permCenter]}>
        <AppText style={s.permTitle}>Camera access needed</AppText>
        <AppText style={s.permSub}>
          Mosaic uses your camera to capture today's colour. Your photos stay private.
        </AppText>
        <Pressable style={s.permBtn} onPress={requestPermission}>
          <AppText style={s.permBtnText}>Allow camera</AppText>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <AppText style={s.permCancel}>Not now</AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Live finder ─────────────────────────────────────────────────────────────
  return (
    <View style={s.dark}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={() => router.back()} accessibilityLabel="Close camera">
            <AppText style={s.closeIcon}>✕</AppText>
          </Pressable>

          {todayColor && (
            <View style={s.hint}>
              <View style={[s.hintDot, { backgroundColor: todayColor.hex }]} />
              <AppText style={s.hintText}>Finding {todayColor.name}</AppText>
            </View>
          )}

          <View style={s.counter}>
            <AppText style={s.counterText}>{sessionShots.length} / ∞</AppText>
          </View>
        </View>

        {/* Focus box */}
        <View style={s.finderMid}>
          <View style={s.focusBox}>
            <View style={[s.fc, s.fcTL]} />
            <View style={[s.fc, s.fcTR]} />
            <View style={[s.fc, s.fcBL]} />
            <View style={[s.fc, s.fcBR]} />
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          {/* Captured-this-session strip + add-from-gallery tile */}
          <View style={s.thumbs}>
            {sessionShots.slice(0, 3).map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                style={[s.thumb, i === 0 && s.thumbSelected]}
              />
            ))}
            <Pressable
              style={s.thumbAdd}
              onPress={handleLibrary}
              disabled={!canCapture}
              accessibilityRole="button"
              accessibilityLabel="Add from gallery"
            >
              <AppText style={s.thumbAddIcon}>+</AppText>
            </Pressable>
          </View>

          <View style={s.row}>
            <Pressable
              style={s.sideBtn}
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              accessibilityLabel="Toggle flash"
            >
              <AppText style={[s.sideIcon, flash === 'on' && s.sideIconActive]}>⚡</AppText>
            </Pressable>

            <Pressable
              style={[s.shutter, !canCapture && s.shutterDisabled]}
              onPress={handleShutter}
              disabled={!canCapture}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              {uploading ? <ActivityIndicator color={colors.ink100} /> : <View style={s.shutterInner} />}
            </Pressable>

            <Pressable
              style={s.sideBtn}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              accessibilityLabel="Flip camera"
            >
              <AppText style={s.sideIcon}>↺</AppText>
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const WHITE_60 = 'rgba(255,255,255,0.6)';
const DARK_GLASS = 'rgba(15,14,13,0.55)';

const s = StyleSheet.create({
  dark: { flex: 1, backgroundColor: '#0F0E0D' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  // Permission
  permCenter: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  permTitle: { fontFamily: fonts.serifR, fontSize: 26, color: '#fff', textAlign: 'center' },
  permSub: { fontFamily: fonts.sans, fontSize: 14, color: WHITE_60, textAlign: 'center', lineHeight: 21 },
  permBtn: {
    backgroundColor: colors.accent, borderRadius: radius.r16,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 8,
  },
  permBtnText: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
  permCancel: { fontFamily: fonts.sansMd, fontSize: 13, color: WHITE_60, marginTop: 4 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: DARK_GLASS,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: fonts.sans },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: DARK_GLASS,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  hintDot: { width: 10, height: 10, borderRadius: 5 },
  hintText: { fontFamily: fonts.sansSb, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 },
  counter: {
    backgroundColor: DARK_GLASS, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  counterText: { fontFamily: fonts.sansSb, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 },

  // Focus box
  finderMid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  focusBox: { width: 90, height: 90 },
  fc: { position: 'absolute', width: 18, height: 18, borderColor: 'rgba(255,255,255,0.9)' },
  fcTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  fcTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  fcBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  fcBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },

  // Controls
  controls: {
    backgroundColor: 'rgba(15,14,13,0.92)', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 16,
  },
  thumbs: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  thumb: { width: 46, height: 46, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  thumbSelected: { borderColor: '#fff', borderWidth: 2 },
  thumbAdd: {
    width: 46, height: 46, borderRadius: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbAddIcon: { fontSize: 22, color: 'rgba(255,255,255,0.55)', fontFamily: fonts.sans, lineHeight: 26 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  sideBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  sideIcon: { fontSize: 19, color: 'rgba(255,255,255,0.6)' },
  sideIconActive: { color: colors.accent },
  shutter: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)' },
});
