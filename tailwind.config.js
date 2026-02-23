/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#020617",
        neonPurple: "#a855f7",
        neonPink: "#ec4899",
      },
    },
  },
  plugins: [],
}