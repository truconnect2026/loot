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
      },
    },
  },
  plugins: [],
};

export default config;
