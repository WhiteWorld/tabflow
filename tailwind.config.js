/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}', './*.html'],
  theme: {
    extend: {
      colors: {
        bg0: '#080A0F',
        bg1: '#0E1117',
        bg2: '#151921',
        bg3: '#1C2230',
        bg4: '#252B3C',
        accent: '#3CE882',
        'accent-dim': 'rgba(60,232,130,0.12)',
        'accent-faint': 'rgba(60,232,130,0.06)',
        warn: '#F0A030',
        'warn-dim': 'rgba(240,160,48,0.12)',
        danger: '#E8455A',
        'danger-dim': 'rgba(232,69,90,0.12)',
        info: '#5090F0',
        'info-dim': 'rgba(80,144,240,0.12)',
        pri: '#EAF0FA',
        sec: '#9AA4BD',
        ter: '#5C6482',
        faint: '#3C4360',
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '9px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
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
