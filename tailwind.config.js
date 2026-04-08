/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          500: '#4169e1',
          600: '#3355c8',
          700: '#2844a8',
        },
      },
    },
  },
  plugins: [],
}

