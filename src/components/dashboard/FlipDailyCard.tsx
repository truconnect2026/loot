"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  // Off-screen: pause EVERY animation on the collectible via one class
  // (animation-play-state) — Home also runs the entrance stagger and the
  // nav blur; this card must cost nothing while scrolled away.
  const dropRef = useRef<HTMLDivElement>(null);
  const [dropInView, setDropInView] = useState(true);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setDropInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
      <div className={"fdc" + (dropInView ? "" : " fdc--paused")}>
      <style>{STYLES}</style>

      {/* Living mint edge — the peripheral-vision winner. Breathes on
          OPACITY only (the ring's box-shadow values are static inside the
          layer, so it stays compositor-only). Pauses off-screen with the
          rest of the card's motion. */}
      <div className="fdc-edge-glow" aria-hidden="true" />

      {/* Top-right hook badge — ALWAYS present so a scrolling eye lands on
          a reason to tap. A real streak (fos-streak-count) shows the flame
          count as returning-user stakes; with no streak we show a
          confident "FREE DAILY" pill (the cold-traffic value: free, daily,
          zero friction). Streak count is never fabricated. */}
      {streak > 0 ? (
        <div className="fdc-chip" aria-label={`${streak} day streak`}>
          <span className="fdc-chip-flame">🔥</span>
          <span className="fdc-chip-num">{streak}</span>
          <span className="fdc-chip-label">{today.played ? "streak alive" : "keep it alive"}</span>
        </div>
      ) : (
        <div className="fdc-chip fdc-chip--free" aria-label="Free daily game">
          <span className="fdc-chip-free-dot" />
          <span className="fdc-chip-free-label">FREE DAILY</span>
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

      {/* The drop card — a holographic mystery collectible (A) that
          resolves to the settled crisp item (B). Foreground depth layer;
          all decorative layers are gated to State A and pause entirely
          when the card leaves the viewport. */}
      <div
        ref={dropRef}
        className={
          "fdc-drop" +
          (today.played ? " fdc-drop--settled" : " fdc-drop--idle") +
          (leaving ? " fdc-drop--flip" : "") +
          (dropInView ? "" : " fdc-drop--paused")
        }
        aria-hidden="true"
      >
        {/* object behind frosted glass — high-contrast silhouette, never
            a smear, never enough detail to infer the flip/skip call */}
        {showPeek ? (
          <div className="fdc-peek">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={teaserImg}
              alt=""
              className={"fdc-peek-img" + (today.played ? " fdc-peek-img--revealed" : "")}
              onError={() => setImgBroken(true)}
              draggable={false}
            />
            {!today.played && <div className="fdc-peek-glass" />}
          </div>
        ) : (
          <div className="fdc-drop-back" />
        )}

        {!today.played && (
          <>
            {/* foil watermark — embossed Saturn back, static premium base */}
            <svg className="fdc-holo-saturn" width="64" height="64" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(92,224,184,0.30)" strokeWidth="1.6" />
              <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="rgba(92,224,184,0.22)" strokeWidth="1.2" transform="rotate(-23 20 20)" />
              <ellipse cx="20" cy="20" rx="14" ry="3.6" fill="none" stroke="rgba(59,130,246,0.14)" strokeWidth="1" transform="rotate(-23 20 20)" />
            </svg>
            {/* iridescent holo foil — the signature drift */}
            <div className="fdc-holo-foil" />
            {/* inner vignette for depth */}
            <div className="fdc-vignette" />
            {/* cosmic motes */}
            <div className="fdc-motes">
              <i /><i /><i /><i /><i />
            </div>
            {/* analyzing scan-line */}
            <div className="fdc-scanline" />
            {/* the ? — halo breathe + rare decode flicker */}
            <div className="fdc-q-halo" />
            <div className="fdc-drop-q">?</div>
            <div className="fdc-q-glitch">?</div>
            {/* living border beam (ring-masked rotating conic) */}
            <div className="fdc-beam"><div className="fdc-beam-spin" /></div>
            {/* flip-handoff light streak */}
            <div className="fdc-flip-streak" />
          </>
        )}
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
  border: 1px solid rgba(92,224,184,0.42);
  background: linear-gradient(180deg, rgba(10,22,18,0.6) 0%, rgba(10,10,10,0.85) 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex; gap: 16px; align-items: center; justify-content: space-between;
  min-height: 200px;
  /* static presence — a constant mint bloom + depth so the tile reads as
     "something rewarding is here" even before the breathing edge lands
     (and as the shipped reduced-motion base). Static box-shadow: no
     per-frame paint. Sits secondary to SCAN's 44px-title viewfinder. */
  box-shadow:
    0 8px 30px -12px rgba(0,0,0,0.6),
    0 0 30px -8px rgba(92,224,184,0.26);
}
.fdc--paused .fdc-edge-glow,
.fdc--paused .fdc-btn--solid::after { animation-play-state: paused !important; }

/* Living mint edge ring — inset (inside the card's overflow clip) so it
   never fights the outer bloom; breathes via OPACITY only. Brighter at
   peak than a neutral card → wins the scroll's peripheral vision. */
.fdc-edge-glow {
  position: absolute; inset: 0; z-index: 0; border-radius: 16px;
  pointer-events: none;
  box-shadow:
    inset 0 0 0 1.5px rgba(92,224,184,0.6),
    inset 0 0 26px rgba(92,224,184,0.14);
  opacity: 0.5;
  animation: fdcEdgeBreathe 3.6s ease-in-out infinite;
}
@keyframes fdcEdgeBreathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
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
  position: relative;
  background: linear-gradient(180deg, #6FE5C0 0%, #4FD1A5 100%);
  color: #070510;
  box-shadow: 0 2px 6px rgba(92,224,184,0.30), 0 8px 22px -4px rgba(92,224,184,0.40), inset 0 1px 0 rgba(255,255,255,0.25);
}
/* Idle "tap me" glow ring — a soft mint halo pulsing on OPACITY only
   (compositor-safe). Says the CTA is live without moving the button. */
.fdc-btn--solid::after {
  content: ""; position: absolute; inset: -2px; border-radius: 13px;
  box-shadow: 0 0 16px 1px rgba(92,224,184,0.55);
  opacity: 0; pointer-events: none;
  animation: fdcCtaPulse 2.6s ease-in-out infinite;
}
@keyframes fdcCtaPulse { 0%, 100% { opacity: 0; } 50% { opacity: 0.85; } }
.fdc-btn--outline { border: 1px solid rgba(92,224,184,0.55); color: #5CE0B8; }
.fdc-foot { font-family: var(--font-space-mono), monospace; font-size: 10px; color: rgba(92,224,184,0.5); letter-spacing: 0.12em; margin-top: 4px; }
.fdc-count {
  font-family: var(--font-space-mono), monospace; font-size: 11px;
  letter-spacing: 0.10em; color: rgba(92,224,184,0.7);
}
.fdc-count-digits { font-variant-numeric: tabular-nums; color: #5CE0B8; }

/* ══ Holographic drop-card collectible ══
   Layer order (back → front): peek object / glass scrim / saturn foil
   watermark / holo foil drift / vignette / motes / scan-line / ?-halo /
   ? / glitch copy / border beam / flip streak.
   EVERY animation is transform/opacity/filter-only; .fdc-drop--paused
   (set by IntersectionObserver) freezes the whole stack off-screen. */
.fdc-drop {
  position: relative; z-index: 1; flex-shrink: 0;
  width: 92px; height: 122px;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(92,224,184,0.55);
  background: linear-gradient(165deg, #101426 0%, #0a0d1a 100%);
  /* floats above the card body: lifted drop shadow + rim light */
  box-shadow:
    0 10px 22px -6px rgba(0,0,0,0.55),
    0 6px 18px -4px rgba(92,224,184,0.28),
    inset 0 1px 0 rgba(255,255,255,0.14);
}
.fdc-drop--paused, .fdc-drop--paused * { animation-play-state: paused !important; }
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

/* object behind frosted glass — contrast-forward, mint-tinted, dark */
.fdc-peek { position: absolute; inset: 0; }
.fdc-peek-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: blur(9px) saturate(1.2) contrast(1.3) brightness(0.9);
  transform: scale(1.3);
  /* Feather the art's rectangular edges to transparent so it floats on
     the card face instead of reading as a pasted-in rectangle. The
     center (Saturn + ?) stays fully opaque; the outer ~28% fades, and
     the card gradient shows through — one continuous surface. Applies
     in both idle and revealed states (revealed only drops the blur). */
  -webkit-mask: radial-gradient(ellipse 92% 88% at 50% 47%, #000 72%, transparent 100%);
  mask: radial-gradient(ellipse 92% 88% at 50% 47%, #000 72%, transparent 100%);
}
/* State A idle: the object drifts on its own phase inside the card's
   tilt — real depth between glass and object. */
.fdc-drop--idle .fdc-peek-img { animation: fdcParallax 3.2s ease-in-out infinite; }
@keyframes fdcParallax {
  0%, 100% { transform: scale(1.3) translate(2px, 1px); }
  50% { transform: scale(1.3) translate(-2px, -2px); }
}
.fdc-peek-img--revealed { filter: none; transform: none; animation: none; }
.fdc-peek-glass {
  position: absolute; inset: 0;
  background:
    linear-gradient(160deg, rgba(10, 22, 26, 0.42) 0%, rgba(7, 5, 16, 0.72) 100%),
    rgba(92, 224, 184, 0.06);
  box-shadow: inset 0 0 18px rgba(7, 5, 16, 0.55);
}
.fdc-drop-back {
  position: absolute; inset: 0;
  background: linear-gradient(165deg, #101426 0%, #0a0d1a 100%);
}

/* saturn foil watermark — embossed, static premium base */
.fdc-holo-saturn {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%) rotate(-8deg);
  opacity: 0.8; pointer-events: none;
}
/* iridescent foil — brand cosmos colors, screen-blended, slow drift.
   Oversized layer moved by transform only. */
.fdc-holo-foil {
  position: absolute; inset: -70%;
  background: linear-gradient(115deg,
    transparent 24%,
    rgba(92, 224, 184, 0.20) 36%,
    rgba(59, 130, 246, 0.18) 46%,
    rgba(107, 70, 193, 0.20) 56%,
    rgba(245, 197, 24, 0.10) 66%,
    transparent 78%);
  mix-blend-mode: screen;
  animation: fdcHolo 4.8s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes fdcHolo {
  from { transform: translate3d(-14%, -10%, 0); }
  to { transform: translate3d(14%, 10%, 0); }
}
.fdc-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(7, 5, 16, 0.5) 100%);
  pointer-events: none;
}
/* cosmic motes — whisper-subtle drifting stars, one shared timeline */
.fdc-motes { position: absolute; inset: 0; pointer-events: none; }
.fdc-motes i {
  position: absolute; width: 2px; height: 2px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: fdcMote 6.4s ease-in-out infinite;
  opacity: 0.2;
}
.fdc-motes i:nth-child(1) { left: 18%; top: 22%; animation-delay: 0s; }
.fdc-motes i:nth-child(2) { left: 74%; top: 16%; background: rgba(92,224,184,0.8); animation-delay: -1.4s; }
.fdc-motes i:nth-child(3) { left: 30%; top: 68%; animation-delay: -2.8s; }
.fdc-motes i:nth-child(4) { left: 66%; top: 78%; background: rgba(92,224,184,0.8); animation-delay: -4.2s; }
.fdc-motes i:nth-child(5) { left: 48%; top: 38%; animation-delay: -5.6s; }
@keyframes fdcMote {
  0%, 100% { transform: translate(0, 0); opacity: 0.15; }
  50% { transform: translate(3px, -5px); opacity: 0.5; }
}
/* analyzing scan-line — vertical mint sweep */
.fdc-scanline {
  position: absolute; left: 6%; right: 6%; top: -4px; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(92,224,184,0.75), transparent);
  box-shadow: 0 0 8px rgba(92,224,184,0.5);
  animation: fdcScan 2.6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes fdcScan {
  0%, 12% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  88%, 100% { transform: translateY(126px); opacity: 0; }
}
/* the ? — static glow always; halo breathes; rare decode flicker */
.fdc-q-halo {
  position: absolute; left: 50%; top: 50%; width: 56px; height: 56px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(92,224,184,0.30) 0%, transparent 70%);
  animation: fdcQBreathe 2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes fdcQBreathe {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.fdc-drop-q {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-space-mono), monospace; font-weight: 700; font-size: 30px;
  color: rgba(92,224,184,0.95);
  text-shadow: 0 0 14px rgba(92,224,184,0.55), 0 2px 12px rgba(0,0,0,0.6);
}
/* decode flicker: a blue-shifted twin flashes for ~4% of a 6.4s loop —
   teases the reveal, never shows it */
.fdc-q-glitch {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-space-mono), monospace; font-weight: 700; font-size: 30px;
  color: rgba(59, 130, 246, 0.9);
  opacity: 0; pointer-events: none;
  animation: fdcGlitch 6.4s steps(2, jump-none) infinite;
}
@keyframes fdcGlitch {
  0%, 92.9% { opacity: 0; transform: translate(0, 0) skewX(0); }
  93% { opacity: 0.8; transform: translate(2px, -1px) skewX(-8deg); }
  94.5% { opacity: 0.6; transform: translate(-2px, 1px) skewX(6deg); }
  96%, 100% { opacity: 0; transform: translate(0, 0) skewX(0); }
}
/* living border beam — static ring mask, rotating conic inside */
.fdc-beam {
  position: absolute; inset: 0; border-radius: 12px; padding: 1.5px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
  overflow: hidden;
}
.fdc-beam-spin {
  position: absolute; left: -55%; top: -55%; width: 210%; height: 210%;
  background: conic-gradient(transparent 0deg 292deg, rgba(92,224,184,0.9) 326deg, transparent 360deg);
  animation: fdcBeam 3s linear infinite;
}
@keyframes fdcBeam {
  to { transform: rotate(360deg); }
}
/* flip handoff — light streak sweeps as the card rotates away */
.fdc-flip-streak {
  position: absolute; inset: -30% -70%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, rgba(92,224,184,0.25) 54%, transparent 64%);
  transform: translateX(-70%);
  opacity: 0;
  pointer-events: none;
}
.fdc-drop--flip .fdc-flip-streak { animation: fdcStreak 240ms ease-out both; }
@keyframes fdcStreak {
  from { transform: translateX(-70%); opacity: 1; }
  to { transform: translateX(70%); opacity: 0; }
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
  /* top:14 (not 12) so the padded chip's optical midline baseline-pairs
     with the "🎯 FLIP OR SKIP" eyebrow across the card top. */
  position: absolute; top: 14px; right: 12px; z-index: 2;
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

/* "FREE DAILY" pill — the always-on hook when there's no streak yet.
   Mint (the free/action color), confident, never fine print. */
.fdc-chip--free { background: rgba(92,224,184,0.10); border-color: rgba(92,224,184,0.38); }
.fdc-chip-free-dot {
  width: 5px; height: 5px; border-radius: 50%; background: #5CE0B8;
  box-shadow: 0 0 6px rgba(92,224,184,0.85);
}
.fdc-chip-free-label {
  font-family: var(--font-space-mono), monospace; font-weight: 700; font-size: 9px;
  color: #5CE0B8; letter-spacing: 0.16em;
}

@media (prefers-reduced-motion: reduce) {
  .fdc-btn, .fdc-arr { transition: none; }
  .fdc-btn:active { transform: none; filter: none; }
  .fdc-btn:hover .fdc-arr, .fdc-btn:active .fdc-arr { transform: none; }
  /* kill every decorative motion layer; the static base (foil-watermark
     saturn back, mint rim, glowing ?, glass peek, float shadow) IS the
     shipped look under reduced motion — complete, nothing broken */
  .fdc-drop--idle, .fdc-drop--flip,
  .fdc-holo-foil, .fdc-peek-img, .fdc-q-halo, .fdc-q-glitch,
  .fdc-beam-spin, .fdc-motes i, .fdc-flip-streak { animation: none !important; }
  .fdc-scanline, .fdc-motes, .fdc-beam, .fdc-q-glitch { display: none; }
  .fdc-q-halo { opacity: 0.7; }
  /* Designed elevated static glow (NOT flat): the breathing edge freezes
     bright and the CTA keeps a soft static halo, so the tile still reads
     as live and premium with zero motion — this is David's shipped look. */
  .fdc-edge-glow { animation: none; opacity: 0.85; }
  .fdc-btn--solid::after { animation: none; opacity: 0.4; }
}
`;
