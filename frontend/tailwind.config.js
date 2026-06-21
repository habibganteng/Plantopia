/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        ink: "#0B2A22",
        moss: "#15493A",
        gold: "#E8B95B",
        coral: "#FF8B6B",
        cream: "#FAF3E6",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        breathe: { "0%,100%": { transform: "scale(1)", opacity: "0.55" }, "50%": { transform: "scale(1.15)", opacity: "0.9" } },
        float: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease-out",
        breathe: "breathe 3.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}