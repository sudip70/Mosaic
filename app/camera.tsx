import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
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
import { useTheme } from '@/hooks/useTheme';
import { reportError } from '@/lib/reportError';
import { today } from '@/lib/dates';
import { fonts, radius, type Palette } from '@/lib/theme';
import { X, Settings, Plus, Zap, RotateCcw, ICON_STROKE } from '@/lib/icons';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();
  const { uploadPhoto, uploading, error: uploadError } = useUpload();
  const todayColor = useColorStore((s) => s.todayColor);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
  // `zoom` drives the CameraView prop (JS-side); `zoomSV` mirrors it on the UI
  // thread so the pinch gesture stays continuous without rebuilding each frame.
  const [zoom, setZoom] = useState(0);
  const zoomSV = useSharedValue(0);
  const startZoom = useSharedValue(0);
  // Thumbnails captured in this session — drives the strip + counter.
  const [sessionShots, setSessionShots] = useState<string[]>([]);

  // expo-camera matches selectedLens by localizedName ("Back Wide Camera"), not by device type
  // string. Exclude virtual/compound devices ("Back Dual Wide Camera", "Back Triple Camera")
  // which sort before "Back Wide Camera" alphabetically and show ultrawide at zoom=0.
  const pickWide = useCallback((lenses: string[]) => {
    const wide = lenses.find(l => /wide/i.test(l) && !/ultra|dual|triple/i.test(l)) ?? lenses[0];
    if (wide) setSelectedLens(wide);
  }, []);

  const handleLensesChanged = useCallback(({ lenses }: { lenses: string[] }) => {
    pickWide(lenses);
  }, [pickWide]);

  // Safety-net: if onAvailableLensesChanged fired before the listener attached,
  // onCameraReady gives us a second chance to select the correct lens.
  const handleCameraReady = useCallback(async () => {
    if (selectedLens || !cameraRef.current) return;
    const lenses = await cameraRef.current.getAvailableLensesAsync();
    if (lenses.length) pickWide(lenses);
  }, [selectedLens, pickWide]);

  // Built once — reads/writes shared values only, so it survives the per-frame
  // setZoom re-renders that keep the CameraView prop in sync.
  const pinchGesture = useMemo(() => Gesture.Pinch()
    .onStart(() => { startZoom.value = zoomSV.value; })
    .onUpdate((e) => {
      const next = Math.min(Math.max(startZoom.value + (e.scale - 1) * 0.35, 0), 1);
      zoomSV.value = next;
      runOnJS(setZoom)(next);
    }), []);

  // Camera-only preferences (persisted) + the settings popup visibility.
  const { timestamp, grid, leveling, toggle } = useCameraSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Themed chrome — the live feed can't be themed, but the surrounding UI follows it.
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  // Icon tints over glass chrome, adapted per theme.
  const glassIcon = isDark ? 'rgba(255,255,255,0.85)' : colors.ink100;
  const mutedIcon = isDark ? 'rgba(255,255,255,0.7)' : colors.ink60;
  const faintIcon = isDark ? 'rgba(255,255,255,0.6)' : colors.ink30;
  // Shutter: neutral ring + a dot tinted with the colour of the day.
  const shutterSpinner = isDark ? '#fff' : colors.ink100;
  const shutterColor = todayColor?.hex ?? colors.accent;

  const canCapture = !!user && !!todayColor && !uploading;

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current || !canCapture) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: true });
      if (!photo?.uri) return;
      setSessionShots((prev) => [photo.uri, ...prev]);
      await uploadPhoto(photo.uri, user!.id, today(), todayColor!.id, timestamp, photo.exif);
    } catch (e) {
      reportError(e, { scope: 'takePicture' });
    }
  }, [canCapture, user, todayColor, uploadPhoto, timestamp]);

  const handleLibrary = useCallback(async () => {
    if (!canCapture) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      exif: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSessionShots((prev) => [asset.uri, ...prev]);
      await uploadPhoto(asset.uri, user!.id, today(), todayColor!.id, timestamp, asset.exif ?? undefined);
    }
  }, [canCapture, user, todayColor, uploadPhoto, timestamp]);

  // ── Permission gates ────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={s.dark}>
        <ActivityIndicator color={colors.ink100} />
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
            <X size={18} color={glassIcon} strokeWidth={ICON_STROKE} />
          </Pressable>

          {todayColor && (
            <View style={s.hint}>
              <View style={[s.hintDot, { backgroundColor: todayColor.hex }]} />
              <AppText style={s.hintText}>Finding {todayColor.name}</AppText>
            </View>
          )}

          <Pressable
            style={[s.settingsBtn, showSettings && s.settingsBtnActive]}
            onPress={() => setShowSettings((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Camera settings"
          >
            <Settings size={16} color={showSettings ? '#fff' : glassIcon} strokeWidth={ICON_STROKE} />
          </Pressable>
        </View>

        {/* Finder — fills space between top bar and controls */}
        <GestureDetector gesture={pinchGesture}>
          <View style={s.finderMid}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
            selectedLens={selectedLens}
            zoom={zoom}
            onAvailableLensesChanged={handleLensesChanged}
            onCameraReady={handleCameraReady}
          />
          {grid && <GridOverlay />}
          {leveling && <LevelIndicator />}
          {timestamp && <TimestampOverlay />}
          {uploadError && (
            <View style={ov.errorBanner}>
              <AppText style={ov.errorText}>{uploadError}</AppText>
            </View>
          )}
          </View>
        </GestureDetector>

        {/* Controls */}
        <View style={s.controls}>
          {/* Captured-this-session strip + add-from-gallery tile, counter at right */}
          <View style={s.thumbs}>
            <View style={s.thumbStrip}>
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
                <Plus size={22} color={faintIcon} strokeWidth={ICON_STROKE} />
              </Pressable>
            </View>

            <View style={s.counter}>
              <AppText style={s.counterText}>{sessionShots.length} / ∞</AppText>
            </View>
          </View>

          <View style={s.row}>
            <Pressable
              style={s.sideBtn}
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              accessibilityLabel="Toggle flash"
            >
              <Zap size={19} color={flash === 'on' ? colors.accent : mutedIcon} strokeWidth={ICON_STROKE} />
            </Pressable>

            <Pressable
              style={[s.shutter, !canCapture && s.shutterDisabled]}
              onPress={handleShutter}
              disabled={!canCapture}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              {uploading ? <ActivityIndicator color={shutterSpinner} /> : <View style={[s.shutterInner, { backgroundColor: shutterColor }]} />}
            </Pressable>

            <Pressable
              style={s.sideBtn}
              onPress={() => { setFacing((f) => (f === 'back' ? 'front' : 'back')); setSelectedLens(undefined); setZoom(0); zoomSV.value = 0; }}
              accessibilityLabel="Flip camera"
            >
              <RotateCcw size={19} color={mutedIcon} strokeWidth={ICON_STROKE} />
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
            s={s}
            colors={colors}
            isDark={isDark}
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
  s: ReturnType<typeof makeStyles>;
  colors: Palette;
  isDark: boolean;
}

function CameraSettingsPanel({ timestamp, grid, leveling, onToggle, s, colors, isDark }: PanelProps) {
  const rows: { key: 'timestamp' | 'grid' | 'leveling'; label: string; value: boolean }[] = [
    { key: 'timestamp', label: 'Timestamp', value: timestamp },
    { key: 'grid', label: 'Grid', value: grid },
    { key: 'leveling', label: 'Leveling', value: leveling },
  ];
  const trackOff = isDark ? 'rgba(255,255,255,0.18)' : colors.surface2;
  return (
    <View style={s.panel}>
      {rows.map((r, i) => (
        <View key={r.key} style={[s.panelRow, i < rows.length - 1 && s.panelRowBorder]}>
          <AppText style={s.panelLabel}>{r.label}</AppText>
          <Switch
            value={r.value}
            onValueChange={() => onToggle(r.key)}
            trackColor={{ false: trackOff, true: colors.accent }}
            thumbColor={isDark ? '#fff' : colors.surface0}
            ios_backgroundColor={trackOff}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Dotted rule-of-thirds grid ───────────────────────────────────────────────

function GridOverlay() {
  // Thin solid rule-of-thirds lines, iOS-style.
  const line = 'rgba(255,255,255,0.6)';
  return (
    <Svg style={ov.gridOverlay} width="100%" height="100%" pointerEvents="none">
      {/* Vertical thirds */}
      <Line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke={line} strokeWidth={0.75} />
      <Line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke={line} strokeWidth={0.75} />
      {/* Horizontal thirds */}
      <Line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke={line} strokeWidth={0.75} />
      <Line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke={line} strokeWidth={0.75} />
    </Svg>
  );
}

// ─── Horizon level indicator ──────────────────────────────────────────────────

function LevelIndicator() {
  const { colors } = useTheme();
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
    <View style={ov.levelWrap} pointerEvents="none">
      {/* Fixed center reference */}
      <View style={ov.levelRef} />
      {/* Rotating horizon line */}
      <View style={[ov.levelLine, { backgroundColor: lineColor, transform: [{ rotate: `${roll}deg` }] }]} />
      <View style={[ov.levelDot, { backgroundColor: lineColor }]} />
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
    <View style={ov.timestamp} pointerEvents="none">
      <AppText style={ov.timestampText}>{format(now, 'yyyy-MM-dd  HH:mm:ss')}</AppText>
    </View>
  );
}

// ─── Theme-independent overlays ───────────────────────────────────────────────
// These sit on the live photo (grid, level, timestamp, error). They stay neutral
// white/amber so they read on any captured scene, in either app theme.
const ov = StyleSheet.create({
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  levelWrap: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  levelLine: { position: 'absolute', width: 180, height: 2, borderRadius: 1 },
  levelRef: { position: 'absolute', width: 56, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  levelDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  timestamp: { position: 'absolute', bottom: 16, right: 18 },
  timestampText: {
    fontFamily: fonts.sansSb, fontSize: 13, letterSpacing: 0.5,
    color: 'rgba(255,200,90,0.92)',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  errorBanner: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    backgroundColor: 'rgba(198,40,40,0.92)', borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8, maxWidth: '90%',
  },
  errorText: { fontFamily: fonts.sansMd, fontSize: 12, color: '#fff', textAlign: 'center' },
});

// ─── Themed chrome ────────────────────────────────────────────────────────────
const makeStyles = (c: Palette, isDark: boolean) => {
  // Glass pills/buttons floating over the live feed.
  const glassBg     = isDark ? 'rgba(15,14,13,0.55)' : 'rgba(254,252,248,0.72)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  // Solid chrome bars / popups. The mask + controls share one solid canvas tone
  // so everything below the 4:3 finder reads as a single seamless surface.
  const chromeBg    = c.canvas;
  const panelBg     = isDark ? 'rgba(22,20,19,0.96)' : 'rgba(254,252,248,0.98)';
  // Shutter inverts with the theme so it always pops against its bar.
  const shutterFill = isDark ? '#fff' : c.ink100;

  return StyleSheet.create({
    dark: { flex: 1, backgroundColor: c.canvas },
    overlay: { flex: 1 },

    // Permission
    permCenter: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
    permTitle: { fontFamily: fonts.serifR, fontSize: 26, color: c.ink100, textAlign: 'center' },
    permSub: { fontFamily: fonts.sans, fontSize: 14, color: c.ink60, textAlign: 'center', lineHeight: 21 },
    permBtn: {
      backgroundColor: c.accent, borderRadius: radius.r16,
      paddingHorizontal: 28, paddingVertical: 14, marginTop: 8,
    },
    permBtnText: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
    permCancel: { fontFamily: fonts.sansMd, fontSize: 13, color: c.ink60, marginTop: 4 },

    // Top bar
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: glassBg,
      borderWidth: 1, borderColor: glassBorder, alignItems: 'center', justifyContent: 'center',
    },
    hint: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: glassBg,
      borderWidth: 1, borderColor: glassBorder, borderRadius: radius.full,
      paddingHorizontal: 14, paddingVertical: 6,
    },
    hintDot: { width: 10, height: 10, borderRadius: 5 },
    hintText: { fontFamily: fonts.sansSb, fontSize: 11, color: isDark ? 'rgba(255,255,255,0.85)' : c.ink100, letterSpacing: 0.4 },
    counter: {
      backgroundColor: glassBg, borderWidth: 1, borderColor: glassBorder,
      borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
    },
    counterText: { fontFamily: fonts.sansSb, fontSize: 11, color: isDark ? 'rgba(255,255,255,0.7)' : c.ink60, letterSpacing: 0.4 },
    settingsBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: glassBg,
      borderWidth: 1, borderColor: glassBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    settingsBtnActive: { backgroundColor: c.accent, borderColor: c.accent },

    // Settings popup
    panel: {
      position: 'absolute', top: 124, right: 16, zIndex: 50,
      width: 196, borderRadius: 16,
      backgroundColor: panelBg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : c.ink15,
      paddingHorizontal: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.4 : 0.18, shadowRadius: 20, elevation: 12,
    },
    panelRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 9,
    },
    panelRowBorder: { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : c.ink15 },
    panelLabel: { fontFamily: fonts.sansMd, fontSize: 14, color: c.ink100 },

    // Finder — fills all space between the top bar and controls.
    finderMid: {
      flex: 1,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },

    // Controls — same solid tone as the mask, joined seamlessly
    controls: {
      backgroundColor: chromeBg, paddingHorizontal: 24, paddingVertical: 8, gap: 16,
    },
    thumbs: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
    thumbStrip: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    thumb: { width: 46, height: 46, borderRadius: 8, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.2)' : c.ink15 },
    thumbSelected: { borderColor: isDark ? '#fff' : c.ink100, borderWidth: 2 },
    thumbAdd: {
      width: 46, height: 46, borderRadius: 8,
      borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.25)' : c.ink30, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center',
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
    sideBtn: {
      width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.15)' : c.ink15,
      alignItems: 'center', justifyContent: 'center',
    },
    shutter: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 4, borderColor: shutterFill,
    },
    shutterDisabled: { opacity: 0.5 },
    // Colour-of-the-day dot; backgroundColor is set inline from todayColor.
    shutterInner: { width: 54, height: 54, borderRadius: 27 },
  });
};
