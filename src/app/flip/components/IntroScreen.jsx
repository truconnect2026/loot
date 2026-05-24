"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const HEADLINE = "FLIP OR SKIP";

function MascotSvg({ size = 120, spin = 3 }) {
  return (
    <svg className="flip-intro-mascot-svg" width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
      <ellipse cx="80" cy="80" rx="70" ry="20" fill="none" stroke="#5CE0B8" strokeWidth="2" transform="rotate(-23 80 80)">
        <animateTransform attributeName="transform" type="rotate" from="-23 80 80" to="337 80 80" dur={`${spin}s`} repeatCount="indefinite" />
      </ellipse>
      <path d="M 50 50 L 44 22 L 66 42 Z" fill="none" stroke="#5CE0B8" strokeWidth="2" />
      <path d="M 110 50 L 116 22 L 94 42 Z" fill="none" stroke="#5CE0B8" strokeWidth="2" />
      <ellipse cx="80" cy="86" rx="38" ry="36" fill="none" stroke="#5CE0B8" strokeWidth="2" />
      <path d="M 62 102 Q 80 132 98 102 Q 94 116 80 118 Q 66 116 62 102 Z" fill="none" stroke="#5CE0B8" strokeWidth="2" />
      <ellipse cx="80" cy="108" rx="3" ry="2.4" fill="#5CE0B8" />
      <path d="M 60 80 Q 67 76 74 80" stroke="#5CE0B8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="98" cy="80" rx="3.5" ry="3" fill="#5CE0B8" />
    </svg>
  );
}

export default function IntroScreen({ puzzleNumber, onStart, ready = true, warping = false, replayCount = 0, konamiArmed = false, konamiHint = false }) {
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

  return (
    <div className={`flip-intro ${warping ? "flip-intro--warping" : ""}`}>
      <span className="flip-intro-day flip-day-chip">DAY {puzzleNumber}</span>

      <div className="flip-intro-inner">
        <motion.div
          className="flip-intro-mascot"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
        >
          <MascotSvg />
        </motion.div>

        <h1 className="flip-intro-title flip-intro-title--gradient" aria-label={HEADLINE}>
          {headlineChars.map((c, i) => (
            <motion.span
              key={`${c}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
              style={{ display: "inline-block", whiteSpace: "pre" }}
            >
              {c}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="flip-intro-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          Daily thrift game. 10 items. Trust your gut.
        </motion.p>

        <motion.div
          className="flip-intro-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <span>DAILY DROP</span>
          <span className="flip-intro-stats-dot" aria-hidden="true">·</span>
          <span>10 ITEMS</span>
          <span className="flip-intro-stats-dot" aria-hidden="true">·</span>
          <span>DAY {puzzleNumber}</span>
        </motion.div>

        <motion.button
          type="button"
          onClick={onStart}
          disabled={!ready}
          className={`flip-tap-in flip-tap-in--cosmic ${showIdle && ready ? "flip-tap-in--idle" : ""}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flip-tap-in-particles" aria-hidden="true">
            <span /><span /><span />
          </span>
          {ready ? (playedToday ? "PLAY AGAIN →" : "TAP IN →") : "LOADING…"}
        </motion.button>

        <motion.p
          className="flip-intro-fine"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.4 }}
        >
          free. no signup. one round per day.
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

        {firstTime && !showIdle && (
          <motion.div
            className="flip-intro-tip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2 }}
          >
            first time? trust your gut. you got this.
          </motion.div>
        )}

        {showIdle && (
          <div className="flip-intro-tip flip-intro-tip--idle">press it →</div>
        )}
      </div>
    </div>
  );
}
