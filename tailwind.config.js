/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        surface: {
          DEFAULT: '#0f172a',
          card:    '#1e293b',
          border:  '#334155',
          muted:   '#475569',
        },
        status: {
          safe:      '#4ade80',
          tight:     '#fb923c',
          at_risk:   '#f87171',
          boarding:  '#a78bfa',
        },
      },
      fontFamily: {
        sans:     ['Inter-Regular'],
        medium:   ['Inter-Medium'],
        semibold: ['Inter-SemiBold'],
        bold:     ['Inter-Bold'],
      },
    },
  },
  plugins: [],
};
