/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'selector', // Changed from 'class' to 'selector' for v4
  theme: {
    extend: {},
  },
  plugins: [],
}