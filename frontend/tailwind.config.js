/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neon: {
          500: '#B3FF40', // The vibrant lime green from the design
          400: '#D1FF80',
          600: '#90E61A',
        },
        dark: {
          900: '#0A0A0A', // Main background
          800: '#111111', // Card background
          700: '#1A1A1A', // Elevated panels
          600: '#2A2A2A', // Borders
        },
        primary: "#B3FF40",
        background: "#0A0A0A",
        surface: "#111111",
      }
    },
  },
  plugins: [],
}
