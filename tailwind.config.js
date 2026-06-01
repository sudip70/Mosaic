/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas:   '#F4EFE6',
        surface0: '#FEFCF8',
        surface1: '#F0EAE0',
        surface2: '#E8E1D6',
        ink100:   '#1A1714',
        ink60:    '#7A736C',
        ink30:    '#B8B0A6',
        ink15:    '#DDD8D0',
        accent:   '#C4604A',
        'accent-soft': '#F7EDE9',
      },
      fontFamily: {
        serif:   ['Fraunces_300Light_Italic'],
        serifR:  ['Fraunces_400Regular_Italic'],
        sans:    ['DMSans_400Regular'],
        sansMd:  ['DMSans_500Medium'],
        sansSb:  ['DMSans_600SemiBold'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        '5xl': '32px',
      },
    },
  },
  plugins: [],
};
