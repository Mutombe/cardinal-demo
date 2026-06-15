/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cardinal Properties — verified from their live brand system.
        maroon: {
          DEFAULT: '#75191b',
          dark: '#5a1315',
          deep: '#3f0d0e',
        },
        sand: {
          DEFAULT: '#b4a887',
          dark: '#9a8f6e',
        },
        cream: {
          DEFAULT: '#f5f0eb',
          light: '#faf9f6',
          dark: '#e5e2dc',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#333333',
          muted: '#6b6b6b',
        },
        // Silverbrook sub-brand (its green/blue leaf logo).
        forest: '#016630',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Display/accent face for names + short labels (no periods — demo watermark).
        sande: ['SandeMore', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      maxWidth: {
        content: '1240px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
        bob: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(6px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 1.2s ease-out both',
        'ken-burns': 'ken-burns 18s ease-out both',
        bob: 'bob 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
