"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const HINTS = ["swipe or tap", "trust your gut", "flip the grails", "call it"];

export default function FlipSkipButtons({ onFlip, onSkip, disabled }) {
  const [hintIdx, setHintIdx] = useState(0);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setHintIdx((i) => (i + 1) % HINTS.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setIdle(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flip-action-row">
      <div className="flip-action-cell">
        <motion.button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className={`flip-action flip-action--skip ${idle ? "flip-action--idle" : ""}`}
          aria-label="Skip"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </motion.button>
        <span className="flip-action-label flip-action-label--skip">SKIP</span>
      </div>

      <div className="flip-action-hint">{HINTS[hintIdx]}</div>

      <div className="flip-action-cell">
        <motion.button
          type="button"
          onClick={onFlip}
          disabled={disabled}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className={`flip-action flip-action--flip ${idle ? "flip-action--idle" : ""}`}
          aria-label="Flip"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.button>
        <span className="flip-action-label flip-action-label--flip">FLIP</span>
      </div>
    </div>
  );
}
