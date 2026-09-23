/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Pioneer Health palette — clinical teal primary, clean neutrals.
        brand: {
          50: '#eefdf6',
          100: '#d6f8e8',
          200: '#b0efd4',
          300: '#7ce0ba',
          400: '#43c99a',
          500: '#1fae82',
          600: '#128c69',
          700: '#0f7056',
          800: '#105945',
          900: '#0e493a',
        },
        ink: {
          DEFAULT: '#0f172a',
          soft: '#475569',
          faint: '#94a3b8',
        },
        canvas: '#f6f8fa',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 12px 32px -12px rgba(15,23,42,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
