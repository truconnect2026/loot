"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import FlipCoyote from "@/components/shared/FlipCoyote";
import { readLiveStreak } from "../lib/localStreak.js";
import { useSceneParallax } from "../lib/useSceneParallax.js";

/**
 * The TAP-IN landing — the free-game on-ramp that pre-sells Pro. flip-or-skip is
 * loot's core loop with the money taken out; a stranger who plays one free round
 * is pre-sold. So this front door's job is to move a cold, no-signup IG visitor
 * from *sees it* → *playing* with minimum friction and maximum pull.
 *
 * HONEST, ADAPTIVE STREAK (the correctness fix):
 *  - PUZZLE global day (puzzleNumber, getPuzzleNumber() epoch-day) is used ONLY
 *    as the "today's board" identifier — like Wordle's puzzle number. It is
 *    NEVER shown as a personal streak.
 *  - USER streak is the visitor's REAL earned consecutive-day run, read from the
 *    local play record (fos-streak-count / fos-last-played-date) via
 *    readLiveStreak() — maintained by ResultReveal on completion; we only READ.
 *  - A FRESH visitor (no record) or a BROKEN run (missed a day) → streak 0 → the
 *    newcomer hook shows, never a number. Only an earned, still-alive run shows
 *    the flame "DAY {streak}" badge. So "DAY 77" can never appear for a stranger.
 *
 * FENCED (never touched here): the TAP IN handler (`onStart`), the one-round-a-day
 * gating, getPuzzleNumber, ResultReveal/dailySeed/easterEggs, the round logic,
 * and the free-ungated status. The streak read is READ-ONLY localStorage; no
 * writes, no new keys, no gating change, no auth/backend.
 *
 * Motion: the screen ASSEMBLES like a game booting — Kronos → streak-or-hook →
 * today's-board teaser → TAP IN last. Under reduced motion every entrance
 * collapses to its final state and every idle loop rests at a DECLARED base
 * value. Compositor-only (opacity/transform/filter); the atmosphere + teaser
 * glows are pointer-events:none and can never eat a tap.
 */

const INTRO_STYLES = `
/* ════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — defined once, consumed everywhere, so the intro reads as one
   intentional object. Scoped to .flip-intro (inherits to every descendant).
   TWO type roles (display + mono), an 8pt space scale, one dominant accent
   (mint = action, owned by TAP IN) with a receding support tier, gold as the
   brand/achievement accent (Kronos + streak), one radius scale, one elevation.
   ════════════════════════════════════════════════════════════════════════ */
.flip-intro {
  /* TYPE — 2 roles (families are the global --display Bebas / --mono Space Mono).
     display: tight tracking; label: tracked small-caps; body/data: normal. */
  --fs-display-lg: 28px;  /* streak number */
  --fs-display-md: 15px;  /* section label "FLIP OR SKIP", FLIP/SKIP verbs */
  --fs-label: 9px;        /* tracked small-caps (board id, tag, DAY) */
  --fs-body: 11px;        /* hook, free-chip, reveal line, confidence, reassure */
  --fs-data: 12px;        /* redacted price */
  --icon-flame: 19px;     /* streak flame glyph */
  --tr-display: 0.02em; --tr-label: 0.18em; --tr-body: 0.08em;
  /* SPACE — 8pt (4 = half-step for chips) */
  --sp-4: 4px; --sp-8: 8px; --sp-16: 16px; --sp-24: 24px; --sp-32: 32px;
  /* COLOR — one accent wins. mint = action (primary owned by TAP IN);
     support mint recedes; gold = brand/achievement; red = controlled stop. */
  --acc-text: rgba(92,224,184,0.62);   /* supporting mint text */
  --acc-line: rgba(92,224,184,0.28);   /* muted mint border (support tier) */
  --acc-fill: rgba(92,224,184,0.07);   /* muted mint fill */
  --stop: #ff9a9a;                      /* softened stop-red — never out-pulls TAP IN */
  --stop-line: rgba(255,107,107,0.42);
  --stop-fill: rgba(255,107,107,0.09);
  --gold: #f5c518; --gold-line: rgba(245,197,24,0.38); --gold-fill: rgba(245,197,24,0.1);
  --ink-1: rgba(255,255,255,0.92); --ink-2: rgba(255,255,255,0.62); --ink-3: rgba(255,255,255,0.42);
  /* RADIUS — one scale for every container */
  --r-pill: 999px; --r-md: 16px; --r-sm: 10px; --r-xs: 4px;
  /* ELEVATION — one support-tier treatment (border weight + glow + inset) */
  --bd: 1px;
  --elev: 0 12px 30px -14px rgba(92,224,184,0.4);
  --inset-hi: inset 0 1px 0 rgba(255,255,255,0.12);
}

/* ── DAY streak badge — the GOLD achievement tier (shown only for an earned run) */
.flip-streak-slot { min-height: 42px; display: flex; align-items: center; justify-content: center; }
.flip-streak {
  position: relative;
  display: inline-flex; align-items: center; gap: var(--sp-8);
  padding: var(--sp-4) var(--sp-16) var(--sp-4) var(--sp-8);
  border-radius: var(--r-pill);
  border: var(--bd) solid var(--gold-line);
  background: linear-gradient(180deg, var(--gold-fill) 0%, var(--acc-fill) 100%);
  box-shadow: var(--inset-hi), 0 8px 22px -10px rgba(245,197,24,0.5);
}
.flip-streak-aura {
  position: absolute; inset: -45% -12%; z-index: -1; pointer-events: none;
  border-radius: var(--r-pill);
  background: radial-gradient(ellipse at center, rgba(245,197,24,0.26) 0%, transparent 68%);
  opacity: 0.5;
  animation: flip-streak-aura 3.8s ease-in-out infinite;
  will-change: opacity, transform;
}
@keyframes flip-streak-aura {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.72; transform: scale(1.06); }
}
.flip-streak-flame { font-size: var(--icon-flame); line-height: 1; filter: drop-shadow(0 0 7px rgba(245,197,24,0.65)); }
.flip-streak-label {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-label);
  letter-spacing: var(--tr-label); text-transform: uppercase; color: var(--ink-2);
}
.flip-streak-num {
  font-family: var(--display); font-weight: 900; font-size: var(--fs-display-lg); line-height: 0.9;
  letter-spacing: var(--tr-display); color: var(--gold);
  text-shadow: 0 0 18px rgba(245,197,24,0.4);
  font-variant-numeric: tabular-nums;
}
/* Newcomer hook — a fresh/broken visitor sees curiosity, never a fake number.
   BODY token (lowercase picker voice); support-tier mint (recedes vs TAP IN). */
.flip-fresh-hook {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-body);
  letter-spacing: var(--tr-body); color: var(--acc-text);
  padding: var(--sp-8) var(--sp-16); border-radius: var(--r-pill);
  border: var(--bd) solid var(--acc-line); background: var(--acc-fill);
}

/* ── Today's-board teaser — the centerpiece that teaches the loop in 2 seconds:
      a mystery find, call FLIP or SKIP. Honest — question marks only, never a
      real answer. Glassy, glowing, tappable-looking. ──────────────────────── */
.flip-board {
  position: relative; width: 100%; max-width: 340px;
  border-radius: var(--r-md);
  border: var(--bd) solid var(--acc-line);
  /* Frosted-glass look WITHOUT backdrop-filter: a moving backdrop-blur
     re-samples + re-blurs its backdrop EVERY frame under parallax — a real
     GPU cost in the throttled IG webview. Dialed back for the 60fps floor. A
     deep translucent gradient + inner highlight reads as lit glass at a
     fraction of the cost (the concealed-item panel keeps its own frost). */
  background: linear-gradient(180deg, rgba(18,24,30,0.62) 0%, rgba(8,10,16,0.8) 100%);
  box-shadow: var(--inset-hi), inset 0 0 34px var(--acc-fill), var(--elev);
  padding: var(--sp-16);
  overflow: hidden;
  /* Internal rhythm: one 8pt gap governs head → mystery → call → caption. */
  display: flex; flex-direction: column; gap: var(--sp-8);
}
.flip-board-glow {
  position: absolute; inset: -50% -20%; z-index: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 24%, rgba(92,224,184,0.18) 0%, transparent 68%);
  opacity: 0.6; animation: flip-board-glow 4.6s ease-in-out infinite;
  will-change: opacity, transform;
}
@keyframes flip-board-glow { 0%, 100% { opacity: 0.42; transform: scale(1); } 50% { opacity: 0.72; transform: scale(1.05); } }
.flip-board-head {
  position: relative; display: flex; align-items: center; justify-content: space-between;
}
/* Section label — display-md in neutral ink (was a mint→blue gradient, an
   unsystematized third color; blue is gone). */
.flip-board-name {
  font-family: var(--display); font-weight: 900; font-size: var(--fs-display-md);
  letter-spacing: var(--tr-display); color: var(--ink-1);
}
.flip-board-num {
  font-family: var(--mono); font-size: var(--fs-label); letter-spacing: var(--tr-label);
  text-transform: uppercase; color: var(--ink-3);
}
/* Card grid: the concealed find (1fr) and the FLIP/SKIP call (auto) stretch to
   equal height, so the call aligns to the card's rows instead of floating. */
.flip-board-row { position: relative; display: grid; grid-template-columns: 1fr auto; gap: var(--sp-8); align-items: stretch; }
/* Concealed mystery find — a REAL thrift item withheld behind frosted glass,
   with a redacted buy→sell price that teases toward resolving (a mint shimmer
   sweep). Reads "there's an answer here, hidden," never "failed to load."
   Honest: no real number ever — only redaction bars. */
.flip-board-mystery {
  position: relative; min-height: 64px; overflow: hidden;
  border-radius: var(--r-sm); border: var(--bd) solid rgba(255,255,255,0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.24) 100%);
  padding: var(--sp-8);
  display: flex; flex-direction: column; justify-content: center; gap: var(--sp-4);
}
/* The concealed find — a clear-but-shadowed thrift OBJECT (a vinyl record),
   lightly blurred behind the frost so it reads "an item, hidden," not a smudge. */
.flip-board-silhouette {
  position: absolute; right: 7px; top: 50%; transform: translateY(-50%);
  width: 40px; height: 40px; color: rgba(255,255,255,0.3);
  filter: blur(1.2px); pointer-events: none;
}
.flip-board-frost {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.015) 55%, transparent 100%);
}
.flip-board-shimmer {
  position: absolute; top: 0; bottom: 0; left: -45%; width: 45%; z-index: 1; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(92,224,184,0.22), transparent);
  animation: flip-board-shimmer 3.4s ease-in-out infinite; will-change: transform;
}
@keyframes flip-board-shimmer { 0% { transform: translateX(0); } 70%, 100% { transform: translateX(360%); } }
/* Redacted price — a gentle pulse "about to reveal" (it never does; honest). */
.flip-board-price { position: relative; z-index: 2; display: flex; align-items: center; gap: var(--sp-4); animation: flip-redact-pulse 3s ease-in-out infinite; will-change: opacity; }
@keyframes flip-redact-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.72; } }
.flip-board-cash { font-family: var(--mono); font-size: var(--fs-data); font-weight: 700; color: var(--ink-2); }
.flip-board-bar {
  display: inline-block; width: 11px; height: 13px; border-radius: var(--r-xs);
  background: var(--acc-line); box-shadow: inset 0 0 0 1px var(--acc-line);
}
.flip-board-bar + .flip-board-bar { margin-left: 2px; }
.flip-board-arrow { color: var(--acc-text); font-size: var(--fs-data); margin: 0 3px; }
.flip-board-tag {
  position: relative; z-index: 2;
  font-family: var(--mono); font-size: var(--fs-label); letter-spacing: var(--tr-label); text-transform: uppercase;
  color: var(--acc-text);
}
/* The CALL — the hook. FLIP (green go) vs SKIP (red stop): a charged two-way
   decision whose scale+glow spotlight alternates so a thumb itches to choose.
   Tints (not a solid fill) so the single primary — the TAP IN button — stays
   unmistakable. */
/* The two choices split the call column's height (aligned to the mystery panel
   via the row grid's align-items:stretch) — a decision row, not floating pills. */
.flip-board-call { display: grid; grid-template-rows: 1fr 1fr; gap: var(--sp-8); }
.flip-board-verb {
  position: relative; display: flex; align-items: center; justify-content: center;
  font-family: var(--display); font-weight: 900; font-size: var(--fs-display-md); letter-spacing: var(--tr-display);
  padding: 0 var(--sp-16); border-radius: var(--r-sm); text-align: center; min-width: 76px;
  will-change: transform, opacity;
}
/* SKIP = controlled STOP: softened red so it never out-pulls the solid TAP IN. */
.flip-board-verb--skip {
  color: var(--stop); border: var(--bd) solid var(--stop-line);
  background: linear-gradient(180deg, var(--stop-fill), transparent);
  box-shadow: var(--inset-hi);
  animation: flip-board-call-a 2.6s ease-in-out infinite;
}
/* FLIP = GO: a mint TINT (support tier) — inviting, but the solid mint TAP IN
   button remains accent-primary and the single strongest pull. */
.flip-board-verb--flip {
  color: var(--acc-text); border: var(--bd) solid var(--acc-line);
  background: linear-gradient(180deg, var(--acc-fill), transparent);
  box-shadow: var(--inset-hi);
  animation: flip-board-call-b 2.6s ease-in-out infinite;
}
@keyframes flip-board-call-a { 0%, 40% { transform: scale(1.04); opacity: 1; } 56%, 100% { transform: scale(0.98); opacity: 0.66; } }
@keyframes flip-board-call-b { 0%, 40% { transform: scale(0.98); opacity: 0.66; } 56%, 100% { transform: scale(1.04); opacity: 1; } }
.flip-board-cap {
  position: relative; text-align: center;
  font-family: var(--mono); font-size: var(--fs-body); letter-spacing: var(--tr-body); color: var(--ink-2);
}
.flip-board-cap b { color: var(--acc-text); font-weight: 700; }

/* ── Kronos: idle bob + breathing mint aura (compositor-only) ────────────── */
.flip-intro-host-wrap { position: relative; line-height: 0; }
.flip-intro-host-bob { animation: flip-host-bob 7s ease-in-out infinite; will-change: transform; }
@keyframes flip-host-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  20% { transform: translateY(-6px) rotate(0deg); }
  /* the react beat — a knowing tilt toward the mystery card, daring you */
  46% { transform: translateY(-3px) rotate(-4deg) scale(1.03); }
  52% { transform: translateY(-4px) rotate(0deg) scale(1); }
  72% { transform: translateY(-6px) rotate(0deg); }
}
.flip-intro-host-aura {
  position: absolute; left: 50%; top: 48%; width: 168%; height: 168%;
  transform: translate(-50%, -50%); z-index: 0; pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(92,224,184,0.26) 0%, rgba(92,224,184,0.08) 44%, transparent 66%);
  opacity: 0.55;
  animation: flip-host-aura 5s ease-in-out infinite;
  will-change: opacity, transform;
}
@keyframes flip-host-aura {
  0%, 100% { opacity: 0.42; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.78; transform: translate(-50%, -50%) scale(1.08); }
}

/* ── Light reassurance (BODY token, tertiary ink) ───────────────────────── */
.flip-intro-reassure {
  margin-top: var(--sp-8); font-family: var(--mono); font-size: var(--fs-body);
  letter-spacing: var(--tr-body); color: var(--ink-3);
}

/* ── Overrides for FlipGame-owned intro elements. FlipGame's stylesheet is
      fenced (byte-identical), so these token rules live here and win by higher
      specificity (.flip-intro ancestor), order-independent — no !important. ── */
/* Vertical rhythm between major blocks — 8pt; fuller on tall viewports to close
   the ~30% bottom dead air, tight on short webviews to protect the fold. */
.flip-intro .flip-intro-inner { gap: var(--sp-16); }
/* free-chip: MONO body, support-tier mint (recedes vs the solid mint TAP IN),
   unified pill radius + support border/fill. */
.flip-intro .flip-intro-free {
  font-family: var(--mono); font-weight: 700; font-size: var(--fs-body);
  letter-spacing: var(--tr-body); color: var(--acc-text);
  border: var(--bd) solid var(--acc-line); background: var(--acc-fill);
  border-radius: var(--r-pill);
}
.flip-intro .flip-intro-free-dot { color: var(--ink-3); }
/* confidence line: the THIRD type voice (Bebas w500 sans) reassigned to the
   MONO body token — two roles only, no orphan style. */
.flip-intro .flip-intro-confidence {
  font-family: var(--mono); font-weight: 400; font-size: var(--fs-body);
  letter-spacing: var(--tr-body); color: var(--ink-3);
}

/* ── Intro atmosphere — faint drifting glows (behind the scrim, never a tap
      target). The main starfield is the shared CosmicBackdrop. ───────────── */
/* Parallax depth wrapper — the hook writes translate3d here (compositor-only).
   Full-width flex-center so the wrapped in-flow element stays centered while it
   shifts. */
.flip-plx { position: relative; width: 100%; display: flex; justify-content: center; will-change: transform; }
/* Deep atmosphere layer (slowest parallax). Oversized inset so a parallax
   shift never reveals an edge. Blooms in on boot. */
.flip-intro-atmos {
  position: absolute; inset: -14px; z-index: 0; pointer-events: none; overflow: hidden;
  will-change: transform;
  animation: flip-boot-atmos 0.9s ease-out both;
}
@keyframes flip-boot-atmos { from { opacity: 0; } to { opacity: 1; } }
.flip-atmos-glow { position: absolute; border-radius: 50%; filter: blur(36px); will-change: transform, opacity; }
.flip-atmos-glow--a { width: 230px; height: 230px; left: 6%; top: 18%; background: rgba(92,224,184,0.12); opacity: 0.5; animation: flip-atmos-a 16s ease-in-out infinite; }
.flip-atmos-glow--b { width: 270px; height: 270px; right: 4%; bottom: 14%; background: rgba(107,70,193,0.13); opacity: 0.5; animation: flip-atmos-b 19s ease-in-out infinite; }
@keyframes flip-atmos-a { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(24px, -18px); } }
@keyframes flip-atmos-b { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 16px); } }
/* Volumetric light shafts — soft diagonal beams that drift; premium depth. */
.flip-atmos-shaft {
  position: absolute; top: -25%; height: 150%; width: 64px;
  background: linear-gradient(180deg, transparent, rgba(92,224,184,0.07) 45%, transparent);
  filter: blur(9px); will-change: transform, opacity; transform-origin: top center;
}
.flip-atmos-shaft--a { left: 22%; animation: flip-shaft-a 9.5s ease-in-out infinite; }
.flip-atmos-shaft--b { right: 18%; animation: flip-shaft-b 11.5s ease-in-out infinite; }
@keyframes flip-shaft-a { 0%, 100% { opacity: 0.3; transform: rotate(15deg) translateX(0); } 50% { opacity: 0.6; transform: rotate(15deg) translateX(12px); } }
@keyframes flip-shaft-b { 0%, 100% { opacity: 0.24; transform: rotate(-13deg) translateX(0); } 50% { opacity: 0.55; transform: rotate(-13deg) translateX(-12px); } }
/* Center vignette — focuses the eye on the scene, static. */
.flip-atmos-vignette {
  position: absolute; inset: 0; z-index: 1;
  background: radial-gradient(ellipse 82% 72% at 50% 42%, transparent 42%, rgba(4,4,10,0.5) 100%);
}

/* ── Reduced motion: declared static rests (fill-mode lesson). BOTH the fresh
      and the earned-streak states are composed, deliberate stills. ───────── */
@media (prefers-reduced-motion: reduce) {
  .flip-streak-aura { animation: none; opacity: 0.5; transform: scale(1); }
  .flip-board-glow { animation: none; opacity: 0.5; transform: scale(1); }
  /* Concealed teaser rests as a deliberate frosted still — the shimmer sweep is
     removed (not frozen mid-scramble), FLIP/SKIP hold a charged static state. */
  .flip-board-shimmer { animation: none; opacity: 0; }
  .flip-board-price { animation: none; opacity: 1; }
  .flip-board-verb--skip, .flip-board-verb--flip { animation: none; opacity: 0.95; transform: scale(1); }
  .flip-intro-host-bob { animation: none; transform: none; }
  .flip-intro-host-aura { animation: none; opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  /* Atmosphere rests as a composed static field (glows placed, shafts angled,
     vignette present). The parallax hook is inert under reduced motion, so the
     .flip-plx layers keep their base offset — depth via static composition. */
  .flip-intro-atmos { animation: none; opacity: 1; transform: none; }
  .flip-atmos-glow--a, .flip-atmos-glow--b { animation: none; opacity: 0.5; transform: none; }
  .flip-atmos-shaft--a { animation: none; opacity: 0.4; transform: rotate(15deg); }
  .flip-atmos-shaft--b { animation: none; opacity: 0.4; transform: rotate(-13deg); }
}

/* ── Short viewports (≤700px tall): tighten the 8pt rhythm one step to protect
      the fold (gap + card padding drop to --sp-8), display sizes ease down. ── */
@media (max-height: 700px) {
  /* Redefine the display + flame TOKENS one step down; every consumer
     (streak number, section label, FLIP/SKIP, flame) follows automatically —
     no per-element raw px overrides. */
  .flip-intro { --fs-display-lg: 24px; --fs-display-md: 13px; --icon-flame: 16px; }
  .flip-intro .flip-intro-inner { gap: var(--sp-8); }
  .flip-streak-slot { min-height: 38px; }
  .flip-board { padding: var(--sp-8); gap: var(--sp-8); }
  .flip-board-mystery { min-height: 56px; }
  .flip-board-silhouette { width: 32px; height: 32px; }
  .flip-board-verb { min-width: 66px; }
}
`;

export default function IntroScreen({ puzzleNumber, onStart, ready = true, warping = false, replayCount = 0, konamiArmed = false, konamiHint = false }) {
  const reduced = useReducedMotion();
  const [firstTime, setFirstTime] = useState(false);
  const [playedToday, setPlayedToday] = useState(null); // { score: N } or null
  const [showIdle, setShowIdle] = useState(false);
  const [replayBannerDismissed, setReplayBannerDismissed] = useState(false);
  // REAL personal streak (0 = fresh/broken → newcomer hook). Starts 0 so SSR and
  // the first client render agree (hydration-safe); the true value resolves in a
  // post-mount effect from localStorage. dayDisplay is the rolling number.
  const [streak, setStreak] = useState(0);
  const [dayDisplay, setDayDisplay] = useState(0);

  // Spatial-depth layers — near moves more, far less (small, eased amplitudes
  // so it reads premium, never seasick). The hook writes only translate3d to
  // these refs (compositor-only, one rAF); under reduced motion it is inert.
  const atmosRef = useRef(null);
  const kronosRef = useRef(null);
  const cardRef = useRef(null);
  const parallaxLayers = useMemo(
    () => [
      { ref: atmosRef, coef: 5 }, // deep atmosphere — slowest
      { ref: kronosRef, coef: 10 }, // the host — forward
      { ref: cardRef, coef: 10 }, // the mystery card — frontmost scene layer (kept within the column gap)
    ],
    [],
  );
  useSceneParallax(parallaxLayers, reduced);
  // Gates the streak-or-hook content until the localStorage read resolves
  // post-mount. Server + first client render agree on `false` (empty slot,
  // reserved height) so there is no hydration mismatch AND — critically for a
  // reduced-motion returning user, whose slot is opacity 1 from frame one with
  // no entrance to mask a swap — the newcomer hook is never shown before the
  // earned badge. The slot resolves neutrally: empty → the correct state.
  const [streakResolved, setStreakResolved] = useState(false);

  // Read the earned streak (read-only; never writes, never touches gating) and,
  // when it's an earned run, roll the badge number up to it like a scoreboard.
  // The roll lands EXACTLY on the real streak and can never invent it. No flash:
  // the slot is opacity 0 until its 0.4s entrance, so seeding happens unseen.
  // Reduced motion / fresh visitor: the real value (or 0) shows instantly.
  useEffect(() => {
    const { streak: real } = readLiveStreak();
    setStreak(real);
    setStreakResolved(true);
    if (real < 1) { setDayDisplay(0); return; }
    if (reduced) { setDayDisplay(real); return; }
    const start = Math.max(0, real - 14);
    setDayDisplay(start);
    let intervalId = 0;
    // setInterval + Date.now (not rAF): iOS in-app webviews throttle rAF hard
    // enough to freeze a count; wall-clock timers are the proven clock here.
    const delayId = window.setTimeout(() => {
      const t0 = Date.now();
      const dur = 700;
      intervalId = window.setInterval(() => {
        const p = Math.min((Date.now() - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDayDisplay(Math.round(start + (real - start) * eased));
        if (p >= 1) window.clearInterval(intervalId);
      }, 40);
    }, 400);
    return () => { window.clearTimeout(delayId); window.clearInterval(intervalId); };
  }, [reduced]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ymd = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem("fos-last-played-date");
      const best = localStorage.getItem("fos-best-score");
      if (!last && !best) setFirstTime(true);
      if (last === ymd) {
        const score = parseInt(localStorage.getItem("fos-last-score") || "0", 10);
        setPlayedToday({ score });
      }
    } catch { /* private mode */ }

    const idleTimer = window.setTimeout(() => setShowIdle(true), 8000);
    return () => window.clearTimeout(idleTimer);
  }, []);

  // One entrance helper — under reduced motion every element renders at its
  // final state instantly (a designed static composition); otherwise it
  // fades/rises on the house decelerate curve at a staggered delay.
  const enter = (delay, y = 16) =>
    reduced
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] } };

  const earned = streak >= 1;

  return (
    <div className={`flip-intro ${warping ? "flip-intro--warping" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: INTRO_STYLES }} />

      {/* Atmosphere depth layer (slowest parallax, ref'd) — volumetric glows,
          drifting light shafts, center vignette. Blooms in on boot. Behind the
          scrim; pointer-events:none, never a tap target. */}
      <div ref={atmosRef} className="flip-intro-atmos" aria-hidden="true">
        <span className="flip-atmos-glow flip-atmos-glow--a" />
        <span className="flip-atmos-glow flip-atmos-glow--b" />
        <span className="flip-atmos-shaft flip-atmos-shaft--a" />
        <span className="flip-atmos-shaft flip-atmos-shaft--b" />
        <span className="flip-atmos-vignette" />
      </div>

      {/* Legibility scrim — darkens the content column so the cosmos reads as
          ambient depth behind the words. Above the backdrop (z0), below content. */}
      <div className="flip-intro-scrim" aria-hidden="true" />

      <div className="flip-intro-inner">
        {/* Kronos — the host: breathing mint aura + gentle idle bob, "hyped"
            callout energy daring you to call today's board. */}
        <div ref={kronosRef} className="flip-plx">
          <motion.div
            className="flip-intro-host-wrap"
            initial={reduced ? false : { opacity: 0, scale: 0.8, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={reduced ? undefined : { delay: 0.25, type: "spring", stiffness: 200, damping: 16 }}
          >
            <span className="flip-intro-host-aura" aria-hidden="true" />
            <div className={`flip-intro-host ${reduced ? "flip-intro-host--static" : ""}`}>
              <div className="flip-intro-host-bob">
                <FlipCoyote mood="hyped" size={132} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Streak-or-hook — the honest, adaptive second beat. An EARNED run shows
            the flame "DAY {streak}" (rolling to the real number); a fresh or
            broken visitor sees the newcomer hook, never an unearned number.
            The fresh↔earned swap resolves post-mount while the slot is still
            opacity 0, so it is never visible; the min-height slot prevents any
            layout shift. */}
        <motion.div
          className="flip-streak-slot"
          initial={reduced ? false : { opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 0.55, type: "spring", stiffness: 320, damping: 15 }}
        >
          {/* Content gated on streakResolved: empty (reserved height) until the
              read completes, so a returning user never flashes the newcomer
              hook and a fresh visitor never flashes a badge. */}
          {streakResolved && (earned ? (
            <span className="flip-streak" aria-label={`${streak} day streak`}>
              <span className="flip-streak-aura" aria-hidden="true" />
              <span className="flip-streak-flame" aria-hidden="true">🔥</span>
              <span className="flip-streak-label" aria-hidden="true">DAY</span>
              <span className="flip-streak-num" aria-hidden="true">{dayDisplay}</span>
            </span>
          ) : (
            <span className="flip-fresh-hook">can you call today&apos;s board?</span>
          ))}
        </motion.div>

        {/* Today's-board teaser — the centerpiece. A REAL find is withheld
            behind frosted glass with a redacted price that teases toward
            resolving; the FLIP (go) / SKIP (stop) call is charged so a thumb
            itches to choose. Honest teaser — no real number, never a spoiler;
            the concealment IS the point, and it resolves when you play.
            #{puzzleNumber} is the GLOBAL board id (Wordle-style), never a
            personal streak. */}
        <div ref={cardRef} className="flip-plx">
          <motion.div
            className="flip-board"
            role="img"
            aria-label="today's board — a hidden thrift find; call flip or skip, revealed when you tap in"
            {...enter(0.8)}
          >
            <span className="flip-board-glow" aria-hidden="true" />
            <div className="flip-board-head">
              <span className="flip-board-name" aria-hidden="true">FLIP OR SKIP</span>
              <span className="flip-board-num" aria-hidden="true">board #{puzzleNumber}</span>
            </div>
            <div className="flip-board-row">
              {/* Concealed mystery find — a shadowed thrift OBJECT (a vinyl
                  record) behind frosted glass + a redacted buy→sell price
                  (redaction bars, never a real number). */}
              <div className="flip-board-mystery" aria-hidden="true">
                <svg className="flip-board-silhouette" viewBox="0 0 44 44" aria-hidden="true">
                  <circle cx="22" cy="22" r="19" fill="currentColor" />
                  <circle cx="22" cy="22" r="13" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
                  <circle cx="22" cy="22" r="9" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
                  <circle cx="22" cy="22" r="6" fill="rgba(92,224,184,0.4)" />
                  <circle cx="22" cy="22" r="1.6" fill="rgba(0,0,0,0.5)" />
                </svg>
                <span className="flip-board-frost" aria-hidden="true" />
                <span className="flip-board-shimmer" aria-hidden="true" />
                <div className="flip-board-price">
                  <span className="flip-board-cash">$</span>
                  <span className="flip-board-bar" /><span className="flip-board-bar" />
                  <span className="flip-board-arrow">→</span>
                  <span className="flip-board-cash">$</span>
                  <span className="flip-board-bar" /><span className="flip-board-bar" /><span className="flip-board-bar" />
                </div>
                <span className="flip-board-tag">mystery find · concealed</span>
              </div>
              {/* The call — FLIP (go) vs SKIP (stop): a charged two-way decision. */}
              <div className="flip-board-call" aria-hidden="true">
                <span className="flip-board-verb flip-board-verb--skip">SKIP</span>
                <span className="flip-board-verb flip-board-verb--flip">FLIP</span>
              </div>
            </div>
            <div className="flip-board-cap" aria-hidden="true">tap in to reveal today&apos;s find · <b>your call</b></div>
          </motion.div>
        </div>

        {/* Hero CTA — the single most tappable object in the app. Layered depth
            (gradient + inner highlight + bloom), spring entrance last, idle
            pulse, press = scale + glow surge. Handler is fenced. */}
        <motion.button
          type="button"
          onClick={onStart}
          disabled={!ready}
          className={`flip-tap-in flip-tap-in--cosmic ${showIdle && ready ? "flip-tap-in--idle" : ""}`}
          initial={reduced ? false : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 1.15, type: "spring", stiffness: 210, damping: 17 }}
          whileTap={reduced ? undefined : { scale: 0.97 }}
        >
          <span className="flip-tap-in-particles" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="flip-tap-in-label">{ready ? (playedToday ? "PLAY AGAIN →" : "TAP IN →") : "LOADING…"}</span>
          <span className="flip-tap-in-bloom" aria-hidden="true" />
        </motion.button>

        {/* The FREE flex — a PRIMARY selling point for cold traffic, confident,
            never fine print. */}
        <motion.div className="flip-intro-free" {...enter(1.35)}>
          <span className="flip-intro-free-item">free</span>
          <span className="flip-intro-free-dot" aria-hidden="true">·</span>
          <span className="flip-intro-free-item">no signup</span>
          <span className="flip-intro-free-dot" aria-hidden="true">·</span>
          <span className="flip-intro-free-item">one round a day</span>
        </motion.div>

        <motion.p className="flip-intro-confidence" {...enter(1.5)}>
          {playedToday ? "back for more? go with your gut." : "first time? trust the gut. you got this."}
        </motion.p>

        {playedToday && (
          <div className="flip-intro-played">
            ✓ played today · {playedToday.score}/10
          </div>
        )}

        {playedToday && replayCount >= 1 && !replayBannerDismissed && (
          replayCount >= 3 ? (
            <a href="/pro" className="flip-intro-replay-banner flip-intro-replay-banner--pro">
              🔥 you're hooked. unlimited plays on Pro →
            </a>
          ) : (
            <div className="flip-intro-replay-banner">
              <span>🔄 replay #{replayCount + 1} · won't change your score</span>
              <button type="button" onClick={() => setReplayBannerDismissed(true)} aria-label="Dismiss">✕</button>
            </div>
          )
        )}

        {konamiArmed && (
          <div className="flip-intro-grail-hunter">GRAIL HUNTER ACTIVATED</div>
        )}
        {konamiHint && (
          <div className="flip-intro-konami-hint" aria-hidden="true">↑↑↓↓...</div>
        )}

        {/* Trimmed reassurance — the old bordered "free forever" box is now a
            light, confident line (only for a true first-timer, pre-idle). */}
        {firstTime && !showIdle && !playedToday && (
          <motion.div
            className="flip-intro-reassure"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduced ? undefined : { delay: 1.7 }}
          >
            free forever · no card, no catch
          </motion.div>
        )}

        {/* Single primary action: TAP IN is the only "go". The old idle
            "press it →" box was a second CTA that read unfinished — removed.
            showIdle still drives TAP IN's own idle glow (flip-tap-in--idle),
            so the hero pulses to be pressed without a competing affordance. */}
      </div>
    </div>
  );
}
