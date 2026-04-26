import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Fredoka One"', '"Nunito"', 'sans-serif'],
        mono: ['"Nunito"', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        r6: {
          bg:      '#FFF9F0',
          deep:    '#FFF0E0',
          panel:   '#FFF5EE',
          card:    '#FFFFFF',
          border:  '#E0CCB0',
          orange:  '#008C45',   // Italian green (primary action)
          amber:   '#006030',   // dark green
          red:     '#CE2B37',   // Italian red
          text:    '#1A1A2E',
          muted:   '#7A7A8C',
          green:   '#22c55e',
          danger:  '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
