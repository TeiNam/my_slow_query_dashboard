/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in-out': 'fadeInOut 3s ease-in-out forwards',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'refresh-highlight': 'refreshHighlight 2s ease-in-out',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '10%': { opacity: '1', transform: 'translateY(0)' },
          '90%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        refreshHighlight: {
          '0%': { backgroundColor: 'rgba(59, 130, 246, 0)' },
          '50%': { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          '100%': { backgroundColor: 'rgba(59, 130, 246, 0)' },
        },
      },
    },
  },
  plugins: [],
};
