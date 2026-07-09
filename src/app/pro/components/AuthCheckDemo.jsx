"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_HEADLINE_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * "The fake check" — interactive authenticate demo. The user drags a
 * mint scanline across an unbranded hoodie; the checklist waits as four
 * dim ghost rows (so the reveal is legible before anyone drags), and
 * each row ignites to its full ✓/✗ state as the line crosses its zone.
 * Reaching the right edge slams in a REP DETECTED verdict. Fully
 * scrubbable in both directions because every visual is derived purely
 * from one progress value (0..1) — scrub-back de-ignites rows to ghost.
 *
 * Interaction model:
 *   - drag: pointer events, horizontal only. The panel sets
 *     touch-action: pan-y, so vertical swipes stay with the browser
 *     (the y-snap scroller keeps working; we get a pointercancel) and
 *     only horizontal movement reaches the drag logic.
 *   - tap: auto-runs the full sweep at hero pacing (~2s).
 *   - idle attract: after 6s without interaction while on-screen, the
 *     sweep runs as a loop (sweep → hold → fade reset) so
 *     non-interactors still get the story. Any pointerdown cancels it.
 *
 * All values illustrative; no real brands anywhere. #ff6b6b appears
 * ONLY on failed checks and the verdict stamp.
 */

const RED = "#ff6b6b";
const EASE = "cubic-bezier(0.16,1,0.3,1)";
const SWEEP_MS = 2000;
const END = 0.95; // progress at which the verdict fires

const NUDGE_STYLES = `
@keyframes acdNudge {
  0%, 100% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
}
.acd-nudge { animation: acdNudge 2s ease-in-out infinite; will-change: transform; }
@keyframes acdChevron {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.8; }
}
.acd-chevron { animation: acdChevron 2s ease-in-out infinite; }
@keyframes acdStampPulse {
  0% { opacity: 0; }
  40% { opacity: 0.9; }
  100% { opacity: 0; }
}
.acd-stamp-pulse { animation: acdStampPulse 600ms ease-out 1; }
/* idle prompt pulse — same 2.2s opacity language as the scan demo */
@keyframes acdTapPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
.acd-tap-pulse { animation: acdTapPulse 2.2s ease-in-out infinite; }
`;

const CHECKS = [
  { label: "stitch density", pass: true, at: 0.22 },
  { label: "tag print", pass: true, at: 0.42 },
  { label: "hardware weight", pass: false, at: 0.62 },
  { label: "label font", pass: false, at: 0.8 },
];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* Local, continuously-updating visibility tracker — same pattern as the
   other live demos, duplicated so this file stays self-contained. */
function useLiveInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* Unbranded streetwear-style graphic hoodie — mint line work only, the
   chest "graphic" is an abstract starburst/ring so it reads as a print
   without resembling any real mark. */
function HoodieIcon() {
  return (
    <svg viewBox="0 0 200 240" width="100%" height="100%" style={{ display: "block" }}>
      {/* hood */}
      <path
        d="M68 44 Q100 14 132 44 Q142 55 140 68 L60 68 Q58 55 68 44 Z"
        fill="none"
        stroke={C.mint}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M76 62 Q100 34 124 62" fill="none" stroke={C.mint} strokeWidth="1.2" opacity="0.5" />
      {/* body */}
      <path
        d="M60 68 L38 80 L45 214 Q100 226 155 214 L162 80 L140 68 Z"
        fill="none"
        stroke={C.mint}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* sleeves */}
      <path d="M38 80 L18 160 L42 168 L52 110" fill="none" stroke={C.mint} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M162 80 L182 160 L158 168 L148 110" fill="none" stroke={C.mint} strokeWidth="2.2" strokeLinejoin="round" />
      {/* drawstrings */}
      <path d="M92 68 L89 92 M108 68 L111 92" stroke={C.mint} strokeWidth="1.4" opacity="0.6" />
      <circle cx="89" cy="95" r="2" fill={C.mint} opacity="0.6" />
      <circle cx="111" cy="95" r="2" fill={C.mint} opacity="0.6" />
      {/* kangaroo pocket */}
      <path
        d="M68 176 L72 208 L128 208 L132 176 L112 176 L100 190 L88 176 Z"
        fill="none"
        stroke={C.mint}
        strokeWidth="1.6"
        opacity="0.7"
      />
      {/* abstract chest graphic — generic starburst + ring, no lettering */}
      <g opacity="0.75">
        <circle cx="100" cy="130" r="17" fill="rgba(92,224,184,0.1)" stroke={C.mint} strokeWidth="1.4" />
        <path
          d="M100 118 L103 127 L112 127 L105 133 L108 142 L100 136 L92 142 L95 133 L88 127 L97 127 Z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.2"
          opacity="0.7"
        />
        <path d="M78 150 L122 150" stroke={C.mint} strokeWidth="1" opacity="0.4" />
        <path d="M84 156 L116 156" stroke={C.mint} strokeWidth="1" opacity="0.25" />
      </g>
    </svg>
  );
}

export default function AuthCheckDemo() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useLiveInView();
  const panelRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [attract, setAttract] = useState(false);
  const [lastTouch, setLastTouch] = useState(0);
  // Pre-interaction nudge dies PERMANENTLY on first pointer interaction.
  const [nudgeKilled, setNudgeKilled] = useState(false);
  // Reduced motion: static verdict by default; panel tap toggles the
  // static pristine (ghost) state back in — zero timers, zero motion.
  const [reducedShown, setReducedShown] = useState(true);

  const dragRef = useRef(null);
  const autoRafRef = useRef(null);
  // Entrance beat: one short partial sweep (~26% travel, out and back)
  // that ignites and releases the first ghost row — shows the mechanic
  // during the arrival swipe. One-shot per entry; interval-driven (not
  // rAF — see the hero count-up WebKit lesson).
  const beatDoneRef = useRef(false);
  const beatTimersRef = useRef([]);
  // >=10s cooldown between entrance-beat fires (see shelf demo note).
  const lastBeatAtRef = useRef(0);
  // Attract cap: the loop stops after 2 cycles per section entry.
  const attractCyclesRef = useRef(0);

  const cancelBeat = useCallback(() => {
    for (const id of beatTimersRef.current) {
      clearTimeout(id);
      clearInterval(id);
    }
    beatTimersRef.current = [];
  }, []);

  const cancelAuto = useCallback(() => {
    if (autoRafRef.current) {
      cancelAnimationFrame(autoRafRef.current);
      autoRafRef.current = null;
    }
  }, []);

  /* One-shot sweep at hero pacing — used by the tap fallback. Runs from
     0 regardless of current position so a tap always tells the full
     story, then holds the end state. Debounced: taps landing while a
     sweep is in flight are ignored (the running sweep continues), same
     contract as the scan demo. */
  const runSweep = useCallback(() => {
    if (autoRafRef.current) return; // debounce, don't restart
    const t0 = performance.now();
    const step = (ts) => {
      const t = Math.min((ts - t0) / SWEEP_MS, 1);
      setProgress(easeInOutCubic(t));
      if (t < 1) autoRafRef.current = requestAnimationFrame(step);
      else autoRafRef.current = null;
    };
    autoRafRef.current = requestAnimationFrame(step);
  }, [cancelAuto]);

  /* Entrance beat — runs once per entry on a pristine panel. The 6s
     attract clock restarts from beat END (lastTouch), so beat and
     attract can never stack. Any pointerdown cancels it (takeControl →
     cancelBeat). */
  useEffect(() => {
    if (!inView) {
      beatDoneRef.current = false;
      attractCyclesRef.current = 0;
      return;
    }
    if (reduced || beatDoneRef.current || nudgeKilled || attract) return;
    beatDoneRef.current = true;
    if (Date.now() - lastBeatAtRef.current < 10000) return; // cooldown
    lastBeatAtRef.current = Date.now();
    const DUR = 1200;
    const delay = setTimeout(() => {
      const t0 = Date.now();
      const id = setInterval(() => {
        const t = Math.min((Date.now() - t0) / DUR, 1);
        const tri = t < 0.5 ? t * 2 : (1 - t) * 2; // out and back
        setProgress(0.26 * easeInOutCubic(tri));
        if (t >= 1) {
          clearInterval(id);
          setProgress(0);
          setLastTouch(Date.now());
        }
      }, 33);
      beatTimersRef.current.push(id);
    }, 400);
    beatTimersRef.current.push(delay);
    return cancelBeat;
  }, [inView, reduced, attract, nudgeKilled, cancelBeat]);

  /* Idle watcher — arms the attract loop after 6s without interaction,
     only while on-screen and not already attracting. Gated on `reduced`
     so reduced-motion visitors get zero timers. */
  useEffect(() => {
    if (reduced || !inView || attract) return;
    if (attractCyclesRef.current >= 2) return; // capped until re-entry
    const t = setTimeout(() => setAttract(true), 6000);
    return () => clearTimeout(t);
  }, [reduced, inView, attract, lastTouch]);

  /* Attract loop — sweep → hold 2s → fade reset → brief settle → again.
     The cleanup (off-screen, interaction, unmount) kills every pending
     timer and frame, so nothing runs while scrolled away. */
  useEffect(() => {
    if (!attract || !inView || reduced) return;
    let cancelled = false;
    let raf = null;
    let timer = null;
    const cycle = () => {
      if (cancelled) return;
      attractCyclesRef.current += 1;
      if (attractCyclesRef.current > 2) {
        setAttract(false); // rest until the section is re-entered
        return;
      }
      const t0 = performance.now();
      const step = (ts) => {
        if (cancelled) return;
        const t = Math.min((ts - t0) / SWEEP_MS, 1);
        setProgress(easeInOutCubic(t));
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          timer = setTimeout(() => {
            if (cancelled) return;
            setFading(true);
            timer = setTimeout(() => {
              if (cancelled) return;
              setProgress(0);
              setFading(false);
              timer = setTimeout(cycle, 900);
            }, 400);
          }, 2000);
        }
      };
      raf = requestAnimationFrame(step);
    };
    setProgress(0);
    cycle();
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      setFading(false);
    };
  }, [attract, inView, reduced]);

  /* Off-screen: stop any tap-initiated sweep too. */
  useEffect(() => {
    if (!inView) cancelAuto();
  }, [inView, cancelAuto]);

  const takeControl = useCallback(() => {
    setNudgeKilled(true);
    setAttract(false);
    // NOTE: deliberately does NOT cancel a tap-initiated sweep — taps
    // mid-sweep are debounced away; only an ARMED DRAG takes the line
    // (cancelAuto lives in onPointerMove's arming branch).
    cancelBeat(); // an in-progress entrance beat yields instantly
    setFading(false);
    setLastTouch(Date.now());
  }, [cancelBeat]);

  const onPointerDown = (e) => {
    if (reduced) {
      setReducedShown((v) => !v); // static toggle: verdict ↔ ghost state
      return;
    }
    takeControl();
    const rect = panelRef.current.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, moved: false, rect };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — drag still works within the panel */
    }
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) < 6) return;
    if (!d.moved) cancelAuto(); // an armed drag takes the line from a sweep
    d.moved = true;
    const p = (e.clientX - d.rect.left) / d.rect.width;
    setProgress(Math.max(0, Math.min(1, p)));
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    setLastTouch(Date.now());
    if (d && !d.moved) runSweep(); // tap fallback
  };

  const onPointerCancel = () => {
    // Browser took the gesture (vertical pan-y scroll) — release cleanly.
    dragRef.current = null;
    setLastTouch(Date.now());
  };

  // Every visual derives from one progress value, so scrubbing backward
  // resets checks/verdict automatically. Reduced motion pins p statically
  // to 1 (verdict) or 0 (ghost state) via the tap toggle.
  const p = reduced ? (reducedShown ? 1 : 0) : progress;
  const verdict = p >= END;
  const lineShown = !reduced && !verdict;
  // Nudge contract: killed forever after first interaction, suspended
  // during attract (attract owns the line), paused off-screen, never
  // under reduced motion, and only while the line rests at 0.
  const nudge = !reduced && !nudgeKilled && !attract && inView && progress === 0;

  return (
    <section className="pro-snap-section" style={{ padding: SECTION_PADDING, position: "relative", zIndex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: NUDGE_STYLES }} />
      <SectionShell maxWidth={720}>
        <FadeUp>
          <Eyebrow text="— the fake check" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              margin: "0 0 28px",
              padding: 0,
              color: "#fff",
            }}
          >
            catch the rep before it burns you.
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div ref={rootRef}>
            {/* Camera-view panel — pan-y keeps vertical swipes with the
                page scroller; only horizontal drags reach the scanline. */}
            <div
              ref={panelRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              style={{
                position: "relative",
                borderRadius: 20,
                border: "1px solid rgba(92,224,184,0.25)",
                background: "rgba(255,255,255,0.02)",
                boxShadow: "0 20px 60px rgba(92,224,184,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                padding: "16px 18px 8px",
                boxSizing: "border-box",
                overflow: "hidden",
                touchAction: "pan-y",
                cursor: reduced ? "default" : "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {/* Replay affordance — same pill language as the scan demo.
                  The TAP TARGET is the whole panel (tap = auto sweep). */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  zIndex: 4,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.mint,
                  border: "1px solid rgba(92,224,184,0.4)",
                  borderRadius: 999,
                  padding: "4px 9px",
                  background: "rgba(7,5,16,0.6)",
                  opacity: (reduced ? reducedShown : verdict && !attract) ? 1 : 0,
                  transition: reduced ? "none" : `opacity 300ms ${EASE} 250ms`,
                  pointerEvents: "none",
                }}
              >
                {reduced ? "tap to reset" : "↻ scan again"}
              </div>

              {/* Scene content — fades as one unit during attract reset. */}
              <div
                style={{
                  opacity: fading ? 0 : 1,
                  transition: `opacity 400ms ${EASE}`,
                }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  {/* Hoodie + verdict stamp overlay */}
                  <div style={{ position: "relative", width: "46%", flexShrink: 0 }}>
                    <div style={{ width: "100%", aspectRatio: "200 / 240" }}>
                      <HoodieIcon />
                    </div>
                    <div
                      aria-hidden={!verdict}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          border: `3px solid ${RED}`,
                          borderRadius: 6,
                          padding: "7px 14px",
                          background: "rgba(7,5,16,0.82)",
                          fontFamily: "var(--font-bebas), sans-serif",
                          fontSize: "clamp(20px,5.5vw,30px)",
                          letterSpacing: "0.08em",
                          color: RED,
                          whiteSpace: "nowrap",
                          opacity: verdict ? 1 : 0,
                          transform: verdict ? "rotate(-9deg) scale(1)" : "rotate(-9deg) scale(1.5)",
                          transition: reduced ? "none" : "opacity 240ms ease-out, transform 240ms cubic-bezier(0.2,1.3,0.4,1)",
                          willChange: "transform, opacity",
                        }}
                      >
                        REP DETECTED
                        <div
                          aria-hidden="true"
                          className={verdict && !reduced ? "acd-stamp-pulse" : ""}
                          style={{
                            position: "absolute",
                            inset: -6,
                            borderRadius: 9,
                            border: `2px solid ${RED}`,
                            opacity: 0,
                            pointerEvents: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist — ghost state at rest: all four rows sit
                      visible as dim mint placeholders (text only, no
                      marks), so the visitor can see WHAT dragging will
                      reveal. Each row ignites to its full colored state
                      the moment the scanline crosses its zone, and
                      de-ignites back to ghost on scrub-back because
                      everything is derived from p. Trigger points (at:)
                      untouched. */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {CHECKS.map((chk) => {
                      const shown = p >= chk.at;
                      const color = chk.pass ? C.mint : RED;
                      // 0.3 (was 0.15): 0.15 rendered as an illegible smudge on real
                      // devices. No parent opacity multiplies this — the color alpha
                      // is the final rendered value.
                      const GHOST = "rgba(92,224,184,0.3)";
                      return (
                        <div
                          key={chk.label}
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: "clamp(10px,2.9vw,13px)",
                              color: shown ? (chk.pass ? "rgba(255,255,255,0.7)" : color) : GHOST,
                              whiteSpace: "nowrap",
                              transition: reduced ? "none" : `color 280ms ${EASE}`,
                            }}
                          >
                            {chk.label}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono), monospace",
                              fontWeight: 700,
                              fontSize: 14,
                              color,
                              lineHeight: 1,
                              display: "inline-block",
                              opacity: shown ? 1 : 0,
                              transform: shown ? "scale(1)" : "scale(0.4)",
                              transition: reduced
                                ? "none"
                                : `opacity 260ms ${EASE}, transform 260ms cubic-bezier(0.2,1.4,0.4,1)`,
                            }}
                            aria-hidden="true"
                          >
                            {chk.pass ? "✓" : "✗"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verdict subline — the payoff beat */}
                <div
                  style={{
                    marginTop: 6,
                    minHeight: 20,
                    textAlign: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "clamp(11px,3vw,13px)",
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.7)",
                    opacity: verdict ? 1 : 0,
                    transform: verdict ? "translateY(0)" : "translateY(8px)",
                    transition: reduced ? "none" : `opacity 320ms ${EASE} 140ms, transform 320ms ${EASE} 140ms`,
                  }}
                >
                  walk away. keep your $200.
                </div>

                {/* micro-CTA: reserved slot, anchor only. Appears at full
                    completion; resets on scrub-back below END and on demo
                    reset because it derives purely from `verdict`. */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  tabIndex={verdict ? 0 : -1}
                  aria-hidden={!verdict}
                  style={{
                    display: "block",
                    margin: "2px auto 0",
                    height: 20,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: verdict ? "pointer" : "default",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: C.mint,
                    opacity: verdict ? 1 : 0,
                    transform: verdict ? "translateY(0)" : "translateY(6px)",
                    transition: reduced ? "none" : `opacity 320ms ${EASE} 450ms, transform 320ms ${EASE} 450ms`,
                    pointerEvents: verdict ? "auto" : "none",
                  }}
                >
                  never eat a $200 mistake again &rarr;
                </button>
              </div>

              {/* Scanline + handle — position driven by transform only.
                  The wrapper spans the panel, so translateX(p*100%) maps
                  progress 1:1 onto panel width. Fades out on verdict. */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  transform: `translateX(${Math.min(p, END) * 100}%)`,
                  opacity: lineShown ? 1 : 0,
                  transition: `opacity 260ms ${EASE}`,
                  willChange: "transform, opacity",
                }}
              >
              {/* nudge layer: separate element from the progress transform
                  above, so the idle sway never touches drag math */}
              <div className={nudge ? "acd-nudge" : ""} style={{ position: "absolute", inset: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    bottom: 8,
                    left: 0,
                    width: 2,
                    background: "linear-gradient(180deg, transparent, #5CE0B8 18%, #5CE0B8 82%, transparent)",
                    boxShadow: "0 0 10px 2px rgba(92,224,184,0.5)",
                  }}
                />
                {/* grip handle: 44px hit zone centered near the line's
                    visual x. The zone is empty padding; the scanline's
                    x-origin and all drag math are untouched. */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 14,
                    transform: "translate(-50%, -50%)",
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 32,
                      borderRadius: 10,
                      background: C.mint,
                      boxShadow: "0 0 14px rgba(92,224,184,0.65)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(7,5,16,0.6)" }} />
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(7,5,16,0.6)" }} />
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(7,5,16,0.6)" }} />
                  </div>
                  <span
                    aria-hidden="true"
                    className={nudge ? "acd-chevron" : ""}
                    style={{
                      position: "absolute",
                      left: 40,
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 16,
                      color: C.mint,
                      opacity: 0,
                      lineHeight: 1,
                    }}
                  >
                    &rsaquo;
                  </span>
                </div>
              </div>
              </div>
            </div>

            {/* Prompt line — also a tap target for the auto sweep. Hidden
                under reduced motion (there's nothing to drag). */}
            {!reduced && (
              <button
                type="button"
                className={inView && progress === 0 && !attract ? "acd-tap-pulse" : ""}
                onClick={() => {
                  takeControl();
                  runSweep();
                }}
                style={{
                  display: "block",
                  margin: "14px auto 0",
                  background: "none",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(92,224,184,0.55)",
                }}
              >
                drag to scan it yourself
              </button>
            )}
          </div>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
