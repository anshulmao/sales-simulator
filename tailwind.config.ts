import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#06080F",
        surface: "rgba(20,22,29,0.62)",
        "surface-2": "#14161D",
        line: "#252A36",
        ink: "#EDEFF4",
        muted: "#8A90A0",
        primary: "#2563EB",
        secondary: "#06B6D4",
        violet: "#7C5CFF",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "blob-morph": {
          "0%, 100%": {
            borderRadius: "42% 58% 63% 37% / 45% 42% 58% 55%",
            rotate: "0deg",
          },
          "33%": {
            borderRadius: "63% 37% 42% 58% / 58% 55% 45% 42%",
            rotate: "8deg",
          },
          "66%": {
            borderRadius: "37% 63% 58% 42% / 42% 58% 55% 45%",
            rotate: "-6deg",
          },
        },
        "gradient-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "ambient-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
      },
      animation: {
        "blob-morph": "blob-morph 9s ease-in-out infinite",
        "gradient-flow": "gradient-flow 6s ease infinite",
        "ambient-pulse": "ambient-pulse 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
