/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        inksoft: 'rgb(var(--c-inksoft) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        amber: 'rgb(var(--c-amber) / <alpha-value>)',
        orange: 'rgb(var(--c-orange) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        steel: '#334155',
        chrome: '#0F172A',
      },
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        sm: '0 2px 8px -2px rgba(15,23,42,0.08), 0 8px 20px -6px rgba(30,58,138,0.10)',
        DEFAULT: '0 4px 14px -4px rgba(15,23,42,0.10), 0 10px 28px -8px rgba(30,58,138,0.12)',
        md: '0 6px 20px -6px rgba(15,23,42,0.12), 0 14px 34px -10px rgba(30,58,138,0.14)',
        lg: '0 10px 28px -8px rgba(15,23,42,0.14), 0 20px 46px -12px rgba(30,58,138,0.16)',
        xl: '0 16px 40px -12px rgba(15,23,42,0.18), 0 26px 60px -14px rgba(30,58,138,0.20)',
        '2xl': '0 24px 60px -16px rgba(15,23,42,0.24), 0 34px 80px -18px rgba(30,58,138,0.24)',
      },
    },
  },
  plugins: [],
}