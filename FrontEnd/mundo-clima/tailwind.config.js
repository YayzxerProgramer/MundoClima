/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        primary: token("primary"),
        aqua: token("aqua"),
        buy: token("buy"),
        ink: token("ink"),
        muted: token("muted"),
        surface: token("surface"),
        canvas: token("canvas"),
        line: token("line"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        display: ['"Montserrat Variable"', "Montserrat", "system-ui", "sans-serif"],
      },
      maxWidth: {
        site: "80rem",
      },
      borderRadius: {
        control: "0.625rem",
        card: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(11 35 54 / 0.04), 0 8px 24px rgb(11 35 54 / 0.06)",
        float: "0 12px 40px rgb(11 35 54 / 0.18)",
      },
    },
  },
  plugins: [],
};
