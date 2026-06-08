/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0b0f19",
          card: "#161d30",
          accent: "#4f46e5",
          highlight: "#818cf8",
          success: "#10b981",
          danger: "#ef4444",
          warning: "#f59e0b",
          border: "#1e293b"
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(79, 70, 229, 0.15)",
        cardGlow: "0 0 15px rgba(79, 70, 229, 0.08)",
        successGlow: "0 0 15px rgba(16, 185, 129, 0.15)"
      }
    },
  },
  plugins: [],
}
