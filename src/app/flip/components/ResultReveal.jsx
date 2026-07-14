"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { getScoreTier } from "../lib/scoring.js";
import useGameSounds from "../hooks/useGameSounds.jsx";
import useHaptics from "../hooks/useHaptics.jsx";
import ShareGrid from "./ShareGrid.jsx";
import { SPEECH_BUBBLE_CHANCE } from "./Mascot.jsx";
import FlipCoyote from "@/components/shared/FlipCoyote";
import { useTilt } from "../hooks/useMouseManager.jsx";
import { useDeviceClass } from "../lib/perf.js";
import { isDiscovered, markDiscovered, shouldShowHint, markHintShown } from "../lib/easterEggs.js";

const TIER_META = {
  wolf: { label: "WOLF", glyph: "🐺", color: "#5CE0B8", subtext: "TOP TIER FLIPPER", shake: 8, glow: true },
  solid: { label: "SOLID", glyph: "💪", color: "#5CE0B8", subtext: "STRONG CALL", shake: 4, glow: false },
  mid: { label: "MID", glyph: "😬", color: "#ffffff", subtext: "ROOM TO GROW", shake: 2, glow: false },
  rip: { label: "RIP", glyph: "💀", color: "#ef4444", subtext: "TOMORROW IS NEW", shake: 0, glow: false },
};

const MASCOT_MOOD = { wolf: "hyped", solid: "smirk", mid: "sideeye", rip: "dead" };

const PHASE_TIMING = {
  B_TIER_SLAM: 1700,
  C_DOLLARS: 3700,
  D_STATS: 6700,
  E_CTA: 8400,
  F_SHARE: 9800,
};

function midnightCountdown(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const diff = Math.max(0, tomorrow - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return {
    text: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    minutes: h * 60 + m,
  };
}

export default function ResultReveal({ answers, priceGuesses, scoreData, puzzleNumber, onReplay }) {
  const tier = getScoreTier(scoreData.finalScore);
  const tm = TIER_META[tier];
  const sounds = useGameSounds();
  const haptics = useHaptics();

  const [phase, setPhase] = useState("A");
  const [countdown, setCountdown] = useState(midnightCountdown());
  const [lifetime, setLifetime] = useState({ total: 0, streak: 0, best: 0, played: 0 });
  const [savedVisible, setSavedVisible] = useState(false);
  const [milestoneFlash, setMilestoneFlash] = useState(0);
  const [wolfFlash, setWolfFlash] = useState(false);
  const [wolfHintVisible, setWolfHintVisible] = useState(false);
  const confettiRef = useRef(null);
  const lsWrittenRef = useRef(false);
  const mascotRef = useRef(null);
  const ctaRef = useRef(null);
  const { enableHeavyEffects } = useDeviceClass();
  const { tiltX: ctaTiltX, tiltY: ctaTiltY } = useTilt(ctaRef, {
    maxRotateX: 4, maxRotateY: 4, enabled: enableHeavyEffects,
  });

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then((mod) => { if (!cancelled) confettiRef.current = mod.default; });
    return () => { cancelled = true; };
  }, []);

  // Orchestration timeline.
  useEffect(() => {
    sounds.playWin();
    const timers = [];
    // Tell other listeners (CosmicBackdrop, Mascot in corner) which tier landed.
    window.dispatchEvent(new CustomEvent("fos:tier-reveal", { detail: { tier } }));
    timers.push(window.setTimeout(() => {
      setPhase("B"); haptics.hapticSuccess();
      sounds.playImpactSwell?.(tier);
      if (tier === "wolf") mascotRef.current?.doubleWink();
      if ((tier === "wolf" || tier === "solid") && confettiRef.current) {
        const end = Date.now() + (tier === "wolf" ? 1800 : 800);
        const colors = tier === "wolf"
          ? ["#5CE0B8", "#F5C518", "#3B82F6", "#ffffff"]
          : ["#5CE0B8", "#ffffff"];
        const interval = setInterval(() => {
          if (Date.now() > end) return clearInterval(interval);
          confettiRef.current({ particleCount: 50, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true });
          confettiRef.current({ particleCount: 50, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true });
        }, 200);
      }
    }, PHASE_TIMING.B_TIER_SLAM));
    timers.push(window.setTimeout(() => setPhase("C"), PHASE_TIMING.C_DOLLARS));
    timers.push(window.setTimeout(() => setPhase("D"), PHASE_TIMING.D_STATS));
    timers.push(window.setTimeout(() => setPhase("E"), PHASE_TIMING.E_CTA));
    timers.push(window.setTimeout(() => setPhase("F"), PHASE_TIMING.F_SHARE));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [tier, sounds, haptics]);

  // Countdown ticker
  useEffect(() => {
    const id = window.setInterval(() => setCountdown(midnightCountdown()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // localStorage writes (once at phase F) + read lifetime stats
  useEffect(() => {
    if (phase !== "F" || lsWrittenRef.current) return;
    lsWrittenRef.current = true;
    try {
      const today = new Date();
      const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const lastDate = localStorage.getItem("fos-last-played-date");
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const yYmd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      const prevStreak = parseInt(localStorage.getItem("fos-streak-count") || "0", 10);
      const newStreak = lastDate === yYmd ? prevStreak + 1 : (lastDate === ymd ? prevStreak : 1);
      const prevBest = parseInt(localStorage.getItem("fos-best-score") || "0", 10);
      const prevTotal = parseInt(localStorage.getItem("fos-total-flipped") || "0", 10);
      const prevPlayed = parseInt(localStorage.getItem("fos-days-played") || "0", 10);
      localStorage.setItem("fos-last-played-date", ymd);
      localStorage.setItem("fos-last-score", String(scoreData.swipeScore));
      localStorage.setItem("fos-streak-count", String(newStreak));
      localStorage.setItem("fos-best-score", String(Math.max(prevBest, scoreData.finalScore)));
      localStorage.setItem("fos-total-flipped", String(prevTotal + scoreData.totalDollarsSpotted));
      localStorage.setItem("fos-days-played", String(prevPlayed + 1));
      setLifetime({
        total: prevTotal + scoreData.totalDollarsSpotted,
        streak: newStreak,
        best: Math.max(prevBest, scoreData.finalScore),
        played: prevPlayed + 1,
      });
      // SAVED ✓ micro-icon — appears briefly, top-right.
      setSavedVisible(true);
      window.setTimeout(() => setSavedVisible(false), 1900);
    } catch { /* private mode */ }
  }, [phase, scoreData]);

  // WOLF easter egg — listen for w-o-l-f sequence on the results screen.
  useEffect(() => {
    const buffer = { keys: [], timer: null };
    const onKey = (e) => {
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (isDiscovered("wolf-typed")) return;
      const k = (e.key || "").toLowerCase();
      if (!"wolf".includes(k)) { buffer.keys = []; return; }
      buffer.keys.push(k);
      if (buffer.timer) window.clearTimeout(buffer.timer);
      buffer.timer = window.setTimeout(() => { buffer.keys = []; }, 3000);
      if (buffer.keys.join("") === "wolf") {
        markDiscovered("wolf-typed");
        setWolfFlash(true);
        window.setTimeout(() => setWolfFlash(false), 220);
        mascotRef.current?.doubleWink();
        if (Math.random() < SPEECH_BUBBLE_CHANCE * 2) {
          mascotRef.current?.speak("WOLF SHIT");
        }
        // eslint-disable-next-line no-console
        console.log("🐺 wolf detected");
        if (confettiRef.current) {
          confettiRef.current({
            particleCount: 30, spread: 80, origin: { x: 0.5, y: 0.5 },
            colors: ["#5CE0B8", "#F5C518"], disableForReducedMotion: true,
          });
        }
        buffer.keys = [];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (buffer.timer) window.clearTimeout(buffer.timer);
    };
  }, []);

  // Wolf hint — only after 4+ plays without discovery.
  useEffect(() => {
    if (phase !== "F") return;
    if (!shouldShowHint("wolf-typed")) return;
    setWolfHintVisible(true);
    markHintShown("wolf-typed");
    const t = window.setTimeout(() => setWolfHintVisible(false), 6000);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Milestone $100 flashes during dollar count
  useEffect(() => {
    if (phase !== "C") return;
    const value = scoreData.totalDollarsSpotted;
    if (value < 100) return;
    const flashes = Math.min(3, Math.floor(value / 100));
    const timers = [];
    for (let i = 0; i < flashes; i++) {
      timers.push(window.setTimeout(() => setMilestoneFlash((k) => k + 1), 400 + i * 350));
    }
    return () => timers.forEach(window.clearTimeout);
  }, [phase, scoreData.totalDollarsSpotted]);

  const phaseRank = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 }[phase];
  const missedItems = answers.filter((a) => !a.correct && a.choice === "skip" && a.item?.isFlip).slice(0, 3);

  const countdownClass = countdown.minutes < 1
    ? "flip-rev-countdown flip-rev-countdown--imminent"
    : countdown.minutes < 10
      ? "flip-rev-countdown flip-rev-countdown--urgent"
      : "flip-rev-countdown";

  return (
    <div className={`flip-rev ${wolfFlash ? "flip-rev--wolf-flash" : ""}`}>
      <div className="flip-rev-aurora" aria-hidden="true" />
      <div className="sr-only" aria-live="polite">
        {phaseRank >= 1 ? `Result: ${tm.label}. ${scoreData.swipeScore} of 10 correct. $${scoreData.totalDollarsSpotted} spotted.` : ""}
      </div>

      <motion.div
        className={`flip-rev-mascot flip-rev-mascot--${MASCOT_MOOD[tier]}`}
        initial={{ y: 200, scale: 0.4, opacity: 0 }}
        animate={phaseRank >= 1 ? { y: -40, scale: 0.4, opacity: 1, x: -120 } : { y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        {/* Kronos — the same host from TAP IN, mood-matched to the tier, so
            the free game opens and closes on one branded face. (The old SVG
            mascot's wink/speak calls below now no-op via optional chaining;
            the wolf easter egg keeps its flash + confetti.) */}
        <FlipCoyote mood={MASCOT_MOOD[tier]} size={150} />
      </motion.div>

      {phaseRank >= 1 && phaseRank < 2 && (
        <motion.div
          key="tier-big"
          className={`flip-rev-tier ${tm.glow ? "flip-rev-tier--glow" : ""}`}
          style={{ color: tm.color }}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 16 }}
        >
          <div className="flip-rev-tier-glyph">{tm.glyph}</div>
          <div className="flip-rev-tier-label">{tm.label}</div>
          <div className="flip-rev-tier-sub">{tm.subtext}</div>
        </motion.div>
      )}

      {phaseRank >= 2 && (
        <motion.div
          className="flip-rev-tier-chip"
          style={{ borderColor: tm.color, color: tm.color }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>{tm.glyph}</span> <span>{tm.label}</span>
        </motion.div>
      )}

      {phaseRank >= 2 && (
        <motion.div
          className="flip-rev-dollars-block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <DollarCounter
            value={scoreData.totalDollarsSpotted}
            onTick={() => sounds.playReveal()}
            active={phaseRank === 2}
            enableHeavyEffects={enableHeavyEffects}
          />
          <div className="flip-rev-dollars-tag">SPOTTED TODAY</div>
          <div className="flip-rev-dollars-sub">
            across {scoreData.swipeScore} {scoreData.swipeScore === 1 ? "call" : "calls"} you nailed
          </div>
        </motion.div>
      )}

      {/* Milestone $100 flash sweeps */}
      <AnimatePresence>
        {milestoneFlash > 0 && (
          <motion.div
            key={milestoneFlash}
            className="flip-rev-milestone-flash"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 0.6, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {phaseRank >= 3 && (
        <>
          <motion.div
            className="flip-rev-stats"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StatCard label="SWIPE" value={`${scoreData.swipeScore}/10`} color="#5CE0B8" />
            <StatCard label="GRAIL EYE" value={scoreData.grailCount} color={scoreData.grailCount > 0 ? "#F5C518" : "#ffffff"} gold={scoreData.grailCount > 0} />
            <StatCard label="SHARP" value={scoreData.sharpCount} color="#5CE0B8" />
          </motion.div>

          {lifetime.played > 1 && (
            <motion.div
              className="flip-rev-lifetime"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flip-rev-lifetime-label">LIFETIME</div>
              <div className="flip-rev-lifetime-row">
                <div className="flip-rev-lifetime-stat">${lifetime.total.toLocaleString()}</div>
                {lifetime.streak > 0 && <div className="flip-rev-lifetime-stat">{lifetime.streak} 🔥</div>}
              </div>
              <div className="flip-rev-lifetime-sub">{lifetime.played} days played · best {lifetime.best}</div>
            </motion.div>
          )}
        </>
      )}

      {phaseRank >= 4 && (
        <motion.div
          className="flip-rev-cta"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flip-rev-cta-head">DO IT FOR REAL</div>
          <div className="flip-rev-cta-sub-head">loot.works does this in 1.4 sec</div>

          {scoreData.missedFlips > 0 && (
            <div className="flip-rev-miss-card">
              <div className="flip-rev-miss-row">
                <div className="flip-rev-miss-col">
                  <div className="flip-rev-miss-label">YOU MISSED</div>
                  <div className="flip-rev-miss-big" style={{ color: "#ef4444" }}>{scoreData.missedFlips} FLIPS</div>
                </div>
                <div className="flip-rev-miss-col flip-rev-miss-col--right">
                  <div className="flip-rev-miss-big">${scoreData.missedDollars}</div>
                  <div className="flip-rev-miss-label">left on the shelf</div>
                </div>
              </div>
              {missedItems.length > 0 && (
                <div className="flip-rev-miss-strip">
                  {missedItems.map((a) => (
                    <div key={a.item.id} className="flip-rev-miss-thumb" title={`${a.item.name} · $${a.item.resellEst}`}>
                      <Image src={a.item.image} alt="" fill sizes="48px"
                        onError={(e) => { const t = e.currentTarget; if (!t.src.endsWith("_placeholder.svg")) t.src = "/items/_placeholder.svg"; }}
                      />
                      <span>${a.item.resellEst}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <motion.div
            ref={ctaRef}
            style={{ rotateX: ctaTiltX, rotateY: ctaTiltY, transformPerspective: 800, width: "100%", maxWidth: 420, display: "flex", justifyContent: "center" }}
          >
            <Link href="/app?ref=flip_results" className="flip-rev-cta-btn">
              <span className="flip-rev-cta-btn-bloom" aria-hidden="true" />
              <span className="flip-rev-cta-btn-label">GET LOOT.WORKS →</span>
            </Link>
          </motion.div>
          <Link href="/app?ref=flip_results" className="flip-rev-cta-sub-link">
            or scan free →
          </Link>
        </motion.div>
      )}

      {/* SAVED ✓ micro-icon — fires once when localStorage writes complete */}
      <AnimatePresence>
        {savedVisible && (
          <motion.div
            className="flip-rev-saved-icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
          >
            <span className="flip-rev-saved-dot" />✓ saved
          </motion.div>
        )}
      </AnimatePresence>

      {phaseRank >= 5 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flip-rev-share-section"
        >
          <div className="flip-rev-share-divider">// SHARE THE DAMAGE //</div>
          {wolfHintVisible && <div className="flip-rev-egg-hint">spell it</div>}
          <ShareGrid
            scoreData={scoreData}
            puzzleNumber={puzzleNumber}
            answers={answers}
            priceGuesses={priceGuesses}
          />
          <div className="flip-rev-footer">
            <div className={countdownClass}>
              <span className="flip-rev-countdown-label">NEXT DROP IN</span>
              <span className="flip-rev-countdown-time">{countdown.text}</span>
            </div>
            <button type="button" className="flip-rev-replay" onClick={onReplay}>PLAY AGAIN</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DollarCounter({ value, onTick, active, enableHeavyEffects }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 60, damping: 18 });
  const text = useTransform(spring, (v) => `$${Math.round(v).toLocaleString()}`);
  const [floaters, setFloaters] = useState([]);

  useEffect(() => {
    spring.set(value);
    let last = 0;
    const unsub = spring.on("change", (v) => {
      const r = Math.round(v);
      if (r !== last && r % 5 === 0) { last = r; onTick?.(); }
    });
    return () => unsub();
  }, [value, spring, onTick]);

  // Spawn 6–10 floating $ emojis during the count.
  useEffect(() => {
    if (!active || !enableHeavyEffects) return;
    const max = Math.min(10, Math.max(6, Math.floor(value / 50)));
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      const next = {
        id: Date.now() + i,
        left: 20 + Math.random() * 60,
        size: 16 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 40,
      };
      setFloaters((arr) => [...arr.slice(-9), next]);
      if (i >= max) window.clearInterval(id);
    }, 150);
    return () => window.clearInterval(id);
  }, [active, enableHeavyEffects, value]);

  return (
    <div className="flip-rev-dollars">
      <motion.span>{text}</motion.span>
      <div className="flip-rev-dollars-floaters" aria-hidden="true">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="flip-rev-dollars-floater"
            style={{ left: `${f.left}%`, fontSize: f.size, "--drift": `${f.drift}px` }}
          >$</span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, gold }) {
  return (
    <div className={`flip-rev-stat ${gold ? "flip-rev-stat--gold" : ""}`}>
      <div className="flip-rev-stat-label">{label}</div>
      <div className="flip-rev-stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

