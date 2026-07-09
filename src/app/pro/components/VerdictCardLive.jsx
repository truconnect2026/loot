"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import { CheckIcon, CoinMark } from "./atoms.jsx";
import { usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";
import { PyrexBowl } from "../../marketing-screens/_frame";

/**
 * Live, looping scan→verdict animation for the hero phone.
 *
 * ONE DOM STRUCTURE UNDER ALL CONDITIONS: reduced motion pins the phase
 * to "hold" (static assembled verdict, zero timers) inside THIS tree.
 * The old `if (reduced) return <VerdictCard/>` twin swap was the last
 * structural conditional on the page — and because the reduced flag
 * initializes from matchMedia on the client while SSR renders the live
 * tree, Reduce-Motion devices hydrated into a DIFFERENT structure than
 * the server painted. That divergence class is dead: same tree, always.
 *
 * INTERACTIVE (tap to scan): the old forever-loop is gone. One trigger
 * function — runScan() — plays the SAME frame→sweep→assemble sequence
 * (same phases, same durations, same CSS keyframes) and terminates at
 * "hold", where the verdict stays until the visitor taps again ("reset"
 * bridges held→fresh scan on replay). It is called from exactly two
 * places: first-scroll-into-view autoplay (once), and taps on the
 * viewfinder (the whole phone screen is the tap target). Mid-animation
 * taps are debounced away, not queued.
 *
 * Visibility tracking is local to this file (not the shared useInView,
 * which is a one-shot "seen once" hook and can't report going back out
 * of view) so the idle affordance pulse pauses off-screen and an
 * interrupted autoplay re-arms on re-entry.
 */

const PHASES = ["frame", "sweep", "assemble", "hold", "reset"];
const DURATIONS = { frame: 600, sweep: 700, assemble: 1400, hold: 3500, reset: 400 };
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
.vcl-sweep-track.vcl-active { animation: vclSweepMove 0.7s ${EASE} 1; }

@keyframes vclFlash {
  0%, 74% { opacity: 0; }
  86%     { opacity: 0.32; }
  100%    { opacity: 0; }
}
.vcl-flash { opacity: 0; }
.vcl-flash.vcl-active { animation: vclFlash 0.7s ease-out 1; }

@keyframes vclBracketPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.vcl-bracket { opacity: 0.5; transition: opacity 0.3s ease; }
.vcl-bracket.vcl-active { animation: vclBracketPulse 0.35s ease-in-out 2; }
/* idle tap affordance — gentle, transform/opacity only, class-gated on
   in-view + idle + motion-ok so it costs nothing off-screen */
.vcl-bracket.vcl-idle { animation: vclBracketPulse 2.2s ease-in-out infinite; }
@keyframes vclTapPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
.vcl-tap-label { animation: vclTapPulse 2.2s ease-in-out infinite; }
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

/* Numbers start counting 250ms into "assemble" and settle FAST (550ms —
   the comps/AUTHENTIC reveals wait until after it settles, so no frame
   ever shows a mid-count range next to sold comps). Holds at target
   through "hold", resets to 0 once the cycle leaves assemble/hold.
   Re-fires every loop (no fired-once guard) — that's the point.
   Reduced motion: pinned to target, zero timers. */
function useCountUp(target, phase, reduced) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (phase === "assemble") {
      const t = setTimeout(() => setActive(true), 250);
      return () => clearTimeout(t);
    }
    if (phase === "hold") return; // keep counting/holding, no reset
    setActive(false);
  }, [phase, reduced]);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    // setInterval + wall clock, NOT requestAnimationFrame: iOS in-app
    // webviews (and headless WebKit) throttle rAF hard enough that the
    // count froze at $0–$0 while the timer-driven phase machine kept
    // going. Timers are the proven-reliable clock here.
    const start = Date.now();
    const dur = 550;
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p >= 1) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, [active, target]);

  return reduced ? target : value;
}

function Bracket({ corner, pulse, idle }) {
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
      className={`vcl-bracket${pulse ? " vcl-active" : ""}${idle ? " vcl-idle" : ""}`}
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
  // Motion path: "idle" at rest; runScan() walks the SAME phase chain
  // the old loop used, then parks at "hold" until the next tap.
  const [phase, setPhase] = useState("idle");
  // Reduced path: static verdict by default; tap toggles the static
  // idle viewfinder back in — zero timers, zero motion, ever.
  const [reducedShown, setReducedShown] = useState(true);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const runningRef = useRef(false);
  const autoplayedRef = useRef(false);
  const timersRef = useRef([]);

  // THE single source of truth for the sequence — autoplay and taps both
  // call this; nothing else advances the phase machine.
  const runScan = useCallback(() => {
    if (runningRef.current) return; // debounce: mid-animation taps ignored
    runningRef.current = true;
    // Replays from a held verdict crossfade back through "reset" first —
    // the same 400ms bridge the old loop used, no new animation logic.
    const seq = phaseRef.current === "hold" ? ["reset", "frame", "sweep", "assemble", "hold"] : ["frame", "sweep", "assemble", "hold"];
    let acc = 0;
    seq.forEach((ph, i) => {
      timersRef.current.push(
        setTimeout(() => {
          setPhase(ph);
          if (i === seq.length - 1) runningRef.current = false;
        }, acc),
      );
      acc += DURATIONS[ph];
    });
  }, []);

  // First-view autoplay: run the sequence ONCE so passive viewers see it
  // work. If the visitor scrolls away mid-run, cancel cleanly and re-arm
  // (they never saw the verdict); once it completes, the verdict holds
  // and re-entries do NOT replay.
  useEffect(() => {
    if (reduced) return;
    if (!inView) {
      if (runningRef.current) {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        runningRef.current = false;
        setPhase("idle");
        autoplayedRef.current = false;
      }
      return;
    }
    if (!autoplayedRef.current) {
      autoplayedRef.current = true;
      const t = setTimeout(runScan, 450);
      timersRef.current.push(t);
    }
  }, [inView, reduced, runScan]);

  // unmount safety
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const handleTap = () => {
    if (reduced) {
      setReducedShown((v) => !v); // static toggle: verdict ↔ idle
      return;
    }
    runScan();
  };

  const low = useCountUp(75, phase, reduced);
  const high = useCountUp(95, phase, reduced);

  const effPhase = reduced ? (reducedShown ? "hold" : "idle") : phase;
  const viewfinderShown =
    effPhase === "idle" || effPhase === "frame" || effPhase === "sweep" || effPhase === "reset";
  const verdictShown = effPhase === "assemble" || effPhase === "hold";
  const idle = effPhase === "idle";
  const held = effPhase === "hold" && !runningRef.current;

  return (
    <div
      ref={rootRef}
      onClick={handleTap}
      role="button"
      aria-label={held ? "scan again" : "tap to scan"}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", cursor: "pointer" }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* App-header skin — mirrors the dashboard header (src/app/app/
          page.tsx: CoinMark + LOOT.WORKS wordmark over a hairline).
          The app sets it in Outfit; /pro's kit substitutes Manrope at
          the same size/tracking/color. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 14px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,5,16,0.85)",
        }}
      >
        <CoinMark size={18} />
        <span
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: C.mint,
          }}
        >
          LOOT.WORKS
        </span>
      </div>

      {/* Tab-bar hint — the app really has one (src/components/nav/
          TabBar.tsx: Home / Sourcing / SCAN / Tools / Me, mint top
          hairline, blurred dark bar). Simplified, non-interactive. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          height: 30,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          borderTop: "1px solid rgba(92,224,184,0.15)",
          background: "rgba(10,10,10,0.8)",
        }}
      >
        {/* Real app labels + tracking (src/components/nav/TabBar.tsx
            lines 78-82: Home / Sourcing / SCAN / Tools / Me at 0.06em) —
            the old ALL-CAPS 0.12em rendering crammed SOURCING into SCAN
            at frame width. */}
        {["Home", "Sourcing", "SCAN", "Tools", "Me"].map((t) => (
          <span
            key={t}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 7,
              letterSpacing: "0.06em",
              textAlign: "center",
              color: t === "SCAN" ? C.mint : "rgba(255,255,255,0.4)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Camera layer — ALWAYS visible, every phase. During the scan
          phases the composition sits centered and large; when the sheet
          rises the whole composition steps back (transform-only: up +
          scaled) into the band above the sheet, so the item silhouette
          stays on screen through assemble/hold instead of dimming into a
          near-black strip. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: viewfinderShown ? 1 : 0.85,
          transition: reduced ? "none" : `opacity 400ms ${EASE}`,
          willChange: "opacity",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "15% 11% 12%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: viewfinderShown ? "translateY(0) scale(1)" : "translateY(-6%) scale(0.38)",
            transformOrigin: "center top",
            transition: reduced ? "none" : `transform 420ms ${EASE}`,
            willChange: "transform",
          }}
        >
        <div
          style={{
            position: "relative",
            // Height-proportional, not width-derived: a width-based
            // square left a giant black band above and below on tall
            // screens. Min presence 150px per the content-owns-the-stage
            // principle.
            width: "82%",
            maxWidth: 310,
            height: "58%",
            minHeight: 150,
            maxHeight: 440,
            borderRadius: 20,
            background: "rgba(255,255,255,0.025)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* faint reticle crosshairs — static composition, no motion */}
          <div aria-hidden="true" style={{ position: "absolute", left: "8%", right: "8%", top: "50%", height: 1, background: "rgba(92,224,184,0.08)" }} />
          <div aria-hidden="true" style={{ position: "absolute", top: "8%", bottom: "8%", left: "50%", width: 1, background: "rgba(92,224,184,0.08)" }} />
          <Bracket corner="tl" pulse={effPhase === "sweep"} idle={idle && inView && !reduced} />
          <Bracket corner="tr" pulse={effPhase === "sweep"} idle={idle && inView && !reduced} />
          <Bracket corner="bl" pulse={effPhase === "sweep"} idle={idle && inView && !reduced} />
          <Bracket corner="br" pulse={effPhase === "sweep"} idle={idle && inView && !reduced} />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "min(58%, 170px)" }}>
              <PyrexBowl size="100%" />
            </div>
          </div>

          {/* Scan sweep bar */}
          <div className={`vcl-sweep-track${effPhase === "sweep" ? " vcl-active" : ""}`} style={{ position: "absolute", inset: 0 }}>
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
            className={`vcl-flash${effPhase === "sweep" ? " vcl-active" : ""}`}
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
            opacity: viewfinderShown ? 1 : 0,
            transition: reduced ? "none" : `opacity 300ms ${EASE}`,
          }}
          className={idle && inView && !reduced ? "vcl-tap-label" : ""}
        >
          {idle ? "tap to scan" : effPhase === "sweep" ? "analyzing…" : "scanning…"}
        </div>
        </div>
      </div>

      {/* Replay affordance — appears once the verdict holds. Small pill
          only; the TAP TARGET is the whole screen (root onClick). Under
          reduced motion it reads "tap to reset" and toggles statically. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 50,
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
          opacity: held ? 1 : 0,
          transition: reduced ? "none" : `opacity 300ms ${EASE} 250ms`,
          pointerEvents: "none",
        }}
      >
        {reduced ? "tap to reset" : "↻ scan again"}
      </div>

      {/* Verdict layer — phases 3 & 4, staggered per-element reveal.
          Bottom-anchored and content-hugging like the real BottomSheet:
          full-height (top 13%) left a dead band under AUTHENTIC on tall
          9:19.5 screens; now the dim camera owns the space above. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "auto",
          bottom: 0,
          // 72% (was 87%): the camera zone above the held sheet keeps a
          // composed ≥25%-of-screen presence with the item visible — the
          // held verdict is the frame people screenshot.
          maxHeight: "72%",
          opacity: verdictShown ? 1 : 0,
          transform: verdictShown ? "translateY(0)" : "translateY(14px)",
          transition: reduced ? "none" : `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
          willChange: "opacity, transform",
          display: "flex",
          flexDirection: "column",
          padding: "7% 9% 12%",
          boxSizing: "border-box",
          // Sheet skin per src/components/shared/BottomSheet.tsx: the
          // real result presents as a bottom sheet.
          background: "rgba(18,14,24,0.92)",
          borderTop: `2px solid ${C.mint}`,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        {/* sheet drag-handle nub, as BottomSheet renders */}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.15)",
            margin: "0 auto 6px",
            flexShrink: 0,
          }}
        />
        {/* 0.5 vs 1: bias the result block toward the top of the sheet —
            equal spacers left a dead band above the title on tall screens */}
        <div style={{ flex: "0.5 1 auto" }} />

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

        <Reveal shown={verdictShown} delayMs={60} reduced={reduced}>
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

        <Reveal shown={verdictShown} delayMs={120} mode="pop" reduced={reduced}>
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

        <Reveal shown={verdictShown} delayMs={200} reduced={reduced}>
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
            <Reveal key={line} shown={verdictShown} delayMs={880 + i * 60} reduced={reduced}>
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

        <Reveal shown={verdictShown} delayMs={1050} mode="pop-strong" reduced={reduced}>
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
