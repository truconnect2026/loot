"use client";

/**
 * LOGIN BACKDROP — the product demos itself. A slow ambient SCAN
 * SEQUENCE loops behind the auth card: parallax starfield + mint
 * nebula + brand orbit-arcs, then THE HUNT — a faint item silhouette
 * drifts in the deep background, a mint reticle drifts to it, corner
 * brackets converge and LOCK, a ghosted "$––" pill blinks in, holds,
 * dissolves, rests. Point → lock → number: the whole product in
 * pantomime, never louder than the card.
 *
 * Timelines (consolidated): 16s hunt cycle (reticle + brackets + pill
 * share it) · 64s shape/stage rotation (4 silhouettes, one per cycle,
 * stage re-anchors between cycles) · 90/140/200s starfield parallax ·
 * 40s arc drift. All transform/opacity/filter, CSS only, zero assets.
 *
 * `phase` mirrors LoginPage's entrance: "pre" hides everything (page
 * is behind the splash), "enter" plays the stars-settle fade AND the
 * one-shot FIRST LOCK — the signature: the page finds its first item
 * exactly as the card lands. "static" renders everything instantly.
 *
 * Reduced motion (CSS-level): hunt + first-lock hidden, stars/nebula/
 * arcs frozen — a faint static cosmos. The master pause class
 * (.lp--paused, applied by LoginPage on document-hidden) freezes every
 * animation here via inheritance.
 */

interface Props {
  phase: "pre" | "enter" | "static";
}

// Stroke-only abstract silhouettes — outlines, never product art.
const SILHOUETTES = [
  // vase
  <svg key="vase" className="lb-item lb-item--1" viewBox="0 0 48 64" aria-hidden="true">
    <path d="M19 4 h10 v8 q9 5 9 20 q0 12 -7 16 l1 12 h-16 l1 -12 q-7 -4 -7 -16 q0 -15 9 -20 z" />
  </svg>,
  // jacket
  <svg key="jacket" className="lb-item lb-item--2" viewBox="0 0 48 64" aria-hidden="true">
    <path d="M17 8 l7 -4 l7 4 l10 6 l-4 14 l-5 -3 v33 h-16 v-33 l-5 3 l-4 -14 z M24 4 v18" />
  </svg>,
  // record
  <svg key="record" className="lb-item lb-item--3" viewBox="0 0 48 64" aria-hidden="true">
    <circle cx="24" cy="32" r="21" />
    <circle cx="24" cy="32" r="8" />
    <circle cx="24" cy="32" r="1.5" />
  </svg>,
  // camera
  <svg key="camera" className="lb-item lb-item--4" viewBox="0 0 48 64" aria-hidden="true">
    <rect x="4" y="20" width="40" height="28" rx="5" />
    <circle cx="24" cy="34" r="9" />
    <path d="M15 20 l3 -6 h12 l3 6" />
    <circle cx="38" cy="27" r="2" />
  </svg>,
];

function Reticle({ cls }: { cls: string }) {
  return (
    <div className={cls} aria-hidden="true">
      <span className="lb-br lb-br--tl" />
      <span className="lb-br lb-br--tr" />
      <span className="lb-br lb-br--bl" />
      <span className="lb-br lb-br--br" />
      <span className="lb-cross lb-cross--h" />
      <span className="lb-cross lb-cross--v" />
    </div>
  );
}

export default function LoginBackdrop({ phase }: Props) {
  return (
    <div
      className={"lb" + (phase === "pre" ? " lb--pre" : phase === "enter" ? " lb--enter" : "")}
      aria-hidden="true"
    >
      <style>{CSS}</style>

      {/* parallax starfield — three depths, three drift rates */}
      <div className="lb-stars lb-stars--far" />
      <div className="lb-stars lb-stars--mid" />
      <div className="lb-stars lb-stars--near" />

      {/* mint nebula bloom, low in frame */}
      <div className="lb-nebula" />

      {/* brand orbit-arcs */}
      <svg className="lb-arcs" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="195" cy="700" rx="330" ry="120" transform="rotate(-14 195 700)" />
        <ellipse cx="195" cy="720" rx="250" ry="86" transform="rotate(-14 195 720)" />
      </svg>

      {/* THE HUNT — one stage, four silhouettes rotating per cycle */}
      <div className="lb-stage">
        {SILHOUETTES}
        <Reticle cls="lb-ret" />
        <div className="lb-pill">$––</div>
      </div>

      {/* SIGNATURE — the first lock, one shot, timed to the card landing */}
      <div className="lb-first">
        <Reticle cls="lb-first-ret" />
        <div className="lb-first-pill">$––</div>
      </div>
    </div>
  );
}

const CSS = `
.lb {
  position: fixed; inset: 0; z-index: 0;
  overflow: hidden; pointer-events: none;
  background: linear-gradient(180deg, #0A0714 0%, #110C1D 55%, #130E20 100%);
  opacity: 1;
}
.lb--pre { opacity: 0; }
.lb--enter { animation: lbSettle 300ms ease-out both; }
@keyframes lbSettle {
  from { opacity: 0; transform: scale(1.03); }
  to { opacity: 1; transform: scale(1); }
}

/* ── starfield ─────────────────────────────────────────────────── */
.lb-stars {
  position: absolute; inset: -30%;
  background-repeat: repeat;
}
.lb-stars--far {
  opacity: 0.5;
  background-image:
    radial-gradient(1px 1px at 22px 34px, rgba(255,255,255,0.55), transparent 100%),
    radial-gradient(1px 1px at 128px 96px, rgba(255,255,255,0.4), transparent 100%),
    radial-gradient(1px 1px at 210px 180px, rgba(255,255,255,0.5), transparent 100%),
    radial-gradient(1px 1px at 68px 214px, rgba(255,255,255,0.35), transparent 100%),
    radial-gradient(1px 1px at 250px 60px, rgba(255,255,255,0.45), transparent 100%);
  background-size: 290px 290px;
  animation: lbDriftA 200s linear infinite alternate;
}
.lb-stars--mid {
  opacity: 0.55;
  background-image:
    radial-gradient(1.3px 1.3px at 80px 44px, rgba(255,255,255,0.6), transparent 100%),
    radial-gradient(1.2px 1.2px at 190px 140px, rgba(200,245,228,0.5), transparent 100%),
    radial-gradient(1.2px 1.2px at 40px 190px, rgba(255,255,255,0.45), transparent 100%),
    radial-gradient(1.3px 1.3px at 230px 240px, rgba(255,255,255,0.5), transparent 100%);
  background-size: 320px 320px;
  animation: lbDriftB 140s linear infinite alternate;
}
.lb-stars--near {
  opacity: 0.6;
  background-image:
    radial-gradient(1.6px 1.6px at 60px 120px, rgba(255,255,255,0.6), transparent 100%),
    radial-gradient(1.5px 1.5px at 260px 80px, rgba(185,245,227,0.55), transparent 100%),
    radial-gradient(1.6px 1.6px at 150px 260px, rgba(255,255,255,0.5), transparent 100%);
  background-size: 360px 360px;
  animation: lbDriftC 90s linear infinite alternate;
}
@keyframes lbDriftA { from { transform: translate3d(0,0,0); } to { transform: translate3d(-26px, 14px, 0); } }
@keyframes lbDriftB { from { transform: translate3d(0,0,0); } to { transform: translate3d(20px, -18px, 0); } }
@keyframes lbDriftC { from { transform: translate3d(0,0,0); } to { transform: translate3d(-32px, -22px, 0); } }

/* ── nebula ────────────────────────────────────────────────────── */
.lb-nebula {
  position: absolute; left: 50%; bottom: -240px;
  width: 640px; height: 520px; margin-left: -320px;
  background: radial-gradient(ellipse at center, rgba(92,224,184,0.10) 0%, rgba(92,224,184,0.04) 40%, transparent 70%);
  filter: blur(40px);
  animation: lbNebula 30s ease-in-out infinite alternate;
}
@keyframes lbNebula {
  from { transform: translate3d(-14px, 0, 0); opacity: 0.85; }
  to { transform: translate3d(14px, -10px, 0); opacity: 1; }
}

/* ── orbit arcs ────────────────────────────────────────────────── */
.lb-arcs {
  position: absolute; inset: 0; width: 100%; height: 100%;
}
.lb-arcs ellipse {
  fill: none; stroke: rgba(92, 224, 184, 0.10); stroke-width: 1;
  stroke-dasharray: 3 7;
  animation: lbArc 40s linear infinite;
}
@keyframes lbArc { to { stroke-dashoffset: -100; } }

/* ── THE HUNT ──────────────────────────────────────────────────────
   Stage re-anchors across four screen spots on a 64s clock (teleports
   during the rest beat of each 16s cycle, so the move is never seen).
   Within each 16s cycle: reticle drifts in 0-24%, LOCK snap at 27%,
   pill blinks 32-58%, dissolve by 66%, rest 66-100%. */
.lb-stage {
  position: absolute; left: 50%; top: 50%;
  width: 0; height: 0;
  animation: lbStage 64s step-end infinite;
  animation-delay: 5s;
}
@keyframes lbStage {
  0%, 24.99% { transform: translate(-125px, -290px); }
  25%, 49.99% { transform: translate(95px, -180px); }
  50%, 74.99% { transform: translate(-95px, 195px); }
  75%, 100% { transform: translate(110px, 265px); }
}
.lb-item {
  position: absolute; left: -26px; top: -34px;
  width: 52px; height: 68px;
  fill: none; stroke: rgba(255, 255, 255, 0.30); stroke-width: 1.3;
  stroke-linejoin: round; stroke-linecap: round;
  opacity: 0;
  animation: lbItemDrift 16s ease-in-out infinite, lbItemShow 64s linear infinite;
  animation-delay: 5s;
}
/* silhouette drifts gently while on stage */
@keyframes lbItemDrift {
  from { transform: translate3d(-6px, 3px, 0); }
  50% { transform: translate3d(6px, -3px, 0); }
  to { transform: translate3d(-6px, 3px, 0); }
}
/* one silhouette per 16s window; visible only while its cycle is live */
.lb-item--1 { animation-name: lbItemDrift, lbShow1; }
.lb-item--2 { animation-name: lbItemDrift, lbShow2; }
.lb-item--3 { animation-name: lbItemDrift, lbShow3; }
.lb-item--4 { animation-name: lbItemDrift, lbShow4; }
@keyframes lbShow1 { 0%, 0.5% { opacity: 0; } 2%, 15% { opacity: 1; } 16.5%, 100% { opacity: 0; } }
@keyframes lbShow2 { 0%, 25.5% { opacity: 0; } 27%, 40% { opacity: 1; } 41.5%, 100% { opacity: 0; } }
@keyframes lbShow3 { 0%, 50.5% { opacity: 0; } 52%, 65% { opacity: 1; } 66.5%, 100% { opacity: 0; } }
@keyframes lbShow4 { 0%, 75.5% { opacity: 0; } 77%, 90% { opacity: 1; } 91.5%, 100% { opacity: 0; } }
/* keep the silhouettes ghosted — deep background, never competing */
@keyframes lbItemShow { from { opacity: 0; } to { opacity: 0; } }

/* reticle — 64px frame, drifts in, locks, dissolves. 16s cycle. */
.lb-ret {
  position: absolute; left: -32px; top: -38px;
  width: 64px; height: 72px;
  opacity: 0;
  animation: lbRet 16s ease-in-out infinite;
  animation-delay: 5s;
}
@keyframes lbRet {
  0% { opacity: 0; transform: translate(-46px, -34px) scale(1.15); }
  10% { opacity: 0.7; }
  24% { transform: translate(0, 0) scale(1.08); opacity: 0.8; }
  27% { transform: translate(0, 0) scale(1); opacity: 1; }
  58% { transform: translate(0, 0) scale(1); opacity: 1; }
  66%, 100% { opacity: 0; transform: translate(0, 0) scale(1); }
}
.lb-br {
  position: absolute; width: 12px; height: 12px;
  border: 0 solid rgba(92, 224, 184, 0.75);
}
.lb-br--tl { top: 0; left: 0; border-top-width: 1.5px; border-left-width: 1.5px; }
.lb-br--tr { top: 0; right: 0; border-top-width: 1.5px; border-right-width: 1.5px; }
.lb-br--bl { bottom: 0; left: 0; border-bottom-width: 1.5px; border-left-width: 1.5px; }
.lb-br--br { bottom: 0; right: 0; border-bottom-width: 1.5px; border-right-width: 1.5px; }
.lb-cross { position: absolute; left: 50%; top: 50%; background: rgba(92, 224, 184, 0.5); }
.lb-cross--h { width: 18px; height: 1px; margin-left: -9px; }
.lb-cross--v { width: 1px; height: 18px; margin-top: -9px; }

/* ghosted verdict pill — blinks in beside the lock, "$––" only */
.lb-pill {
  position: absolute; left: 36px; top: -48px;
  font-family: var(--font-label), monospace;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  color: #071310;
  background: rgba(92, 224, 184, 0.75);
  border-radius: 999px; padding: 2px 7px;
  opacity: 0;
  animation: lbPill 16s linear infinite;
  animation-delay: 5s;
}
@keyframes lbPill {
  0%, 31% { opacity: 0; }
  32.5% { opacity: 0.9; } 34% { opacity: 0.2; } 35.5% { opacity: 0.9; }
  56% { opacity: 0.9; }
  63%, 100% { opacity: 0; }
}

/* ── SIGNATURE: the first lock ──────────────────────────────────────
   Plays ONCE during the entrance (lb--enter only): brackets converge
   and snap precisely as the card lands (~800ms), pill blinks, both
   dissolve. The page finds its first item as you arrive. */
.lb-first {
  position: absolute; left: 50%; top: 24%;
  width: 0; height: 0;
  transform: translateX(96px);
  display: none;
}
.lb--enter .lb-first { display: block; }
.lb-first-ret {
  position: absolute; left: -30px; top: -30px;
  width: 60px; height: 60px;
  opacity: 0;
  animation: lbFirstRet 1700ms ease-out 380ms 1 both;
}
@keyframes lbFirstRet {
  0% { opacity: 0; transform: scale(1.6); }
  18% { opacity: 0.9; }
  24% { transform: scale(1.06); }
  28% { transform: scale(1); opacity: 1; }
  72% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}
.lb-first-pill {
  position: absolute; left: 34px; top: -44px;
  font-family: var(--font-label), monospace;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  color: #071310;
  background: rgba(92, 224, 184, 0.8);
  border-radius: 999px; padding: 2px 7px;
  opacity: 0;
  animation: lbFirstPill 1700ms linear 380ms 1 both;
}
@keyframes lbFirstPill {
  0%, 32% { opacity: 0; }
  36% { opacity: 0.95; } 40% { opacity: 0.25; } 44% { opacity: 0.95; }
  72% { opacity: 0.95; }
  100% { opacity: 0; }
}

/* ── reduced motion: faint static cosmos, no hunt, no signature ── */
@media (prefers-reduced-motion: reduce) {
  .lb, .lb * { animation: none !important; }
  .lb--pre { opacity: 1; }
  .lb-stage, .lb-first { display: none; }
}
`;
