"use client";

import { useEffect, useState } from "react";

/**
 * LadderVisualization — the centerpiece of /kit.
 *
 * Vertical 3-tier ladder (Standard → Gold → Founding 20). This is the
 * page's brand moment: the thing screenshots get taken of and shared.
 *
 * - Connecting line gradient mint → gold
 * - Subtle ascending particle animation (skipped on reduced-motion / mobile)
 * - Hover any tier → expanded panel with full benefits
 * - Click any tier → smooth-scrolls to its detail section
 * - "YOUR TIER" chip placeholder (TODO(David): wire to auth once logged-in state lands)
 *
 * All styles namespaced under .ladder-viz so we don't collide with the
 * monolithic .kit-page styles.
 */

const TIERS = [
  {
    id: "founding-20",
    label: "FOUNDING 20",
    rate: "60% SETUP + 40% LIFETIME",
    status: "INVITATION TIER",
    statusColor: "gold",
    accent: "gradient",
    bullets: [
      "60% setup + 40% lifetime recurring",
      "Free Pro account for life",
      "Physical kit (sticker pack, enamel pin, custom tag)",
      "Monthly $500/$300/$200/$100 cash prizes",
      "365-day cookie · direct founder line",
    ],
    icon: "🪐",
  },
  {
    id: "gold",
    label: "GOLD",
    rate: "50% RECURRING",
    status: "UNLOCKABLE",
    statusColor: "gold",
    accent: "gold",
    bullets: [
      "50% recurring on monthly + annual",
      "Custom vanity code (loot.works/yourhandle)",
      "Early-access to product drops",
      "Priority support · monthly leaderboard feature",
    ],
    icon: "★",
  },
  {
    id: "standard",
    label: "STANDARD",
    rate: "40% RECURRING",
    status: "OPEN TO ALL · AUTO-ENROLL",
    statusColor: "mint",
    accent: "mint",
    bullets: [
      "40% recurring on monthly + annual subs",
      "60-day cookie",
      "Weekly Digistore payout",
      "Full swipe copy + brand asset access",
    ],
    icon: "◐",
  },
];

// TODO(David): wire to Supabase or hardcoded count from the founding-creators table.
const FOUNDING_CLAIMED = 3;
const FOUNDING_TOTAL = 20;

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  history.replaceState(null, "", `#${id}`);
}

export default function LadderVisualization() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [enableParticles, setEnableParticles] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    setEnableParticles(!reduced && !mobile);
  }, []);

  return (
    <div className="ladder-viz" aria-label="Affiliate tier ladder">
      <style dangerouslySetInnerHTML={{ __html: LADDER_STYLES }} />

      {/* "Your tier" chip — placeholder until logged-in state lands */}
      <div className="lv-yourtier" aria-hidden="true">
        <span className="lv-yourtier-dot" />
        YOUR TIER: NOT YET STARTED
      </div>

      {/* The ladder rail with particles */}
      <div className="lv-rail" aria-hidden="true">
        {enableParticles && (
          <div className="lv-particles">
            <span style={{ animationDelay: "0s" }} />
            <span style={{ animationDelay: "0.7s" }} />
            <span style={{ animationDelay: "1.5s" }} />
            <span style={{ animationDelay: "2.2s" }} />
          </div>
        )}
      </div>

      <div className="lv-tiers">
        {TIERS.map((tier, i) => (
          <button
            key={tier.id}
            type="button"
            className={`lv-tier lv-tier--${tier.accent}${
              hovered === tier.id ? " lv-tier--hover" : ""
            }`}
            onMouseEnter={() => setHovered(tier.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(tier.id)}
            onBlur={() => setHovered(null)}
            onClick={() =>
              jumpTo(tier.id === "founding-20" ? "founding-20" : "sec-ladder")
            }
            aria-label={`${tier.label} tier — ${tier.rate}`}
          >
            <div className="lv-tier-header">
              <span className="lv-tier-icon" aria-hidden="true">
                {tier.icon}
              </span>
              <div className="lv-tier-body">
                <div className="lv-tier-label">{tier.label}</div>
                <div className="lv-tier-rate">{tier.rate}</div>
                <div className={`lv-tier-status lv-tier-status--${tier.statusColor}`}>
                  {tier.status}
                  {tier.id === "founding-20" &&
                    ` · ${FOUNDING_CLAIMED} / ${FOUNDING_TOTAL} CLAIMED`}
                </div>
              </div>
              {i === 1 && (
                <span className="lv-upnext" aria-hidden="true">
                  UP NEXT ↑
                </span>
              )}
            </div>

            <div className="lv-tier-bullets" aria-hidden={hovered !== tier.id}>
              {tier.bullets.map((b) => (
                <div key={b} className="lv-bullet">
                  <span className="lv-bullet-dot" aria-hidden="true" />
                  {b}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Standard → Gold progress bar (placeholder; populated once auth ships) */}
      <div className="lv-progress" aria-hidden="true">
        <div className="lv-progress-label">
          <span>$0</span>
          <span className="lv-progress-target">$1,000 → GOLD</span>
        </div>
        <div className="lv-progress-track">
          <div className="lv-progress-fill" style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  );
}

const LADDER_STYLES = `
.ladder-viz {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}
.ladder-viz .lv-yourtier {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 8px;
  font: 500 9px/1 var(--mono);
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px;
  padding: 8px 14px;
  margin-bottom: 4px;
}
.ladder-viz .lv-yourtier-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.4);
  box-shadow: 0 0 8px rgba(255,255,255,0.3);
}
.ladder-viz .lv-rail {
  position: absolute;
  top: 60px; bottom: 60px;
  left: 26px;
  width: 2px;
  background: linear-gradient(180deg,
    rgba(212,165,116,0.55) 0%,
    rgba(212,165,116,0.45) 35%,
    rgba(92,224,184,0.55) 80%,
    rgba(92,224,184,0.4) 100%
  );
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.ladder-viz .lv-particles {
  position: absolute; inset: 0;
}
.ladder-viz .lv-particles span {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #5CE0B8;
  box-shadow: 0 0 8px rgba(92,224,184,0.7);
  animation: lv-particle-rise 3.2s linear infinite;
}
@keyframes lv-particle-rise {
  0% { bottom: -8px; opacity: 0; }
  10% { opacity: 1; }
  80% { opacity: 1; background: #F5C518; box-shadow: 0 0 8px rgba(245,197,24,0.7); }
  100% { bottom: 100%; opacity: 0; }
}
.ladder-viz .lv-tiers {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ladder-viz .lv-tier {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  background: rgba(10,10,10,0.55);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 18px 20px 18px 18px;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: transform 200ms cubic-bezier(0.4,0,0.2,1),
              border-color 200ms ease,
              box-shadow 200ms ease;
}
.ladder-viz .lv-tier:hover,
.ladder-viz .lv-tier:focus-visible {
  transform: translateY(-2px);
  outline: none;
}
.ladder-viz .lv-tier--mint {
  border-color: rgba(92,224,184,0.35);
  box-shadow: 0 0 0 1px rgba(92,224,184,0.08), 0 8px 24px rgba(0,0,0,0.4);
}
.ladder-viz .lv-tier--mint:hover { border-color: rgba(92,224,184,0.7); box-shadow: 0 0 24px rgba(92,224,184,0.18), 0 12px 32px rgba(0,0,0,0.5); }
.ladder-viz .lv-tier--gold {
  border-color: rgba(245,197,24,0.4);
  box-shadow: 0 0 0 1px rgba(245,197,24,0.1), 0 8px 24px rgba(0,0,0,0.4);
  animation: lv-gold-pulse 3.6s ease-in-out infinite;
}
@keyframes lv-gold-pulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(245,197,24,0.1), 0 8px 24px rgba(0,0,0,0.4); }
  50% { box-shadow: 0 0 0 1px rgba(245,197,24,0.25), 0 0 32px rgba(245,197,24,0.12), 0 8px 24px rgba(0,0,0,0.4); }
}
.ladder-viz .lv-tier--gold:hover { border-color: rgba(245,197,24,0.8); }
.ladder-viz .lv-tier--gradient {
  border-color: transparent;
  background:
    linear-gradient(rgba(10,10,10,0.85), rgba(10,10,10,0.85)) padding-box,
    linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%) border-box;
  box-shadow: 0 0 32px rgba(92,224,184,0.12), 0 0 32px rgba(245,197,24,0.08), 0 8px 24px rgba(0,0,0,0.4);
}
.ladder-viz .lv-tier--gradient:hover {
  box-shadow: 0 0 48px rgba(92,224,184,0.22), 0 0 48px rgba(245,197,24,0.15), 0 12px 32px rgba(0,0,0,0.5);
}
.ladder-viz .lv-tier-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ladder-viz .lv-tier-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
}
.ladder-viz .lv-tier--mint .lv-tier-icon { border-color: rgba(92,224,184,0.5); color: #5CE0B8; }
.ladder-viz .lv-tier--gold .lv-tier-icon { border-color: rgba(245,197,24,0.6); color: #F5C518; }
.ladder-viz .lv-tier--gradient .lv-tier-icon { border-color: rgba(92,224,184,0.6); color: #fff; }
.ladder-viz .lv-tier-body { flex: 1; min-width: 0; }
.ladder-viz .lv-tier-label {
  font: 600 18px/1.05 var(--display, var(--font-manrope), sans-serif);
  letter-spacing: 0.02em;
  color: #fff;
  margin-bottom: 4px;
}
.ladder-viz .lv-tier--gold .lv-tier-label { color: #F5C518; }
.ladder-viz .lv-tier--gradient .lv-tier-label {
  background: linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ladder-viz .lv-tier-rate {
  font: 700 11px/1.1 var(--mono, var(--font-space-mono), monospace);
  letter-spacing: 0.08em;
  color: #5CE0B8;
  margin-bottom: 4px;
}
.ladder-viz .lv-tier--gold .lv-tier-rate { color: #F5C518; }
.ladder-viz .lv-tier--gradient .lv-tier-rate {
  background: linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ladder-viz .lv-tier-status {
  font: 500 9px/1.1 var(--mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ladder-viz .lv-tier-status--mint { color: rgba(92,224,184,0.8); }
.ladder-viz .lv-tier-status--gold { color: rgba(245,197,24,0.85); }
.ladder-viz .lv-upnext {
  font: 700 9px/1 var(--mono);
  letter-spacing: 0.14em;
  color: #F5C518;
  background: rgba(245,197,24,0.1);
  border: 1px solid rgba(245,197,24,0.3);
  border-radius: 999px;
  padding: 6px 10px;
  white-space: nowrap;
}
.ladder-viz .lv-tier-bullets {
  margin-top: 0;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 280ms ease, opacity 280ms ease, margin-top 280ms ease;
}
.ladder-viz .lv-tier--hover .lv-tier-bullets {
  max-height: 200px;
  opacity: 1;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.ladder-viz .lv-bullet {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font: 400 13px/1.45 var(--display);
  color: rgba(255,255,255,0.75);
  padding: 3px 0;
}
.ladder-viz .lv-bullet-dot {
  flex-shrink: 0;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #5CE0B8;
  margin-top: 8px;
}
.ladder-viz .lv-tier--gold .lv-bullet-dot { background: #F5C518; }
.ladder-viz .lv-tier--gradient .lv-bullet-dot {
  background: linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%);
}
.ladder-viz .lv-progress {
  margin-top: 8px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
}
.ladder-viz .lv-progress-label {
  display: flex;
  justify-content: space-between;
  font: 500 9px/1 var(--mono);
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.5);
  margin-bottom: 8px;
}
.ladder-viz .lv-progress-target { color: #F5C518; }
.ladder-viz .lv-progress-track {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
}
.ladder-viz .lv-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
}
@media (prefers-reduced-motion: reduce) {
  .ladder-viz .lv-tier--gold { animation: none; }
  .ladder-viz .lv-particles { display: none; }
}
@media (max-width: 768px) {
  .ladder-viz .lv-particles { display: none; }
}
`;
