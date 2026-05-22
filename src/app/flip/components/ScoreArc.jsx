"use client";

import { motion } from "motion/react";

/**
 * 10-segment horizontal progress strip. Each segment is one card.
 *  - filled: correct      mint solid
 *  - wrong: incorrect     red
 *  - skipped-incorrectly  muted gray (currently not exposed separately —
 *                         folded into 'wrong')
 *  - empty                mint 15%
 *
 * Bound to `answers` array from FlipGame. Snap-in animation on segment fill.
 */
export default function ScoreArc({ total = 10, answers = [] }) {
  return (
    <div className="flip-score-arc" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => {
        const a = answers[i];
        let state = "empty";
        if (a) state = a.correct ? "correct" : "wrong";
        return (
          <motion.span
            key={i}
            className={`flip-score-seg flip-score-seg--${state}`}
            initial={false}
            animate={a ? { scale: [0, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        );
      })}
    </div>
  );
}
