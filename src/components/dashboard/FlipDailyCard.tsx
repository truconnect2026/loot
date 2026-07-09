"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDailyItems } from "../../app/flip/lib/dailySeed.js";

/**
 * Dashboard tile that surfaces today's FLIP OR SKIP round as a STATEFUL
 * game tile. Reads (never writes) the daily game's localStorage:
 *   - fos-last-played-date  (YYYY-MM-DD → played-today when === today)
 *   - fos-last-score / fos-total-flipped  (State B recap line)
 *   - fos-streak-count      (streak chip — rendered ONLY when > 0)
 * Today's teaser image comes from getDailyItems() — the same pure,
 * date-seeded function the game itself uses (read-only; game logic
 * untouched). The peek is blurred hard so it teases the drop without
 * revealing anything the round asks you to call.
 *
 * STATE A (not played): blurred face-down drop card with idle tilt
 * breathe + PLAY DAILY hero button; pressing PLAY plays a ~240ms flip
 * flourish on the teaser, then routes to /flip.
 * STATE B (played): settled crisp card + ✓, calm recap, live countdown
 * to local midnight (ticks every second — informational, so it keeps
 * ticking under reduced motion), and a quiet "view today's drop" link.
 * All decorative motion is transform/opacity only and dies under
 * prefers-reduced-motion.
 */

function useCountdownToMidnight(active: boolean, onMidnight: () => void) {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const now = new Date();
      const mid = new Date(now);
      mid.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((mid.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      setLeft(`${h}:${m}:${ss}`);
      if (s === 0) onMidnight();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return left;
}

export default function FlipDailyCard() {
  const router = useRouter();
  const [today, setToday] = useState<{ played: boolean; score: number; dollars: number }>({
    played: false, score: 0, dollars: 0,
  });
  const [streak, setStreak] = useState(0);
  const [streakBoost, setStreakBoost] = useState(false);
  const [teaserImg, setTeaserImg] = useState<string | null>(null);
  const [imgBroken, setImgBroken] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const readState = () => {
    try {
      const ymd = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem("fos-last-played-date");
      const score = parseInt(localStorage.getItem("fos-last-score") || "0", 10);
      const dollars = parseInt(localStorage.getItem("fos-total-flipped") || "0", 10);
      const s = parseInt(localStorage.getItem("fos-streak-count") || "0", 10);
      setToday({ played: last === ymd, score, dollars });
      setStreak(s);
    } catch { /* private mode */ }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    readState();
    // Today's drop teaser — client-only (date-seeded) to avoid any SSR
    // date mismatch. Read-only peek at the same bank the game draws.
    try {
      setTeaserImg(getDailyItems()[0]?.image ?? null);
    } catch { /* bank unavailable — face-down fallback renders */ }
    try {
      // Streak-boost banner — fired by ShareGrid after a successful share.
      const sharedAt = parseInt(sessionStorage.getItem("fos-just-shared") || "0", 10);
      if (sharedAt && Date.now() - sharedAt < 10 * 60 * 1000) {
        setStreakBoost(true);
        sessionStorage.removeItem("fos-just-shared"); // show once
        window.setTimeout(() => setStreakBoost(false), 5000);
      }
    } catch { /* private mode */ }
  }, []);

  // Countdown only matters in State B; when it crosses midnight the card
  // re-reads storage and settles back into State A for the new drop.
  const countdown = useCountdownToMidnight(today.played, readState);

  // PLAY handoff: brief flip flourish on the teaser, then route. Under
  // reduced motion (or if matchMedia is unavailable) navigate instantly.
  const onPlay = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch { /* default: animate */ }
    if (reduced || leaving) {
      router.push("/flip");
      return;
    }
    setLeaving(true);
    window.setTimeout(() => router.push("/flip"), 240);
  };

  const showPeek = teaserImg && !imgBroken;

  return (
    <div className="fdc-wrap">
      {streakBoost && (
        <div className="fdc-streak-boost">✓ shared today — streak boost applied</div>
      )}
      <div className="fdc">
      <style>{STYLES}</style>

      {/* Streak chip — stakes, top-right. Rendered ONLY when a real
          streak exists in storage; never fabricated. */}
      {streak > 0 && (
        <div className="fdc-chip" aria-label={`${streak} day streak`}>
          <span className="fdc-chip-flame">🔥</span>
          <span className="fdc-chip-num">{streak}</span>
          <span className="fdc-chip-label">{today.played ? "streak alive" : "keep it alive"}</span>
        </div>
      )}

      <div className="fdc-inner">
        <div className="fdc-eyebrow">🎯 FLIP OR SKIP</div>
        {today.played ? (
          <>
            <div className="fdc-mid">✓ played · {today.score}/10 · ${today.dollars} spotted</div>
            <div className="fdc-count">
              next drop · <span className="fdc-count-digits">{countdown}</span>
            </div>
            <Link href="/flip" className="fdc-btn fdc-btn--outline">
              view today&apos;s drop <span className="fdc-arr">→</span>
            </Link>
          </>
        ) : (
          <>
            <div className="fdc-mid">today&apos;s drop is live. can you call it?</div>
            <Link href="/flip" onClick={onPlay} className="fdc-btn fdc-btn--solid">
              PLAY DAILY <span className="fdc-arr">→</span>
            </Link>
            <div className="fdc-foot">next drop · midnight local</div>
          </>
        )}
      </div>

      {/* The drop card — face-down blurred peek (A) / settled reveal (B).
          Foreground depth layer; the card body recedes behind it. */}
      <div
        className={
          "fdc-drop" +
          (today.played ? " fdc-drop--settled" : " fdc-drop--idle") +
          (leaving ? " fdc-drop--flip" : "")
        }
        aria-hidden="true"
      >
        {showPeek ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teaserImg}
            alt=""
            className={"fdc-drop-img" + (today.played ? "" : " fdc-drop-img--peek")}
            onError={() => setImgBroken(true)}
            draggable={false}
          />
        ) : (
          <div className="fdc-drop-back">
            <svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="8" fill="none" stroke="#5CE0B8" strokeWidth="2" />
              <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="#5CE0B8" strokeWidth="1.5" transform="rotate(-23 20 20)" />
            </svg>
          </div>
        )}
        {!today.played && <div className="fdc-drop-q">?</div>}
        {!today.played && <div className="fdc-drop-sheen" />}
        {today.played && <div className="fdc-drop-check">✓</div>}
      </div>
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
  box-shadow: 0 0 18px rgba(92,224,184,0.35);
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
.fdc-inner { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; position: relative; z-index: 1; }
.fdc-eyebrow { font-family: var(--font-space-mono), monospace; font-weight: 700; font-size: 11px; letter-spacing: 0.18em; color: #5CE0B8; }
.fdc-mid { font-family: var(--font-manrope), sans-serif; font-size: 16px; color: #fff; line-height: 1.3; }
.fdc-btn {
  align-self: flex-start; padding: 11px 20px; font-family: var(--font-manrope), sans-serif;
  font-weight: 700; font-size: 12px; letter-spacing: 0.18em; text-decoration: none;
  margin-top: 4px;
  border-radius: 12px;
  transition: transform 160ms cubic-bezier(0.22,1,0.36,1), filter 160ms ease;
}
.fdc-btn:active { transform: scale(0.96); filter: brightness(0.94); }
.fdc-arr { display: inline-block; transition: transform 160ms cubic-bezier(0.22,1,0.36,1); }
.fdc-btn:hover .fdc-arr, .fdc-btn:active .fdc-arr { transform: translateX(3px); }
.fdc-btn--solid {
  /* The Home hero: same gradient language as the primary CTAs, with a
     soft bloom beneath — the loudest element in the scrollable content. */
  background: linear-gradient(180deg, #6FE5C0 0%, #4FD1A5 100%);
  color: #070510;
  box-shadow: 0 2px 6px rgba(92,224,184,0.30), 0 8px 22px -4px rgba(92,224,184,0.40), inset 0 1px 0 rgba(255,255,255,0.25);
}
.fdc-btn--outline { border: 1px solid rgba(92,224,184,0.55); color: #5CE0B8; }
.fdc-foot { font-family: var(--font-space-mono), monospace; font-size: 10px; color: rgba(92,224,184,0.5); letter-spacing: 0.12em; margin-top: 4px; }
.fdc-count {
  font-family: var(--font-space-mono), monospace; font-size: 11px;
  letter-spacing: 0.10em; color: rgba(92,224,184,0.7);
}
.fdc-count-digits { font-variant-numeric: tabular-nums; color: #5CE0B8; }

/* ── Drop-card teaser ── */
.fdc-drop {
  position: relative; z-index: 1; flex-shrink: 0;
  width: 92px; height: 122px;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(92,224,184,0.45);
  background: linear-gradient(165deg, #101426 0%, #0a0d1a 100%);
  box-shadow: 0 6px 18px -4px rgba(92,224,184,0.30), inset 0 1px 0 rgba(255,255,255,0.12);
}
.fdc-drop--idle { animation: fdcFloat 3.2s ease-in-out infinite; will-change: transform; }
@keyframes fdcFloat {
  0%, 100% { transform: rotate(-1.5deg) translateY(0); }
  50% { transform: rotate(1.5deg) translateY(-3px); }
}
.fdc-drop--flip { animation: fdcFlipOut 240ms cubic-bezier(0.22,1,0.36,1) both; }
@keyframes fdcFlipOut {
  to { transform: perspective(400px) rotateY(88deg) scale(0.92); opacity: 0.4; }
}
.fdc-drop--settled { box-shadow: 0 4px 12px -4px rgba(92,224,184,0.18), inset 0 1px 0 rgba(255,255,255,0.10); }
.fdc-drop-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fdc-drop-img--peek { filter: blur(14px) saturate(1.1) brightness(0.75); transform: scale(1.35); }
.fdc-drop-back { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0.55; }
.fdc-drop-q {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-space-mono), monospace; font-weight: 700; font-size: 30px;
  color: rgba(92,224,184,0.9); text-shadow: 0 2px 12px rgba(0,0,0,0.6);
}
.fdc-drop-sheen {
  position: absolute; inset: -40% -60%;
  background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.14) 50%, transparent 58%);
  animation: fdcSheen 3.2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes fdcSheen {
  0%, 55%, 100% { transform: translateX(-45%); }
  80% { transform: translateX(45%); }
}
.fdc-drop-check {
  position: absolute; top: 6px; right: 6px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #5CE0B8; color: #070510;
  font-family: var(--font-space-mono), monospace; font-weight: 700; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(92,224,184,0.4);
}

/* ── Streak chip — top-right stakes ── */
.fdc-chip {
  position: absolute; top: 12px; right: 12px; z-index: 2;
  display: flex; align-items: center; gap: 5px;
  padding: 5px 9px; border-radius: 999px;
  background: rgba(245,197,24,0.10);
  border: 1px solid rgba(245,197,24,0.30);
}
.fdc-chip-flame { font-size: 12px; line-height: 1; }
.fdc-chip-num {
  font-family: var(--font-manrope), sans-serif; font-weight: 800; font-size: 13px;
  color: #F5C518; line-height: 1; font-variant-numeric: tabular-nums;
}
.fdc-chip-label {
  font-family: var(--font-space-mono), monospace; font-size: 8px;
  color: rgba(245,197,24,0.75); letter-spacing: 0.10em;
}

@media (prefers-reduced-motion: reduce) {
  .fdc-btn, .fdc-arr { transition: none; }
  .fdc-btn:active { transform: none; filter: none; }
  .fdc-btn:hover .fdc-arr, .fdc-btn:active .fdc-arr { transform: none; }
  .fdc-drop--idle, .fdc-drop--flip { animation: none; }
  .fdc-drop-sheen { animation: none; display: none; }
}
`;
