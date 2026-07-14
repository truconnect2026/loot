"use client";

import { motion, useReducedMotion } from "motion/react";

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
  const reduced = useReducedMotion();
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
            // Lock-in pulse from the segment's existing size (not a pop
            // from scale 0) on the house decelerate curve — reads as the
            // segment settling into its result, not an element popping in.
            // Reduced motion: no pulse; the colour change alone marks it.
            animate={a && !reduced ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], times: [0, 0.4, 1] }}
          />
        );
      })}
    </div>
  );
}
