"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Dashboard tile that surfaces today's FLIP OR SKIP round. Reads from
 * localStorage to detect whether the user has already played today and
 * adapts copy + CTA accordingly. Pure client component — no server data
 * dependency.
 */
export default function FlipDailyCard() {
  const [today, setToday] = useState<{ played: boolean; score: number; dollars: number }>({
    played: false, score: 0, dollars: 0,
  });
  const [streak, setStreak] = useState(0);
  const [streakBoost, setStreakBoost] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ymd = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem("fos-last-played-date");
      const score = parseInt(localStorage.getItem("fos-last-score") || "0", 10);
      const dollars = parseInt(localStorage.getItem("fos-total-flipped") || "0", 10);
      const s = parseInt(localStorage.getItem("fos-streak-count") || "0", 10);
      setToday({ played: last === ymd, score, dollars });
      setStreak(s);
      // Streak-boost banner — fired by ShareGrid after a successful share.
      const sharedAt = parseInt(sessionStorage.getItem("fos-just-shared") || "0", 10);
      if (sharedAt && Date.now() - sharedAt < 10 * 60 * 1000) {
        setStreakBoost(true);
        sessionStorage.removeItem("fos-just-shared"); // show once
        window.setTimeout(() => setStreakBoost(false), 5000);
      }
    } catch { /* private mode */ }
  }, []);

  return (
    <div className="fdc-wrap">
      {streakBoost && (
        <div className="fdc-streak-boost">✓ shared today — streak boost applied</div>
      )}
      <div className="fdc">
      <style>{STYLES}</style>
      <div className="fdc-glyph" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="8" fill="none" stroke="#5CE0B8" strokeWidth="2" />
          <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="#5CE0B8" strokeWidth="1.5" transform="rotate(-23 20 20)" />
        </svg>
      </div>

      <div className="fdc-inner">
        <div className="fdc-eyebrow">🎯 FLIP OR SKIP</div>
        {today.played ? (
          <>
            <div className="fdc-mid">✓ Played today · {today.score}/10 · ${today.dollars} spotted</div>
            <Link href="/flip" className="fdc-btn fdc-btn--outline">PLAY AGAIN →</Link>
          </>
        ) : (
          <>
            <div className="fdc-mid">Today's drop is live → play</div>
            <Link href="/flip" className="fdc-btn fdc-btn--solid">PLAY DAILY →</Link>
          </>
        )}
        <div className="fdc-foot">next drop · midnight local</div>
      </div>

      {streak >= 2 && (
        <div className="fdc-streak">
          <span className="fdc-streak-flame">🔥</span>
          <span className="fdc-streak-num">{streak}</span>
          <span className="fdc-streak-label">day streak</span>
        </div>
      )}
      </div>
    </div>
  );
}

const STYLES = `
.fdc-wrap { display: flex; flex-direction: column; gap: 8px; }
.fdc-streak-boost {
  background: #5CE0B8; color: #000;
  font-family: var(--font-manrope), sans-serif; font-weight: 700; font-size: 13px;
  padding: 8px 14px; letter-spacing: 0.04em; border-radius: 10px;
  box-shadow: 0 0 24px rgba(92,224,184,0.5);
  text-align: center;
}
.fdc {
  position: relative; overflow: hidden;
  border: 1px solid rgba(92,224,184,0.25);
  background: linear-gradient(180deg, rgba(10,22,18,0.6) 0%, rgba(10,10,10,0.85) 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex; gap: 16px; align-items: center; justify-content: space-between;
  min-height: 200px;
}
.fdc-glyph { position: absolute; bottom: -10px; right: -10px; opacity: 0.1; }
.fdc-inner { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; position: relative; z-index: 1; }
.fdc-eyebrow { font-family: ui-monospace, monospace; font-weight: 700; font-size: 11px; letter-spacing: 0.18em; color: #5CE0B8; }
.fdc-mid { font-family: var(--font-manrope), sans-serif; font-size: 16px; color: #fff; line-height: 1.3; }
.fdc-btn {
  align-self: flex-start; padding: 10px 18px; font-family: var(--font-manrope), sans-serif;
  font-weight: 700; font-size: 12px; letter-spacing: 0.18em; text-decoration: none;
  margin-top: 4px;
}
.fdc-btn--solid { background: #5CE0B8; color: #000; }
.fdc-btn--outline { border: 1px solid #5CE0B8; color: #5CE0B8; }
.fdc-foot { font-family: ui-monospace, monospace; font-size: 10px; color: rgba(92,224,184,0.5); letter-spacing: 0.12em; margin-top: 4px; }
.fdc-streak { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 88px; position: relative; z-index: 1; }
.fdc-streak-flame { font-size: 24px; animation: fdc-pulse 2s ease-in-out infinite; }
.fdc-streak-num { font-family: var(--font-manrope), sans-serif; font-weight: 900; font-size: 36px; color: #F5C518; line-height: 1; font-variant-numeric: tabular-nums; }
.fdc-streak-label { font-family: ui-monospace, monospace; font-size: 9px; color: rgba(245,197,24,0.7); letter-spacing: 0.12em; }
@keyframes fdc-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
@media (prefers-reduced-motion: reduce) { .fdc-streak-flame { animation: none; } }
`;
