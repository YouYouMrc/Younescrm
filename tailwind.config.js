/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        accent: '#323E83',
        bg: '#0D0D0D',
        surface1: '#141414',
        surface2: '#1C1C1C',
        surface3: '#242424',
        text1: '#F0F0F0',
        text2: '#888888',
        text3: '#4A4A4A',
      },
      borderColor: {
        border1: 'rgba(255,255,255,0.06)',
        border2: 'rgba(255,255,255,0.11)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
