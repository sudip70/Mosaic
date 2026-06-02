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
  accentSoft: string;
  accent08: string;
  accent15: string;
  accent30: string;
}

export const lightColors: Palette = {
  canvas:      '#F4EFE6',
  surface0:    '#FEFCF8',
  surface1:    '#F0EAE0',
  surface2:    '#E8E1D6',
  ink100:      '#1A1714',
  ink60:       '#7A736C',
  ink30:       '#B8B0A6',
  ink15:       '#DDD8D0',
  accent:      '#C4604A',
  accentSoft:  '#F7EDE9',
  accent08:    'rgba(196,96,74,0.08)',
  accent15:    'rgba(196,96,74,0.15)',
  accent30:    'rgba(196,96,74,0.30)',
};

export const darkColors: Palette = {
  canvas:      '#141110',
  surface0:    '#1F1B17',
  surface1:    '#272019',
  surface2:    '#322A22',
  ink100:      '#F4EFE6',
  ink60:       '#A9A199',
  ink30:       '#6E665E',
  ink15:       '#39322B',
  accent:      '#D2735A',
  accentSoft:  '#2A1E19',
  accent08:    'rgba(210,115,90,0.10)',
  accent15:    'rgba(210,115,90,0.18)',
  accent30:    'rgba(210,115,90,0.32)',
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
  serif:  'Fraunces_300Light_Italic',
  serifR: 'Fraunces_400Regular_Italic',
  sans:   'DMSans_400Regular',
  sansMd: 'DMSans_500Medium',
  sansSb: 'DMSans_600SemiBold',
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
  hero:      { fontFamily: fonts.serif,  fontSize: 54, lineHeight: 52, letterSpacing: -1 },
  display:   { fontFamily: fonts.serifR, fontSize: 38, lineHeight: 38, letterSpacing: -1.2 },
  serifLg:   { fontFamily: fonts.serifR, fontSize: 30, lineHeight: 30, letterSpacing: -0.6 },
  wordmark:  { fontFamily: fonts.serifR, fontSize: 24, lineHeight: 24, letterSpacing: -0.3 },
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
