import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-page": "var(--bg-page)",
        "bg-surface": "var(--bg-surface)",
        "bg-recessed": "var(--bg-recessed)",
        "border-default": "var(--border-default)",
        "border-subtle": "var(--border-subtle)",
        "border-dim": "var(--border-dim)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "text-dim": "var(--text-dim)",
        "accent-mint": "var(--accent-mint)",
        "accent-camel": "var(--accent-camel)",
        "accent-red": "var(--accent-red)",
        "accent-blue": "var(--accent-blue)",
        "accent-mint-surface": "var(--accent-mint-surface)",
        "accent-mint-border": "var(--accent-mint-border)",
        "accent-camel-surface": "var(--accent-camel-surface)",
        "accent-camel-border": "var(--accent-camel-border)",
        "accent-red-surface": "var(--accent-red-surface)",
        "accent-red-border": "var(--accent-red-border)",
        "press-bg": "var(--press-bg)",
      },
      borderRadius: {
        "asymmetric": "4px 14px 14px 14px",
        "standard": "14px",
        "small": "6px",
        "stats": "10px",
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        jetbrains: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "profit-glow": "var(--profit-glow)",
        "inner-line": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
        "card":
          "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -4px rgba(0,0,0,0.3)",
        "card-hover":
          "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 12px 40px -4px rgba(0,0,0,0.5)",
        "glow-mint":
          "0 0 0 1px rgba(92,224,184,0.20), 0 0 24px -4px rgba(92,224,184,0.35), 0 0 60px -8px rgba(92,224,184,0.15)",
        "glow-camel":
          "0 0 0 1px rgba(212,165,116,0.20), 0 0 24px -4px rgba(212,165,116,0.35), 0 0 60px -8px rgba(212,165,116,0.15)",
        "trough": "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ios": "cubic-bezier(0.32, 0.72, 0, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
