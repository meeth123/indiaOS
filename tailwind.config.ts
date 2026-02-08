import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Space Mono'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        yellow: "#FFE566",
        pink: "#FF69B4",
        green: "#90EE90",
        purple: "#B388FF",
        black: "#1a1a1a",
        offwhite: "#FAFAFA",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #1a1a1a",
        "brutal-lg": "6px 6px 0px 0px #1a1a1a",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;
