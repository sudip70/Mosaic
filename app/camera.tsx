import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Accelerometer } from 'expo-sensors';
import Svg, { Line } from 'react-native-svg';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { useUpload } from '@/hooks/useUpload';
import { useAuth } from '@/hooks/useAuth';
import { useColorStore } from '@/store/useColorStore';
import { useCameraSettings } from '@/store/useCameraSettings';
import { today } from '@/lib/dates';
import { colors, fonts, radius } from '@/lib/theme';
import { X, Settings, Plus, Zap, RotateCcw, ICON_STROKE } from '@/lib/icons';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();
  const { uploadPhoto, uploading, error: uploadError } = useUpload();
  const todayColor = useColorStore((s) => s.todayColor);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  // Thumbnails captured in this session — drives the strip + counter.
  const [sessionShots, setSessionShots] = useState<string[]>([]);

  // Camera-only preferences (persisted) + the settings popup visibility.
  const { timestamp, grid, leveling, toggle } = useCameraSettings();
  const [showSettings, setShowSettings] = useState(false);

  const canCapture = !!user && !!todayColor && !uploading;

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current || !canCapture) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (!photo?.uri) return;
    setSessionShots((prev) => [photo.uri, ...prev]);
    await uploadPhoto(photo.uri, user!.id, today(), todayColor!.id, timestamp);
  }, [canCapture, user, todayColor, uploadPhoto, timestamp]);

  const handleLibrary = useCallback(async () => {
    if (!canCapture) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSessionShots((prev) => [uri, ...prev]);
      await uploadPhoto(uri, user!.id, today(), todayColor!.id, timestamp);
    }
  }, [canCapture, user, todayColor, uploadPhoto, timestamp]);

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
        {/* Tap-away backdrop for the settings popup */}
        {showSettings && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSettings(false)}
            accessibilityLabel="Close settings"
          />
        )}

        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={() => router.back()} accessibilityLabel="Close camera">
            <X size={18} color="rgba(255,255,255,0.85)" strokeWidth={ICON_STROKE} />
          </Pressable>

          {todayColor && (
            <View style={s.hint}>
              <View style={[s.hintDot, { backgroundColor: todayColor.hex }]} />
              <AppText style={s.hintText}>Finding {todayColor.name}</AppText>
            </View>
          )}

          <View style={s.topRight}>
            <View style={s.counter}>
              <AppText style={s.counterText}>{sessionShots.length} / ∞</AppText>
            </View>
            <Pressable
              style={[s.settingsBtn, showSettings && s.settingsBtnActive]}
              onPress={() => setShowSettings((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Camera settings"
            >
              <Settings size={16} color="rgba(255,255,255,0.85)" strokeWidth={ICON_STROKE} />
            </Pressable>
          </View>
        </View>

        {/* Finder — grid/level aids are confined to this region only */}
        <View style={s.finderMid}>
          {grid && <GridOverlay />}
          {leveling && <LevelIndicator />}
          {timestamp && <TimestampOverlay />}
          {uploadError && (
            <View style={s.errorBanner}>
              <AppText style={s.errorText}>{uploadError}</AppText>
            </View>
          )}
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
              <Plus size={22} color="rgba(255,255,255,0.6)" strokeWidth={ICON_STROKE} />
            </Pressable>
          </View>

          <View style={s.row}>
            <Pressable
              style={s.sideBtn}
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              accessibilityLabel="Toggle flash"
            >
              <Zap size={19} color={flash === 'on' ? colors.accent : 'rgba(255,255,255,0.7)'} strokeWidth={ICON_STROKE} />
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
              <RotateCcw size={19} color="rgba(255,255,255,0.7)" strokeWidth={ICON_STROKE} />
            </Pressable>
          </View>

        </View>

        {/* Settings popup — rendered last so it sits above the finder aids */}
        {showSettings && (
          <CameraSettingsPanel
            timestamp={timestamp}
            grid={grid}
            leveling={leveling}
            onToggle={toggle}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Camera settings popup ────────────────────────────────────────────────────

interface PanelProps {
  timestamp: boolean;
  grid: boolean;
  leveling: boolean;
  onToggle: (key: 'timestamp' | 'grid' | 'leveling') => void;
}

function CameraSettingsPanel({ timestamp, grid, leveling, onToggle }: PanelProps) {
  const rows: { key: 'timestamp' | 'grid' | 'leveling'; label: string; value: boolean }[] = [
    { key: 'timestamp', label: 'Timestamp', value: timestamp },
    { key: 'grid', label: 'Grid', value: grid },
    { key: 'leveling', label: 'Leveling', value: leveling },
  ];
  return (
    <View style={s.panel}>
      {rows.map((r, i) => (
        <View key={r.key} style={[s.panelRow, i < rows.length - 1 && s.panelRowBorder]}>
          <AppText style={s.panelLabel}>{r.label}</AppText>
          <Switch
            value={r.value}
            onValueChange={() => onToggle(r.key)}
            trackColor={{ false: 'rgba(255,255,255,0.18)', true: colors.accent }}
            thumbColor="#fff"
            ios_backgroundColor="rgba(255,255,255,0.18)"
          />
        </View>
      ))}
    </View>
  );
}

// ─── Dotted rule-of-thirds grid ───────────────────────────────────────────────

function GridOverlay() {
  const stroke = 'rgba(255,255,255,0.5)';
  return (
    <Svg style={s.gridOverlay} pointerEvents="none">
      <Line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke={stroke} strokeWidth={1} strokeDasharray="2 7" />
      <Line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke={stroke} strokeWidth={1} strokeDasharray="2 7" />
      <Line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke={stroke} strokeWidth={1} strokeDasharray="2 7" />
      <Line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke={stroke} strokeWidth={1} strokeDasharray="2 7" />
    </Svg>
  );
}

// ─── Horizon level indicator ──────────────────────────────────────────────────

function LevelIndicator() {
  const [roll, setRoll] = useState(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y }) => {
      // Roll angle in portrait: 0° when upright, ± when tilted left/right.
      setRoll((Math.atan2(x, -y) * 180) / Math.PI);
    });
    return () => sub.remove();
  }, []);

  const level = Math.abs(roll) < 1.2;
  const lineColor = level ? colors.accent : 'rgba(255,255,255,0.8)';

  return (
    <View style={s.levelWrap} pointerEvents="none">
      {/* Fixed center reference */}
      <View style={s.levelRef} />
      {/* Rotating horizon line */}
      <View style={[s.levelLine, { backgroundColor: lineColor, transform: [{ rotate: `${roll}deg` }] }]} />
      <View style={[s.levelDot, { backgroundColor: lineColor }]} />
    </View>
  );
}

// ─── Live timestamp overlay ───────────────────────────────────────────────────

function TimestampOverlay() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={s.timestamp} pointerEvents="none">
      <AppText style={s.timestampText}>{format(now, 'yyyy-MM-dd  HH:mm:ss')}</AppText>
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
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: DARK_GLASS,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  hintDot: { width: 10, height: 10, borderRadius: 5 },
  hintText: { fontFamily: fonts.sansSb, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: {
    backgroundColor: DARK_GLASS, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  counterText: { fontFamily: fonts.sansSb, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: DARK_GLASS,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingsBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },

  // Settings popup
  panel: {
    position: 'absolute', top: 124, right: 16, zIndex: 50,
    width: 196, borderRadius: 16,
    backgroundColor: 'rgba(22,20,19,0.92)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  panelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9,
  },
  panelRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  panelLabel: { fontFamily: fonts.sansMd, fontSize: 14, color: '#fff' },

  // Grid — inset from the top so it doesn't crowd the colour hint / top bar
  gridOverlay: { position: 'absolute', top: 28, left: 0, right: 0, bottom: 0 },

  // Level indicator
  levelWrap: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  levelLine: { position: 'absolute', width: 180, height: 2, borderRadius: 1 },
  levelRef: { position: 'absolute', width: 56, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  levelDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  // Timestamp
  timestamp: { position: 'absolute', bottom: 16, right: 18 },
  timestampText: {
    fontFamily: fonts.sansSb, fontSize: 13, letterSpacing: 0.5,
    color: 'rgba(255,200,90,0.92)',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  // Finder
  finderMid: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Error banner
  errorBanner: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    backgroundColor: 'rgba(198,40,40,0.92)', borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8, maxWidth: '90%',
  },
  errorText: { fontFamily: fonts.sansMd, fontSize: 12, color: '#fff', textAlign: 'center' },

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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  sideBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  shutter: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)' },
});
