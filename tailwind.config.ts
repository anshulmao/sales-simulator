import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // Organic "blob" morph: the border-radius drifts between asymmetric
        // values while the whole shape slowly rotates — reads as liquid.
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
        // Flowing gradient: pan the oversized gradient background around.
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
