import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#0c0c0e", rack: "#161619", line: "#26262b", accent: "#FF6B2B" } } },
  plugins: [],
} satisfies Config;
