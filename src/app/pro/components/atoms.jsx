"use client";

import { useState } from "react";
import { C } from "../lib/colors.js";
import { useInView, usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/* Saturn coin glyph — single-color stroke. Used in TopStrip, Closer, etc. */
export function CoinMark({ size = 24, color = C.mint, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="3" stroke={color} strokeWidth="1.2" transform="rotate(-20 12 12)" />
    </svg>
  );
}

/* Small, consistent "this is an illustration, not a real report/earning"
   tag for demo clusters — so no fabricated number can be mistaken for a
   real eBay report or an income promise. Mono, dim, on-brand. */
export function ExampleTag({ label = "EXAMPLE", style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 4,
        padding: "2px 6px",
        lineHeight: 1,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      {label}
    </span>
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

/* Shared sizing for every NON-hero section — one consistent ramp instead
   of each component hand-picking its own clamp(). Hero keeps its own
   (much bigger) scale; it's excepted by design. */
export const SECTION_PADDING = "clamp(48px,6.5vw,80px) 24px";
export const SECTION_HEADLINE_SIZE = "clamp(42px,7.5vw,84px)";
/* THE one H2 spec — every non-hero section headline spreads this so
   face/size/tracking/line-height cannot drift per section again.
   (Hero keeps its own display scale + the max-height:700px
   compressed variants from pro-hero-* classes.) */
export const SECTION_HEADLINE_STYLE = {
  fontFamily: "var(--font-bebas), sans-serif",
  fontSize: SECTION_HEADLINE_SIZE,
  lineHeight: 1.12,
  letterSpacing: "0.01em",
};
export const SECTION_BODY_SIZE = "clamp(16px,2vw,18px)";

/* One shared outer shell for every snap section's content — same centered
   column, same box-sizing. Vertical centering itself lives on the
   .pro-snap-section class (see pro.module.css); sections whose content
   genuinely exceeds one viewport override that to flex-start inline so
   they top-align and scroll internally instead of center-forcing. */
export function SectionShell({ children, maxWidth = 640, style = {} }) {
  return (
    <div style={{ width: "100%", maxWidth, margin: "0 auto", boxSizing: "border-box", ...style }}>
      {children}
    </div>
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

/* Reveal — THE shared scroll-reveal primitive for the page. Child fades
   and rises 12px over 450ms on one shared ease when it enters the
   viewport; `delay` (seconds) staggers eyebrow → headline → body at
   each call site. Fires ONCE per page load and does not re-fire on
   re-entry: with mandatory snap, sections re-enter on every scroll
   pass, and re-firing would blink content each time. Reduced motion
   renders children immediately with no transition (and useInView's
   observer is the only "timer"-ish machinery — no setTimeout/RAF). */
export function Reveal({ delay = 0, children, style = {}, className = "" }) {
  const [ref, inView] = useInView();
  const reduced = usePrefersReducedMotion();
  const shown = reduced || inView;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(12px)",
        transition: reduced
          ? "none"
          : `opacity 450ms cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 450ms cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* FadeUp — legacy name every section already wraps its eyebrow/headline/
   body in. Delegates to Reveal so the whole page shares one reveal
   treatment without touching any section component's internals. */
export function FadeUp(props) {
  return <Reveal {...props} />;
}

/* One button system, reused for every CTA on the page (CLAIM PRO, CLAIM
   PRO NOW, CLAIM ANNUAL, START MONTHLY). Fit-to-label, not full-width;
   "primary" = mint-gradient fill for the recommended action, "outline" =
   mint-bordered ghost for the secondary one. Hover/press state lives here
   (JS + inline style) rather than in CSS so there's a single source of
   truth for how every CTA looks and feels. Transform/opacity only. */
export function CTAButton({
  children,
  onClick,
  variant = "primary",
  type = "button",
  style = {},
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === "primary";
  const active = hovered || pressed;

  return (
    <button
      type={type}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "fit-content",
        maxWidth: "100%",
        alignSelf: "center",
        fontFamily: "var(--font-bebas), sans-serif",
        fontSize: 18,
        fontWeight: 400,
        letterSpacing: "0.04em", // Bebas sub-32px optical tracking
        padding: "14px 30px",
        borderRadius: 13,
        cursor: "pointer",
        color: isPrimary ? C.bg : C.mint,
        background: isPrimary
          ? "linear-gradient(180deg, #6FE5C0 0%, #4FD1A5 100%)"
          : hovered
            ? "rgba(92,224,184,0.08)"
            : "transparent",
        border: isPrimary ? "none" : `1.5px solid ${C.mint}`,
        boxShadow: isPrimary
          ? pressed
            ? "0 2px 10px rgba(92,224,184,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
            : "0 6px 22px rgba(92,224,184,0.3), inset 0 1px 0 rgba(255,255,255,0.28)"
          : "none",
        transform: pressed ? "translateY(0) scale(0.98)" : hovered ? "translateY(-1px)" : "translateY(0) scale(1)",
        transition: "transform 0.15s cubic-bezier(0.16,1,0.3,1), box-shadow 0.15s ease-out, background 0.15s ease-out",
        ...style,
      }}
    >
      <span>{children}</span>
      <span aria-hidden="true" style={{ fontSize: "0.7em", lineHeight: 1 }}>
        &rarr;
      </span>
    </button>
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
