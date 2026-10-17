import type { Config } from 'tailwindcss';
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    emerald: { DEFAULT: '#0A4A30', 700: '#0A4A30', 600: '#0F6140', 100: '#DCEBE3' },
    gold: { DEFAULT: '#C9962F', light: '#F0D27A' },
    cream: '#FBF8F0' },
    fontFamily: { sans: ['var(--font-inter)', 'sans-serif'], urdu: ['var(--font-urdu)', 'serif'], arabic: ['var(--font-arabic)', 'serif'] } } },
  plugins: [],
} satisfies Config;
