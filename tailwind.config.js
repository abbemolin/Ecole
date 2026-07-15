/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:   { DEFAULT: '#1a1814', 50: '#f8f7f4', 100: '#edeae3', 200: '#d8d3c8', 300: '#b8b0a0', 400: '#8c8070', 500: '#6b5f50', 600: '#4a3f32' },
        gold:  { DEFAULT: '#b8973a', 50: '#fdf9ec', 100: '#f7edcc', 200: '#edda96', 300: '#dfc25e', 400: '#c9a53a', DEFAULT: '#b8973a', 600: '#9a7a28' },
        chapel:{ DEFAULT: '#1e3058', light: '#2a4480', muted: '#e8edf5' },
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        card: '0 1px 3px rgba(26,24,20,0.06), 0 1px 2px rgba(26,24,20,0.04)',
        hover: '0 4px 12px rgba(26,24,20,0.10)',
      }
    },
  },
  plugins: [],
}
