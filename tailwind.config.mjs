/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        foreground: '#e6e6ff',
        neon: {
          purple: '#9b5cff',
          pink: '#ff4d9d',
          cyan: '#00e5ff',
          yellow: '#ffd166',
        },
      },
      boxShadow: {
        glow: '0 0 25px rgba(155, 92, 255, 0.6), 0 0 40px rgba(0, 229, 255, 0.35)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

