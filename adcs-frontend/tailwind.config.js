/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#ed1d23",
        "background-light": "#f8f6f6",
        "background-dark": "#1f1313",
      },
      fontFamily: {
        "display": ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
}