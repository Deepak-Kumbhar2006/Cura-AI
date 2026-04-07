/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784',
          400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C',
          800: '#2E7D32', 900: '#1B5E20',
        },
        surface: { 50: '#FAFFFE', 100: '#F1F8F2', 200: '#E8F5E9', 300: '#DCF0DE' },
        danger: { 50: '#FFF5F5', 100: '#FED7D7', 200: '#FED7D7', 300: '#FC8B8B', 400: '#FC8181', 500: '#F56565', 600: '#E53E3E', 700: '#C53030', 800: '#9B2C2C', 900: '#742A2A' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '16px', '3xl': '20px', '4xl': '24px' },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -4px rgba(0,0,0,0.02)',
        card: '0 4px 25px -5px rgba(0,0,0,0.06), 0 10px 10px -5px rgba(0,0,0,0.02)',
        elevated: '0 10px 40px -10px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)',
        glow: '0 0 20px rgba(76,175,80,0.15)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'slide-in': 'slideIn 0.3s ease-out both',
        'scale-in': 'scaleIn 0.2s ease-out both',
        'pulse-soft': 'pulseSoft 2.2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%,100%': { boxShadow: '0 0 0 0 rgba(76,175,80,0.2)' }, '50%': { boxShadow: '0 0 0 10px rgba(76,175,80,0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
};
