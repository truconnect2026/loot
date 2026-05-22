"use client";

/**
 * GrailCardOverlay — gold treatment for rarity === "grail" cards.
 *
 * Two cosmetic layers:
 *   1. Rotating conic-gradient ring (CSS conic-gradient + @keyframes — no
 *      @property since browser support varies; pure transform spin instead)
 *   2. Gold dust particles drifting up from the bottom (6 emoji-like dots)
 *
 * No motion/react inside — pure CSS animation so it's free during drag.
 */
export default function GrailCardOverlay({ isTop }) {
  return (
    <>
      <div className="flip-grail-border" aria-hidden="true" />
      {isTop && (
        <div className="flip-grail-dust" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.6}s` }} />
          ))}
        </div>
      )}
    </>
  );
}
