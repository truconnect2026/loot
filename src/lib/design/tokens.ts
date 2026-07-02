/**
 * Design tokens — single source of truth for the loot.works visual system.
 * Built FROM the existing system (cosmic #070510, mint, gold, purple, JBMono/
 * Outfit/Bebas) — not a replacement. Every component in src/components/ui/*
 * pulls exclusively from here.
 *
 * Use CSS vars (globals.css) for properties that live in stylesheets/keyframes.
 * Use this file for inline-style props in TSX.
 */

// ── Colors ────────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds — deepest to shallowest
  bgBase:          "#070510",   // absolute floor (html/body, tab bar)
  bgPage:          "#120e18",   // page surface
  bgSurface:       "#17122A",   // raised surface
  bgSurfaceRaised: "#1E1838",   // further raised (ProfileCard)
  bgRecessed:      "#120e18",   // recessed pits (cells inside cards)

  // Borders
  borderFaint:     "#1A1530",
  borderSubtle:    "#1E1835",
  borderDefault:   "#2A2240",
  borderEm:        "#3D2E55",   // emphasized (section dividers)

  // Text
  textPrimary:   "#C8C0D8",
  textSecondary: "#9B8FB0",
  textMuted:     "#5A4E70",
  textDim:       "#3D2E55",

  // Brand accent (money/action)
  mint:           "#5CE0B8",
  mintSurface:    "rgba(92,224,184,0.08)",
  mintBorder:     "rgba(92,224,184,0.20)",
  mintGlow:       "0 0 20px rgba(92,224,184,0.15)",

  // Gold / camel (pricing, value signals, sourcing)
  gold:        "#D4A574",
  goldSurface: "rgba(212,165,116,0.08)",
  goldBorder:  "rgba(212,165,116,0.20)",

  // Blue-purple (data, notifications, utility)
  blue:        "#7B8FFF",
  blueSurface: "rgba(123,143,255,0.08)",
  blueBorder:  "rgba(123,143,255,0.20)",

  // Danger / soft red
  danger:        "#FF6B6B",
  dangerAlt:     "#E8636B",     // existing variant kept for compatibility
  dangerSurface: "rgba(232,99,107,0.08)",
  dangerBorder:  "rgba(232,99,107,0.20)",

  // Verdict semantic tokens
  verdictBuy:         "#5CE0B8",
  verdictBuySurface:  "rgba(92,224,184,0.08)",
  verdictBuyBorder:   "rgba(92,224,184,0.20)",
  verdictMaybe:       "#D4A574",
  verdictMaybeSurface:"rgba(212,165,116,0.08)",
  verdictMaybeBorder: "rgba(212,165,116,0.20)",
  verdictPass:        "#E8636B",
  verdictPassSurface: "rgba(232,99,107,0.08)",
  verdictPassBorder:  "rgba(232,99,107,0.20)",
} as const;

// ── Spacing — 8px grid ────────────────────────────────────────────────────────

export const space = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  12: 48,
  16: 64,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────

export const radius = {
  sm:   4,
  md:   8,
  lg:   16,
  xl:   20,
  pill: 999,
} as const;

// ── Type ramp ─────────────────────────────────────────────────────────────────
// Sizes, weights, tracking per semantic step. Fonts are CSS vars resolved at
// runtime — reference them as string literals here.

export const type = {
  hero:    { fontFamily: "var(--font-display)", fontSize: 44, lineHeight: 1,    letterSpacing: "0.02em",  fontWeight: 400 },
  title:   { fontFamily: "var(--font-body)",    fontSize: 22, lineHeight: 1.2,  letterSpacing: "0.01em",  fontWeight: 600 },
  body:    { fontFamily: "var(--font-body)",    fontSize: 15, lineHeight: 1.5,  letterSpacing: "0",       fontWeight: 400 },
  bodyM:   { fontFamily: "var(--font-body)",    fontSize: 13, lineHeight: 1.45, letterSpacing: "0",       fontWeight: 500 },
  bodyS:   { fontFamily: "var(--font-body)",    fontSize: 11, lineHeight: 1.45, letterSpacing: "0.01em",  fontWeight: 400 },
  label:   { fontFamily: "var(--font-label)",   fontSize: 9,  lineHeight: 1,    letterSpacing: "0.12em",  fontWeight: 700 },
  caption: { fontFamily: "var(--font-body)",    fontSize: 11, lineHeight: 1.4,  letterSpacing: "0.01em",  fontWeight: 400 },
  data:    { fontFamily: "var(--font-data)",    fontSize: 12, lineHeight: 1.4,  letterSpacing: "0.02em",  fontWeight: 700 },
} as const;

// ── Elevation — 3 shadow levels ───────────────────────────────────────────────
// Level 0: flat (no shadow, border only where needed)
// Level 1: surface lift — tiles, list rows
// Level 2: card — ProfileCard, sheets content areas
// Level 3: float — modal, picker, top-of-stack sheet
//
// All levels use layered shadows: outer drop shadow (depth) +
// inset top highlight (light-from-above) + optional mint rim for raised cards.

export const elevation = {
  0: "none",
  1: [
    "inset 0 1px 0 0 rgba(255,255,255,0.08)",   // top rim highlight
    "0 1px 3px rgba(0,0,0,0.25)",                 // base lift
    "0 4px 12px -2px rgba(0,0,0,0.30)",           // depth shadow
  ].join(", "),
  2: [
    "inset 0 1px 0 0 rgba(255,255,255,0.10)",
    "0 2px 8px rgba(0,0,0,0.30)",
    "0 8px 24px -4px rgba(0,0,0,0.40)",
    "0 0 0 0.5px rgba(92,224,184,0.04)",          // faint mint rim
  ].join(", "),
  3: [
    "inset 0 1px 0 0 rgba(255,255,255,0.12)",
    "0 4px 16px rgba(0,0,0,0.40)",
    "0 16px 40px -8px rgba(0,0,0,0.50)",
    "0 0 0 0.5px rgba(92,224,184,0.08)",
    "0 -8px 40px -4px rgba(0,0,0,0.50)",          // negative-Y lift (sheets)
  ].join(", "),
  // Mint rim-light — combine with elevation[2] or [3] for top-card glow
  rim: "inset 0 0 0 1.5px rgba(92,224,184,0.35), 0 0 24px -4px rgba(92,224,184,0.22)",
} as const;

// ── Motion ────────────────────────────────────────────────────────────────────

export const motion = {
  // Named curves
  spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",  // overshoot spring
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",        // fast-in, ease-out
  drawer:  "cubic-bezier(0.32, 0.72, 0, 1)",        // iOS sheet curve

  // Durations (ms)
  fast:    150,
  base:    250,
  slow:    400,

  // List stagger step
  stagger: 40,

  // Crate mode Phase 3 — three-beat lift-off sequence
  crateBeat1:   120,  // ms — "pick up" pause (strips desaturate + lift)
  crateBeat2:   350,  // ms — FLIP travel (spring, staggered per card)
  crateBeat3:   200,  // ms — spring overshoot resolution + CountUp fire
  crateStagger: 45,   // ms per card, front-to-back physical order
  cratePeek:    56,   // px — visible strip of each "under" card in the fan
} as const;
