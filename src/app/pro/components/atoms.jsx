"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
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

/* THE EXAMPLE SIGNATURE — one deliberate, on-brand treatment applied
   identically to every demo cluster (Pyrex verdict, shelf value, arsenal
   comps, haul, math). Mint-tinted (the brand's trust color) with a leading
   dot so it reads as an intentional design signature — "this is a live
   demonstration" — not an apologetic disclaimer sticker. Consistency IS the
   honesty: a skeptic learns the mark, then trusts that anything WITHOUT it
   is a real claim. Used on VerdictCardLive, ShelfScannerDemo, FeatureMatrix,
   ROICalculator, AuthCheckDemo. */
export function ExampleTag({ label = "EXAMPLE", style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(92,224,184,0.7)",
        background: "rgba(92,224,184,0.06)",
        border: "1px solid rgba(92,224,184,0.3)",
        borderRadius: 4,
        padding: "2px 6px",
        lineHeight: 1,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      <span
        aria-hidden="true"
        style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(92,224,184,0.85)", flexShrink: 0 }}
      />
      {label}
    </span>
  );
}

/* THE GUARANTEE BADGE — the 60-day money-back promise as a first-class,
   confident element (a flex, not a footnote). Terminal-trust aesthetic:
   mint shield-check + tabular mono. Surfaces the EXISTING Digistore policy
   (60 days is the floor — never shorter); zero refund logic changes. Placed
   at every decision point (hero trust strip, pricing CLAIM, closer CTA) so
   no one reaches a CLAIM button without "and if I hate it, I get it all
   back for 60 days." Static under reduced-motion (no animation of its own;
   any entrance is the parent FadeUp, which the global reduce rule neutralizes). */
export function GuaranteeBadge({ style = {} }) {
  return (
    <span
      className="pro-guarantee-glow"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#5CE0B8",
        background: "rgba(92,224,184,0.08)",
        border: "1px solid rgba(92,224,184,0.42)",
        borderRadius: 999,
        padding: "6px 14px",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path
          d="M12 2.5l7 3v6c0 4.4-3 8.4-7 9.9-4-1.5-7-5.5-7-9.9v-6l7-3z"
          fill="rgba(92,224,184,0.14)"
          stroke="#5CE0B8"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M8.4 12.1l2.3 2.3 4.9-5" stroke="#5CE0B8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      60-day money-back guarantee
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

/* Section eyebrow — mint divider line + mono label. The dash DRAWS in
   left-to-right on the section's first entry (scaleX from a left origin —
   transform only, its 40×2 layout box never changes, so no reflow and no
   effect on the label or snap geometry). One mechanism + one house timing
   for every header; the 100ms delay lets the parent FadeUp's rise start
   first so the draw lands as its own small arrival beat. useInView fires
   once and never re-fires, matching Reveal — no blink on snap re-entry.
   Reduced motion: `none` here + the global clamp = dash present fully
   drawn, instantly, at its final state. */
export function Eyebrow({ text, color = C.mint }) {
  const [ref, inView] = useInView();
  const reduced = usePrefersReducedMotion();
  const drawn = reduced || inView;
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
      <div
        style={{
          width: 40,
          height: 2,
          background: color,
          borderRadius: 1,
          flexShrink: 0,
          transform: drawn ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition: reduced ? "none" : "transform var(--motion-medium) var(--ease-out) 100ms",
        }}
      />
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
        // House system: one decelerate-in curve + one cadence for EVERY
        // section entrance (hero included), so scrolling reads as a single
        // continuous, confident motion. 16px rise (was 12) so the lift is
        // felt as intentional craft, not a plain fade; --motion-medium keeps
        // it crisp — fast enough to never delay a claim. Reduced-motion:
        // `none` here + the global clamp = every section present instantly,
        // correctly composed, zero entrance motion (a designed still state).
        transform: shown ? "translateY(0)" : "translateY(16px)",
        transition: reduced
          ? "none"
          : `opacity var(--motion-medium) var(--ease-out) ${delay}s, transform var(--motion-medium) var(--ease-out) ${delay}s`,
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
        // ONE press for every CLAIM (hero, inline, sticky, card): a quick
        // scale-down to 0.97 + a brightness dip so the buy action feels
        // physical and rewarding everywhere identically. House timing. (Was
        // 0.98 here while the hero forced 0.97 via a CSS !important override —
        // two systems fighting; the override is now removed so this is the
        // single source of truth.)
        transform: pressed ? "translateY(0) scale(0.97)" : hovered ? "translateY(-1px)" : "translateY(0) scale(1)",
        filter: pressed ? "brightness(0.94)" : "none",
        // transform + filter are compositor-safe; box-shadow/background are the
        // glow + outline-tint (tiny button area, negligible paint) — the press
        // depresses INTO the surface (glow eases back) which reads more certain
        // than a flashy surge. Reduced-motion: the global clamp makes it instant.
        transition:
          "transform var(--motion-fast) var(--ease-out), filter var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out), background var(--motion-fast) var(--ease-out)",
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

/* InlineClaim — a peak-intent CTA dropped INSIDE a section (post-hero,
   post-math) so a convinced buyer never has to hunt for the button. Unified
   "CLAIM" verb; routes to the EXISTING checkout by smooth-scrolling to the
   pricing card (same behavior as the hero CTA) so the buyer lands on the plan
   toggle + guarantee and picks a plan honestly — no force-picked plan, no new
   checkout logic. Carries a compact zero-risk microframe so risk-reversal
   travels with every button. Static under reduced-motion (CTAButton's own
   transitions are interaction-only; the entrance FadeUp is the caller's). */
export function InlineClaim({ label = "CLAIM PRO", location = "inline" }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 22 }}>
      <CTAButton
        variant="primary"
        onClick={() => {
          track("pro_inline_cta_clicked", { location, plan_target: "pricing" });
          if (typeof document !== "undefined") {
            // Reduced-motion: instant jump (explicit behavior:"smooth" defeats
            // the CSS reduce override, so guard it here).
            document.getElementById("pricing")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
          }
        }}
      >
        {label}
      </CTAButton>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "rgba(92,224,184,0.7)",
        }}
      >
        <CheckIcon size={12} color="rgba(92,224,184,0.7)" /> 60-day money-back · cancel anytime
      </span>
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
