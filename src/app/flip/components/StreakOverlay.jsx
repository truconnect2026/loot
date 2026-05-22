"use client";

import { AnimatePresence, motion } from "motion/react";

function colorFor(streak) {
  if (streak >= 6) return undefined; // rainbow gradient set via className
  if (streak >= 3) return "#F5C518";
  return "#5CE0B8";
}

function sizeFor(streak) {
  if (streak >= 8) return 80;
  if (streak >= 6) return 64;
  if (streak >= 3) return 48;
  return 32;
}

/**
 * Renders an ephemeral floating "+N" or "+N STREAK 🔥" above the card stack
 * each time `streakKey` changes. Mounting key = streakKey so consecutive
 * correct swipes get distinct animations.
 */
export default function StreakOverlay({ streakKey, streak }) {
  if (!streak) return null;
  const isRainbow = streak >= 6;
  const fontSize = sizeFor(streak);
  const color = colorFor(streak);

  return (
    <div className="flip-streak-overlay">
      <AnimatePresence>
        <motion.div
          key={streakKey}
          initial={{ y: 0, opacity: 1, scale: 0.9 }}
          animate={{ y: -60, opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className={`flip-streak-text${isRainbow ? " flip-streak-text--rainbow" : ""}`}
          style={{
            fontSize,
            color,
          }}
        >
          {streak >= 3 ? `+${streak} STREAK 🔥` : `+${streak}`}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
