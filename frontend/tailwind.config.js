/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron:   { DEFAULT: '#e85d04', light: '#fb8500', dark: '#c04b00' },
        turmeric:  { DEFAULT: '#ffd166', light: '#ffe0a0', dark: '#e6b800' },
        forest:    { DEFAULT: '#1b4332', light: '#2d6a4f', dark: '#0f2a1e' },
        cream:     { DEFAULT: '#fff8f0', dark: '#f5e6d0' },
        charcoal:  { DEFAULT: '#1a1a2e', light: '#2d2d44' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        warm: '0 4px 24px rgba(232, 93, 4, 0.15)',
        card: '0 2px 16px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                 to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
    },
  },
  plugins: [],
};
