/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom neutral palette
        ink: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Accent color - warm coral/amber
        accent: {
          50: '#fef7ee',
          100: '#fdecd6',
          200: '#fad5ad',
          300: '#f6b779',
          400: '#f19143',
          500: '#ed7420',
          600: '#de5a16',
          700: '#b84315',
          800: '#933619',
          900: '#772f17',
          950: '#40150a',
        },
        // Secondary accent - sage green
        sage: {
          50: '#f6f7f6',
          100: '#e3e6e2',
          200: '#c6cdc4',
          300: '#a2ad9f',
          400: '#7d8b79',
          500: '#62705e',
          600: '#4d594a',
          700: '#40493d',
          800: '#353c33',
          900: '#2d332c',
          950: '#181b17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Source Serif Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      maxWidth: {
        '8xl': '88rem',
        'prose-lg': '75ch',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.ink.700'),
            maxWidth: '75ch',
            h1: {
              color: theme('colors.ink.900'),
              fontWeight: '700',
              fontFamily: theme('fontFamily.serif').join(', '),
            },
            h2: {
              color: theme('colors.ink.900'),
              fontWeight: '600',
              fontFamily: theme('fontFamily.serif').join(', '),
            },
            h3: {
              color: theme('colors.ink.800'),
              fontWeight: '600',
            },
            a: {
              color: theme('colors.accent.600'),
              textDecoration: 'none',
              '&:hover': {
                color: theme('colors.accent.700'),
                textDecoration: 'underline',
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.accent.400'),
              fontStyle: 'italic',
              color: theme('colors.ink.600'),
            },
            code: {
              backgroundColor: theme('colors.ink.100'),
              borderRadius: '0.25rem',
              padding: '0.125rem 0.25rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.ink.900'),
              borderRadius: '0.75rem',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.ink.300'),
            h1: { color: theme('colors.ink.100') },
            h2: { color: theme('colors.ink.100') },
            h3: { color: theme('colors.ink.200') },
            a: { color: theme('colors.accent.400') },
            blockquote: {
              borderLeftColor: theme('colors.accent.500'),
              color: theme('colors.ink.400'),
            },
            code: {
              backgroundColor: theme('colors.ink.800'),
              color: theme('colors.ink.200'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
