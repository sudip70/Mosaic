export const colors = {
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
} as const;

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
