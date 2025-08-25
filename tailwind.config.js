/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // OLED-optimized dark theme colors
        'true-black': '#000000',
        'dark': {
          50: '#404040',
          100: '#2D2D2D',
          200: '#1A1A1A',
          300: '#141414',
          400: '#0F0F0F',
          500: '#0A0A0A',
          600: '#050505',
          700: '#020202',
          800: '#010101',
          900: '#000000',
        },
        // Neon accent colors for critical data
        'critical': '#FF0040',
        'warning': '#39FF14',
        'success': '#00D4FF',
        'info': '#8B5CF6',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      fontFamily: {
        'sans': ['Inter var', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glassmorphism': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
    },
  },
  plugins: [],
}