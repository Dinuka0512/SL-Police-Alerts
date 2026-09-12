/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        police: {
          navy: '#003366',
          blue: '#1F2937',
          primary: '#1D4ED8',
          accent: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};