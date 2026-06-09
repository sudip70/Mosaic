// ─── Palettes ────────────────────────────────────────────────────────────────
// Two warm palettes with identical keys. Components read the active one through
// useTheme()/useThemedStyles(); never import `colors` directly in new code.
export interface Palette {
  canvas: string;
  surface0: string;
  surface1: string;
  surface2: string;
  ink100: string;
  ink60: string;
  ink30: string;
  ink15: string;
  accent: string;
  /** Foreground for content placed ON an accent fill (adapts per theme). */
  onAccent: string;
  accentSoft: string;
  accent08: string;
  accent15: string;
  accent30: string;
}

// Accent is no longer orange — it's ink (near-black in light, near-paper in
// dark). It carries the same role the brand colour used to, but reads as
// "black in place of orange". `onAccent` is whatever sits legibly on top of it.
export const lightColors: Palette = {
  canvas:      '#F2EEE3',
  surface0:    '#FBF8F1',
  surface1:    '#EAE5D7',
  surface2:    '#DDD7C5',
  ink100:      '#16120D',
  ink60:       '#5A5247',
  ink30:       '#8E867A',
  ink15:       '#CFC8B7',
  accent:      '#16120D',
  onAccent:    '#FFFFFF',
  accentSoft:  '#ECE7DB',
  accent08:    'rgba(22,18,13,0.06)',
  accent15:    'rgba(22,18,13,0.12)',
  accent30:    'rgba(22,18,13,0.24)',
};

// Dark mode is neutral (Spotify-style): a near-black canvas with cool grey
// cards, pills, and buttons — not the warm browns of light mode.
export const darkColors: Palette = {
  canvas:      '#0A0A0A',
  surface0:    '#1C1C1C',
  surface1:    '#242424',
  surface2:    '#2E2E2E',
  ink100:      '#FFFFFF',
  ink60:       '#B3B3B3',
  ink30:       '#7C7C7C',
  ink15:       '#2B2B2B',
  accent:      '#FFFFFF',
  onAccent:    '#0A0A0A',
  accentSoft:  '#242424',
  accent08:    'rgba(255,255,255,0.07)',
  accent15:    'rgba(255,255,255,0.13)',
  accent30:    'rgba(255,255,255,0.26)',
};

// Back-compat default (light). Prefer the themed hooks in components.
export const colors = lightColors;

export const radius = {
  r8:   8,
  r12:  12,
  r16:  16,
  r20:  20,
  r24:  24,
  r32:  32,
  full: 9999,
} as const;

export const shadows = {
  elev1: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  elev2: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  elev3: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const fonts = {
  serif:  'Fraunces_400Regular',  // editorial display — regular
  serifR: 'Fraunces_500Medium',   // editorial display — medium (headings/wordmark)
  sans:   'DMSans_400Regular',
  sansMd: 'DMSans_500Medium',
  sansSb: 'DMSans_600SemiBold',
  caveat: 'Caveat_400Regular',    // handwriting — used for polaroid dates
} as const;

// ─── Spacing scale ───────────────────────────────────────────────────────────
// Every margin, padding, and gap in the app pulls from this 4px-based scale.
// Never hard-code a spacing number in a screen — use spacing.* instead.
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  x3:  32,
  x4:  40,
} as const;

// ─── Layout constants ────────────────────────────────────────────────────────
// Shared structural measurements so every screen lines up edge-to-edge.
export const layout = {
  screenPadH:   20,   // left/right padding for scrollable content
  navPadH:      24,   // left/right padding for the top nav bar
  navPadTop:    8,
  navPadBottom: 12,
  cardGap:      14,   // vertical gap between stacked cards on a screen
  cardPad:      16,   // internal padding inside a card
  iconBtn:      36,   // diameter of circular header icon buttons
} as const;

// ─── Typography scale ────────────────────────────────────────────────────────
// Font/size only — colour is applied by AppText from the active palette so text
// adapts to light/dark. Use <AppText variant="..."> rather than re-declaring.
export const type = {
  hero:      { fontFamily: fonts.serifR, fontSize: 54, lineHeight: 56, letterSpacing: -0.5 },
  display:   { fontFamily: fonts.serifR, fontSize: 38, lineHeight: 42, letterSpacing: -0.3 },
  serifLg:   { fontFamily: fonts.serifR, fontSize: 30, lineHeight: 34, letterSpacing: -0.2 },
  wordmark:  { fontFamily: fonts.serifR, fontSize: 24, lineHeight: 28, letterSpacing: -0.2 },
  title:     { fontFamily: fonts.sansSb, fontSize: 16 },
  body:      { fontFamily: fonts.sans,   fontSize: 14 },
  bodyMd:    { fontFamily: fonts.sansMd, fontSize: 13 },
  label:     { fontFamily: fonts.sansSb, fontSize: 14 },
  caption:   { fontFamily: fonts.sans,   fontSize: 12 },
  sub:       { fontFamily: fonts.sans,   fontSize: 11 },
  overline:  { fontFamily: fonts.sansSb, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

// Default colour per text variant — resolved against the active palette.
export const typeColorKey: Record<keyof typeof type, keyof Palette> = {
  hero: 'ink100', display: 'ink100', serifLg: 'ink100', wordmark: 'ink100',
  title: 'ink100', body: 'ink60', bodyMd: 'ink100', label: 'ink100',
  caption: 'ink30', sub: 'ink30', overline: 'ink30',
};

// ─── Readable text over an arbitrary colour ───────────────────────────────────
// Half the daily palette is light, so text laid over a swatch must adapt.

/** True when a hex colour is light enough that white text reads poorly on it. */
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceptual (Rec. 709) luminance on a 0–255 scale.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
}

/** Foreground ink for content laid directly over a coloured swatch. */
export function inkOnColor(hex: string) {
  const light = isLightColor(hex);
  return {
    strong:   light ? '#16120D' : '#FFFFFF',
    soft:     light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.62)',
    chipBg:   light ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.18)',
    chipBorder: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)',
    chipText: light ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.78)',
    overlay:  light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
    shadow:   light ? 'transparent' : 'rgba(0,0,0,0.12)',
  };
}
