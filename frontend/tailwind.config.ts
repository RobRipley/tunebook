import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: "#faf8f5",
          100: "#f5f0e8",
          200: "#ebe1d4",
          300: "#ddd0bc",
          400: "#c9b89e",
        },
        moss: {
          50: "#f3f6f3",
          100: "#e4ebe4",
          200: "#c9d7ca",
          300: "#a3bda5",
          400: "#7a9e7d",
          500: "#5a8260",
          600: "#46694c",
          700: "#39543e",
          800: "#304434",
          900: "#29392c",
        },
        stone: {
          50: "#f8f7f6",
          100: "#f0eeec",
          200: "#e0dcd8",
          300: "#ccc6bf",
          400: "#b0a79d",
          500: "#9a8e82",
          600: "#847769",
          700: "#6e6358",
          800: "#5c534a",
          900: "#4d463f",
          950: "#2a2522",
        },
      },
      fontFamily: {
        display: ['"Libre Baskerville"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        "card-hover": "0 2px 6px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
