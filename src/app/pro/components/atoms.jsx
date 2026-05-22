"use client";

import { C } from "../lib/colors.js";
import { useInView } from "../hooks/usePageHooks.jsx";

/* Saturn coin glyph — single-color stroke. Used in TopStrip, Closer, etc. */
export function CoinMark({ size = 24, color = C.mint, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="3" stroke={color} strokeWidth="1.2" transform="rotate(-20 12 12)" />
    </svg>
  );
}

/* Animated multi-color background-clip gradient text (shimmer keyframe lives
   in pro.module.css). */
export function ShimmerText({ children, style = {} }) {
  return (
    <span className="shimmer-text" style={style}>
      {children}
    </span>
  );
}

/* Section eyebrow — mint divider line + mono label. */
export function Eyebrow({ text, color = C.mint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
      <div style={{ width: 40, height: 2, background: color, borderRadius: 1, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 13,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color,
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* Fade-up on scroll using useInView (IntersectionObserver + fallbacks). */
export function FadeUp({ delay = 0, children, style = {}, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* Inline SVG check icon. */
export function CheckIcon({ size = 12, color = C.mint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      style={{ verticalAlign: "middle", flexShrink: 0 }}
      aria-hidden="true"
    >
      <path
        d="M2.5 6.5L5 9L9.5 3.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
