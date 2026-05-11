/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        accent: "#f59e0b",
        background: "#0f172a",
        surface: "#1e293b",
      }
    },
  },
  plugins: [],
}
