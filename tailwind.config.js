/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        elevated: token('elevated'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-soft': token('accent-soft'),
        danger: token('danger'),
        'danger-bg': token('danger-bg'),
        'danger-line': token('danger-line'),
        warn: token('warn'),
        'warn-bg': token('warn-bg'),
        'warn-line': token('warn-line'),
        safe: token('safe'),
        'safe-bg': token('safe-bg'),
        'safe-line': token('safe-line'),
        flash: '#10B981',
        cyanbit: token('netbit'),
        hostbit: token('hostbit'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--c-accent) / 0.35), 0 8px 30px -12px rgb(var(--c-accent) / 0.55)',
        card: '0 1px 0 0 rgb(255 255 255 / 0.03) inset, 0 10px 30px -18px rgb(0 0 0 / 0.6)',
        flash: '0 0 0 1px #10B981, 0 0 24px -6px rgb(16 185 129 / 0.7)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.85)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'pulse-dot': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
        scan: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'pop-in': 'pop-in 160ms ease-out both',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        scan: 'scan 2.8s linear infinite',
      },
    },
  },
  plugins: [],
};
