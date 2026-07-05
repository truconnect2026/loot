"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_HEADLINE_SIZE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

/**
 * "The fake check" — interactive authenticate demo. The user drags a
 * mint scanline across an unbranded hoodie; checklist lines assemble as
 * the line crosses their zones, and reaching the right edge slams in a
 * REP DETECTED verdict. Fully scrubbable in both directions because
 * every visual is derived purely from one progress value (0..1).
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

  const dragRef = useRef(null);
  const autoRafRef = useRef(null);

  const cancelAuto = useCallback(() => {
    if (autoRafRef.current) {
      cancelAnimationFrame(autoRafRef.current);
      autoRafRef.current = null;
    }
  }, []);

  /* One-shot sweep at hero pacing — used by the tap fallback. Runs from
     0 regardless of current position so a tap always tells the full
     story, then holds the end state. */
  const runSweep = useCallback(() => {
    cancelAuto();
    const t0 = performance.now();
    const step = (ts) => {
      const t = Math.min((ts - t0) / SWEEP_MS, 1);
      setProgress(easeInOutCubic(t));
      if (t < 1) autoRafRef.current = requestAnimationFrame(step);
      else autoRafRef.current = null;
    };
    autoRafRef.current = requestAnimationFrame(step);
  }, [cancelAuto]);

  /* Idle watcher — arms the attract loop after 6s without interaction,
     only while on-screen and not already attracting. Gated on `reduced`
     so reduced-motion visitors get zero timers. */
  useEffect(() => {
    if (reduced || !inView || attract) return;
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
    setAttract(false);
    cancelAuto();
    setFading(false);
    setLastTouch(Date.now());
  }, [cancelAuto]);

  const onPointerDown = (e) => {
    if (reduced) return;
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
  // resets checks/verdict automatically. Reduced motion pins p to 1.
  const p = reduced ? 1 : progress;
  const verdict = p >= END;
  const lineShown = !reduced && !verdict;

  return (
    <section className="pro-snap-section" style={{ padding: SECTION_PADDING, position: "relative", zIndex: 1 }}>
      <SectionShell maxWidth={720}>
        <FadeUp>
          <Eyebrow text="— the fake check" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: SECTION_HEADLINE_SIZE,
              lineHeight: 1.15,
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
                padding: "22px 18px 16px",
                boxSizing: "border-box",
                overflow: "hidden",
                touchAction: "pan-y",
                cursor: reduced ? "default" : "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
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
                      </div>
                    </div>
                  </div>

                  {/* Checklist — each line assembles the moment the
                      scanline crosses its zone; scrubbing back hides it
                      again because it's derived from p. */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {CHECKS.map((chk) => {
                      const shown = p >= chk.at;
                      const color = chk.pass ? C.mint : RED;
                      return (
                        <div
                          key={chk.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            opacity: shown ? 1 : 0,
                            transform: shown ? "translateX(0)" : "translateX(-8px)",
                            transition: reduced ? "none" : `opacity 280ms ${EASE}, transform 280ms ${EASE}`,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: "clamp(10px,2.9vw,13px)",
                              color: chk.pass ? "rgba(255,255,255,0.7)" : color,
                              whiteSpace: "nowrap",
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
                              transform: shown ? "scale(1)" : "scale(0.4)",
                              transition: reduced ? "none" : "transform 260ms cubic-bezier(0.2,1.4,0.4,1)",
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
                    marginTop: 14,
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
                {/* grabbable handle */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 3,
                    transform: "translateY(-50%)",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: C.mint,
                    boxShadow: "0 0 14px rgba(92,224,184,0.65)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <span style={{ width: 2, height: 8, borderRadius: 1, background: "rgba(7,5,16,0.55)" }} />
                  <span style={{ width: 2, height: 8, borderRadius: 1, background: "rgba(7,5,16,0.55)" }} />
                </div>
              </div>
            </div>

            {/* Prompt line — also a tap target for the auto sweep. Hidden
                under reduced motion (there's nothing to drag). */}
            {!reduced && (
              <button
                type="button"
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
