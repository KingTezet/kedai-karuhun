import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        accent: {
          50: '#FFF1EC',
          100: '#FFDCCF',
          400: '#FF7A45',
          500: '#F95E1F',
          600: '#E04A0C',
          700: '#B83A08',
        },
        sale: {
          50: '#FFEDEF',
          500: '#EF3E52',
          600: '#D72C40',
        },
        // Netral (nama lama "cream" dipertahankan agar semua halaman ikut berubah)
        cream: {
          50: '#FAFAFB',
          100: '#F3F4F6',
          200: '#EBECEF',
          300: '#DCDEE3',
        },
        ink: {
          DEFAULT: '#1F2328',
          soft: '#3D434B',
          muted: '#6B7280',
          faint: '#9CA3AF',
        },
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,24,39,.04), 0 1px 6px rgba(17,24,39,.05)',
        hover: '0 6px 20px -6px rgba(17,24,39,.18)',
        pop: '0 12px 32px -10px rgba(17,24,39,.28)',
        nav: '0 -1px 10px rgba(17,24,39,.06)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-14px) scale(.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-10px) scale(.97)' },
        },
        bump: {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(.6)', opacity: '0' },
          '70%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
      },
      animation: {
        'toast-in': 'toast-in .25s ease-out both',
        'toast-out': 'toast-out .2s ease-in both',
        bump: 'bump .35s ease-out',
        pop: 'pop .3s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
        'sheet-up': 'sheet-up .25s ease-out both',
        'fade-in': 'fade-in .2s ease-out both',
        'progress-indeterminate': 'progress-indeterminate 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
