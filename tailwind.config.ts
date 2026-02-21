import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#86E3E3",
        "primary-light": "#B8F0F0",
        "primary-dark": "#5CCECE",
        gold: "#E6D08E",
        "gold-light": "#F5E9BB",
        pink: "#FAA2EE",
        "pink-light": "#FDCFF7",
        surface: "#F6FAFA",
        "dark-bg": "#1C1C1E",
        "dark-card": "#2C2C2E",
      },
      backgroundImage: {
        "hero-light": "linear-gradient(180deg, #FFFFFF 0%, #F0FAFA 100%)",
        "hero-dark": "radial-gradient(ellipse at top, #1C1C1E 0%, #111113 100%)",
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
