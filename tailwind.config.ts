import type {Config} from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
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
  plugins: []
};

export default config;
