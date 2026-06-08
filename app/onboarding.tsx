import { useRef, useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence, withDelay,
  Easing, interpolate, interpolateColor,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText } from '@/components/ui/AppText';
import { TimePicker } from '@/components/ui/TimePicker';
import { useTheme } from '@/hooks/useTheme';
import { fonts, radius, spacing, shadows, type Palette } from '@/lib/theme';
import { ONBOARDING_KEY } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';
import { useSettings } from '@/store/useSettings';
import { requestNotificationPermission, scheduleReminder } from '@/lib/notifications';
import { Camera, ArrowRight, User, ICON_STROKE } from '@/lib/icons';
import { Bell } from 'lucide-react-native';
import Svg, {
  Path, Rect, Circle, Ellipse, Defs,
  LinearGradient, Stop,
} from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

const PALETTE = ['#C4604A', '#5B8DB8', '#6BAF6B', '#D4A843', '#A0668A', '#4A9B8F'];

// ─── Mosaic grid constants ────────────────────────────────────────────────────

const GRID_N   = 5;
const GRID_GAP = 3;
const GRID_W   = 210;
const TILE_S   = (GRID_W - GRID_GAP * (GRID_N - 1)) / GRID_N;
const MOSAIC_COLORS = Array.from({ length: GRID_N * GRID_N }, (_, i) => PALETTE[i % PALETTE.length]);

// ─── Polaroid scenes (SVG illustrations) ─────────────────────────────────────

function MountainScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="mSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E08870" />
          <Stop offset="1" stopColor="#C86040" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#mSky)" />
      {/* Sun */}
      <Circle cx="74" cy="38" r="10" fill="#F0A870" opacity={0.65} />
      {/* Back range */}
      <Path d="M0 74 L14 48 L24 60 L40 34 L56 54 L70 30 L84 50 L94 38 L100 44 L100 100 L0 100Z"
            fill="#B04838" />
      {/* Front range */}
      <Path d="M0 100 L0 84 L18 62 L32 78 L50 50 L66 72 L82 52 L96 66 L100 60 L100 100Z"
            fill="#7A2E1E" />
    </Svg>
  );
}

function CityScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="cSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1A3050" />
          <Stop offset="1" stopColor="#2C5878" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#cSky)" />
      {/* Stars */}
      <Circle cx="12" cy="10" r="0.9" fill="#fff" opacity={0.85} />
      <Circle cx="28" cy="6"  r="0.7" fill="#fff" opacity={0.70} />
      <Circle cx="50" cy="13" r="1.0" fill="#fff" opacity={0.80} />
      <Circle cx="38" cy="21" r="0.6" fill="#fff" opacity={0.60} />
      <Circle cx="64" cy="8"  r="0.8" fill="#fff" opacity={0.75} />
      {/* Moon */}
      <Circle cx="82" cy="16" r="7" fill="#C8D8EA" />
      {/* Buildings — back layer */}
      <Rect x="0"  y="54" width="13" height="46" fill="#112038" />
      <Rect x="15" y="40" width="10" height="60" fill="#0E1C32" />
      <Rect x="27" y="58" width="12" height="42" fill="#112038" />
      <Rect x="41" y="36" width="15" height="64" fill="#0E1C32" />
      <Rect x="58" y="48" width="11" height="52" fill="#112038" />
      <Rect x="71" y="44" width="13" height="56" fill="#0E1C32" />
      <Rect x="86" y="56" width="14" height="44" fill="#112038" />
      {/* Lit windows */}
      <Rect x="3"  y="62" width="2" height="2" fill="#7AB0CC" opacity={0.9} />
      <Rect x="3"  y="68" width="2" height="2" fill="#7AB0CC" opacity={0.7} />
      <Rect x="7"  y="60" width="2" height="2" fill="#7AB0CC" opacity={0.8} />
      <Rect x="17" y="48" width="2" height="2" fill="#7AB0CC" opacity={0.9} />
      <Rect x="17" y="56" width="2" height="2" fill="#7AB0CC" opacity={0.6} />
      <Rect x="44" y="44" width="2" height="2" fill="#7AB0CC" opacity={0.85}/>
      <Rect x="44" y="52" width="2" height="2" fill="#7AB0CC" opacity={0.7} />
      <Rect x="50" y="48" width="2" height="2" fill="#7AB0CC" opacity={0.8} />
      <Rect x="74" y="54" width="2" height="2" fill="#7AB0CC" opacity={0.75}/>
      <Rect x="74" y="62" width="2" height="2" fill="#7AB0CC" opacity={0.6} />
    </Svg>
  );
}

function HillsScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="hSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CCE8C4" />
          <Stop offset="1" stopColor="#B4D8A8" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#hSky)" />
      {/* Cloud */}
      <Ellipse cx="34" cy="22" rx="16" ry="7"  fill="#fff" opacity={0.70} />
      <Ellipse cx="46" cy="18" rx="12" ry="6"  fill="#fff" opacity={0.75} />
      <Ellipse cx="22" cy="24" rx="9"  ry="5"  fill="#fff" opacity={0.65} />
      {/* Back hills */}
      <Path d="M0 72 Q26 52 52 66 Q76 80 100 62 L100 100 L0 100Z" fill="#5A9858" />
      {/* Mid hills */}
      <Path d="M0 82 Q22 64 46 76 Q68 88 88 70 Q94 65 100 72 L100 100 L0 100Z" fill="#3C7C3A" />
      {/* Foreground */}
      <Path d="M0 93 Q32 84 62 90 Q82 94 100 88 L100 100 L0 100Z" fill="#2C6230" />
      {/* Tree */}
      <Rect x="70" y="62" width="3" height="11" fill="#2A5228" />
      <Path d="M63 62 L71.5 46 L80 62Z" fill="#2A5228" />
      <Path d="M65 56 L71.5 42 L78 56Z" fill="#3A7038" />
    </Svg>
  );
}

function DesertScene({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="dSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ECD8A0" />
          <Stop offset="1" stopColor="#DFBF60" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#dSky)" />
      {/* Sun */}
      <Circle cx="24" cy="30" r="15" fill="#F0B820" opacity={0.88} />
      {/* Heat shimmer */}
      <Rect x="0" y="64" width="100" height="2" fill="#C8A030" opacity={0.25} />
      {/* Back dune */}
      <Path d="M0 70 Q28 52 58 64 Q80 72 100 62 L100 100 L0 100Z" fill="#C29030" />
      {/* Front dune */}
      <Path d="M0 86 Q26 70 52 80 Q78 90 100 76 L100 100 L0 100Z" fill="#9A7020" />
      {/* Shadow pocket */}
      <Path d="M52 80 Q60 83 70 80 Q65 90 55 87Z" fill="#7A5818" opacity={0.4} />
    </Svg>
  );
}

// ─── Polaroid frames (page 1) ─────────────────────────────────────────────────

type SceneKey = 'mountains' | 'city' | 'hills' | 'desert';

const SCENES: Record<SceneKey, (size: number) => React.ReactElement> = {
  mountains: (s) => <MountainScene size={s} />,
  city:      (s) => <CityScene     size={s} />,
  hills:     (s) => <HillsScene    size={s} />,
  desert:    (s) => <DesertScene   size={s} />,
};

interface PolaroidCfg {
  left: number; top: number; width: number; rot: number;
  scene: SceneKey;
  date: string;
  amp: number; dur: number; delay: number;
}

const POLAROIDS: PolaroidCfg[] = [
  { left: -22,       top: 8,   width: 168, rot: -8, scene: 'mountains', date: 'jun 5',  amp: 11, dur: 3200, delay: 0   },
  { left: SW - 164,  top: 0,   width: 150, rot:  6, scene: 'city',      date: 'jun 3',  amp: 15, dur: 2800, delay: 350 },
  { left: SW * 0.13, top: 168, width: 154, rot: -4, scene: 'hills',     date: 'may 31', amp:  9, dur: 3500, delay: 200 },
  { left: SW * 0.50, top: 98,  width: 134, rot:  9, scene: 'desert',    date: 'jun 1',  amp: 13, dur: 3100, delay: 580 },
];

const POLAROID_BORDER = 8;
const POLAROID_CAP    = 40;

function PolaroidFrame({ cfg }: { cfg: PolaroidCfg }) {
  const y    = useSharedValue(0);
  const rock = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(cfg.delay, withRepeat(
      withSequence(
        withTiming(-cfg.amp, { duration: cfg.dur,       easing: Easing.inOut(Easing.ease) }),
        withTiming( cfg.amp, { duration: cfg.dur,       easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    ));
    rock.value = withDelay(cfg.delay + 280, withRepeat(
      withSequence(
        withTiming( 1.4, { duration: cfg.dur * 1.35, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1.4, { duration: cfg.dur * 1.35, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    ));
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${cfg.rot + rock.value}deg` }],
  }));

  const photoW = cfg.width - POLAROID_BORDER * 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: 'absolute', left: cfg.left, top: cfg.top,
        width: cfg.width,
        backgroundColor: '#fff',
        paddingTop: POLAROID_BORDER,
        paddingHorizontal: POLAROID_BORDER,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 10,
      }, aStyle]}
    >
      {/* SVG scene illustration */}
      <View style={{ width: photoW, height: photoW, overflow: 'hidden' }}>
        {SCENES[cfg.scene](photoW)}
      </View>

      {/* Handwritten date caption */}
      <View style={{ height: POLAROID_CAP, alignItems: 'center', justifyContent: 'center' }}>
        <AppText style={{ fontFamily: fonts.caveat, fontSize: 15, color: '#3A3430', letterSpacing: 0.3 }}>
          {cfg.date}
        </AppText>
      </View>
    </Animated.View>
  );
}

// ─── Page 1: Welcome ──────────────────────────────────────────────────────────

function WelcomePage({ c }: { c: Palette }) {
  return (
    <View style={pg.page}>
      <View style={pg.visual}>
        {POLAROIDS.map((p, i) => <PolaroidFrame key={i} cfg={p} />)}
      </View>
      <View style={pg.copy}>
        <View style={pg.eyebrow}>
          <View style={[pg.eyebrowDot, { backgroundColor: c.accent }]} />
          <AppText style={[pg.tag, { color: c.accent }]}>Welcome to Mosaic</AppText>
        </View>
        <AppText style={[pg.headline, { color: c.ink100 }]}>
          See the world{'\n'}in{' '}
          <AppText style={[pg.headlineAccent, { color: c.accent }]}>colour.</AppText>
        </AppText>
        <AppText style={[pg.body, { color: c.ink60 }]}>
          One colour every morning. Photograph it wherever you find it. Build a diary of your life without even trying.
        </AppText>
      </View>
    </View>
  );
}

// ─── Page 2: Daily Color ──────────────────────────────────────────────────────

function ColorPage({ c }: { c: Palette }) {
  const colorProg = useSharedValue(0);
  const breathe   = useSharedValue(1);
  useEffect(() => {
    colorProg.value = withRepeat(
      withTiming(PALETTE.length, { duration: 14000, easing: Easing.linear }),
      -1, false,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
  }, []);

  const swatchStyle = useAnimatedStyle(() => {
    const p    = colorProg.value;
    const from = Math.floor(p) % PALETTE.length;
    const to   = (from + 1) % PALETTE.length;
    const t    = p - Math.floor(p);
    return {
      backgroundColor: interpolateColor(t, [0, 1], [PALETTE[from], PALETTE[to]]),
      transform: [{ scale: breathe.value }],
    };
  });

  return (
    <View style={pg.page}>
      <View style={[pg.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={[pg.swatch, swatchStyle]} />
      </View>
      <View style={pg.copy}>
        <View style={pg.eyebrow}>
          <View style={[pg.eyebrowDot, { backgroundColor: c.accent }]} />
          <AppText style={[pg.tag, { color: c.accent }]}>Your daily colour</AppText>
        </View>
        <AppText style={[pg.headline, { color: c.ink100 }]}>Something new{'\n'}every morning.</AppText>
        <AppText style={[pg.body, { color: c.ink60 }]}>
          We pick one. You find it in the wild — a coffee cup, a stranger's coat, a patch of sky you almost walked past.
        </AppText>
      </View>
    </View>
  );
}

// ─── Page 3: Photograph ───────────────────────────────────────────────────────

function PhotoPage({ c }: { c: Palette }) {
  const ring   = useSharedValue(1.0);
  const ringOp = useSharedValue(0.55);
  useEffect(() => {
    ring.value = withRepeat(
      withSequence(
        withTiming(2.0, { duration: 550, easing: Easing.out(Easing.ease) }),
        withDelay(2600, withTiming(1.0, { duration: 0 })),
      ),
      -1, false,
    );
    ringOp.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 550, easing: Easing.out(Easing.ease) }),
        withDelay(2600, withTiming(0.55, { duration: 0 })),
      ),
      -1, false,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: ringOp.value,
  }));

  return (
    <View style={pg.page}>
      <View style={[pg.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        {/* Ring + camera stacked in a fixed container so ring pulses outward from centre */}
        <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[pg.shutterRing, { borderColor: c.accent }, ringStyle]} />
          <View style={[pg.cameraCircle, { position: 'absolute', backgroundColor: c.surface1, borderColor: c.ink15 }]}>
            <Camera size={30} color={c.accent} strokeWidth={ICON_STROKE} />
          </View>
        </View>
        <AppText style={[pg.cameraHint, { color: c.ink30 }]}>as many shots as you like</AppText>
      </View>
      <View style={pg.copy}>
        <View style={pg.eyebrow}>
          <View style={[pg.eyebrowDot, { backgroundColor: c.accent }]} />
          <AppText style={[pg.tag, { color: c.accent }]}>Your camera</AppText>
        </View>
        <AppText style={[pg.headline, { color: c.ink100 }]}>Just take{'\n'}the photo.</AppText>
        <AppText style={[pg.body, { color: c.ink60 }]}>
          No composition rules. No editing. No wrong answers. Your everyday eye is exactly the right one.
        </AppText>
      </View>
    </View>
  );
}

// ─── Page 4: Mosaic ───────────────────────────────────────────────────────────

function MosaicTile({ idx, color, prog }: { idx: number; color: string; prog: SharedValue<number> }) {
  const tStyle = useAnimatedStyle(() => {
    const t = interpolate(prog.value, [idx, idx + 0.8], [0, 1], 'clamp');
    return {
      opacity: t,
      transform: [{ scale: interpolate(t, [0, 0.65, 1], [0.2, 1.12, 1]) }],
    };
  });
  return (
    <Animated.View
      style={[tStyle, {
        width: TILE_S, height: TILE_S, borderRadius: 5,
        backgroundColor: color, margin: GRID_GAP / 2,
      }]}
    />
  );
}

function MosaicPage({ c }: { c: Palette }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withRepeat(
      withSequence(
        withTiming(GRID_N * GRID_N, { duration: GRID_N * GRID_N * 100, easing: Easing.linear }),
        withDelay(1400, withTiming(0, { duration: 350 })),
      ),
      -1, false,
    );
  }, []);
  return (
    <View style={pg.page}>
      <View style={[pg.visual, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: GRID_W + GRID_GAP }}>
          {MOSAIC_COLORS.map((color, i) => (
            <MosaicTile key={i} idx={i} color={color} prog={prog} />
          ))}
        </View>
      </View>
      <View style={pg.copy}>
        <View style={pg.eyebrow}>
          <View style={[pg.eyebrowDot, { backgroundColor: c.accent }]} />
          <AppText style={[pg.tag, { color: c.accent }]}>Your mosaic</AppText>
        </View>
        <AppText style={[pg.headline, { color: c.ink100 }]}>A year becomes{'\n'}something beautiful.</AppText>
        <AppText style={[pg.body, { color: c.ink60 }]}>
          365 colours. 365 moments. Each one a day you actually showed up and looked at your world.
        </AppText>
      </View>
    </View>
  );
}

// ─── Page 5: Streaks & Friends ───────────────────────────────────────────────

const DAYS        = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ACTIVE_DAYS = [0, 1, 2, 3, 4, 5]; // Mon–Sat lit; Sunday still to come

const FRIEND_AVATARS = [
  { color: '#5B8DB8' },
  { color: '#6BAF6B' },
  { color: '#D4A843' },
];

function StreakDot({ idx, active, c }: { idx: number; active: boolean; c: Palette }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(idx * 110, withSpring(1, { damping: 14, stiffness: 200 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[pg.streakDot, { backgroundColor: active ? c.accent : c.accent15 }, aStyle]} />
  );
}

function FriendAvatar({ color, delay, c }: { color: string; delay: number; c: Palette }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 180 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: s.value }));
  return (
    <Animated.View style={[pg.avatar, { backgroundColor: color, borderColor: c.surface0 }, aStyle]}>
      <User size={17} color="rgba(255,255,255,0.92)" strokeWidth={2} />
    </Animated.View>
  );
}

function StreakPage({ c }: { c: Palette }) {
  const [count, setCount]  = useState(1);
  const flamePulse         = useSharedValue(1);

  useEffect(() => {
    const id = setInterval(() => setCount(n => (n >= 21 ? 1 : n + 1)), 140);
    flamePulse.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    return () => clearInterval(id);
  }, []);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: flamePulse.value }] }));

  return (
    <View style={pg.page}>
      <View style={[pg.visual, { alignItems: 'center', justifyContent: 'center', gap: spacing.xl }]}>

        {/* Flame + counter */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View style={flameStyle}>
            <AppText style={pg.flameEmoji}>🔥</AppText>
          </Animated.View>
          <AppText style={[pg.streakCount, { color: c.ink100 }]}>{count}</AppText>
          <AppText style={[pg.streakLabel, { color: c.ink30 }]}>day streak</AppText>
        </View>

        {/* Day dots */}
        <View style={pg.dayRow}>
          {DAYS.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 5 }}>
              <StreakDot idx={i} active={ACTIVE_DAYS.includes(i)} c={c} />
              <AppText style={[pg.dayLabel, { color: c.ink30 }]}>{d}</AppText>
            </View>
          ))}
        </View>

        {/* Friend avatars */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {FRIEND_AVATARS.map((av, i) => (
            <FriendAvatar key={i} color={av.color} delay={900 + i * 110} c={c} />
          ))}
          <AppText style={[pg.friendsNote, { color: c.ink60 }]}>3 friends on a streak</AppText>
        </View>
      </View>

      <View style={pg.copy}>
        <View style={pg.eyebrow}>
          <View style={[pg.eyebrowDot, { backgroundColor: c.accent }]} />
          <AppText style={[pg.tag, { color: c.accent }]}>Stay consistent</AppText>
        </View>
        <AppText style={[pg.headline, { color: c.ink100 }]}>{"Build streaks.\nBring friends."}</AppText>
        <AppText style={[pg.body, { color: c.ink60 }]}>
          Every photo keeps the streak alive. Miss a day and it resets — but your friends will notice.
        </AppText>
      </View>
    </View>
  );
}

// ─── Page 6: Reminder ─────────────────────────────────────────────────────────

interface NotifCardData {
  title: string; sub: string;
  top: number; left: number; width: number;
  rot: number; amp: number; dur: number; delay: number;
}

const NOTIF_CARDS: NotifCardData[] = [
  { title: 'A fresh colour today',       sub: 'Yours to find in the world around you.', top: 22,  left: 16,          width: 260, rot: -4, amp: 14, dur: 3100, delay: 0   },
  { title: "Time for today's colour", sub: 'Your daily pick is ready.',                 top: 80,  left: SW - 216,    width: 200, rot:  5, amp: 10, dur: 3600, delay: 500 },
  { title: "Don't forget today's photo", sub: 'Your mosaic is waiting.',                top: 148, left: 28,          width: 240, rot:  2, amp: 18, dur: 2700, delay: 300 },
];

function FloatingCard({ card, c }: { card: NotifCardData; c: Palette }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(card.delay, withRepeat(
      withSequence(
        withTiming(-card.amp, { duration: card.dur, easing: Easing.inOut(Easing.ease) }),
        withTiming( card.amp, { duration: card.dur, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    ));
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${card.rot}deg` }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        pg.notifCard,
        { top: card.top, left: card.left, width: card.width, backgroundColor: c.surface0, borderColor: c.ink15 },
        aStyle,
      ]}
    >
      <View style={[pg.notifIcon, { backgroundColor: c.accentSoft }]}>
        <Bell size={13} color={c.accent} strokeWidth={ICON_STROKE} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={[pg.notifTitle, { color: c.ink100 }]}>{card.title}</AppText>
        <AppText style={[pg.notifSub,   { color: c.ink60  }]}>{card.sub}</AppText>
      </View>
    </Animated.View>
  );
}

function ReminderPage({ c, time, onChangeTime }: { c: Palette; time: string; onChangeTime: (t: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <View style={pg.page}>
      <View style={pg.visual}>
        {NOTIF_CARDS.map((card, i) => <FloatingCard key={i} card={card} c={c} />)}
      </View>
      <View style={pg.copy}>
        <View style={pg.eyebrow}>
          <View style={[pg.eyebrowDot, { backgroundColor: c.accent }]} />
          <AppText style={[pg.tag, { color: c.accent }]}>Stay on track</AppText>
        </View>
        <AppText style={[pg.headline, { color: c.ink100 }]}>{"Don't let today\nslip by."}</AppText>
        <Pressable onPress={() => setPickerOpen(true)} accessibilityRole="button" accessibilityLabel="Change reminder time">
          {({ pressed }) => (
            <View style={[pg.timeChip, { backgroundColor: c.surface1, borderColor: c.ink15, opacity: pressed ? 0.72 : 1 }]}>
              <Bell size={15} color={c.accent} strokeWidth={ICON_STROKE} />
              <AppText style={[pg.timeVal, { color: c.ink100 }]}>{time}</AppText>
              <AppText style={[pg.tapHint, { color: c.ink30 }]}>tap to change</AppText>
            </View>
          )}
        </Pressable>
      </View>
      <TimePicker visible={pickerOpen} current={time} onSelect={onChangeTime} onClose={() => setPickerOpen(false)} />
    </View>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDot({ active, accent, idle }: { active: boolean; accent: string; idle: string }) {
  const w = useSharedValue(active ? 22 : 7);
  useEffect(() => {
    w.value = withSpring(active ? 22 : 7, { damping: 20, stiffness: 220 });
  }, [active]);
  const widthStyle = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[pg.dot, { backgroundColor: active ? accent : idle }, widthStyle]} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors: c, isDark } = useTheme();
  const insets             = useSafeAreaInsets();
  const setOnboarded       = useAppStore((s) => s.setOnboarded);
  const setMorningReminder = useSettings((s) => s.setMorningReminder);
  const setReminderTime    = useSettings((s) => s.setReminderTime);
  const defaultTime        = useSettings((s) => s.reminderTime);

  const scrollRef          = useRef<ScrollView>(null);
  const [page, setPage]    = useState(0);
  const [time, setTime]    = useState(defaultTime);

  const onMomentumEnd = useCallback((e: any) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / SW));
  }, []);

  const advance = useCallback(() => {
    scrollRef.current?.scrollTo({ x: (page + 1) * SW, animated: true });
  }, [page]);

  async function finish() {
    setOnboarded(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/');
  }

  async function enableAndFinish() {
    const granted = await requestNotificationPermission();
    if (granted) {
      setMorningReminder(true);
      setReminderTime(time);
      scheduleReminder(time);
    }
    await finish();
  }

  const isReminder = page === 5;

  return (
    <View style={[pg.screen, { backgroundColor: c.canvas }]}>
      {/* Skip chip — visible on every page except the final reminder (0–4) */}
      {!isReminder && (
        <Pressable
          style={[pg.skipBtn, { top: insets.top + 14 }]}
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <AppText style={[pg.skipText, { color: c.ink30 }]}>Skip</AppText>
        </Pressable>
      )}

      {/* Page strip */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={{ flex: 1 }}
      >
        <WelcomePage  c={c} />
        <ColorPage    c={c} />
        <PhotoPage    c={c} />
        <MosaicPage   c={c} />
        <StreakPage   c={c} />
        <ReminderPage c={c} time={time} onChangeTime={setTime} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={[pg.nav, { paddingBottom: Math.max(insets.bottom, 16) + 6 }]}>
        <View style={pg.dots}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProgressDot key={i} active={i === page} accent={c.accent} idle={c.ink15} />
          ))}
        </View>

        {!isReminder ? (
          <Pressable onPress={advance} accessibilityRole="button" accessibilityLabel="Continue">
            {({ pressed }) => (
              <View style={[pg.cta, { backgroundColor: isDark ? c.surface2 : c.ink100 }, pressed && pg.ctaPressed]}>
                <AppText style={[pg.ctaLabel, { color: isDark ? c.ink100 : '#fff' }]}>Continue</AppText>
                <View style={[pg.ctaArrow, { backgroundColor: c.accent }]}>
                  <ArrowRight size={18} color={c.onAccent} strokeWidth={ICON_STROKE} />
                </View>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <Pressable onPress={enableAndFinish} accessibilityRole="button" accessibilityLabel="Turn on reminders">
              {({ pressed }) => (
                <View style={[pg.cta, { backgroundColor: isDark ? c.surface2 : c.ink100 }, pressed && pg.ctaPressed]}>
                  <AppText style={[pg.ctaLabel, { color: isDark ? c.ink100 : '#fff' }]}>Turn on reminders</AppText>
                  <View style={[pg.ctaArrow, { backgroundColor: c.accent }]}>
                    <Bell size={18} color={c.onAccent} strokeWidth={ICON_STROKE} />
                  </View>
                </View>
              )}
            </Pressable>
            <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip for now">
              {({ pressed }) => (
                <AppText style={[pg.skipReminder, { color: c.ink30, opacity: pressed ? 0.55 : 1 }]}>
                  Skip for now →
                </AppText>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pg = StyleSheet.create({
  screen:   { flex: 1 },

  skipBtn:  { position: 'absolute', right: 20, zIndex: 10, paddingHorizontal: 4 },
  skipText: { fontFamily: fonts.sansMd, fontSize: 13 },

  // Per-page layout — 60 / 40 split, consistent across all pages
  page:   { width: SW, flex: 1, paddingTop: 64 },
  visual: { flex: 3, overflow: 'hidden' },
  copy:   { flex: 2, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },

  eyebrow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  tag:        { fontFamily: fonts.sansSb, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },

  headline:       { fontFamily: fonts.serifR, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  headlineAccent: { fontFamily: fonts.serifR, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  body:           { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20 },

  // Page 2 — swatch
  swatch: { width: 165, height: 165, borderRadius: radius.r32, ...shadows.elev3 },

  // Page 3 — camera
  shutterRing:  { width: 84, height: 84, borderRadius: 42, borderWidth: 2 },
  cameraCircle: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.elev2,
  },
  cameraHint: { fontFamily: fonts.sans, fontSize: 11, marginTop: 18, textAlign: 'center' },

  // Page 5 — notification cards
  notifCard: {
    position: 'absolute',
    borderRadius: radius.r16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadows.elev2,
    opacity: 0.9,
  },
  notifIcon:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontFamily: fonts.sansSb, fontSize: 12 },
  notifSub:   { fontFamily: fonts.sans, fontSize: 11, marginTop: 1 },

  // Page 5 — time chip
  timeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: radius.r24, borderWidth: StyleSheet.hairlineWidth,
  },
  timeVal:  { fontFamily: fonts.sansSb, fontSize: 18, letterSpacing: -0.3 },
  tapHint:  { fontFamily: fonts.sans, fontSize: 11 },

  // Page 5 — streaks
  flameEmoji:   { fontSize: 54, textAlign: 'center' },
  streakCount:  { fontFamily: fonts.sansSb, fontSize: 54, letterSpacing: -2, lineHeight: 58 },
  streakLabel:  { fontFamily: fonts.sans, fontSize: 12 },
  dayRow:       { flexDirection: 'row', gap: 10 },
  streakDot:    { width: 30, height: 30, borderRadius: 15 },
  dayLabel:     { fontFamily: fonts.sansSb, fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  friendsNote:   { fontFamily: fonts.sans, fontSize: 12 },

  // Progress dots
  dot:  { height: 7, borderRadius: 3.5 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },

  // Bottom nav
  nav: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },

  cta: {
    borderRadius: radius.r24, padding: spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 6,
  },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
  ctaLabel:   { fontFamily: fonts.serifR, fontSize: 20, color: '#fff', letterSpacing: -0.2 },
  ctaArrow:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  skipReminder: { fontFamily: fonts.sans, fontSize: 13, textAlign: 'center', paddingVertical: 4 },
});
