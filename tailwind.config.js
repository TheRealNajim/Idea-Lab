/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#070a0f',
        panel: '#0d121b',
        acid: '#b8f34a',
        cyan: '#3ee8ff',
        violet: '#9b7bff',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(184, 243, 74, 0.2)',
      },
    },
  },
  plugins: [],
}
