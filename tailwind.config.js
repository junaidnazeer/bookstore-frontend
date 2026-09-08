/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spine: "#1E3D32",
        brass: "#A6791F",
        ink: "#1B1B1B",
        paper: "#FAF9F6",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Work Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
