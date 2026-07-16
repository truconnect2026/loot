"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { C } from "../lib/colors.js";
import { CheckIcon, CoinMark, ExampleTag } from "./atoms.jsx";
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

// Scan sequence: idle → frame (reticle detects) → sweep (beam passes) →
// lock (corners snap + capture flash + ANALYZING) → assemble → hold. The
// distinct "lock" beat (was folded into the sweep→assemble jump) is what
// makes the demo read as a real scan resolving rather than a freeze. Total
// to verdict ≈ 550+750+500 = 1.8s of scan, then the sheet builds — "seconds",
// matching the pitch. Rests on hold (the verdict is what people screenshot).
const PHASES = ["frame", "sweep", "lock", "assemble", "hold", "reset"];
const DURATIONS = { frame: 550, sweep: 750, lock: 500, assemble: 1300, hold: 4000, reset: 400 };
const EASE = "cubic-bezier(0.16,1,0.3,1)";

const comps = ["sold $85 · 3d ago", "sold $78 · 1w ago", "sold $92 · 2w ago"];

const STYLES = `
/* Scan beam — a tall gradient band led by a bright mint line, sweeping the
   full item top→bottom once. Transform/opacity only (compositor). */
@keyframes vclSweepMove {
  0%   { transform: translateY(-105%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(105%); opacity: 0; }
}
.vcl-sweep-track { transform: translateY(-105%); opacity: 0; will-change: transform, opacity; }
.vcl-sweep-track.vcl-active { animation: vclSweepMove 0.75s ${EASE} 1; }

/* Capture flash at LOCK (the "photo taken" blink), mint-tinted not white. */
@keyframes vclFlash {
  0%   { opacity: 0; }
  30%  { opacity: 0.3; }
  100% { opacity: 0; }
}
.vcl-flash { opacity: 0; }
.vcl-flash.vcl-active { animation: vclFlash 0.5s ease-out 1; }

@keyframes vclBracketPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.vcl-bracket { opacity: 0.5; transition: opacity 0.3s ease; }
.vcl-bracket.vcl-active { animation: vclBracketPulse 0.35s ease-in-out 2; }
/* LOCK: corners snap solid — a quick scale-settle reads as "locked on". */
@keyframes vclLockSnap { 0% { transform: scale(1.22); } 55% { transform: scale(0.96); } 100% { transform: scale(1); } }
.vcl-bracket.vcl-locked { opacity: 1; animation: vclLockSnap 0.4s ${EASE} 1; }
/* idle tap affordance — gentle, transform/opacity only, class-gated on
   in-view + idle + motion-ok so it costs nothing off-screen */
.vcl-bracket.vcl-idle { animation: vclBracketPulse 2.2s ease-in-out infinite; }
@keyframes vclTapPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
.vcl-tap-label { animation: vclTapPulse 2.2s ease-in-out infinite; }
/* Ambient "live feed" breath — a faint mint sheen drifting in the viewport
   so it reads as a live camera at rest, not a frozen gray plate. Gated on
   in-view + motion via .vcl-live; under reduced motion the class is absent
   and the sheen holds its base opacity — a still, textured viewfinder. */
@keyframes vclAmbient {
  0%, 100% { opacity: 0.3; transform: translateY(-6%); }
  50%      { opacity: 0.62; transform: translateY(6%); }
}
.vcl-ambient { opacity: 0.3; will-change: transform, opacity; }
.vcl-ambient.vcl-live { animation: vclAmbient 4.2s ease-in-out infinite; }
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

function Bracket({ corner, pulse, locked, idle }) {
  const size = 18;
  const stroke = locked ? 2.5 : 2;
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
      className={`vcl-bracket${pulse ? " vcl-active" : ""}${locked ? " vcl-locked" : ""}${idle ? " vcl-idle" : ""}`}
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
    const seq = phaseRef.current === "hold" ? ["reset", "frame", "sweep", "lock", "assemble", "hold"] : ["frame", "sweep", "lock", "assemble", "hold"];
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
  // Camera holds full-size through the whole scan (incl. the lock beat);
  // it only steps back when the verdict sheet rises at "assemble".
  const viewfinderShown =
    effPhase === "idle" || effPhase === "frame" || effPhase === "sweep" || effPhase === "lock" || effPhase === "reset";
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
            // Explicit: Manrope's normal line-height is 1.366, which put
            // the header at ~44px and broke the 44px camera clearance
            // budget. 1.2 locks the header at 12+18+10+1border = 41px.
            lineHeight: 1.2,
            color: C.mint,
          }}
        >
          LOOT.WORKS
        </span>
      </div>

      {/* Tab-bar hint — the app really has one (src/components/nav/
          TabBar.tsx: Home / Sourcing / SCAN / Tools / Me, mint top
          hairline, blurred dark bar). Simplified, non-interactive.
          Sits ABOVE the home-indicator chin (bottom: 14), not on the
          screen edge — the sheet docks onto this bar's top, so nothing
          can ever paint under it or clip at the frame. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 14,
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

      {/* Home-indicator chin — the 14px band that CLOSES the device.
          Without it the composition ended at raw clipped content and the
          frame's 12px bezel read as an open tube. Gesture pill floating
          on the screen's own black, exactly like the real hardware. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 14,
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 64, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.28)" }} />
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
          // Fixed px verticals, NOT width-%: clears the 41px header and
          // the 44px nav+chin at every frame size. Width-derived vertical
          // padding was the root cause of the composition drifting under
          // the chrome on short webviews.
          padding: "44px 11% 47px",
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
            // 0.30 / -4% (was 0.38 / -6%): with real font metrics (mono
            // line-heights pinned at 1.3, header locked to 41px) the
            // scaled reticle box's TOP lands 7-10px below the header at
            // every frame size and its BOTTOM clears the held sheet's
            // top edge by ≥8px even at the 246×456 worst-case screen.
            transform: viewfinderShown ? "translateY(0) scale(1)" : "translateY(-4%) scale(0.30)",
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
            // Camera-feel depth, not a flat gray plate: a lifted-center,
            // vignetted-edge dark gradient reads as a real viewfinder. This
            // sits BEHIND the item and is fully static (compositor-safe, no
            // paint churn); the "live" feel comes from the ambient sheen +
            // grid layers below, not from repainting this base.
            background:
              "radial-gradient(115% 100% at 50% 38%, rgba(38,42,54,0.6) 0%, rgba(12,12,20,0.86) 62%, rgba(4,4,9,0.96) 100%)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.55)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Sensor grid — faint mint lattice, reads as a scan overlay. Static. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(92,224,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(92,224,184,0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              opacity: 0.7,
              pointerEvents: "none",
            }}
          />
          {/* Ambient live-feed sheen — drifts + breathes when in view (motion
              ok); under reduced motion the .vcl-live class is dropped and it
              holds a static faint mint glow, so the viewport still reads as a
              camera, never gray. */}
          <div
            aria-hidden="true"
            className={`vcl-ambient${inView && !reduced ? " vcl-live" : ""}`}
            style={{
              position: "absolute",
              inset: "-20% 0",
              background: "radial-gradient(70% 42% at 50% 50%, rgba(92,224,184,0.12), transparent 72%)",
              pointerEvents: "none",
            }}
          />
          {/* faint reticle crosshairs — static composition, no motion */}
          <div aria-hidden="true" style={{ position: "absolute", left: "8%", right: "8%", top: "50%", height: 1, background: "rgba(92,224,184,0.1)" }} />
          <div aria-hidden="true" style={{ position: "absolute", top: "8%", bottom: "8%", left: "50%", width: 1, background: "rgba(92,224,184,0.1)" }} />
          <Bracket corner="tl" pulse={effPhase === "sweep"} locked={effPhase === "lock"} idle={idle && inView && !reduced} />
          <Bracket corner="tr" pulse={effPhase === "sweep"} locked={effPhase === "lock"} idle={idle && inView && !reduced} />
          <Bracket corner="bl" pulse={effPhase === "sweep"} locked={effPhase === "lock"} idle={idle && inView && !reduced} />
          <Bracket corner="br" pulse={effPhase === "sweep"} locked={effPhase === "lock"} idle={idle && inView && !reduced} />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "min(58%, 170px)" }}>
              <PyrexBowl size="100%" />
            </div>
          </div>

          {/* Scan beam — a tall mint gradient band led by a bright line at
              its lower edge (the current scan position), sweeping the item
              top→bottom once during the sweep phase. Reads clearly as
              "analyzing", where the old 3px hairline was easy to miss. */}
          <div className={`vcl-sweep-track${effPhase === "sweep" ? " vcl-active" : ""}`} style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "42%",
                background: "linear-gradient(180deg, transparent 0%, rgba(92,224,184,0.16) 68%, rgba(92,224,184,0.42) 100%)",
              }}
            >
              {/* leading scan line */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "#5CE0B8",
                  boxShadow: "0 0 14px 3px rgba(92,224,184,0.7)",
                }}
              />
            </div>
          </div>

          {/* Capture flash at LOCK — mint-tinted "photo taken" blink. */}
          <div
            className={`vcl-flash${effPhase === "lock" ? " vcl-active" : ""}`}
            style={{ position: "absolute", inset: 0, background: "rgba(92,224,184,0.5)", pointerEvents: "none" }}
            aria-hidden="true"
          />
        </div>

        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            // Space Mono's normal line-height is 1.481 — every mono line
            // in this card pins an explicit value so the composition
            // budget is deterministic, not font-metric roulette. This
            // status line lives INSIDE the flex-centered column with the
            // reticle box, so at scale(1) it is provably clear of the
            // header and nav at the 246×456 worst case (see fit proof).
            lineHeight: 1.3,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            // LOCK reads brightest (the ANALYZING beat); the other scan
            // states sit a touch dimmer so ANALYZING is the emphasis. The
            // color/weight change is an INSTANT snap at the lock beat, not
            // a transition — animating `color` would be a paint property,
            // and this card's motion budget is compositor-only (the phase
            // switch itself is the "beat", so the snap reads as decisive).
            color: effPhase === "lock" ? C.mint : "rgba(92,224,184,0.55)",
            fontWeight: effPhase === "lock" ? 700 : 400,
            opacity: viewfinderShown ? 1 : 0,
            transition: reduced ? "none" : `opacity 300ms ${EASE}`,
          }}
          className={idle && inView && !reduced ? "vcl-tap-label" : ""}
        >
          {idle
            ? "tap to scan"
            : effPhase === "frame"
              ? "detecting…"
              : effPhase === "sweep"
                ? "scanning…"
                : effPhase === "lock"
                  ? "analyzing…"
                  : "scanning…"}
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
          // Docked exactly on the tab bar's top edge (30px bar + 14px
          // chin) — the sheet can no longer run under the nav or past
          // the frame; its content-hugging height plus this dock IS the
          // clean seam between the two stacked zones.
          bottom: 44,
          // Content-hugging with a hard reserve: at least 84px of camera
          // band (41px header + composed item strip) survives above the
          // held sheet at every frame size. The old fixed 72% cap was
          // SMALLER than the sheet's own content on short webviews, so
          // the excess spilled out the bottom and clipped mid-line.
          maxHeight: "calc(100% - 128px)",
          opacity: verdictShown ? 1 : 0,
          transform: verdictShown ? "translateY(0)" : "translateY(14px)",
          transition: reduced ? "none" : `opacity 400ms ${EASE}, transform 400ms ${EASE}`,
          willChange: "opacity, transform",
          display: "flex",
          flexDirection: "column",
          // Fixed vertical padding (horizontal stays width-%): the old
          // 7%/12% width-derived pair grew with frame WIDTH while the
          // sheet's budget is HEIGHT — the mismatch was the overflow.
          padding: "12px 9% 10px",
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
        {/* Phase 1.2: label the card as an EXAMPLE *VERDICT* — the words
            directly qualify the "AUTHENTIC" / range / comps below as sample
            OUTPUTS of the feature ("here's what a verdict looks like"), never
            as certification of a real item or a real eBay report. */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, flexShrink: 0 }}>
          <ExampleTag label="EXAMPLE VERDICT" />
        </div>

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
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.5)",
              margin: "0 0 6px",
            }}
          >
            {/* en-dash for numeric ranges is correct and permanent; the
                no-dash rule applies to em-dashes in prose only.
                1.2: dropped the standalone "verified" — as a lone word it
                read as certifying THIS real bowl; the authenticity output
                lives (clearly framed as a sample) in the AUTHENTIC line. */}
            1957&ndash;68 &middot; Pyrex
          </p>
        </Reveal>

        <Reveal shown={verdictShown} delayMs={120} mode="pop" reduced={reduced}>
          <div
            style={{
              // Block-level flex, NOT inline-flex: as an inline inside its
              // plain block wrapper the row inherited a 24px strut (16px
              // Manrope × preflight lh 1.5) that silently added 4.3px —
              // the last un-pinned line box in the sheet's height budget.
              display: "flex",
              width: "fit-content",
              background: C.mint,
              color: "#070510",
              fontFamily: "var(--font-mono), monospace",
              fontWeight: 700,
              fontSize: 10,
              lineHeight: 1,
              letterSpacing: "0.06em",
              padding: "5px 12px",
              borderRadius: 999,
              // Even fixed rhythm: the 9%/8%/7% width-derived margins
              // hoarded ~65px up top and starved the bottom rows.
              marginBottom: 8,
            }}
          >
            CONDITION: EXCELLENT
          </div>
        </Reveal>

        <Reveal shown={verdictShown} delayMs={200} reduced={reduced}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                lineHeight: 1,
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

        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 6 }}>
          {comps.map((line, i) => (
            // Comps STAMP in one at a time, top→bottom, like a receipt
            // printing (mode "pop" = scale-pop, 130ms stagger). Reveal's
            // reduced branch renders each at its final opacity 1 / transform
            // none — declared rest, so a reduced user sees all three comps,
            // never a mid-stamp frame.
            <Reveal key={line} shown={verdictShown} delayMs={820 + i * 130} mode="pop" reduced={reduced}>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  lineHeight: 1.3,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                }}
              >
                {line}
              </div>
            </Reveal>
          ))}
        </div>

        {/* AUTHENTIC is the confident tick that closes the receipt. delayMs
            1220 starts it as the last comp is finishing its stamp (the last
            comp begins at 820+2*130 = 1080 and its 420ms pop settles ~1500),
            so the tick lands into the settling receipt, then holds. */}
        <Reveal shown={verdictShown} delayMs={1220} mode="pop-strong" reduced={reduced}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: C.mint,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            <CheckIcon size={13} color={C.mint} /> AUTHENTIC
          </div>
        </Reveal>

        {/* 1.2: example-context legible AT the verdict — a skeptic who only
            catches the "AUTHENTIC" line still reads it as a sample output of
            the feature, not a certificate for a specific real object. */}
        <Reveal shown={verdictShown} delayMs={1330} reduced={reduced}>
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              // Wraps to two lines on narrow frames — 1.3 keeps the
              // two-line block inside the sheet's proven budget.
              lineHeight: 1.3,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(92,224,184,0.5)",
              marginTop: 6,
            }}
          >
            example output · what fake check returns
          </div>
        </Reveal>

        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: "0.14em",
            color: C.mint,
            paddingTop: 6,
          }}
        >
          loot.works
        </div>
      </div>
    </div>
  );
}
