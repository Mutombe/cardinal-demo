/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          // Cardinal Properties maroon
          50: '#fbf2f2',
          100: '#f7e0e1',
          200: '#ecbfc1',
          300: '#dd969b',
          400: '#c5616a',
          500: '#a23b43',
          600: '#85222a',
          700: '#75191b',
          800: '#5a1315',
          900: '#3f0d0e',
          950: '#2a0809',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Accent layer: an electric "ion" cyan spark + a deeper azure blue.
        ion: {
          DEFAULT: '#5ee7ff',
          soft: '#7df9ff',
          deep: '#22b8d6',
        },
        // (kept the `plasma` name for the gradient's deep stop; now an azure blue, no violet)
        plasma: '#2b8fff',
        // Premium dark bands — tuned to the platform's own navy/slate scale
        // (not neutral black) so they read as THIS brand, not a foreign band.
        void: '#020617',     // slate-950 — deepest section background
        carbon: '#0f172a',   // slate-900 — standard card surface
        graphite: '#1e293b', // slate-800 — featured / form surface (raised)
        ash: '#334155',      // slate-700
        // Cardinal Properties brand surfaces (mirrors the public website)
        cream: {
          DEFAULT: '#f5f0eb',
          light: '#faf9f6',
          dark: '#e5e2dc',
        },
        sand: {
          DEFAULT: '#b4a887',
          dark: '#9a8f6e',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#333333',
          muted: '#6b6b6b',
        },
        forest: '#016630',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Editorial display face — matches the marketing site's headings
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      maxWidth: {
        content: '1240px',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
