import type {Config} from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-general)", "var(--font-onest)", "system-ui", "sans-serif"],
        display: ["var(--font-clash)", "var(--font-onest)", "system-ui", "sans-serif"]
      },
      colors: {
        // Lime accent from the ProfileX-style CV design.
        accent: {
          DEFAULT: "#BFF747",
          soft: "rgb(191 247 71 / 0.12)"
        },
        brand: {
          50: "#eef6ff",
          100: "#d7e9ff",
          500: "#2d78ff",
          700: "#1f57b8",
          900: "#163b7c"
        }
      }
    }
  },
  plugins: [typography]
};

export default config;
