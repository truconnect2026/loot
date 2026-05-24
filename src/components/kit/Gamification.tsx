"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { withUTM } from "@/lib/utm";

const DIGISTORE_SIGNUP = "https://digistore24.com/signup/691098/";
const READY_TOAST_URL = withUTM(DIGISTORE_SIGNUP, "kit_ready_toast", "affiliate_signup");
const COPIES_CHIP_URL = withUTM(DIGISTORE_SIGNUP, "kit_copies_chip", "affiliate_signup");

/**
 * Gamification — the floating widgets that live across the entire /kit
 * page after the user scrolls past the hero:
 *
 *  • Progress bar (top of viewport, mint gradient — % page scrolled)
 *  • Copies counter (bottom-right chip; increments via window event)
 *  • Achievement toasts (welcome on mount, "ready to earn" after 5 copies)
 *  • Sticky leaderboard mini-widget (desktop only, dismissible)
 *  • Mascot speech bubble (desktop only, rotating tips, dismissible)
 *  • Streak chip (returning-visitor counter, localStorage-backed)
 *
 * Each widget gates itself on prefers-reduced-motion / mobile / dismissal.
 *
 * COPY BUTTONS dispatch a CustomEvent("loot-kit-copy") so this component
 * doesn't need to know which buttons exist — it just counts the events.
 *
 * Listen pattern for COPY buttons elsewhere on the page:
 *   onClick={(e) => { ...do clipboard work...; window.dispatchEvent(new CustomEvent("loot-kit-copy")) }}
 */

const STREAK_KEY = "loot-kit-streak";
const STREAK_LASTSEEN_KEY = "loot-kit-streak-lastseen";
const TOAST_DISMISS_KEY = "loot-kit-toasts-dismissed";

const MASCOT_TIPS = [
  "trust your gut · grab your link",
  "wolf shit · this tier ladder is real",
  "Gold unlocks at $1,000 in 90 days · doable",
  "365-day cookie at Founding 20 · math checks out",
  "first to 100 paid signups → $2,500. go.",
  "post once · paid forever · the cookie is real",
];

type ToastKind = "welcome" | "ready-to-earn" | "founding-20-eyeball";
type Toast = { id: string; kind: ToastKind; body: string; cta?: { href: string; label: string } };

export default function Gamification() {
  // ── Scroll progress ──
  const [scrollPct, setScrollPct] = useState(0);
  const [pastHero, setPastHero] = useState(false);

  // ── Copies counter ──
  const [copies, setCopies] = useState(0);

  // ── Toasts ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismissed = useRef<Set<string>>(new Set());

  // ── Sticky leaderboard widget ──
  const [lbDismissed, setLbDismissed] = useState(false);

  // ── Mascot ──
  const [mascotVisible, setMascotVisible] = useState(false);
  const [mascotTipIdx, setMascotTipIdx] = useState(0);
  const [mascotDismissed, setMascotDismissed] = useState(false);

  // ── Streak ──
  const [streakDays, setStreakDays] = useState(0);
  const [streakDismissed, setStreakDismissed] = useState(false);

  // ── Feature gates ──
  const [enableDesktopWidgets, setEnableDesktopWidgets] = useState(false);
  const [enableProgress, setEnableProgress] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    setEnableDesktopWidgets(desktop);
    setEnableProgress(!reduced);

    // Streak: bump if last-seen was at least 1 calendar day ago.
    try {
      const today = new Date().toDateString();
      const lastSeen = localStorage.getItem(STREAK_LASTSEEN_KEY);
      let count = Number(localStorage.getItem(STREAK_KEY) || "0");
      if (!lastSeen) {
        count = 1;
      } else if (lastSeen !== today) {
        count += 1;
      }
      localStorage.setItem(STREAK_KEY, String(count));
      localStorage.setItem(STREAK_LASTSEEN_KEY, today);
      if (count >= 2) setStreakDays(count);
    } catch {
      /* localStorage unavailable */
    }

    // Re-load toast dismissal state
    try {
      const raw = localStorage.getItem(TOAST_DISMISS_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        arr.forEach((id) => dismissed.current.add(id));
      }
    } catch {
      /* JSON parse error — ignore */
    }
  }, []);

  // Scroll listener: progress bar + past-hero gate
  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      setScrollPct(pct);
      setPastHero(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Copies counter event listener
  useEffect(() => {
    function onCopy() {
      setCopies((c) => c + 1);
    }
    window.addEventListener("loot-kit-copy", onCopy as EventListener);
    return () =>
      window.removeEventListener("loot-kit-copy", onCopy as EventListener);
  }, []);

  // Toast: welcome on mount
  useEffect(() => {
    if (dismissed.current.has("welcome")) return;
    const t = window.setTimeout(() => {
      addToast({
        id: "welcome",
        kind: "welcome",
        body: "✓ Welcome to the kit — copy 5 templates to unlock the GET YOUR LINK fast-track.",
      });
    }, 1800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast: ready-to-earn after 5 copies
  useEffect(() => {
    if (copies >= 5 && !dismissed.current.has("ready-to-earn")) {
      addToast({
        id: "ready-to-earn",
        kind: "ready-to-earn",
        body: "💡 You're ready. Claim your link.",
        cta: { href: READY_TOAST_URL, label: "GET YOUR LINK →" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copies]);

  // Toast: eyeball on Founding 20 scroll-past
  useEffect(() => {
    function onScrollIO() {
      if (dismissed.current.has("founding-20-eyeball")) return;
      const sec = document.getElementById("founding-20");
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      // After Founding 20 fully scrolled past
      if (rect.bottom < -200) {
        addToast({
          id: "founding-20-eyeball",
          kind: "founding-20-eyeball",
          body: "👀 you read the whole Founding 20 section. apply?",
          cta: { href: "#founding-20-form", label: "APPLY →" },
        });
        window.removeEventListener("scroll", onScrollIO);
      }
    }
    window.addEventListener("scroll", onScrollIO, { passive: true });
    return () => window.removeEventListener("scroll", onScrollIO);
  }, []);

  // Mascot: appear after hero scroll, rotate tips
  useEffect(() => {
    if (!enableDesktopWidgets || mascotDismissed) return;
    if (!pastHero) {
      setMascotVisible(false);
      return;
    }
    const showT = window.setTimeout(() => setMascotVisible(true), 1500);
    const rotateT = window.setInterval(
      () => setMascotTipIdx((i) => (i + 1) % MASCOT_TIPS.length),
      45_000,
    );
    return () => {
      window.clearTimeout(showT);
      window.clearInterval(rotateT);
    };
  }, [enableDesktopWidgets, pastHero, mascotDismissed]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((cur) => {
      if (cur.find((t) => t.id === toast.id)) return cur;
      if (dismissed.current.has(toast.id)) return cur;
      return [...cur, toast];
    });
    // Auto-dismiss after 7s (unless it has a CTA)
    if (!toast.cta) {
      window.setTimeout(() => dismissToast(toast.id), 7000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
    dismissed.current.add(id);
    try {
      localStorage.setItem(
        TOAST_DISMISS_KEY,
        JSON.stringify([...dismissed.current]),
      );
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GAMIFICATION_STYLES }} />

      {/* PROGRESS BAR — top of viewport */}
      {enableProgress && (
        <div
          className="gm-progress"
          style={{ transform: `scaleX(${scrollPct / 100})` }}
          aria-hidden="true"
        />
      )}

      {/* STREAK CHIP — top-right, returning visitors only */}
      {streakDays >= 2 && !streakDismissed && (
        <div className="gm-streak" role="status">
          <span aria-hidden="true">👋</span>
          welcome back, day {streakDays} visiting the kit
          <button
            type="button"
            onClick={() => setStreakDismissed(true)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* COPIES COUNTER — bottom-right small chip */}
      {pastHero && copies > 0 && (
        <div
          className={`gm-copies${copies >= 5 ? " gm-copies--ready" : ""}`}
          role="status"
        >
          {copies < 5 ? (
            <>
              <span aria-hidden="true">📋</span>
              {copies} {copies === 1 ? "copy" : "copies"} this session
            </>
          ) : (
            <a
              href={COPIES_CHIP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              💡 ready to earn? CLAIM YOUR LINK →
            </a>
          )}
        </div>
      )}

      {/* STICKY LEADERBOARD WIDGET — desktop only */}
      {enableDesktopWidgets && pastHero && !lbDismissed && (
        <div className="gm-lb" role="complementary">
          <a
            href="#founding-20"
            className="gm-lb-link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("founding-20");
              if (el) {
                const top =
                  el.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
          >
            <span className="gm-lb-icon" aria-hidden="true">
              🏆
            </span>
            <div className="gm-lb-body">
              <div className="gm-lb-rank">#1 THIS MONTH</div>
              {/* TODO(David): wire real leaderboard data */}
              <div className="gm-lb-name">Top spot open — claim it</div>
            </div>
          </a>
          <button
            type="button"
            className="gm-lb-dismiss"
            onClick={() => setLbDismissed(true)}
            aria-label="Dismiss leaderboard widget"
          >
            ×
          </button>
        </div>
      )}

      {/* MASCOT — desktop only */}
      {enableDesktopWidgets && mascotVisible && !mascotDismissed && (
        <div className="gm-mascot" role="complementary">
          <button
            type="button"
            className="gm-mascot-orb"
            onClick={() => setMascotDismissed(true)}
            aria-label="Hide Flip"
            title="Tap to hide Flip for this session"
          >
            <img
              src="/brand-kit/flip/flip-smirk.png"
              alt=""
              aria-hidden="true"
            />
          </button>
          <div className="gm-mascot-bubble">
            <div className="gm-mascot-tip">{MASCOT_TIPS[mascotTipIdx]}</div>
            <button
              type="button"
              className="gm-mascot-dismiss"
              onClick={() => setMascotDismissed(true)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* TOASTS — bottom-left stack */}
      <div className="gm-toasts" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`gm-toast gm-toast--${t.kind}`}>
            <div className="gm-toast-body">{t.body}</div>
            {t.cta && (
              <a
                href={t.cta.href}
                target={t.cta.href.startsWith("http") ? "_blank" : undefined}
                rel={t.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (t.cta!.href.startsWith("#")) {
                    e.preventDefault();
                    const el = document.getElementById(t.cta!.href.slice(1));
                    if (el) {
                      const top =
                        el.getBoundingClientRect().top + window.scrollY - 80;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }
                  dismissToast(t.id);
                }}
                className="gm-toast-cta"
              >
                {t.cta.label}
              </a>
            )}
            <button
              type="button"
              className="gm-toast-dismiss"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

const GAMIFICATION_STYLES = `
.gm-progress {
  position: fixed;
  top: 0; left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
  transform-origin: left center;
  z-index: 200;
  pointer-events: none;
  transition: transform 100ms linear;
}

.gm-streak {
  position: fixed;
  top: 76px; right: 24px;
  z-index: 90;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: rgba(10,22,18,0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(92,224,184,0.3);
  border-radius: 999px;
  font: 500 11px/1 var(--mono, 'JetBrains Mono', monospace);
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.85);
  animation: gm-streak-in 400ms cubic-bezier(0.16,1,0.3,1);
}
.gm-streak button {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.4);
  font: 500 14px/1 var(--mono);
  padding: 0; margin-left: 4px;
}
.gm-streak button:hover { color: #fff; }
@keyframes gm-streak-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@media (max-width: 768px) {
  .gm-streak { display: none; }
}

.gm-copies {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 80;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: rgba(10,22,18,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 999px;
  font: 500 11px/1 var(--mono);
  letter-spacing: 0.04em;
  color: rgba(255,255,255,0.85);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  animation: gm-fade-in 400ms cubic-bezier(0.16,1,0.3,1);
}
.gm-copies--ready {
  border-color: rgba(92,224,184,0.45);
  background: rgba(92,224,184,0.12);
  padding: 0;
}
.gm-copies--ready a {
  display: inline-block;
  padding: 12px 20px;
  font-weight: 700;
  color: #5CE0B8;
  text-decoration: none;
  letter-spacing: 0.06em;
}
.gm-copies--ready a:hover { background: rgba(92,224,184,0.2); border-radius: 999px; }
@media (max-width: 639px) {
  .gm-copies { right: 12px; bottom: 12px; font-size: 10px; padding: 8px 12px; }
  .gm-copies--ready a { padding: 10px 14px; }
}
@keyframes gm-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.gm-lb {
  position: fixed;
  top: 50%; right: 24px;
  transform: translateY(-50%);
  z-index: 70;
  display: flex; align-items: center; gap: 6px;
  max-width: 220px;
  padding: 12px 14px;
  background: rgba(10,10,10,0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(245,197,24,0.3);
  border-radius: 12px;
  font: 500 11px/1.3 var(--mono);
  color: rgba(255,255,255,0.85);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  animation: gm-lb-in 500ms cubic-bezier(0.16,1,0.3,1);
}
.gm-lb-link {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; color: inherit;
  flex: 1;
}
.gm-lb-icon { font-size: 18px; }
.gm-lb-rank { color: #F5C518; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 2px; }
.gm-lb-name { color: rgba(255,255,255,0.7); font-size: 10px; }
.gm-lb-dismiss {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.3);
  font: 500 14px/1 var(--mono);
  padding: 0 4px;
}
.gm-lb-dismiss:hover { color: #fff; }
@keyframes gm-lb-in { from { opacity: 0; transform: translateY(-50%) translateX(20px); } to { opacity: 1; transform: translateY(-50%); } }
@media (max-width: 1023px) { .gm-lb { display: none; } }

.gm-mascot {
  position: fixed;
  bottom: 24px; left: 24px;
  z-index: 75;
  display: flex; align-items: flex-end; gap: 12px;
  animation: gm-mascot-in 500ms cubic-bezier(0.16,1,0.3,1);
}
.gm-mascot-orb {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(10,22,18,0.9);
  border: 1px solid rgba(92,224,184,0.4);
  box-shadow: 0 0 24px rgba(92,224,184,0.15), 0 8px 24px rgba(0,0,0,0.4);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  flex-shrink: 0;
}
.gm-mascot-orb img { width: 100%; height: 100%; object-fit: contain; }
.gm-mascot-bubble {
  display: flex; align-items: flex-start; gap: 8px;
  max-width: 240px;
  padding: 10px 14px;
  background: rgba(10,22,18,0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px 12px 12px 4px;
  font: 500 12px/1.4 var(--display, 'Outfit', sans-serif);
  color: rgba(255,255,255,0.85);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.gm-mascot-tip { flex: 1; }
.gm-mascot-dismiss {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.3);
  font: 500 14px/1 var(--mono);
  padding: 0; flex-shrink: 0;
}
.gm-mascot-dismiss:hover { color: #fff; }
@keyframes gm-mascot-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@media (max-width: 1023px) { .gm-mascot { display: none; } }

.gm-toasts {
  position: fixed;
  bottom: 24px; left: 24px;
  z-index: 85;
  display: flex; flex-direction: column; gap: 10px;
  max-width: 360px;
  pointer-events: none;
}
.gm-toast {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: rgba(10,22,18,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  font: 400 13px/1.45 var(--display);
  color: rgba(255,255,255,0.9);
  box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  pointer-events: auto;
  animation: gm-toast-in 400ms cubic-bezier(0.16,1,0.3,1);
}
.gm-toast--ready-to-earn { border-color: rgba(92,224,184,0.45); }
.gm-toast--founding-20-eyeball { border-color: rgba(245,197,24,0.4); }
.gm-toast-body { flex: 1; }
.gm-toast-cta {
  font: 700 11px/1 var(--mono);
  letter-spacing: 0.08em;
  color: #5CE0B8;
  text-decoration: none;
  padding: 8px 12px;
  border: 1px solid rgba(92,224,184,0.45);
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.gm-toast-cta:hover { background: rgba(92,224,184,0.15); }
.gm-toast-dismiss {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.3);
  font: 500 14px/1 var(--mono);
  padding: 0;
  flex-shrink: 0;
}
.gm-toast-dismiss:hover { color: #fff; }
@keyframes gm-toast-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: none; } }
@media (max-width: 1023px) {
  .gm-toasts { left: 12px; right: 12px; bottom: 72px; max-width: none; }
}
@media (prefers-reduced-motion: reduce) {
  .gm-progress, .gm-streak, .gm-copies, .gm-lb, .gm-mascot, .gm-toast {
    animation: none !important;
    transition: none !important;
  }
}
`;
