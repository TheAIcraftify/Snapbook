import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SnapBook brand — warm amber (shutter/flash) + deep charcoal (premium, cinematic)
        brand: {
          50: "#fff8ed",
          100: "#ffefd1",
          200: "#ffdba3",
          300: "#ffc26a",
          400: "#ffa030",
          500: "#fb7f0c",
          600: "#ec6206",
          700: "#c34808",
          800: "#9b390f",
          900: "#7d3010",
        },
        ink: {
          50: "#f6f6f7",
          100: "#e2e3e6",
          200: "#c5c7cc",
          300: "#9a9da6",
          400: "#6b6f7a",
          500: "#4a4e58",
          600: "#363943",
          700: "#282a33",
          800: "#1a1b21",
          900: "#0e0f13",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 20px -4px rgba(14, 15, 19, 0.08)",
        "card-hover": "0 8px 30px -6px rgba(14, 15, 19, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
