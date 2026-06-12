import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Maersk Design palette (Tailwind replica — no @maersk-global dependency)
        maersk: {
          blue: '#42b0d5',
          'blue-deep': '#00a3e0',
          steel: '#b0c4d8',
          slate: '#6b7b8d',
          amber: '#f0b429',
          ink: '#141b25',
          surface: '#f0f4f8',
        },
        // Primary scale aliased to Maersk Blue
        primary: {
          DEFAULT: '#42b0d5',
          50: '#eef8fc',
          100: '#d6eef7',
          200: '#aaddee',
          300: '#79c8e2',
          400: '#42b0d5',
          500: '#2496bd',
          600: '#1f7ea1',
          700: '#1d6582',
          800: '#1e526a',
          900: '#1d4459',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        mds: '0.5rem',
      },
      boxShadow: {
        mds: '0 1px 2px 0 rgba(20, 27, 37, 0.04), 0 4px 12px -2px rgba(20, 27, 37, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
