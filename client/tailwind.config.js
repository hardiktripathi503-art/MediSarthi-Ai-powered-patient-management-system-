/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#060910',
          900: '#0B0F19',
          850: '#0F1523',
          800: '#141D2F',
          700: '#1E2B45',
          600: '#2E3F63',
        },
        ayush: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        cyber: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          teal: '#14b8a6',
          violet: '#8b5cf6',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
        clinical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        emergency: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.4), 0 0 10px -2px rgba(16, 185, 129, 0.2)',
        'neon-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.4), 0 0 10px -2px rgba(6, 182, 212, 0.2)',
        'neon-rose': '0 0 25px -3px rgba(244, 63, 94, 0.5), 0 0 10px -2px rgba(244, 63, 94, 0.3)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        wave: {
          '0%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(2.2)' },
          '100%': { transform: 'scaleY(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sound-wave': 'wave 1s ease-in-out infinite',
        'float-slow': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      }
    },
  },
  plugins: [],
}
