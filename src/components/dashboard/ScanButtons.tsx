"use client";

import { useEffect, useRef, useState } from "react";

/**
 * THE SCAN HERO — one full-width live viewfinder replacing the old
 * SCAN UPC / AI VISION button pair. The old two-column
 * `minmax(0, 1fr) minmax(0, 1fr)` grid (with its equal-track idiom
 * comment) is intentionally gone: a single hero supersedes the
 * two-button layout, so there are no tracks left to equalize. The
 * 14px top gap the grid carried is preserved on the hero wrapper so
 * Home's rhythm doesn't shift.
 *
 * It routes into the ONE ScanOverlay in ITEM mode — the exact
 * startScan("vision") param the old AI VISION button passed — and the
 * overlay's own BARCODE · ITEM · SHELF · CRATE toggle keeps every other
 * mode one tap away. No scanner logic lives here; this is the front
 * door styled as the instrument itself.
 *
 * Layers (back → front): calibration grid drift / edge vignette /
 * type block / viewfinder brackets (focus breathe) / ghost silhouette +
 * "$––" pill (the hunt rehearsal — never a real number) / reticle +
 * camera glyph / scan-line with phosphor trail / border beam (same
 * living-edge language as the FLIP OR SKIP card) / press flash.
 *
 * Motion contract: transform/opacity/filter only; loops grouped on
 * few clocks (5.6s hunt — scan-line + ghost + pill share it · 3.2s
 * bracket breathe · 14s grid drift · 3s beam); ONE IntersectionObserver
 * pauses everything off-screen; prefers-reduced-motion kills all of it
 * and ships the paused instrument (brackets + reticle + frozen ghost +
 * "$––" mid-lock + mint edge).
 */

interface ScanButtonsProps {
  /** Fires the scanner in ITEM mode. The mount passes the canonical
      trigger (src/lib/scan-trigger.ts) with "vision" — identical
      behavior to the old direct startScan("vision") wiring. */
  onScan: () => void;
  /** Accepted for mount-site compatibility; the hero's fixed composition
      does not render a per-button counter anymore. */
  todayScans?: number;
  /** New-user contract preserved from the old primary button: a quiet
      "tap me" border pulse when true. */
  pulsePrimary?: boolean;
}

export default function ScanButtons({ onScan, pulsePrimary }: ScanButtonsProps) {
  const [firing, setFiring] = useState(false);
  const rootRef = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Cocking the scanner: focus-lock brackets + edge flash + one fast
  // sweep (~180ms), then route. Reduced motion routes instantly.
  const fire = () => {
    if (firing) return;
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch { /* default: animate */ }
    if (reduced) {
      onScan();
      return;
    }
    setFiring(true);
    window.setTimeout(() => {
      onScan();
      setFiring(false);
    }, 180);
  };

  return (
    <button
      ref={rootRef}
      type="button"
      onClick={fire}
      aria-label="Scan — point at anything, know what it's worth"
      className={
        "sh" +
        (firing ? " sh--firing" : "") +
        (inView ? "" : " sh--paused") +
        (pulsePrimary ? " sh--pulse" : "")
      }
    >
      <style>{STYLES}</style>

      {/* calibration mesh — a scanner's idle surface, whisper-faint */}
      <div className="sh-grid" aria-hidden="true" />
      <div className="sh-vignette" aria-hidden="true" />

      {/* type block — left, so the viewfinder owns the right like the
          FLIP card's collectible: Home reads as one family */}
      <div className="sh-type">
        <div className="sh-title">SCAN</div>
        <div className="sh-sub">point at anything. know what it&apos;s worth.</div>
      </div>

      {/* the viewfinder */}
      <div className="sh-frame" aria-hidden="true">
        <span className="sh-br sh-br--tl" />
        <span className="sh-br sh-br--tr" />
        <span className="sh-br sh-br--bl" />
        <span className="sh-br sh-br--br" />

        {/* ghost catch — abstract silhouette, never a real item */}
        <svg className="sh-ghost" viewBox="0 0 48 64">
          <path
            d="M18 6 h12 v10 q8 6 8 20 q0 16 -14 16 q-14 0 -14 -16 q0 -14 8 -20 z"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
          />
        </svg>
        <div className="sh-pill">$––</div>

        {/* reticle — crosshair + hardware camera glyph */}
        <div className="sh-reticle">
          <span className="sh-cross sh-cross--h" />
          <span className="sh-cross sh-cross--v" />
          {/* translateY(-1): the camera is bottom-heavy (lens at cy13,
              below the 24-box center), so seating the sprite box on the
              crosshair leaves the lens ~1px below it. Nudge up 1px to seat
              the lens on the crosshair — same optical correction the nav
              FAB camera carries. */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5CE0B8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateY(-1px)" }}>
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx={12} cy={13} r={4} />
          </svg>
        </div>

        {/* the hunt — sweeping line + phosphor trail */}
        <div className="sh-scan" />
      </div>

      {/* capability flex — quiet, bottom edge */}
      <div className="sh-caps">BARCODE · ITEM · SHELF · CRATE</div>

      {/* border beam — same living-edge language as the FLIP card */}
      <div className="sh-beam" aria-hidden="true"><div className="sh-beam-spin" /></div>
      {/* new-user pulse overlay (pulsePrimary contract) */}
      <div className="sh-pulse-ring" aria-hidden="true" />
      {/* press flash */}
      <div className="sh-flash" aria-hidden="true" />
    </button>
  );
}

const STYLES = `
.sh {
  position: relative; display: block; width: 100%; height: 176px;
  margin-top: 14px;
  padding: 0; text-align: left; cursor: pointer;
  background: #070510;
  border: 1px solid rgba(92, 224, 184, 0.35);
  border-radius: 18px;
  overflow: hidden;
  /* forward lift, biased UPWARD so the hero's glow never collides with
     the content below at 390px */
  box-shadow:
    0 -2px 18px -6px rgba(92, 224, 184, 0.22),
    0 6px 20px -8px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.10);
  -webkit-tap-highlight-color: transparent;
}
.sh--paused, .sh--paused * { animation-play-state: paused !important; }

/* calibration mesh — oversized layer, transform drift only */
.sh-grid {
  position: absolute; inset: -30%;
  background-image:
    repeating-linear-gradient(0deg, rgba(92,224,184,0.05) 0 1px, transparent 1px 22px),
    repeating-linear-gradient(90deg, rgba(92,224,184,0.05) 0 1px, transparent 1px 22px);
  animation: shGrid 14s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes shGrid {
  from { transform: translate3d(-8px, -5px, 0); }
  to { transform: translate3d(8px, 5px, 0); }
}
.sh-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 62% 50%, transparent 40%, rgba(7,5,16,0.75) 100%);
  pointer-events: none;
}

/* type block */
.sh-type { position: absolute; left: 20px; top: 30px; z-index: 2; max-width: 46%; }
.sh-title {
  font-family: var(--font-bebas-neue), sans-serif;
  font-size: 44px; line-height: 0.95; letter-spacing: 0.03em;
  color: #5CE0B8;
  text-shadow: 0 0 18px rgba(92, 224, 184, 0.35);
}
.sh-sub {
  margin-top: 8px;
  font-family: var(--font-manrope), sans-serif;
  font-size: 12.5px; line-height: 1.45;
  color: rgba(255, 255, 255, 0.55);
}
.sh-caps {
  position: absolute; left: 20px; bottom: 12px; z-index: 2;
  font-family: var(--font-space-mono), monospace;
  font-size: 8px; letter-spacing: 0.14em;
  color: rgba(92, 224, 184, 0.45);
}

/* viewfinder frame — right region. bottom: 34px (not 18) holds the
   frame's ENTIRE bounding box above the caps row's band (bottom 12px +
   ~9px line box): the two are separated on the CROSS axis, so the caps
   line mathematically cannot reach the brackets at any viewport width —
   no font-metric or run-width math involved. (The first fix narrowed
   the frame width instead; it only held in the harness because the
   fallback serif ran ~25% narrower than real Space Mono.) Do not move
   the caps back into the frame's vertical band. */
.sh-frame {
  position: absolute; right: 14px; top: 18px; bottom: 34px; width: 150px;
  z-index: 1;
}
.sh-br {
  position: absolute; width: 16px; height: 16px;
  border-color: #5CE0B8; border-style: solid; border-width: 0;
  opacity: 0.9;
  animation: shBreathe 3.2s ease-in-out infinite;
}
.sh-br--tl { top: 0; left: 0; border-top-width: 2px; border-left-width: 2px; --bx: -1.5px; --by: -1.5px; }
.sh-br--tr { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; --bx: 1.5px; --by: -1.5px; }
.sh-br--bl { bottom: 0; left: 0; border-bottom-width: 2px; border-left-width: 2px; --bx: -1.5px; --by: 1.5px; }
.sh-br--br { bottom: 0; right: 0; border-bottom-width: 2px; border-right-width: 2px; --bx: 1.5px; --by: 1.5px; }
@keyframes shBreathe {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(var(--bx, 0), var(--by, 0)); }
}
/* focus-lock: brackets snap INWARD while firing */
.sh--firing .sh-br { animation: none; transition: transform 120ms cubic-bezier(0.22,1,0.36,1); }
.sh--firing .sh-br--tl { transform: translate(5px, 5px); }
.sh--firing .sh-br--tr { transform: translate(-5px, 5px); }
.sh--firing .sh-br--bl { transform: translate(5px, -5px); }
.sh--firing .sh-br--br { transform: translate(-5px, -5px); }

/* reticle */
.sh-reticle {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 0 6px rgba(92, 224, 184, 0.45));
}
.sh-cross { position: absolute; background: rgba(92, 224, 184, 0.35); }
.sh-cross--h { width: 58px; height: 1px; }
.sh-cross--v { width: 1px; height: 58px; }

/* the hunt — scan-line, ghost, and pill share ONE 5.6s clock */
.sh-scan {
  position: absolute; top: 4%; bottom: 4%; left: -3px; width: 2px;
  background: linear-gradient(180deg, transparent, rgba(92,224,184,0.9), transparent);
  box-shadow: 4px 0 12px rgba(92, 224, 184, 0.35), 12px 0 22px rgba(92, 224, 184, 0.12);
  animation: shSweep 5.6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes shSweep {
  0% { transform: translateX(0); opacity: 0; }
  6% { opacity: 1; }
  42% { transform: translateX(150px); opacity: 1; }
  48%, 100% { transform: translateX(150px); opacity: 0; }
}
.sh--firing .sh-scan { animation: shSweepFast 160ms ease-in 1; }
@keyframes shSweepFast {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(150px); opacity: 1; }
}
.sh-ghost {
  position: absolute; left: 50%; top: 50%; width: 44px; height: 58px;
  transform: translate(-58%, -52%);
  opacity: 0;
  animation: shGhost 5.6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes shGhost {
  0%, 34% { opacity: 0; }
  42%, 66% { opacity: 0.5; }
  78%, 100% { opacity: 0; }
}
.sh-pill {
  position: absolute; right: 14px; top: 22%;
  font-family: var(--font-space-mono), monospace;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  color: #070510;
  background: rgba(92, 224, 184, 0.9);
  border-radius: 999px; padding: 2px 7px;
  opacity: 0;
  /* linear, not steps(): steps(1, jump-none) is invalid CSS (jump-none
     needs >=2 steps) and silently kills the whole animation. The
     flicker lives in the keyframe stops themselves. */
  animation: shPill 5.6s linear infinite;
  pointer-events: none;
}
@keyframes shPill {
  0%, 45% { opacity: 0; }
  47% { opacity: 0.9; }
  50% { opacity: 0.25; }
  52% { opacity: 0.9; }
  64% { opacity: 0.9; }
  70%, 100% { opacity: 0; }
}

/* border beam — matches the FLIP card's living edge */
.sh-beam {
  position: absolute; inset: 0; border-radius: 18px; padding: 1.5px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  overflow: hidden; pointer-events: none;
}
.sh-beam-spin {
  position: absolute; left: -55%; top: -160%; width: 210%; height: 420%;
  background: conic-gradient(transparent 0deg 300deg, rgba(92,224,184,0.8) 332deg, transparent 360deg);
  animation: shBeam 3s linear infinite;
}
@keyframes shBeam { to { transform: rotate(360deg); } }

/* new-user pulse (pulsePrimary contract) */
.sh-pulse-ring {
  position: absolute; inset: 0; border-radius: 18px;
  border: 1px solid rgba(92, 224, 184, 0.6);
  opacity: 0; pointer-events: none;
}
.sh--pulse .sh-pulse-ring { animation: shPulse 2.6s ease-in-out infinite; }
@keyframes shPulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.7; }
}

/* press flash — mint edge flash while firing */
.sh-flash {
  position: absolute; inset: 0; border-radius: 18px;
  box-shadow: inset 0 0 0 1.5px rgba(92, 224, 184, 0.9), inset 0 0 24px rgba(92, 224, 184, 0.25);
  opacity: 0; pointer-events: none;
}
.sh--firing .sh-flash { animation: shFlash 180ms ease-out 1; }
@keyframes shFlash {
  0% { opacity: 0; }
  35% { opacity: 1; }
  100% { opacity: 0; }
}
.sh--firing { transform: scale(0.985); transition: transform 120ms ease; }

@media (prefers-reduced-motion: reduce) {
  /* the paused instrument: brackets + reticle + frozen ghost + "$––"
     mid-lock + mint edge. Complete and premium with zero motion. */
  .sh, .sh * { animation: none !important; transition: none !important; }
  .sh--firing { transform: none; }
  .sh-scan, .sh-beam { display: none; }
  .sh-grid { transform: none; }
  .sh-ghost { opacity: 0.45; }
  .sh-pill { opacity: 0.85; }
  .sh-pulse-ring { opacity: 0; }
}
`;
