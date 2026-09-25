/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15131C',
        paper: '#FFFDF7',
        cream: '#F6F1E7',
        purple: {
          DEFAULT: '#7C5CFF',
          deep: '#5B3DE0',
          soft: '#C9BBFF',
        },
        coral: {
          DEFAULT: '#FF5470',
          deep: '#E23458',
          soft: '#FFC2CE',
        },
        gold: {
          DEFAULT: '#FFC94A',
          deep: '#F2A800',
          soft: '#FFE6A8',
        },
        mint: {
          DEFAULT: '#B9F178',
          deep: '#8FCB4D',
          soft: '#DFF7BE',
        },
        peach: {
          DEFAULT: '#FFB454',
          deep: '#F5903A',
          soft: '#FFDCAE',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        hardSm: '3px 3px 0 0 #15131C',
        hard: '5px 5px 0 0 #15131C',
        hardLg: '8px 8px 0 0 #15131C',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      keyframes: {
        rise: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        popIn: 'popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        wiggle: 'wiggle 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
