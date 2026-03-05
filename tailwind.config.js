/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#F0EDFF", 100: "#D5CEF7", 500: "#6C5CE7", 600: "#5A4BD1", 700: "#4839B5" },
        success: { 50: "#E8F5E9", 500: "#27AE60" },
        warning: { 50: "#FFF8E1", 500: "#F39C12" },
        danger: { 50: "#FFEBEE", 500: "#E74C3C" },
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["Nanum Myeongjo", "Batang", "serif"],
      },
    },
  },
  plugins: [],
};
