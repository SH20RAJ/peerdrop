/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',  // Blue
        secondary: '#10B981', // Green
        dark: '#1F2937',
        light: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
