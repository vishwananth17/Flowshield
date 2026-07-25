/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  'var(--gold-50)',
          100: 'var(--gold-100)',
          200: 'var(--gold-200)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: 'var(--gold-600)',
          DEFAULT: '#D4AF37',
        },
        navy: {
          50:  'var(--navy-50)',
          100: 'var(--navy-100)',
          200: 'var(--navy-200)',
          300: 'var(--navy-300)',
          400: 'var(--navy-400)',
          500: 'var(--navy-500)',
          600: 'var(--navy-600)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          DEFAULT: '#1E3A6E',
        },
        surface: {
          base:      'var(--bg-base)',
          DEFAULT:   'var(--bg-surface)',
          elevated:  'var(--bg-elevated)',
          overlay:   'var(--bg-overlay)',
          inset:     'var(--bg-inset)',
          highlight: 'var(--bg-highlight)',
        },
        content: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
          gold:      'var(--text-gold)',
        },
        border: {
          subtle:  'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)',
          gold:    'var(--border-gold)',
        },
        status: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger:  'var(--color-danger)',
          info:    'var(--color-info)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-gold': 'var(--gradient-primary)',
        'gradient-navy': 'var(--gradient-navy)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-glow': 'var(--gradient-glow)',
      },
      boxShadow: {
        'gold':  'var(--shadow-gold)',
        'navy':  'var(--shadow-navy)',
        'card':  'var(--shadow-md)',
        'modal': 'var(--shadow-xl)',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-right': 'slideRight 0.35s ease-out',
        'pulse-gold':  'pulseGold 2s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'count-up':    'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(212,175,55,0)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 8px rgba(212,175,55,0.1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
