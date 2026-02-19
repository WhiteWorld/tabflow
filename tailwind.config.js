/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}', './*.html'],
  theme: {
    extend: {
      colors: {
        bg1: '#090B10',
        bg2: '#0F1118',
        bg3: '#161923',
        bg4: '#1D2130',
        accent: '#3EE889',
        warn: '#F5A623',
        danger: '#F45B69',
        info: '#5B9CF4',
        pri: '#EDF0F7',
        sec: '#9BA2B8',
        ter: '#5D6380',
        faint: '#3E4359',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
      },
      animation: {
        blink: 'blink 1.4s ease infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
