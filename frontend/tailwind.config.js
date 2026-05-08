/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primarios ─────────────────────────────────────────────────────────
        'primary':                    '#002650',
        'primary-container':          '#1b3c69',
        'on-primary':                 '#ffffff',
        'on-primary-container':       '#8aa7db',
        'on-primary-fixed':           '#001b3c',
        'on-primary-fixed-variant':   '#284775',
        'primary-fixed':              '#d6e3ff',
        'primary-fixed-dim':          '#aac8fd',
        'inverse-primary':            '#aac8fd',
        'brand-blue':                 '#0D2B4E',
        'brand-orange':               '#E8541A',
        // ── Secundarios ───────────────────────────────────────────────────────
        'secondary':                  '#1461a2',
        'secondary-container':        '#7bb7fe',
        'secondary-fixed':            '#d2e4ff',
        'secondary-fixed-dim':        '#a0c9ff',
        'on-secondary':               '#ffffff',
        'on-secondary-container':     '#00477d',
        'on-secondary-fixed':         '#001c37',
        'on-secondary-fixed-variant': '#00487f',
        // ── Superficie ────────────────────────────────────────────────────────
        'surface':                    '#faf9f8',
        'surface-bright':             '#faf9f8',
        'surface-dim':                '#dbdad9',
        'surface-variant':            '#e3e2e1',
        'surface-container':          '#efeeed',
        'surface-container-low':      '#f4f3f2',
        'surface-container-high':     '#e9e8e7',
        'surface-container-highest':  '#e3e2e1',
        'surface-container-lowest':   '#ffffff',
        'surface-tint':               '#415f8e',
        'on-surface':                 '#1a1c1c',
        'on-surface-variant':         '#43474f',
        'inverse-surface':            '#2f3130',
        'inverse-on-surface':         '#f1f0ef',
        'background':                 '#faf9f8',
        'on-background':              '#1a1c1c',
        // ── Contornos ────────────────────────────────────────────────────────
        'outline':                    '#747780',
        'outline-variant':            '#c4c6d0',
        // ── Terciarios (acento dorado) ────────────────────────────────────────
        'tertiary':                   '#352300',
        'tertiary-container':         '#513700',
        'tertiary-fixed':             '#ffdeaa',
        'tertiary-fixed-dim':         '#f7bd54',
        'on-tertiary':                '#ffffff',
        'on-tertiary-container':      '#d39d37',
        'on-tertiary-fixed':          '#271900',
        'on-tertiary-fixed-variant':  '#5f4100',
        // ── Error ─────────────────────────────────────────────────────────────
        'error':                      '#ba1a1a',
        'error-container':            '#ffdad6',
        'on-error':                   '#ffffff',
        'on-error-container':         '#93000a',
      },
      fontFamily: {
        sans:      ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        headline:  ['"Montserrat"', 'sans-serif'],
        body:      ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        label:     ['"Montserrat"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',   // 2px  — casi cuadrado
        sm:      '0.125rem',
        md:      '0.375rem',   // 6px
        lg:      '0.25rem',    // 4px  — muy sutil
        xl:      '0.5rem',     // 8px
        '2xl':   '0.75rem',    // 12px — máximo en cards/botones
        '3xl':   '1rem',
        full:    '9999px',     // círculos reales (avatares)
        pill:    '9999px',     // alias legacy
      },
      boxShadow: {
        'ambient': '0 8px 32px rgba(26,28,28,0.05)',
        'float':   '0 4px 20px rgba(26,28,28,0.08)',
        'card':    '0 2px 8px rgba(26,28,28,0.06)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                       to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
