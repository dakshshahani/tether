import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f7f1e7",
        "bg-deep": "#eadfce",
        surface: "#fffaf2",
        "surface-strong": "#f6ecdd",
        ink: "#172436",
        "ink-soft": "#45576d",
        line: "#d5c3aa",
        accent: "#193044",
        "accent-soft": "#f6b74a",
        error: "#b53a38",
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "serif"],
        "ibm-plex-mono": ["var(--font-ibm-plex-mono)", "monospace"],
      },
      keyframes: {
        "vault-fade": {
          "0%": {
            opacity: "0",
            transform: "translateY(5px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "vault-fade": "vault-fade 200ms ease-out",
      },
    },
  },
} satisfies Config;
