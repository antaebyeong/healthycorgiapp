import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        corgi: {
          cream: "#F8FAFF",
          tan: "#E5E7EB",
          brown: "#3182F6",
          mint: "#DCFCE7",
          ink: "#111827"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(49, 130, 246, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
