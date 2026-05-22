"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { markDiscovered } from "../lib/easterEggs.js";

/** 30% chance gate for speech bubbles (configurable in one place). */
export const SPEECH_BUBBLE_CHANCE = 0.3;

/**
 * Mascot — reusable Saturn-ringed coyote with mood states + imperative
 * methods (wink/doubleWink/shimmy/eyeRoll/speak) and a self-contained
 * 15-tap easter-egg counter.
 *
 * Props:
 *   mood     "smirk" | "hyped" | "sideeye" | "dead"  default smirk
 *   size     pixels   default 120
 *   animated whether Saturn ring spins (default true)
 *   color    stroke color (default mint)
 *   tilt     rotateZ degrees applied to the whole svg (for drag-lean)
 *   onPoke   optional callback fired each tap (for stage announcements)
 */
const Mascot = forwardRef(function Mascot(
  { mood = "smirk", size = 120, animated = true, color = "#5CE0B8", tilt = 0, onPoke },
  ref,
) {
  const [winking, setWinking] = useState(false);
  const [eyesUp, setEyesUp] = useState(false);
  const [shimmy, setShimmy] = useState(0);
  const [bubble, setBubble] = useState(null);
  const [pokes, setPokes] = useState(0);
  const bubbleTimerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    wink: () => {
      setWinking(true);
      window.setTimeout(() => setWinking(false), 200);
    },
    doubleWink: () => {
      setWinking(true);
      window.setTimeout(() => setWinking(false), 200);
      window.setTimeout(() => setWinking(true), 400);
      window.setTimeout(() => setWinking(false), 600);
    },
    excitedShimmy: () => setShimmy((k) => k + 1),
    eyeRoll: () => {
      setEyesUp(true);
      window.setTimeout(() => setEyesUp(false), 300);
    },
    speak: (text, duration = 2200) => {
      if (!text) return;
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
      setBubble(text);
      bubbleTimerRef.current = window.setTimeout(() => setBubble(null), duration);
    },
  }), []);

  useEffect(() => () => { if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current); }, []);

  // Auto-shimmy when shake key bumps.
  useEffect(() => {
    if (shimmy === 0) return;
    /* CSS animation handles the motion; no JS needed past the key bump */
  }, [shimmy]);

  const handlePoke = useCallback(() => {
    const next = pokes + 1;
    setPokes(next);
    onPoke?.(next);
    // Built-in easter-egg ladder
    if (next === 5) {
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
      setBubble("stop poking me");
      bubbleTimerRef.current = window.setTimeout(() => setBubble(null), 2200);
    } else if (next === 10) {
      setEyesUp(true);
      window.setTimeout(() => setEyesUp(false), 300);
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
      setBubble("seriously?");
      bubbleTimerRef.current = window.setTimeout(() => setBubble(null), 2200);
    } else if (next === 15) {
      markDiscovered("mascot-poked");
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
      setBubble("ok i'm in");
      bubbleTimerRef.current = window.setTimeout(() => setBubble(null), 2500);
      window.dispatchEvent(new CustomEvent("fos:mascot-egg"));
    }
  }, [pokes, onPoke]);

  return (
    <div
      className="fos-mascot-wrap"
      style={{ width: size, height: size, transform: `rotate(${tilt}deg)` }}
      onClick={handlePoke}
    >
      <motion.div
        key={shimmy}
        className="fos-mascot-shake"
        animate={shimmy ? { x: [-2, 2, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.15 }}
      >
        <svg width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
          <ellipse
            cx="80" cy="80" rx="70" ry="20"
            fill="none" stroke={color} strokeWidth="2"
            transform="rotate(-23 80 80)"
          >
            {animated && (
              <animateTransform attributeName="transform" type="rotate" from="-23 80 80" to="337 80 80" dur="3s" repeatCount="indefinite" />
            )}
          </ellipse>
          <path d="M 50 50 L 44 22 L 66 42 Z" fill="none" stroke={color} strokeWidth="2" />
          <path d="M 110 50 L 116 22 L 94 42 Z" fill="none" stroke={color} strokeWidth="2" />
          <ellipse cx="80" cy="86" rx="38" ry="36" fill="none" stroke={color} strokeWidth="2" />
          {/* eyes — mood-dependent */}
          <MascotEyes mood={mood} color={color} winking={winking} eyesUp={eyesUp} />
          {/* mouth — mood-dependent */}
          <MascotMouth mood={mood} color={color} />
        </svg>
      </motion.div>
      <AnimatePresence>
        {bubble && (
          <motion.div
            className="fos-mascot-bubble"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function MascotEyes({ mood, color, winking, eyesUp }) {
  const yOffset = eyesUp ? -4 : 0;
  if (winking) {
    return (
      <g transform={`translate(0 ${yOffset})`}>
        <line x1="58" y1="80" x2="74" y2="80" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        <line x1="92" y1="80" x2="106" y2="80" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    );
  }
  if (mood === "hyped") return (
    <g transform={`translate(0 ${yOffset})`}>
      <ellipse cx="62" cy="80" rx="4" ry="4" fill={color} />
      <ellipse cx="98" cy="80" rx="4" ry="4" fill={color} />
    </g>
  );
  if (mood === "sideeye") return (
    <g transform={`translate(0 ${yOffset})`}>
      <ellipse cx="68" cy="80" rx="3.5" ry="3" fill={color} />
      <ellipse cx="92" cy="80" rx="3.5" ry="3" fill={color} />
    </g>
  );
  if (mood === "dead") return (
    <g transform={`translate(0 ${yOffset})`}>
      <line x1="56" y1="76" x2="68" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="68" y1="76" x2="56" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="92" y1="76" x2="104" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="104" y1="76" x2="92" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
  // smirk default
  return (
    <g transform={`translate(0 ${yOffset})`}>
      <path d="M 60 80 Q 67 76 74 80" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="98" cy="80" rx="3.5" ry="3" fill={color} />
    </g>
  );
}

function MascotMouth({ mood, color }) {
  if (mood === "hyped")
    return <path d="M 60 100 Q 80 120 100 100" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
  if (mood === "sideeye")
    return <line x1="62" y1="106" x2="98" y2="106" stroke={color} strokeWidth="2.4" strokeLinecap="round" />;
  if (mood === "dead")
    return <line x1="62" y1="108" x2="98" y2="108" stroke={color} strokeWidth="2.4" strokeLinecap="round" />;
  // smirk default
  return <path d="M 64 104 Q 80 112 96 102" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />;
}

export default Mascot;
