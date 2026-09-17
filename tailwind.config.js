/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Spacing: spec restricts scale to 4/8/12/16/24/32/48/64.
      // Tailwind's default p-1..p-16 already maps to this scale
      // (1=4px,2=8px,3=12px,4=16px,6=24px,8=32px,12=48px,16=64px) — use only those steps.
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn .28s ease',
        'pulse-slow': 'pulseSlow 1.1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.6)', opacity: 0.35 },
        },
      },
    },
  },
  plugins: [],
};
