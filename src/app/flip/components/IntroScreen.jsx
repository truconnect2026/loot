"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import FlipCoyote from "@/components/shared/FlipCoyote";

const HEADLINE = "FLIP OR SKIP";

/**
 * The TAP-IN landing — the money screen. This is where cold paid traffic
 * from Instagram lands, so it is engineered to convert a stranger in under
 * ten seconds: Kronos (the host) makes it feel alive and branded, the
 * cosmic starfield stays as premium ambient depth behind a legibility
 * scrim (text is never crossed by a streak line), and the "free · no
 * signup" line is presented as a PRIMARY selling point, not fine print.
 *
 * Hierarchy (reserved zones, top→bottom): DAY badge · Kronos host · hero
 * headline · one-line hook · hero CTA · the FREE flex · first-timer
 * confidence line.
 *
 * Motion: the screen ASSEMBLES cinematically — Kronos arrives, the
 * headline resolves per-letter, the CTA lands with spring weight, the
 * reassurance fades in — a staggered sequence on --ease-out. Under
 * reduced motion (David's device) `useReducedMotion` collapses every
 * entrance to its final state: a complete, intentional static composition,
 * not a paused frame. Compositor-only throughout (opacity/transform/filter).
 */
export default function IntroScreen({ puzzleNumber, onStart, ready = true, warping = false, replayCount = 0, konamiArmed = false, konamiHint = false }) {
  const reduced = useReducedMotion();
  const [firstTime, setFirstTime] = useState(false);
  const [playedToday, setPlayedToday] = useState(null); // { score: N } or null
  const [showIdle, setShowIdle] = useState(false);
  const [replayBannerDismissed, setReplayBannerDismissed] = useState(false);

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
      {/* Legibility scrim — a radial vignette that darkens the central
          content column so the cosmic ring/starfield read as ambient depth
          BEHIND the text, never streaks across it. Sits above the fixed
          cosmic backdrop (z0), below the content (z1). */}
      <div className="flip-intro-scrim" aria-hidden="true" />

      <span className="flip-intro-day flip-day-chip">DAY {puzzleNumber}</span>

      <div className="flip-intro-inner">
        {/* Kronos — the host. Present, not a corner glyph; a soft halo
            breathes (filter) so he feels alive. "hyped" = let's-go energy
            the moment a stranger opens the screen. */}
        <motion.div
          className={`flip-intro-host ${reduced ? "flip-intro-host--static" : ""}`}
          initial={reduced ? false : { opacity: 0, scale: 0.8, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 0.1, type: "spring", stiffness: 200, damping: 16 }}
        >
          <FlipCoyote mood="hyped" size={132} />
        </motion.div>

        <h1 className="flip-intro-title flip-intro-title--gradient" aria-label={HEADLINE}>
          {headlineChars.map((c, i) => (
            <motion.span
              key={`${c}-${i}`}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? undefined : { delay: 0.28 + i * 0.05, duration: 0.4 }}
              style={{ display: "inline-block", whiteSpace: "pre" }}
            >
              {c}
            </motion.span>
          ))}
        </h1>

        <motion.p className="flip-intro-hook" {...enter(0.72)}>
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
          transition={reduced ? undefined : { delay: 0.9, type: "spring", stiffness: 210, damping: 17 }}
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
        <motion.div className="flip-intro-free" {...enter(1.1)}>
          <span className="flip-intro-free-item">free</span>
          <span className="flip-intro-free-dot" aria-hidden="true">·</span>
          <span className="flip-intro-free-item">no signup</span>
          <span className="flip-intro-free-dot" aria-hidden="true">·</span>
          <span className="flip-intro-free-item">one round a day</span>
        </motion.div>

        <motion.p className="flip-intro-confidence" {...enter(1.3)}>
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
