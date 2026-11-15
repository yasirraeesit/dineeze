/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        sidebar: "#0F172A",
        accent: {
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#D1FAE5",
          dark: "#065F46",
        },
        tenant: "var(--tenant-accent, #10B981)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "-apple-system", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

