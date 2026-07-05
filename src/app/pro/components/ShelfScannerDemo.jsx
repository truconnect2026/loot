"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import {
  CheckIcon,
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_SIZE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";
import { PyrexBowl } from "../../marketing-screens/_frame";

/**
 * "The whole shelf" — a second live proof moment right after the hero,
 * showing the marquee capability (value several items in one pass, not
 * one at a time). Fully self-contained: its own phase loop, its own
 * visibility tracker, its own icon set — nothing shared is modified.
 * Values are illustrative examples, not earnings claims.
 *
 * Loop (~7.4s), transform/opacity only:
 *   settle (0.8s) → detect (1.8s) → value (1.6s) → total (1.2s)
 *   → hold (1.4s) → reset (0.6s)
 */

const PHASES = ["settle", "detect", "value", "total", "hold", "reset"];
const DURATIONS = { settle: 800, detect: 1800, value: 1600, total: 1200, hold: 1400, reset: 600 };
const EASE = "cubic-bezier(0.16,1,0.3,1)";

const ITEMS = [
  { key: "bowl", label: "pyrex bowl", value: 85 },
  { key: "vinyl", label: "vinyl record", value: 40 },
  { key: "jacket", label: "chore jacket", value: 140 },
  { key: "camera", label: "camera", value: 95 },
  { key: "sneaker", label: "sneaker", value: 60 },
];
const SHELF_TOTAL = ITEMS.reduce((sum, i) => sum + i.value, 0); // 420

const STYLES = `
@keyframes ssdBracketPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.ssd-bracket { opacity: 0.5; transition: opacity 0.3s ease; }
.ssd-bracket.ssd-active { animation: ssdBracketPulse 0.6s ease-in-out 3; }
`;

/* Local, continuously-updating visibility tracker (not the shared
   useInView, which only ever reports true once) — same approach as
   VerdictCardLive's useLiveInView, duplicated locally so this section
   stays fully self-contained. */
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

/* Same timer-chain pattern as VerdictCardLive's usePhaseLoop: advances
   while `active`, clears pending timers (stops burning cycles) the
   instant `active` goes false, restarts cleanly from "settle". */
function usePhaseLoop(active) {
  const [phase, setPhase] = useState("settle");
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let idx = 0;
    let timer = null;
    const tick = () => {
      if (cancelled) return;
      setPhase(PHASES[idx]);
      timer = setTimeout(() => {
        idx = (idx + 1) % PHASES.length;
        tick();
      }, DURATIONS[PHASES[idx]]);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active]);
  return active ? phase : "settle";
}

/* Running total — counts up while `active` (the "total" beat), holds at
   target through "hold", resets to 0 the moment the loop leaves those
   phases. Reduced motion never calls this with active=true; the caller
   renders the target directly instead. */
function useTotalCountUp(target, active) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf;
    let start = null;
    const dur = 750;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [active, target]);
  return value;
}

/* Viewfinder corner brackets framing the whole shelf — same visual
   language as the hero's Bracket, pulsing while detection runs. */
function Bracket({ corner, pulse }) {
  const size = 20;
  const stroke = 2;
  const inset = 10;
  const pos = {
    tl: { top: inset, left: inset, borderTop: `${stroke}px solid ${C.mint}`, borderLeft: `${stroke}px solid ${C.mint}` },
    tr: { top: inset, right: inset, borderTop: `${stroke}px solid ${C.mint}`, borderRight: `${stroke}px solid ${C.mint}` },
    bl: { bottom: inset, left: inset, borderBottom: `${stroke}px solid ${C.mint}`, borderLeft: `${stroke}px solid ${C.mint}` },
    br: { bottom: inset, right: inset, borderBottom: `${stroke}px solid ${C.mint}`, borderRight: `${stroke}px solid ${C.mint}` },
  }[corner];
  return (
    <div
      aria-hidden="true"
      className={`ssd-bracket${pulse ? " ssd-active" : ""}`}
      style={{ position: "absolute", width: size, height: size, ...pos }}
    />
  );
}

/* Simple mint-line silhouettes — lightweight SVG, no raster assets. The
   bowl reuses the existing PyrexBowl illustration (same item the hero
   scans, so the two demos read as one continuous story). */
function VinylIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
      <circle cx="50" cy="50" r="44" fill="#120f1a" stroke={C.mint} strokeWidth="2" />
      <circle cx="50" cy="50" r="33" fill="none" stroke={C.mint} strokeWidth="0.8" opacity="0.4" />
      <circle cx="50" cy="50" r="23" fill="none" stroke={C.mint} strokeWidth="0.8" opacity="0.4" />
      <circle cx="50" cy="50" r="13" fill="rgba(92,224,184,0.14)" stroke={C.mint} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="3" fill={C.mint} />
    </svg>
  );
}

function JacketIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
      <path
        d="M35 18 L22 26 L27 42 L33 37 L33 84 L67 84 L67 37 L73 42 L78 26 L65 18 L57 24 L43 24 Z"
        fill="none"
        stroke={C.mint}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <line x1="50" y1="26" x2="50" y2="84" stroke={C.mint} strokeWidth="1" opacity="0.4" />
      <rect x="41" y="46" width="18" height="13" rx="2" fill="none" stroke={C.mint} strokeWidth="1" opacity="0.55" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="16" y="36" width="68" height="42" rx="6" fill="none" stroke={C.mint} strokeWidth="2.2" />
      <rect x="35" y="24" width="20" height="13" rx="2" fill="none" stroke={C.mint} strokeWidth="2" />
      <circle cx="50" cy="57" r="17" fill="none" stroke={C.mint} strokeWidth="2.2" />
      <circle cx="50" cy="57" r="9" fill="rgba(92,224,184,0.14)" stroke={C.mint} strokeWidth="1" />
      <circle cx="71" cy="45" r="3" fill={C.mint} />
    </svg>
  );
}

function SneakerIcon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block" }}>
      <path
        d="M10 68 Q11 58 23 56 L38 49 Q46 45 56 47 L63 51 Q78 48 89 57 Q94 61 91 68 L89 73 L11 73 Z"
        fill="none"
        stroke={C.mint}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M30 56 L38 62 M44 51 L52 58 M58 49 L65 56" stroke={C.mint} strokeWidth="1.4" opacity="0.5" />
      <line x1="11" y1="73" x2="91" y2="73" stroke={C.mint} strokeWidth="2.2" />
    </svg>
  );
}

function ItemIcon({ itemKey }) {
  if (itemKey === "bowl") return <PyrexBowl size="100%" />;
  if (itemKey === "vinyl") return <VinylIcon />;
  if (itemKey === "jacket") return <JacketIcon />;
  if (itemKey === "camera") return <CameraIcon />;
  return <SneakerIcon />;
}

export default function ShelfScannerDemo() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useLiveInView();
  const phase = usePhaseLoop(!reduced && inView);

  // Reduced motion renders the full end state (boxes + tags + total),
  // scanning label hidden, zero timers (phase loop and count-up both
  // stay inactive).
  const sceneShown = reduced || phase !== "reset";
  const boxesShown = reduced || phase === "detect" || phase === "value" || phase === "total" || phase === "hold";
  const tagsShown = reduced || phase === "value" || phase === "total" || phase === "hold";
  const totalShown = reduced || phase === "total" || phase === "hold";
  const scanningLabelShown = !reduced && (phase === "settle" || phase === "detect" || phase === "value");
  const bracketsPulse = !reduced && phase === "detect";

  const counted = useTotalCountUp(SHELF_TOTAL, !reduced && (phase === "total" || phase === "hold"));
  const totalValue = reduced ? SHELF_TOTAL : counted;

  return (
    <section className="pro-snap-section" style={{ padding: SECTION_PADDING, position: "relative", zIndex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <SectionShell maxWidth={720}>
        <FadeUp>
          <Eyebrow text="— the whole shelf" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: SECTION_HEADLINE_SIZE,
              lineHeight: 1.15,
              margin: "0 0 20px",
              padding: 0,
              color: "#fff",
            }}
          >
            value the whole shelf. at once.
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            point at a shelf and loot values every item in seconds. no scanning one by one.
          </p>
        </FadeUp>

        <FadeUp delay={0.45}>
          {/* Camera-view panel — the demo canvas. Corner brackets are static
              frame decor (pulsing during detect); the scene inside fades as
              one unit on reset so per-element staggers only play forward. */}
          <div
            ref={rootRef}
            style={{
              position: "relative",
              marginTop: 32,
              borderRadius: 20,
              border: "1px solid rgba(92,224,184,0.25)",
              background: "rgba(255,255,255,0.02)",
              boxShadow: "0 20px 60px rgba(92,224,184,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              padding: "26px 16px 18px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <Bracket corner="tl" pulse={bracketsPulse} />
            <Bracket corner="tr" pulse={bracketsPulse} />
            <Bracket corner="bl" pulse={bracketsPulse} />
            <Bracket corner="br" pulse={bracketsPulse} />

            <div
              style={{
                opacity: sceneShown ? 1 : 0,
                transform: sceneShown ? "translateY(0)" : "translateY(8px)",
                transition: reduced ? "none" : `opacity 500ms ${EASE}, transform 500ms ${EASE}`,
                willChange: "opacity, transform",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${ITEMS.length}, 1fr)`,
                  gap: 8,
                }}
              >
                {ITEMS.map((item, i) => (
                  <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    {/* Item silhouette — sits on the shelf from the start;
                        the detection box draws AROUND it, not instead of it. */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10%",
                        boxSizing: "border-box",
                      }}
                    >
                      <ItemIcon itemKey={item.key} />

                      {/* Detection box + tick, staggered draw-on */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 10,
                          border: `1.5px solid ${C.mint}`,
                          opacity: boxesShown ? 1 : 0,
                          transform: boxesShown ? "scale(1)" : "scale(0.82)",
                          transition: reduced
                            ? "none"
                            : `opacity 360ms ${EASE} ${i * 350}ms, transform 360ms ${EASE} ${i * 350}ms`,
                          willChange: "transform, opacity",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: C.mint,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: boxesShown ? 1 : 0,
                            transform: boxesShown ? "scale(1)" : "scale(0.4)",
                            transition: reduced
                              ? "none"
                              : `opacity 300ms ${EASE} ${i * 350 + 150}ms, transform 300ms ${EASE} ${i * 350 + 150}ms`,
                          }}
                        >
                          <CheckIcon size={9} color="#070510" />
                        </div>
                      </div>
                    </div>

                    {/* Value tag — pops in per item, same order as detection */}
                    <div
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontWeight: 700,
                        fontSize: "clamp(10px,2.8vw,13px)",
                        color: "#070510",
                        background: C.mint,
                        borderRadius: 999,
                        padding: "3px 8px",
                        opacity: tagsShown ? 1 : 0,
                        transform: tagsShown ? "translateY(0) scale(1)" : "translateY(6px) scale(0.85)",
                        transition: reduced
                          ? "none"
                          : `opacity 320ms ${EASE} ${i * 280}ms, transform 320ms ${EASE} ${i * 280}ms`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ${item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom strip — "scanning shelf…" while working, running
                  total slides up once every tag has landed. */}
              <div style={{ position: "relative", marginTop: 20, minHeight: 56, textAlign: "center" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: scanningLabelShown ? 1 : 0,
                    transition: reduced ? "none" : `opacity 300ms ${EASE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(92,224,184,0.55)",
                  }}
                >
                  scanning shelf…
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: totalShown ? 1 : 0,
                    transform: totalShown ? "translateY(0)" : "translateY(12px)",
                    transition: reduced ? "none" : `opacity 380ms ${EASE}, transform 380ms ${EASE}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    willChange: "opacity, transform",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 2,
                    }}
                  >
                    shelf value
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-bebas), sans-serif",
                      fontSize: "clamp(28px,6vw,40px)",
                      lineHeight: 1,
                      color: C.mint,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ${totalValue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </SectionShell>
    </section>
  );
}
