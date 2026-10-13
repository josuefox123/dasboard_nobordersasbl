import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            500: "#2563EB",
            600: "#1D4ED8",
            700: "#1E40AF",
            800: "#0B3C68",
            900: "#092C4C",
            DEFAULT: "#0B3C68",
          },
          yellow: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            DEFAULT: "#F59E0B",
          },
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        noborders: {
          primary: "#0B3C68",
          "primary-content": "#FFFFFF",
          secondary: "#F59E0B",
          "secondary-content": "#0F172A",
          accent: "#0284C7",
          "accent-content": "#FFFFFF",
          neutral: "#0F172A",
          "neutral-content": "#F8FAFC",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          "base-content": "#0F172A",
          info: "#0284C7",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "9999px",
        },
      },
    ],
  },
};

export default config;
