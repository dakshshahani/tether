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
        border: "hsl(0 0% 89%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(0 0% 9%)",
        muted: "hsl(0 0% 96%)",
        "muted-foreground": "hsl(0 0% 45%)",
        accent: "hsl(0 0% 96%)",
        "accent-foreground": "hsl(0 0% 9%)",
      },
      fontFamily: {
        sans: ["var(--font-fraunces)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(0)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in": "slide-in 300ms ease-out",
      },
    },
  },
} satisfies Config;
