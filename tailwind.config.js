/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        primaryLight: "#A78BFA",
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: "#1E293B",
        textSecondary: "#64748B",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
