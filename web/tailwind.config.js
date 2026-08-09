/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* brand navy — the academy's primary */
        msr: {
          50: '#eef3fb', 100: '#dbe6f6', 200: '#b9cdec', 300: '#8dabdd',
          400: '#5d84c9', 500: '#3a62b0', 600: '#2a4c93', 700: '#223d76',
          800: '#1d3462', 900: '#182b50', 950: '#0f1c36'
        },
        /* saffron accent — energy, used sparingly */
        saffron: {
          50: '#fff8ea', 100: '#fdedc8', 200: '#fbd98d', 300: '#f8c052',
          400: '#f5a524', 500: '#e08700', 600: '#bb6502', 700: '#954a08',
          800: '#7b3b0d', 900: '#67310f'
        },
        /* warm neutral page plane */
        ink: {
          50: '#f7f7f5', 100: '#eeeeea', 200: '#e0e0da', 300: '#c6c6bd',
          400: '#a2a299', 500: '#83837a', 600: '#6a6a62', 700: '#454540',
          800: '#33332f', 900: '#1f1f1c'
        },
        /* data-viz + status (validated: see dataviz palette) */
        series: { 1: '#2a78d6', 2: '#eb6834' },
        good: '#0ca30c',
        warn: '#fab219',
        critical: '#d03b3b'
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter var', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        /* athletic condensed display face — site headlines and big numbers only */
        display: ['Barlow Condensed', 'Arial Narrow', 'system-ui', 'sans-serif']
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }]
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      boxShadow: {
        card: '0 1px 2px rgba(15,28,54,.05), 0 1px 3px rgba(15,28,54,.04)',
        lift: '0 4px 12px rgba(15,28,54,.08), 0 1px 3px rgba(15,28,54,.05)',
        pop: '0 16px 40px -12px rgba(15,28,54,.28)'
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        /* runner scene: lane dashes scroll past the athletes */
        ground: { '0%': { strokeDashoffset: 0 }, '100%': { strokeDashoffset: 88 } },
        /* two-frame run cycle — frame B runs the same animation delayed half a period */
        stride: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-2.5px)' } },
        streak: { '0%': { transform: 'translateX(60px)', opacity: 0 }, '12%': { opacity: .5 }, '100%': { transform: 'translateX(-360px)', opacity: 0 } }
      },
      animation: {
        'fade-up': 'fade-up .28s cubic-bezier(.22,1,.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        ground: 'ground .9s linear infinite',
        stride: 'stride .46s steps(1,end) infinite',
        bob: 'bob .46s ease-in-out infinite',
        streak: 'streak 2.1s linear infinite'
      }
    }
  },
  plugins: []
};
