"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import { CheckIcon, CoinMark } from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";
import { PyrexBowl } from "../../marketing-screens/_frame";
import VerdictCard from "./VerdictCard.jsx";

/**
 * Live, looping scan→verdict animation for the hero phone. Self-contained:
 * VerdictCard.jsx (the static card) stays untouched as the reduced-motion
 * fallback and is reused directly for it, not re-implemented.
 *
 * Loop (~5.6s), transform/opacity only:
 *   frame (0.8s) → sweep (0.8s) → assemble (1.6s) → hold (2s) → reset (0.4s)
 *
 * Visibility tracking is local to this file (not the shared useInView,
 * which is a one-shot "seen once" hook and can't report going back out of
 * view) so the loop can pause off-screen and resume on-screen without
 * touching anything shared.
 */

const PHASES = ["frame", "sweep", "assemble", "hold", "reset"];
const DURATIONS = { frame: 800, sweep: 800, assemble: 1600, hold: 2000, reset: 400 };
const EASE = "cubic-bezier(0.16,1,0.3,1)";

const comps = ["sold $85 · 3d ago", "sold $78 · 1w ago", "sold $92 · 2w ago"];

const STYLES = `
@keyframes vclSweepMove {
  0%   { transform: translateY(-100%); opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
.vcl-sweep-track { transform: translateY(-100%); opacity: 0; will-change: transform, opacity; }
.vcl-sweep-track.vcl-active { animation: vclSweepMove 0.8s ${EASE} 1; }

@keyframes vclFlash {
  0%, 74% { opacity: 0; }
  86%     { opacity: 0.32; }
  100%    { opacity: 0; }
}
.vcl-flash { opacity: 0; }
.vcl-flash.vcl-active { animation: vclFlash 0.8s ease-out 1; }

@keyframes vclBracketPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.vcl-bracket { opacity: 0.5; transition: opacity 0.3s ease; }
.vcl-bracket.vcl-active { animation: vclBracketPulse 0.4s ease-in-out 2; }
`;

/* Live, continuously-updating visibility tracker — local to this file.
   The shared useInView only ever reports true once (by design, for
   reveal-on-scroll); this one flips back to false so the loop can pause. */
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

/* Advances through PHASES on a timer chain for as long as `active` is
   true; clears all pending timers (and stops burning cycles) the moment
   `active` goes false. Resuming restarts cleanly from "frame". */
function usePhaseLoop(active) {
  const [phase, setPhase] = useState("frame");
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
  return active ? phase : "frame";
}

/* Numbers start counting ~400ms into "assemble" (so the reveal is visible
   before it starts moving), hold at target through "hold", reset to 0
   once the cycle leaves assemble/hold. Re-fires every loop (no fired-once
   guard) — that's the point. */
function useCountUp(target, phase) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (phase === "assemble") {
      const t = setTimeout(() => setActive(true), 400);
      return () => clearTimeout(t);
    }
    if (phase === "hold") return; // keep counting/holding, no reset
    setActive(false);
  }, [phase]);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf;
    let start = null;
    const dur = 700;
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

function Bracket({ corner, pulse }) {
  const size = 18;
  const stroke = 2;
  const inset = 6;
  const pos = {
    tl: { top: inset, left: inset, borderTop: `${stroke}px solid ${C.mint}`, borderLeft: `${stroke}px solid ${C.mint}` },
    tr: { top: inset, right: inset, borderTop: `${stroke}px solid ${C.mint}`, borderRight: `${stroke}px solid ${C.mint}` },
    bl: { bottom: inset, left: inset, borderBottom: `${stroke}px solid ${C.mint}`, borderLeft: `${stroke}px solid ${C.mint}` },
    br: { bottom: inset, right: inset, borderBottom: `${stroke}px solid ${C.mint}`, borderRight: `${stroke}px solid ${C.mint}` },
  }[corner];
  return (
    <div
      aria-hidden="true"
      className={`vcl-bracket${pulse ? " vcl-active" : ""}`}
      style={{ position: "absolute", width: size, height: size, ...pos }}
    />
  );
}

/* Fade/slide (or scale-pop) reveal, timed purely via CSS transition-delay
   off one shared `shown` boolean — transform/opacity only. */
function Reveal({ shown, delayMs = 0, mode = "fade", reduced, children }) {
  const hiddenTransform = mode === "pop" ? "scale(0.9)" : mode === "pop-strong" ? "scale(0.85)" : "translateY(10px)";
  const shownTransform = mode === "pop" || mode === "pop-strong" ? "scale(1)" : "translateY(0)";
  return (
    <div
      style={{
        opacity: reduced ? 1 : shown ? 1 : 0,
        transform: reduced ? "none" : shown ? shownTransform : hiddenTransform,
        transition: reduced
          ? "none"
          : `opacity 420ms ${EASE} ${delayMs}ms, transform 420ms ${EASE} ${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function VerdictCardLive() {
  const reduced = usePrefersReducedMotion();
  const [rootRef, inView] = useLiveInView();
  const phase = usePhaseLoop(!reduced && inView);
  const low = useCountUp(75, phase);
  const high = useCountUp(95, phase);

  // Reduced motion: identical static card, no timers, no loop — reuse the
  // real fallback component directly rather than re-describing its markup.
  if (reduced) {
    return (
      <div ref={rootRef} style={{ width: "100%", height: "100%" }}>
        <VerdictCard />
      </div>
    );
  }

  const viewfinderShown = phase === "frame" || phase === "sweep" || phase === "reset";
  const verdictShown = phase === "assemble" || phase === "hold";

  return (
    <div ref={rootRef} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Persistent wordmark — stays put through the whole loop instead of
          re-animating with either layer. */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "9%",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <CoinMark size={16} />
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: C.mint,
          }}
        >
          LOOT.WORKS
        </span>
      </div>

      {/* Viewfinder layer — phases 1 & 2 (and briefly 5, fading back in). */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: viewfinderShown ? 1 : 0,
          transition: `opacity 400ms ${EASE}`,
          willChange: "opacity",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "22% 11% 10%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "76%",
            aspectRatio: "1 / 1.05",
            borderRadius: 20,
            background: "rgba(255,255,255,0.025)",
            overflow: "hidden",
          }}
        >
          <Bracket corner="tl" pulse={phase === "sweep"} />
          <Bracket corner="tr" pulse={phase === "sweep"} />
          <Bracket corner="bl" pulse={phase === "sweep"} />
          <Bracket corner="br" pulse={phase === "sweep"} />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "58%" }}>
              <PyrexBowl size="100%" />
            </div>
          </div>

          {/* Scan sweep bar */}
          <div className={`vcl-sweep-track${phase === "sweep" ? " vcl-active" : ""}`} style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, transparent, #5CE0B8, transparent)",
                boxShadow: "0 0 12px 2px rgba(92,224,184,0.6)",
              }}
            />
          </div>

          {/* Capture flash */}
          <div
            className={`vcl-flash${phase === "sweep" ? " vcl-active" : ""}`}
            style={{ position: "absolute", inset: 0, background: "#fff", pointerEvents: "none" }}
            aria-hidden="true"
          />
        </div>

        <div
          style={{
            marginTop: "8%",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(92,224,184,0.55)",
          }}
        >
          {phase === "sweep" ? "analyzing…" : "scanning…"}
        </div>
      </div>

      {/* Verdict layer — phases 3 & 4, staggered per-element reveal. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: verdictShown ? 1 : 0,
          transform: verdictShown ? "translateY(0)" : "translateY(14px)",
          transition: `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
          willChange: "opacity, transform",
          display: "flex",
          flexDirection: "column",
          padding: "22% 9% 8%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ flex: "1 1 auto" }} />

        <Reveal shown={verdictShown} delayMs={0} reduced={reduced}>
          <h3
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(18px,7cqw,26px)",
              lineHeight: 1.05,
              letterSpacing: "0.03em", // Bebas sub-32px optical tracking
              color: "#fff",
              margin: "0 0 4px",
            }}
          >
            PYREX BUTTERPRINT 403
          </h3>
        </Reveal>

        <Reveal shown={verdictShown} delayMs={130} reduced={reduced}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              margin: "0 0 14px",
            }}
          >
            {/* en-dash for numeric ranges is correct and permanent; the
                no-dash rule applies to em-dashes in prose only */}
            1957&ndash;68 &middot; Pyrex &middot; verified
          </p>
        </Reveal>

        <Reveal shown={verdictShown} delayMs={280} mode="pop" reduced={reduced}>
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              background: C.mint,
              color: "#070510",
              fontFamily: "var(--font-mono), monospace",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.06em",
              padding: "5px 12px",
              borderRadius: 999,
              marginBottom: "9%",
            }}
          >
            CONDITION: EXCELLENT
          </div>
        </Reveal>

        <Reveal shown={verdictShown} delayMs={430} reduced={reduced}>
          <div style={{ textAlign: "center", marginBottom: "8%" }}>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 4,
              }}
            >
              RESALE RANGE
            </div>
            <div
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(26px,11cqw,40px)",
                color: C.mint,
                lineHeight: 1,
                letterSpacing: "0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${low}&ndash;${high}
            </div>
          </div>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: "7%" }}>
          {comps.map((line, i) => (
            <Reveal key={line} shown={verdictShown} delayMs={600 + i * 60} reduced={reduced}>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                }}
              >
                {line}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal shown={verdictShown} delayMs={900} mode="pop-strong" reduced={reduced}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: C.mint,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <CheckIcon size={13} color={C.mint} /> AUTHENTIC
          </div>
        </Reveal>

        <div style={{ flex: "1 1 auto" }} />

        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: C.mint,
            paddingTop: 16,
          }}
        >
          loot.works
        </div>
      </div>
    </div>
  );
}
