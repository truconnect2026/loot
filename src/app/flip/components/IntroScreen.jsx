"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import FlipCoyote from "@/components/shared/FlipCoyote";
import { readLiveStreak } from "../lib/localStreak.js";

/**
 * The TAP-IN landing — the free-game on-ramp that pre-sells Pro. flip-or-skip is
 * loot's core loop with the money taken out; a stranger who plays one free round
 * is pre-sold. So this front door's job is to move a cold, no-signup IG visitor
 * from *sees it* → *playing* with minimum friction and maximum pull.
 *
 * HONEST, ADAPTIVE STREAK (the correctness fix):
 *  - PUZZLE global day (puzzleNumber, getPuzzleNumber() epoch-day) is used ONLY
 *    as the "today's board" identifier — like Wordle's puzzle number. It is
 *    NEVER shown as a personal streak.
 *  - USER streak is the visitor's REAL earned consecutive-day run, read from the
 *    local play record (fos-streak-count / fos-last-played-date) via
 *    readLiveStreak() — maintained by ResultReveal on completion; we only READ.
 *  - A FRESH visitor (no record) or a BROKEN run (missed a day) → streak 0 → the
 *    newcomer hook shows, never a number. Only an earned, still-alive run shows
 *    the flame "DAY {streak}" badge. So "DAY 77" can never appear for a stranger.
 *
 * FENCED (never touched here): the TAP IN handler (`onStart`), the one-round-a-day
 * gating, getPuzzleNumber, ResultReveal/dailySeed/easterEggs, the round logic,
 * and the free-ungated status. The streak read is READ-ONLY localStorage; no
 * writes, no new keys, no gating change, no auth/backend.
 *
 * Motion: the screen ASSEMBLES like a game booting — Kronos → streak-or-hook →
 * today's-board teaser → TAP IN last. Under reduced motion every entrance
 * collapses to its final state and every idle loop rests at a DECLARED base
 * value. Compositor-only (opacity/transform/filter); the atmosphere + teaser
 * glows are pointer-events:none and can never eat a tap.
 */

const INTRO_STYLES = `
/* ── DAY streak badge — shown ONLY for an earned, alive run ──────────────── */
.flip-streak-slot { min-height: 42px; display: flex; align-items: center; justify-content: center; }
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
/* Newcomer hook — a fresh/broken visitor sees curiosity, never a fake number. */
.flip-fresh-hook {
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: rgba(92,224,184,0.85);
  padding: 8px 16px; border-radius: 999px;
  border: 1px solid rgba(92,224,184,0.3); background: rgba(92,224,184,0.06);
}

/* ── Today's-board teaser — the centerpiece that teaches the loop in 2 seconds:
      a mystery find, call FLIP or SKIP. Honest — question marks only, never a
      real answer. Glassy, glowing, tappable-looking. ──────────────────────── */
.flip-board {
  position: relative; width: 100%; max-width: 340px;
  border-radius: 18px;
  border: 1px solid rgba(92,224,184,0.28);
  background: linear-gradient(180deg, rgba(92,224,184,0.07) 0%, rgba(10,12,20,0.35) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 14px 34px -14px rgba(92,224,184,0.5);
  padding: 11px 14px 10px;
  overflow: hidden;
}
.flip-board-glow {
  position: absolute; inset: -50% -20%; z-index: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 24%, rgba(92,224,184,0.18) 0%, transparent 68%);
  opacity: 0.6; animation: flip-board-glow 4.6s ease-in-out infinite;
  will-change: opacity, transform;
}
@keyframes flip-board-glow { 0%, 100% { opacity: 0.42; transform: scale(1); } 50% { opacity: 0.72; transform: scale(1.05); } }
.flip-board-head {
  position: relative; display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.flip-board-name {
  font-family: var(--display); font-weight: 900; font-size: 15px; letter-spacing: 0.06em;
  background: linear-gradient(90deg, #5CE0B8 0%, #3B82F6 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.flip-board-num {
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,255,255,0.42);
}
.flip-board-row { position: relative; display: flex; align-items: center; gap: 12px; }
.flip-board-item {
  flex: 1; display: flex; align-items: center; gap: 10px;
  border-radius: 12px; border: 1px dashed rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.03); padding: 8px 10px;
}
.flip-board-q {
  font-family: var(--display); font-weight: 900; font-size: 26px; line-height: 1;
  color: rgba(92,224,184,0.9); text-shadow: 0 0 12px rgba(92,224,184,0.45);
}
.flip-board-meta { display: flex; flex-direction: column; gap: 2px; }
.flip-board-price { font-family: var(--mono); font-size: 13px; font-weight: 700; color: #fff; }
.flip-board-sub {
  font-family: var(--mono); font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.4);
}
.flip-board-verbs { display: flex; flex-direction: column; gap: 6px; }
.flip-board-verb {
  font-family: var(--display); font-weight: 900; font-size: 13px; letter-spacing: 0.1em;
  padding: 5px 13px; border-radius: 8px; text-align: center; min-width: 62px;
  will-change: opacity;
}
.flip-board-verb--skip { color: #ff6b6b; border: 1px solid rgba(255,107,107,0.42); background: rgba(255,107,107,0.08); animation: flip-board-blink-a 2.8s ease-in-out infinite; }
.flip-board-verb--flip { color: var(--mint); border: 1px solid rgba(92,224,184,0.5); background: rgba(92,224,184,0.10); animation: flip-board-blink-b 2.8s ease-in-out infinite; }
@keyframes flip-board-blink-a { 0%, 42% { opacity: 1; } 58%, 100% { opacity: 0.5; } }
@keyframes flip-board-blink-b { 0%, 42% { opacity: 0.5; } 58%, 100% { opacity: 1; } }
.flip-board-cap {
  position: relative; margin-top: 10px; text-align: center;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.05em; color: rgba(255,255,255,0.52);
}

/* ── Kronos: idle bob + breathing mint aura (compositor-only) ────────────── */
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

/* ── Light reassurance (trimmed from the old bordered "free forever" box) ── */
.flip-intro-reassure {
  margin-top: 9px; font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.04em; color: rgba(255,255,255,0.42);
}

/* ── Intro atmosphere — faint drifting glows (behind the scrim, never a tap
      target). The main starfield is the shared CosmicBackdrop. ───────────── */
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

/* ── Reduced motion: declared static rests (fill-mode lesson). BOTH the fresh
      and the earned-streak states are composed, deliberate stills. ───────── */
@media (prefers-reduced-motion: reduce) {
  .flip-streak-aura { animation: none; opacity: 0.5; transform: scale(1); }
  .flip-board-glow { animation: none; opacity: 0.5; transform: scale(1); }
  .flip-board-verb--skip, .flip-board-verb--flip { animation: none; opacity: 0.92; }
  .flip-intro-host-bob { animation: none; transform: translateY(0); }
  .flip-intro-host-aura { animation: none; opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  .flip-intro-atmos span { animation: none; opacity: 0.5; transform: none; }
}

/* ── Short viewports (≤700px tall): keep the dense composition above the fold. */
@media (max-height: 700px) {
  .flip-streak { padding: 5px 13px 5px 10px; gap: 7px; }
  .flip-streak-num { font-size: 25px; }
  .flip-streak-flame { font-size: 16px; }
  .flip-streak-slot { min-height: 38px; }
  .flip-board { padding: 9px 12px 9px; }
  .flip-board-q { font-size: 22px; }
  .flip-board-verb { font-size: 12px; padding: 4px 11px; }
  .flip-board-cap { margin-top: 8px; }
}
`;

export default function IntroScreen({ puzzleNumber, onStart, ready = true, warping = false, replayCount = 0, konamiArmed = false, konamiHint = false }) {
  const reduced = useReducedMotion();
  const [firstTime, setFirstTime] = useState(false);
  const [playedToday, setPlayedToday] = useState(null); // { score: N } or null
  const [showIdle, setShowIdle] = useState(false);
  const [replayBannerDismissed, setReplayBannerDismissed] = useState(false);
  // REAL personal streak (0 = fresh/broken → newcomer hook). Starts 0 so SSR and
  // the first client render agree (hydration-safe); the true value resolves in a
  // post-mount effect from localStorage. dayDisplay is the rolling number.
  const [streak, setStreak] = useState(0);
  const [dayDisplay, setDayDisplay] = useState(0);
  // Gates the streak-or-hook content until the localStorage read resolves
  // post-mount. Server + first client render agree on `false` (empty slot,
  // reserved height) so there is no hydration mismatch AND — critically for a
  // reduced-motion returning user, whose slot is opacity 1 from frame one with
  // no entrance to mask a swap — the newcomer hook is never shown before the
  // earned badge. The slot resolves neutrally: empty → the correct state.
  const [streakResolved, setStreakResolved] = useState(false);

  // Read the earned streak (read-only; never writes, never touches gating) and,
  // when it's an earned run, roll the badge number up to it like a scoreboard.
  // The roll lands EXACTLY on the real streak and can never invent it. No flash:
  // the slot is opacity 0 until its 0.4s entrance, so seeding happens unseen.
  // Reduced motion / fresh visitor: the real value (or 0) shows instantly.
  useEffect(() => {
    const { streak: real } = readLiveStreak();
    setStreak(real);
    setStreakResolved(true);
    if (real < 1) { setDayDisplay(0); return; }
    if (reduced) { setDayDisplay(real); return; }
    const start = Math.max(0, real - 14);
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
        setDayDisplay(Math.round(start + (real - start) * eased));
        if (p >= 1) window.clearInterval(intervalId);
      }, 40);
    }, 400);
    return () => { window.clearTimeout(delayId); window.clearInterval(intervalId); };
  }, [reduced]);

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

  // One entrance helper — under reduced motion every element renders at its
  // final state instantly (a designed static composition); otherwise it
  // fades/rises on the house decelerate curve at a staggered delay.
  const enter = (delay, y = 16) =>
    reduced
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] } };

  const earned = streak >= 1;

  return (
    <div className={`flip-intro ${warping ? "flip-intro--warping" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: INTRO_STYLES }} />

      {/* Atmosphere — drifting glows behind the scrim. pointer-events:none. */}
      <div className="flip-intro-atmos" aria-hidden="true">
        <span /><span />
      </div>

      {/* Legibility scrim — darkens the content column so the cosmos reads as
          ambient depth behind the words. Above the backdrop (z0), below content. */}
      <div className="flip-intro-scrim" aria-hidden="true" />

      <div className="flip-intro-inner">
        {/* Kronos — the host: breathing mint aura + gentle idle bob, "hyped"
            callout energy daring you to call today's board. */}
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

        {/* Streak-or-hook — the honest, adaptive second beat. An EARNED run shows
            the flame "DAY {streak}" (rolling to the real number); a fresh or
            broken visitor sees the newcomer hook, never an unearned number.
            The fresh↔earned swap resolves post-mount while the slot is still
            opacity 0, so it is never visible; the min-height slot prevents any
            layout shift. */}
        <motion.div
          className="flip-streak-slot"
          initial={reduced ? false : { opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 0.4, type: "spring", stiffness: 320, damping: 15 }}
        >
          {/* Content gated on streakResolved: empty (reserved height) until the
              read completes, so a returning user never flashes the newcomer
              hook and a fresh visitor never flashes a badge. */}
          {streakResolved && (earned ? (
            <span className="flip-streak" aria-label={`${streak} day streak`}>
              <span className="flip-streak-aura" aria-hidden="true" />
              <span className="flip-streak-flame" aria-hidden="true">🔥</span>
              <span className="flip-streak-label" aria-hidden="true">DAY</span>
              <span className="flip-streak-num" aria-hidden="true">{dayDisplay}</span>
            </span>
          ) : (
            <span className="flip-fresh-hook">can you call today&apos;s board?</span>
          ))}
        </motion.div>

        {/* Today's-board teaser — the magnetic centerpiece. Teaches the loop:
            a mystery find, call FLIP or SKIP. Honest teaser (question marks
            only). The FLIP/SKIP verbs blink alternately to make the two-way
            call legible before they tap. #{puzzleNumber} is the GLOBAL board
            id (Wordle-style), never a personal streak. */}
        <motion.div
          className="flip-board"
          role="img"
          aria-label="today's board — ten mystery finds, call flip or skip on each"
          {...enter(0.7)}
        >
          <span className="flip-board-glow" aria-hidden="true" />
          <div className="flip-board-head">
            <span className="flip-board-name" aria-hidden="true">FLIP OR SKIP</span>
            <span className="flip-board-num" aria-hidden="true">board #{puzzleNumber}</span>
          </div>
          <div className="flip-board-row">
            <div className="flip-board-item" aria-hidden="true">
              <span className="flip-board-q">?</span>
              <div className="flip-board-meta">
                <span className="flip-board-price">$? → $?</span>
                <span className="flip-board-sub">mystery find</span>
              </div>
            </div>
            <div className="flip-board-verbs" aria-hidden="true">
              <span className="flip-board-verb flip-board-verb--skip">SKIP</span>
              <span className="flip-board-verb flip-board-verb--flip">FLIP</span>
            </div>
          </div>
          <div className="flip-board-cap" aria-hidden="true">10 finds today · one call each · trust your gut</div>
        </motion.div>

        {/* Hero CTA — the single most tappable object in the app. Layered depth
            (gradient + inner highlight + bloom), spring entrance last, idle
            pulse, press = scale + glow surge. Handler is fenced. */}
        <motion.button
          type="button"
          onClick={onStart}
          disabled={!ready}
          className={`flip-tap-in flip-tap-in--cosmic ${showIdle && ready ? "flip-tap-in--idle" : ""}`}
          initial={reduced ? false : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduced ? undefined : { delay: 0.95, type: "spring", stiffness: 210, damping: 17 }}
          whileTap={reduced ? undefined : { scale: 0.97 }}
        >
          <span className="flip-tap-in-particles" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="flip-tap-in-label">{ready ? (playedToday ? "PLAY AGAIN →" : "TAP IN →") : "LOADING…"}</span>
          <span className="flip-tap-in-bloom" aria-hidden="true" />
        </motion.button>

        {/* The FREE flex — a PRIMARY selling point for cold traffic, confident,
            never fine print. */}
        <motion.div className="flip-intro-free" {...enter(1.15)}>
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

        {/* Trimmed reassurance — the old bordered "free forever" box is now a
            light, confident line (only for a true first-timer, pre-idle). */}
        {firstTime && !showIdle && !playedToday && (
          <motion.div
            className="flip-intro-reassure"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduced ? undefined : { delay: 1.7 }}
          >
            free forever · no card, no catch
          </motion.div>
        )}

        {showIdle && (
          <div className="flip-intro-tip flip-intro-tip--idle">press it →</div>
        )}
      </div>
    </div>
  );
}
