/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface:    '#0A0D1A',       // fondo principal
        card:       '#111527',       // cards
        card2:      '#161B30',       // cards secundarias
        line:       '#1E2440',       // bordes
        muted:      '#8B92A9',       // texto secundario
        primary:    '#7B5CF0',       // violeta CTA
        'primary-dark': '#6347d4',
        teal:       '#00D4B4',       // acento teal
        ink:        '#1C1C1E',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
      },
      boxShadow: {
        'glow-teal':   '0 0 80px 20px rgba(0,212,180,0.12)',
        'glow-purple': '0 0 40px 10px rgba(123,92,240,0.2)',
        card:          '0 2px 8px rgba(0,0,0,0.3)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
