/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        kantong1: '#0284c7', // Modal Putar (Biru)
        kantong2: '#16a34a', // Gaji Pemilik (Hijau)
        kantong3: '#9333ea', // Tabungan Usaha (Ungu)
      }
    },
  },
  plugins: [],
}
