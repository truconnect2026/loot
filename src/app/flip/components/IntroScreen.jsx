"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import FlipCoyote from "@/components/shared/FlipCoyote";

const HEADLINE = "FLIP OR SKIP";

/**
 * The TAP-IN landing — the money screen and the COLD-OPEN of a daily game.
 * Cold paid traffic from Instagram lands here, so it is engineered to convert
 * a stranger in under ten seconds: Kronos (the host) makes it feel alive and
 * branded, and DAY {puzzleNumber} is promoted from a buried corner chip to a
 * HERO STREAK badge — the ritual hook of a daily game (Wordle/NYT Games), the
 * second thing the eye hits after Kronos.
 *
 * FENCED (presentation only — never touched here): the TAP IN handler
 * (`onStart`), the daily-play gating, and the day counter's REAL value
 * (`puzzleNumber`, from getPuzzleNumber() = days since the 2026-05-01 epoch).
 * The badge STAMPS the real number in; it never invents or alters it.
 *
 * Layout hierarchy (in-flow, top→bottom): Kronos host · DAY streak badge ·
 * hero headline · one-line hook · hero CTA · the FREE flex · confidence line.
 * The DAY badge used to be position:absolute at top:16 and Kronos's centered
 * z-1 column painted over it ("AY 77" clipped through his ears); it now lives
 * IN the flow below Kronos, so it can never touch his silhouette again.
 *
 * Motion: the screen ASSEMBLES like a game booting — Kronos lands with spring
 * weight and a breathing mint aura, the DAY streak stamps in like a scoreboard,
 * the headline resolves per-letter, the hook arrives, TAP IN settles last as
 * the payoff and pulses to be pressed. Under reduced motion (David's device)
 * every entrance collapses to its final state and every idle loop rests at a
 * DECLARED base value (see the reduced-motion block in INTRO_STYLES — no revert
 * to CSS-default brightness). Compositor-only throughout (opacity/transform/
 * filter); the atmosphere layer is pointer-events:none and can never eat a tap.
 */

const INTRO_STYLES = `
/* ── DAY streak badge — the hero ritual element ─────────────────────────── */
.flip-streak {
  position: relative;
  display: inline-flex; align-items: center; gap: 9px;
  padding: 6px 15px 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(245,197,24,0.38);
  background: linear-gradient(180deg, rgba(245,197,24,0.10) 0%, rgba(92,224,184,0.05) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 22px -10px rgba(245,197,24,0.5);
}
.flip-streak-aura {
  position: absolute; inset: -45% -12%; z-index: -1; pointer-events: none;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(245,197,24,0.26) 0%, transparent 68%);
  opacity: 0.5;
  animation: flip-streak-aura 3.8s ease-in-out infinite;
  will-change: opacity, transform;
}
@keyframes flip-streak-aura {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.72; transform: scale(1.06); }
}
.flip-streak-flame { font-size: 19px; line-height: 1; filter: drop-shadow(0 0 7px rgba(245,197,24,0.65)); }
.flip-streak-label {
  font-family: var(--mono); font-weight: 700; font-size: 9px;
  letter-spacing: 0.26em; color: rgba(255,255,255,0.62);
}
.flip-streak-num {
  font-family: var(--display); font-weight: 900; font-size: 30px; line-height: 0.9;
  letter-spacing: 0.01em; color: var(--mint);
  text-shadow: 0 0 18px rgba(92,224,184,0.45);
  font-variant-numeric: tabular-nums;
}

/* ── Kronos: idle bob (transform) layered on the existing host glow-breathe,
      plus a breathing mint aura for centerpiece presence ─────────────────── */
.flip-intro-host-wrap { position: relative; line-height: 0; }
.flip-intro-host-bob { animation: flip-host-bob 4.4s ease-in-out infinite; will-change: transform; }
@keyframes flip-host-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
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

/* ── Intro atmosphere — two faint, slow-drifting glows so the frame reads as a
      LIVE space. The main starfield is the shared CosmicBackdrop (out of this
      component's scope); these ride behind the legibility scrim. Never a tap
      target. ───────────────────────────────────────────────────────────────*/
.flip-intro-atmos { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.flip-intro-atmos span {
  position: absolute; border-radius: 50%; filter: blur(34px); opacity: 0.5;
  will-change: transform;
}
.flip-intro-atmos span:nth-child(1) {
  width: 220px; height: 220px; left: 6%; top: 20%;
  background: rgba(92,224,184,0.10); animation: flip-atmos-a 16s ease-in-out infinite;
}
.flip-intro-atmos span:nth-child(2) {
  width: 260px; height: 260px; right: 4%; bottom: 16%;
  background: rgba(107,70,193,0.11); animation: flip-atmos-b 19s ease-in-out infinite;
}
@keyframes flip-atmos-a { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(24px, -18px); } }
@keyframes flip-atmos-b { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 16px); } }

/* ── Reduced motion: declared static rests (fill-mode lesson — never revert to
      a CSS default). Every idle loop above resolves to a composed still. ──── */
@media (prefers-reduced-motion: reduce) {
  .flip-streak-aura { animation: none; opacity: 0.5; transform: scale(1); }
  .flip-intro-host-bob { animation: none; transform: translateY(0); }
  .flip-intro-host-aura { animation: none; opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  .flip-intro-atmos span { animation: none; opacity: 0.5; transform: none; }
}

/* ── Short viewports (iPhone SE / small Androids ≤700px): keep the added badge
      from pushing the cold-open below the fold. ──────────────────────────── */
@media (max-height: 700px) {
  .flip-streak { padding: 5px 13px 5px 10px; gap: 7px; }
  .flip-streak-num { font-size: 25px; }
  .flip-streak-flame { font-size: 16px; }
}
`;

export default function IntroScreen({ puzzleNumber, onStart, ready = true, warping = false, replayCount = 0, konamiArmed = false, konamiHint = false }) {
  const reduced = useReducedMotion();
  const [firstTime, setFirstTime] = useState(false);
  const [playedToday, setPlayedToday] = useState(null); // { score: N } or null
  const [showIdle, setShowIdle] = useState(false);
  const [replayBannerDismissed, setReplayBannerDismissed] = useState(false);
  // The DISPLAYED day number. Initialized to the REAL puzzleNumber so SSR and
  // the first client render match (hydration-safe) and reduced-motion shows the
  // real value instantly; the count-up below only animates the display.
  const [dayDisplay, setDayDisplay] = useState(puzzleNumber);

  // Scoreboard count-up — the badge's number rolls up to the REAL puzzleNumber
  // as it stamps in (a game booting). It lands EXACTLY on puzzleNumber and can
  // never invent or inflate it. No flash: the badge is opacity 0 until its 0.4s
  // Framer entrance, so seeding the low start value at mount is invisible; the
  // roll begins as the badge becomes visible. Reduced motion: no roll — the real
  // number is shown instantly (the useState init IS the declared static base).
  useEffect(() => {
    if (reduced) { setDayDisplay(puzzleNumber); return; }
    const start = Math.max(0, puzzleNumber - 14);
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
        setDayDisplay(Math.round(start + (puzzleNumber - start) * eased));
        if (p >= 1) window.clearInterval(intervalId);
      }, 40);
    }, 400);
    return () => { window.clearTimeout(delayId); window.clearInterval(intervalId); };
  }, [reduced, puzzleNumber]);

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

  const headlineChars = HEADLINE.split("");

  // One entrance helper — under reduced motion every element renders at its
  // final state instantly (a designed static composition); otherwise it
  // fades/rises on the house decelerate curve at a staggered delay.
  const enter = (delay, y = 16) =>
    reduced
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div className={`flip-intro ${warping ? "flip-intro--warping" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: INTRO_STYLES }} />

      {/* Atmosphere — faint drifting glows behind the scrim so the cold-open
          reads as a live space. pointer-events:none; z0 (below content). */}
      <div className="flip-intro-atmos" aria-hidden="true">
        <span /><span />
      </div>

      {/* Legibility scrim — a radial vignette that darkens the central
          content column so the cosmic ring/starfield read as ambient depth
          BEHIND the text, never streaks across it. Sits above the fixed
          cosmic backdrop (z0), below the content (z1). */}
      <div className="flip-intro-scrim" aria-hidden="true" />

      <div className="flip-intro-inner">
        {/* Kronos — the host. Centerpiece presence: a breathing mint aura +
            a gentle idle bob (compositor-only), "hyped" callout energy the
            moment a stranger opens the screen. Entrance spring on the wrap;
            the aura sits OUTSIDE the host's own drop-shadow filter so the
            filter can't smear it. */}
        <motion.div
          className="flip-intro-host-wrap"
          initial={reduced ? false : { opacity: 0, scale: 0.8, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 0.1, type: "spring", stiffness: 200, damping: 16 }}
        >
          <span className="flip-intro-host-aura" aria-hidden="true" />
          <div className={`flip-intro-host ${reduced ? "flip-intro-host--static" : ""}`}>
            <div className="flip-intro-host-bob">
              <FlipCoyote mood="hyped" size={132} />
            </div>
          </div>
        </motion.div>

        {/* DAY streak — the hook. Promoted from a buried absolute chip (which
            Kronos clipped) to a HERO scoreboard badge that STAMPS in second,
            right after Kronos. The number is the REAL puzzleNumber, rendered
            verbatim — the motion animates the badge's arrival, not the value. */}
        <motion.div
          className="flip-streak"
          aria-label={`day ${puzzleNumber}`}
          initial={reduced ? false : { opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 0.4, type: "spring", stiffness: 320, damping: 15 }}
        >
          <span className="flip-streak-aura" aria-hidden="true" />
          <span className="flip-streak-flame" aria-hidden="true">🔥</span>
          <span className="flip-streak-label" aria-hidden="true">DAY</span>
          {/* Display rolls up to the real value; the aria-label above carries
              the true "day {puzzleNumber}" for screen readers regardless. */}
          <span className="flip-streak-num" aria-hidden="true">{dayDisplay}</span>
        </motion.div>

        <h1 className="flip-intro-title flip-intro-title--gradient" aria-label={HEADLINE}>
          {headlineChars.map((c, i) => (
            <motion.span
              key={`${c}-${i}`}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? undefined : { delay: 0.5 + i * 0.04, duration: 0.4 }}
              style={{ display: "inline-block", whiteSpace: "pre" }}
            >
              {c}
            </motion.span>
          ))}
        </h1>

        <motion.p className="flip-intro-hook" {...enter(0.9)}>
          ten thrift finds. one call each. trust your gut.
        </motion.p>

        {/* Hero CTA — the single most tappable object in the app. Layered
            depth (gradient + inner highlight + bloom), lands with spring
            weight, idle pulse says "tap me", press = scale + glow surge. */}
        <motion.button
          type="button"
          onClick={onStart}
          disabled={!ready}
          className={`flip-tap-in flip-tap-in--cosmic ${showIdle && ready ? "flip-tap-in--idle" : ""}`}
          initial={reduced ? false : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 1.05, type: "spring", stiffness: 210, damping: 17 }}
          whileTap={reduced ? undefined : { scale: 0.97 }}
        >
          <span className="flip-tap-in-particles" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="flip-tap-in-label">{ready ? (playedToday ? "PLAY AGAIN →" : "TAP IN →") : "LOADING…"}</span>
          <span className="flip-tap-in-bloom" aria-hidden="true" />
        </motion.button>

        {/* The FREE flex — a PRIMARY selling point for cold traffic (no
            friction, no risk), presented confidently, never as fine print. */}
        <motion.div className="flip-intro-free" {...enter(1.25)}>
          <span className="flip-intro-free-item">free</span>
          <span className="flip-intro-free-dot" aria-hidden="true">·</span>
          <span className="flip-intro-free-item">no signup</span>
          <span className="flip-intro-free-dot" aria-hidden="true">·</span>
          <span className="flip-intro-free-item">one round a day</span>
        </motion.div>

        <motion.p className="flip-intro-confidence" {...enter(1.4)}>
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

        {firstTime && !showIdle && !playedToday && (
          <motion.div
            className="flip-intro-tip"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? undefined : { delay: 2.2 }}
          >
            free forever. no card, no catch.
          </motion.div>
        )}

        {showIdle && (
          <div className="flip-intro-tip flip-intro-tip--idle">press it →</div>
        )}
      </div>
    </div>
  );
}
