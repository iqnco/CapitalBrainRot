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
        sans: ['"Barlow Condensed"', '"Rajdhani"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        r6: {
          bg:      '#05050a',
          deep:    '#08080f',
          panel:   '#0d0d14',
          card:    '#111118',
          border:  '#242432',
          orange:  '#f7941d',
          amber:   '#c4751a',
          red:     '#e8001a',
          text:    '#e8eaf2',
          muted:   '#6b7090',
          green:   '#22c55e',
          danger:  '#ef4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
