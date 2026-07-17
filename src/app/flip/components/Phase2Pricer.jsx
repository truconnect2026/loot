"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { calcPriceAccuracy } from "../lib/scoring.js";
import useGameSounds from "../hooks/useGameSounds.jsx";
import useHaptics from "../hooks/useHaptics.jsx";

const PRESETS = [10, 25, 50, 100, 250, 500];
const REVEAL_HOLD_MS = 1500;

const TIER_META = {
  grail: { label: "GRAIL EYE", glyph: "👁️", color: "#F5C518", barColor: "linear-gradient(90deg, #F5C518, #5CE0B8)", glow: true, sparkle: true },
  sharp: { label: "SHARP", glyph: "🎯", color: "#5CE0B8", barColor: "#5CE0B8", glow: false, sparkle: false },
  fair: { label: "FAIR", glyph: "⚪", color: "#ffffff", barColor: "rgba(255,255,255,0.5)", glow: false, sparkle: false },
  off: { label: "OFF", glyph: "💀", color: "#ef4444", barColor: "#ef4444", glow: false, sparkle: false },
};

export default function Phase2Pricer({ flipItems, onComplete }) {
  const sounds = useGameSounds();
  const haptics = useHaptics();

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [guesses, setGuesses] = useState({});
  const [currentGuess, setCurrentGuess] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const confettiRef = useRef(null);
  const inputRef = useRef(null);

  const item = flipItems[currentItemIndex];
  const isLast = currentItemIndex === flipItems.length - 1;

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then((mod) => { if (!cancelled) confettiRef.current = mod.default; });
    return () => { cancelled = true; };
  }, []);

  const finishReveal = useCallback(() => {
    const next = currentItemIndex + 1;
    if (next >= flipItems.length) return; // wait for FINAL TALLY
    setCurrentItemIndex(next);
    setCurrentGuess("");
    setRevealing(false);
    setRevealData(null);
  }, [currentItemIndex, flipItems.length]);

  const lockIn = useCallback(() => {
    if (!item) return;
    const g = parseFloat(currentGuess);
    if (!g || g <= 0) return;

    const result = calcPriceAccuracy(g, item.resellEst);
    setGuesses((prev) => ({
      ...prev,
      [item.id]: { guess: g, tier: result.tier, percentOff: result.percentOff, scoreMultiplier: result.scoreMultiplier },
    }));

    setRevealData({ guess: g, actual: item.resellEst, tier: result.tier, percentOff: result.percentOff });
    setRevealing(true);

    if (result.tier === "grail" || result.tier === "sharp") {
      sounds.playDing();
      haptics.hapticSuccess();
      if (result.tier === "grail" && confettiRef.current) {
        confettiRef.current({
          particleCount: 80, spread: 90, origin: { x: 0.5, y: 0.4 },
          colors: ["#F5C518", "#5CE0B8", "#ffffff"], disableForReducedMotion: true,
        });
      }
    } else if (result.tier === "off") {
      sounds.playBuzz();
    } else {
      sounds.playReveal();
      haptics.hapticTap();
    }

    if (!isLast) window.setTimeout(finishReveal, REVEAL_HOLD_MS);
  }, [item, currentGuess, sounds, haptics, isLast, finishReveal]);

  const handleFinalTally = useCallback(() => {
    sounds.playWin();
    haptics.hapticSuccess();
    onComplete(guesses);
  }, [sounds, haptics, guesses, onComplete]);

  if (!item) return null;

  return (
    <div className="flip-pricer">
      <div className="flip-pricer-progress">
        <div className="flip-pricer-progress-label">PRICING {currentItemIndex + 1} of {flipItems.length}</div>
        <div className="flip-pricer-progress-strip">
          {flipItems.map((it, i) => {
            const completed = guesses[it.id];
            const tone = completed ? completed.tier : (i === currentItemIndex ? "current" : "pending");
            return <span key={it.id} className={`flip-pricer-tile flip-pricer-tile--${tone}`} />;
          })}
        </div>
      </div>

      <motion.h2
        className="flip-pricer-head"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        CALL THE PRICE
      </motion.h2>
      <div className="flip-pricer-sub">{flipItems.length} grails to price</div>

      <AnimatePresence mode="wait">
        {!revealing ? (
          <motion.div
            key={`guess-${item.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="flip-pricer-body"
          >
            <div className={`flip-pricer-card flip-pricer-card--rarity-${item.rarity || "common"}`}>
              <div className="flip-pricer-card-img-wrap">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 90vw, 360px"
                  className="flip-pricer-card-img"
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.src.endsWith("_placeholder.svg")) t.src = "/items/_placeholder.svg";
                  }}
                />
              </div>
              <div className="flip-pricer-card-meta">
                <div className="flip-pricer-card-name">{item.name}</div>
                <div className="flip-pricer-card-sub">{item.era} · {item.brand}</div>
              </div>
            </div>

            <div className="flip-pricer-q">WHAT'S IT FLIP FOR?</div>

            <div className="flip-pricer-input-row" onClick={() => inputRef.current?.focus()}>
              <span className="flip-pricer-dollar">$</span>
              <div className="flip-pricer-input-display">
                {/* No grey "0" ghost — a blank placeholder holds the line height;
                    the "$", the underline, and the "WHAT'S IT FLIP FOR?" prompt
                    already signal the empty input. */}
                {currentGuess || <span className="flip-pricer-input-placeholder">{" "}</span>}
              </div>
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                className="flip-pricer-input-hidden"
                aria-label="Price guess"
                autoFocus
              />
            </div>
            <div className={`flip-pricer-underline ${currentGuess ? "flip-pricer-underline--active" : ""}`} />

            <div className="flip-pricer-presets">
              {PRESETS.map((p) => (
                <motion.button
                  key={p} type="button" whileTap={{ scale: 0.95 }}
                  onClick={() => { setCurrentGuess(String(p)); haptics.hapticTap(); }}
                  className="flip-pricer-preset"
                >
                  ${p}
                </motion.button>
              ))}
            </div>
            <div className="flip-pricer-presets-hint">tap or type</div>

            <motion.button
              type="button"
              onClick={lockIn}
              disabled={!parseFloat(currentGuess) || parseFloat(currentGuess) <= 0}
              whileTap={{ scale: 0.97 }}
              className="flip-pricer-lockin"
            >
              LOCK IN <span className="flip-pricer-lockin-arrow">→</span>
            </motion.button>
          </motion.div>
        ) : (
          <RevealPanel
            key={`reveal-${item.id}`}
            data={revealData}
            item={item}
            isLast={isLast}
            onFinalTally={handleFinalTally}
            onTick={() => sounds.playReveal()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RevealPanel({ data, item, isLast, onFinalTally, onTick }) {
  const tm = TIER_META[data.tier];
  const reduced = useReducedMotion();
  const guessSpring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const actualSpring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  // Render nothing while a spring rests at 0 before its count-up, so no grey
  // "$0" ghost shows behind the animating figure (a genuine $0 still shows).
  const guessText = useTransform(guessSpring, (v) => {
    const r = Math.round(v);
    return r <= 0 ? (data.guess > 0 ? "" : "$0") : `$${r}`;
  });
  const actualText = useTransform(actualSpring, (v) => {
    const r = Math.round(v);
    return r <= 0 ? (data.actual > 0 ? "" : "$0") : `$${r}`;
  });
  const [finalArmed, setFinalArmed] = useState(false);

  useEffect(() => {
    if (!isLast) return;
    const t = window.setTimeout(() => setFinalArmed(true), REVEAL_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [isLast]);

  useEffect(() => {
    // Reduced motion: jump both figures to final — no count-up.
    if (reduced) { guessSpring.jump(data.guess); actualSpring.jump(data.actual); return; }
    guessSpring.set(data.guess);
    actualSpring.set(data.actual);
    let last = 0;
    const unsub = guessSpring.on("change", (v) => {
      const r = Math.round(v);
      if (r !== last) { last = r; onTick?.(); }
    });
    return () => unsub();
  }, [data.guess, data.actual, guessSpring, actualSpring, onTick, reduced]);

  const accuracyPct = Math.max(0, Math.min(100, Math.round((1 - data.percentOff) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="flip-reveal"
    >
      <div className="flip-reveal-evidence">
        <Image src={item.image} alt="" fill sizes="80px" className="flip-reveal-evidence-img"
          onError={(e) => { const t = e.currentTarget; if (!t.src.endsWith("_placeholder.svg")) t.src = "/items/_placeholder.svg"; }}
        />
      </div>

      <motion.div
        className="flip-reveal-divider"
        initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={reduced ? { duration: 0 } : { duration: 0.2 }}
      />

      <div className="flip-reveal-numbers">
        <div className="flip-reveal-col">
          <div className="flip-reveal-label">YOUR CALL</div>
          <motion.div className="flip-reveal-num">{guessText}</motion.div>
        </div>
        <div className="flip-reveal-col">
          <div className="flip-reveal-label" style={{ color: tm.color, opacity: 0.7 }}>REAL COMP</div>
          <motion.div className="flip-reveal-num" style={{ color: tm.color }}>{actualText}</motion.div>
        </div>
      </div>

      <div className="flip-reveal-bar-track">
        <motion.div
          className="flip-reveal-bar-fill"
          style={{ background: tm.barColor }}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${accuracyPct}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <motion.div
        className={`flip-reveal-tier ${tm.glow ? "flip-reveal-tier--glow" : ""}`}
        style={{ color: tm.color }}
        initial={reduced ? false : { scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : { delay: 0.4, type: "spring", stiffness: 280, damping: 14 }}
      >
        <span className="flip-reveal-tier-glyph">{tm.glyph}</span>
        <span className="flip-reveal-tier-label">{tm.label}</span>
      </motion.div>

      {isLast && finalArmed && (
        <motion.button
          type="button"
          onClick={onFinalTally}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flip-pricer-lockin flip-pricer-lockin--final"
        >
          FINAL TALLY →
        </motion.button>
      )}
    </motion.div>
  );
}
