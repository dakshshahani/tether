import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
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
        "slide-in-left": {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        "slide-out-left": {
          "0%": {
            transform: "translateX(0)",
            opacity: "1",
          },
          "100%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
        },
        "fade-in-backdrop": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-left": "slide-in-left 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-left": "slide-out-left 200ms ease-in",
        "fade-in-backdrop": "fade-in-backdrop 200ms ease-out",
      },
    },
  },
  plugins: [
    plugin(function ({ addBase, addComponents, theme }) {
      addBase({
        ":root": {
          "--background": "0 0% 98%",
          "--foreground": "0 0% 8%",
          "--card": "0 0% 100%",
          "--card-foreground": "0 0% 8%",
          "--muted": "0 0% 95%",
          "--muted-foreground": "0 0% 45%",
          "--accent": "210 40% 96%",
          "--accent-foreground": "0 0% 8%",
          "--border": "0 0% 88%",
        },
        ".dark": {
          "--background": "222 47% 11%",
          "--foreground": "210 40% 98%",
          "--card": "222 47% 15%",
          "--card-foreground": "210 40% 98%",
          "--muted": "217 33% 17%",
          "--muted-foreground": "215 20% 65%",
          "--accent": "217 33% 20%",
          "--accent-foreground": "210 40% 98%",
          "--border": "217 33% 24%",
        },
        "*": {
          "box-sizing": "border-box",
        },
        body: {
          margin: "0",
          padding: "0",
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          fontFamily: theme("fontFamily.sans"),
          "-webkit-font-smoothing": "antialiased",
          "-moz-osx-font-smoothing": "grayscale",
        },
        "body::before": {
          content: '""',
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground) / 0.01) 2px, hsl(var(--foreground) / 0.01) 3px)",
          pointerEvents: "none",
          zIndex: "1",
        },
        "body > *": {
          position: "relative",
          zIndex: "2",
        },
      });
      addComponents({
        ".prose": {
          color: "hsl(var(--foreground))",
          lineHeight: "1.7",
          fontSize: "16px",
        },
        ".prose h1": {
          fontSize: "2em",
          fontWeight: "700",
          margin: "1.5rem 0 1rem",
          lineHeight: "1.2",
          color: "hsl(var(--foreground))",
          textShadow: "0 1px 2px hsl(var(--foreground) / 0.1)",
        },
        ".prose h2": {
          fontSize: "1.5em",
          fontWeight: "600",
          margin: "1.25rem 0 0.75rem",
          lineHeight: "1.3",
          color: "hsl(var(--foreground))",
        },
        ".prose h3": {
          fontSize: "1.25em",
          fontWeight: "600",
          margin: "1rem 0 0.5rem",
          lineHeight: "1.4",
        },
        ".prose p": {
          margin: "0.75rem 0",
        },
        ".prose ul, .prose ol": {
          margin: "1rem 0",
          paddingLeft: "1.75rem",
          lineHeight: "1.75",
        },
        ".prose ul": {
          listStyleType: "disc",
        },
        ".prose ul ul": {
          listStyleType: "circle",
          margin: "0.5rem 0",
        },
        ".prose ul ul ul": {
          listStyleType: "square",
        },
        ".prose ol": {
          listStyleType: "decimal",
        },
        ".prose ol ol": {
          listStyleType: "lower-alpha",
          margin: "0.5rem 0",
        },
        ".prose ol ol ol": {
          listStyleType: "lower-roman",
        },
        ".prose li": {
          margin: "0.5rem 0",
          paddingLeft: "0.5rem",
        },
        ".prose li > p": {
          margin: "0.25rem 0",
        },
        ".prose li::marker": {
          color: "hsl(var(--muted-foreground))",
          fontWeight: "600",
        },
        '.prose input[type="checkbox"]': {
          marginRight: "0.5rem",
          width: "1.1em",
          height: "1.1em",
          cursor: "pointer",
          borderRadius: "3px",
          border: "2px solid hsl(var(--border))",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          background: "hsl(var(--card))",
          position: "relative",
          top: "0.15em",
          transition: "all 0.15s ease",
        },
        '.prose input[type="checkbox"]:checked': {
          background: "hsl(var(--accent))",
          borderColor: "hsl(var(--accent-foreground))",
        },
        '.prose input[type="checkbox"]:checked::after': {
          content: '"✓"',
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "hsl(var(--accent-foreground))",
          fontSize: "0.85em",
          fontWeight: "bold",
        },
        ".prose pre": {
          background: "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          padding: "1rem",
          overflowX: "auto",
          fontFamily: theme("fontFamily.mono"),
          fontSize: "14px",
          lineHeight: "1.6",
          margin: "1rem 0",
          boxShadow:
            "inset 0 2px 4px hsl(var(--foreground) / 0.05), 0 1px 2px hsl(var(--foreground) / 0.05)",
        },
        ".prose code": {
          fontFamily: theme("fontFamily.mono"),
          fontSize: "0.9em",
        },
        ".prose :not(pre) > code": {
          background: "hsl(var(--muted))",
          padding: "0.2em 0.4em",
          borderRadius: "4px",
          border: "1px solid hsl(var(--border))",
          boxShadow: "inset 0 1px 2px hsl(var(--foreground) / 0.05)",
        },
        ".prose blockquote": {
          borderLeft: "4px solid hsl(var(--accent))",
          paddingLeft: "1rem",
          margin: "1rem 0",
          color: "hsl(var(--muted-foreground))",
          fontStyle: "italic",
          background: "hsl(var(--accent) / 0.3)",
          padding: "0.75rem 1rem",
          borderRadius: "0 6px 6px 0",
          boxShadow:
            "inset 4px 0 0 hsl(var(--accent)), inset 0 1px 2px hsl(var(--foreground) / 0.03)",
        },
        ".prose a": {
          color: "hsl(var(--foreground))",
          textDecoration: "underline",
          textDecorationColor: "hsl(var(--muted-foreground))",
          textUnderlineOffset: "2px",
          transition: "all 0.2s",
        },
        ".prose a:hover": {
          textDecorationColor: "hsl(var(--foreground))",
          textShadow: "0 0 8px hsl(var(--accent))",
        },
        ".prose img": {
          maxWidth: "100%",
          borderRadius: "8px",
          margin: "1rem 0",
          boxShadow:
            "0 4px 12px hsl(var(--foreground) / 0.1), 0 2px 4px hsl(var(--foreground) / 0.06)",
        },
        ".prose hr": {
          border: "0",
          height: "1px",
          background:
            "linear-gradient(to right, transparent, hsl(var(--border)), transparent)",
          margin: "2rem 0",
        },
        ".prose table": {
          width: "100%",
          borderCollapse: "collapse",
          margin: "1rem 0",
          boxShadow: "0 2px 8px hsl(var(--foreground) / 0.05)",
          borderRadius: "8px",
          overflow: "hidden",
        },
        ".prose th, .prose td": {
          border: "1px solid hsl(var(--border))",
          padding: "0.75rem",
          textAlign: "left",
        },
        ".prose th": {
          background: "hsl(var(--muted))",
          fontWeight: "600",
          textTransform: "uppercase",
          fontSize: "0.85em",
          letterSpacing: "0.05em",
          boxShadow: "inset 0 -1px 0 hsl(var(--border))",
        },
        ".katex": {
          fontSize: "1.1em",
        },
        ".katex-display": {
          margin: "1.5rem 0",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "0.5rem",
        },
        ".dark .katex": {
          color: "hsl(var(--foreground))",
        },
        ".dark .katex .mord": {
          color: "hsl(var(--foreground))",
        },
        ".dark .katex .mopen, .dark .katex .mclose, .dark .katex .mbin, .dark .katex .mrel, .dark .katex .mop, .dark .katex .mpunct":
          {
            color: "hsl(var(--muted-foreground))",
          },
        ".dark .katex .base": {
          color: "hsl(var(--foreground))",
        },
      });
    }),
  ],
} satisfies Config;
