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
 * "The whole shelf" — tap-to-price. Each item on the shelf is its own
 * plain tap target: tap one and its detection box draws, its value tag
 * pops, and the running total eases up by that amount. Price all five
 * and the completion line lands under $420, holds ~3s, then the scene
 * soft-resets to untapped. Values are illustrative examples, not
 * earnings claims.
 *
 * The old full choreography (settle → detect → value → total → hold →
 * reset) survives as the idle ATTRACT mode: it plays once after 6s of
 * no interaction, then rests. It only arms while the shelf is pristine
 * (zero taps) — attract stomping a visitor's half-priced shelf would
 * be hostile. Any tap cancels it instantly; because the user-mode
 * visuals derive purely from the tapped set (never from attract's
 * phase), cancellation can't leave half-drawn attract boxes behind.
 *
 * Reduced motion: full static end-state (all boxes, tags, $420, and
 * the completion line), zero timers, and taps are DISABLED — the end
 * state already shows everything priced, so there's nothing for a tap
 * to add. Buttons are plain click targets (no gesture capture), so
 * vertical swipes scroll the page normally.
 */

const ATTRACT_PHASES = ["settle", "detect", "value", "total", "hold", "reset"];
const ATTRACT_DURATIONS = { settle: 800, detect: 1800, value: 1600, total: 1200, hold: 1400, reset: 600 };
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

/* Local, continuously-updating visibility tracker — same pattern as the
   other live demos. */
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

/* ONE-SHOT attract runner: walks the classic choreography a single time
   while `active`, then calls onDone. Cleanup kills every pending timer,
   so leaving the viewport (or tapping) stops it dead. */
function useAttractRun(active, onDone) {
  const [phase, setPhase] = useState("settle");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let idx = 0;
    let timer = null;
    setPhase("settle");
    const tick = () => {
      if (cancelled) return;
      setPhase(ATTRACT_PHASES[idx]);
      timer = setTimeout(() => {
        idx += 1;
        if (idx >= ATTRACT_PHASES.length) {
          if (!cancelled) onDoneRef.current();
          return;
        }
        tick();
      }, ATTRACT_DURATIONS[ATTRACT_PHASES[idx]]);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setPhase("settle");
    };
  }, [active]);
  return active ? phase : "settle";
}

/* Eased number display — animates from its CURRENT shown value to each
   new target (per-tap increments ride the same treatment as the old
   0→420 count-up). Reduced motion snaps instantly with no RAF. */
function useEasedNumber(target, reduced) {
  const [value, setValue] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    if (reduced) {
      shownRef.current = target;
      setValue(target);
      return;
    }
    const from = shownRef.current;
    if (from === target) return;
    let raf;
    let start = null;
    const dur = 600;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      shownRef.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [target, reduced]);
  return value;
}

/* Viewfinder corner brackets framing the whole shelf. */
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

/* Simple mint-line silhouettes — the bowl reuses the existing PyrexBowl
   illustration (same item the hero scans). */
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

  const [tapped, setTapped] = useState(() => new Set());
  const [attract, setAttract] = useState(false);
  const [fading, setFading] = useState(false);
  const [lastTouch, setLastTouch] = useState(0);

  const attractActive = attract && inView && !reduced;
  const phase = useAttractRun(attractActive, () => {
    setAttract(false);
    setLastTouch(Date.now()); // rest, then the idle watcher may re-arm
  });

  /* Idle watcher — attract arms only while the shelf is pristine (zero
     taps): replaying the auto show over a half-priced shelf would wipe
     the visitor's progress. */
  useEffect(() => {
    if (reduced || !inView || attract || tapped.size > 0) return;
    const t = setTimeout(() => setAttract(true), 6000);
    return () => clearTimeout(t);
  }, [reduced, inView, attract, tapped, lastTouch]);

  /* Completion: all five priced → hold ~3s → soft fade reset back to
     untapped. Timers die off-screen and restart on return. */
  useEffect(() => {
    if (reduced || !inView || tapped.size !== ITEMS.length) return;
    let t2;
    const t1 = setTimeout(() => {
      setFading(true);
      t2 = setTimeout(() => {
        setTapped(new Set());
        setFading(false);
        setLastTouch(Date.now());
      }, 400);
    }, 3000);
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
      setFading(false);
    };
  }, [reduced, inView, tapped]);

  const tapItem = (key) => {
    if (reduced || fading) return; // reduced motion: end state shown, taps disabled
    setAttract(false); // cancel attract instantly; user visuals never read phase
    setLastTouch(Date.now());
    setTapped((prev) => {
      if (prev.has(key)) return prev; // re-tap = no-op
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  // Attract drives the classic phase booleans; user mode derives purely
  // from the tapped set. Reduced motion pins the complete end state.
  const attractBoxes = attractActive && (phase === "detect" || phase === "value" || phase === "total" || phase === "hold");
  const attractTags = attractActive && (phase === "value" || phase === "total" || phase === "hold");
  const attractTotal = attractActive && (phase === "total" || phase === "hold");
  // Scene fades out during attract's reset beat and during the post-
  // completion soft reset; reduced motion never fades.
  const sceneShown = reduced || (!fading && !(attractActive && phase === "reset"));

  const complete = reduced || tapped.size === ITEMS.length;
  const promptShown = !reduced && !attractActive && tapped.size === 0;
  const scanningShown = attractActive && (phase === "settle" || phase === "detect" || phase === "value");
  const totalShown = reduced || attractTotal || (!attractActive && tapped.size > 0);

  const userSum = ITEMS.reduce((s, it) => s + (tapped.has(it.key) ? it.value : 0), 0);
  const totalTarget = reduced ? SHELF_TOTAL : attractActive ? (attractTotal ? SHELF_TOTAL : 0) : userSum;
  const totalValue = useEasedNumber(totalTarget, reduced);

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
          <div
            ref={rootRef}
            style={{
              position: "relative",
              marginTop: 32,
              borderRadius: 20,
              border: "1px solid rgba(92,224,184,0.25)",
              background: "rgba(255,255,255,0.02)",
              boxShadow: "0 20px 60px rgba(92,224,184,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              // Balanced vertical padding: the panel hugs its content
              // (items row + prompt + total), no stretched dead zone.
              padding: "22px 16px 16px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <Bracket corner="tl" pulse={attractActive && phase === "detect"} />
            <Bracket corner="tr" pulse={attractActive && phase === "detect"} />
            <Bracket corner="bl" pulse={attractActive && phase === "detect"} />
            <Bracket corner="br" pulse={attractActive && phase === "detect"} />

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
                {ITEMS.map((item, i) => {
                  const priced = reduced || tapped.has(item.key);
                  const boxOn = attractActive ? attractBoxes : priced;
                  const tagOn = attractActive ? attractTags : priced;
                  // Stagger only belongs to the attract choreography; a
                  // user's tap responds immediately.
                  const boxDelay = attractActive ? i * 350 : 0;
                  const tagDelay = attractActive ? i * 280 : 0;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => tapItem(item.key)}
                      aria-label={`price the ${item.label}`}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        cursor: reduced ? "default" : "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
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

                        <div
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 10,
                            border: `1.5px solid ${C.mint}`,
                            opacity: boxOn ? 1 : 0,
                            transform: boxOn ? "scale(1)" : "scale(0.82)",
                            transition: reduced
                              ? "none"
                              : `opacity 360ms ${EASE} ${boxDelay}ms, transform 360ms ${EASE} ${boxDelay}ms`,
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
                              opacity: boxOn ? 1 : 0,
                              transform: boxOn ? "scale(1)" : "scale(0.4)",
                              transition: reduced
                                ? "none"
                                : `opacity 300ms ${EASE} ${boxDelay + 150}ms, transform 300ms ${EASE} ${boxDelay + 150}ms`,
                            }}
                          >
                            <CheckIcon size={9} color="#070510" />
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontWeight: 700,
                          fontSize: "clamp(10px,2.8vw,13px)",
                          color: "#070510",
                          background: C.mint,
                          borderRadius: 999,
                          padding: "3px 8px",
                          opacity: tagOn ? 1 : 0,
                          transform: tagOn ? "translateY(0) scale(1)" : "translateY(6px) scale(0.85)",
                          transition: reduced
                            ? "none"
                            : `opacity 320ms ${EASE} ${tagDelay}ms, transform 320ms ${EASE} ${tagDelay}ms`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ${item.value}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Prompt row — sits DIRECTLY under the items so the eye
                  never crosses a void to find it. Prompt (user idle) and
                  "scanning shelf…" (attract) share the slot; they're
                  mutually exclusive states. */}
              <div style={{ position: "relative", marginTop: 12, height: 18, textAlign: "center" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: promptShown ? 1 : 0,
                    transition: reduced ? "none" : `opacity 300ms ${EASE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(92,224,184,0.55)",
                    pointerEvents: "none",
                  }}
                >
                  tap an item to price it
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: scanningShown ? 1 : 0,
                    transition: reduced ? "none" : `opacity 300ms ${EASE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(92,224,184,0.55)",
                    pointerEvents: "none",
                  }}
                >
                  scanning shelf…
                </div>
              </div>

              {/* Total row — the lower third of the panel. Stable
                  minHeight so the tally appearing never shifts layout. */}
              <div style={{ marginTop: 10, minHeight: 54, textAlign: "center" }}>
                <div
                  style={{
                    opacity: totalShown ? 1 : 0,
                    transform: totalShown ? "translateY(0)" : "translateY(12px)",
                    transition: reduced ? "none" : `opacity 380ms ${EASE}, transform 380ms ${EASE}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    willChange: "opacity, transform",
                    pointerEvents: "none",
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
                  {/* Completion line — lands when the visitor prices all
                      five (always shown under reduced motion). */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "rgba(92,224,184,0.6)",
                      marginTop: 4,
                      opacity: complete && !attractActive ? 1 : 0,
                      transform: complete && !attractActive ? "translateY(0)" : "translateY(6px)",
                      transition: reduced ? "none" : `opacity 340ms ${EASE} 250ms, transform 340ms ${EASE} 250ms`,
                    }}
                  >
                    the whole shelf. one walkthrough.
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
