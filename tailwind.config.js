/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}', './*.html'],
  theme: {
    extend: {
      colors: {
        bg0: '#080A0F',
        bg1: '#111520',
        bg2: '#181E2B',
        bg3: '#1F2737',
        bg4: '#2C3347',
        accent: '#3CE882',
        'accent-dim': 'rgba(60,232,130,0.12)',
        'accent-faint': 'rgba(60,232,130,0.06)',
        warn: '#F0A030',
        'warn-dim': 'rgba(240,160,48,0.15)',
        danger: '#E8455A',
        'danger-dim': 'rgba(232,69,90,0.15)',
        info: '#5090F0',
        'info-dim': 'rgba(80,144,240,0.15)',
        pri: '#F0F6FF',
        sec: '#C8D3EE',
        ter: '#8892B0',
        faint: '#5C6882',
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
