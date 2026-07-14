"use client";

import { withUTM } from "@/lib/utm";

/**
 * LadderTiers — the deep gamification section. Three side-by-side cards
 * walking through every benefit at every tier. This is where the ladder
 * stops being a metaphor and starts being a checklist.
 *
 * Order: Standard (mint) → Gold (gold featured) → Founding 20 (gradient
 * premium). Gold sits in the middle because it's THE conversion target
 * for Standard affiliates — the "you can climb to this" tier.
 */

const DIGISTORE_SIGNUP = "https://digistore24.com/signup/691098/";
const STANDARD_SIGNUP_URL = withUTM(DIGISTORE_SIGNUP, "kit_ladder_standard", "affiliate_signup");
const GOLD_SIGNUP_URL = withUTM(DIGISTORE_SIGNUP, "kit_ladder_gold", "affiliate_signup");

// TODO(David): wire to live count once founding-creators table exists.
const FOUNDING_CLAIMED = 3;
const FOUNDING_TOTAL = 20;

export default function LadderTiers() {
  return (
    <section id="sec-ladder" className="lt-section">
      <style dangerouslySetInnerHTML={{ __html: LADDER_TIERS_STYLES }} />

      <div className="lt-wrap">
        <div className="lt-header">
          <p className="lt-eyebrow">THE LADDER</p>
          <h2 className="lt-headline">EVERY TIER UNLOCKS.</h2>
          <p className="lt-sub">
            We don&apos;t cap your earnings. We accelerate them as you grow.
          </p>
        </div>

        <div className="lt-grid">
          {/* STANDARD */}
          <article id="standard" className="lt-card lt-card--mint">
            <div className="lt-card-tier">
              <span className="lt-card-tier-num">TIER 1</span>
              <span className="lt-card-tier-status lt-card-tier-status--mint">
                AUTO-ENROLL · NO APPLICATION
              </span>
            </div>
            <h3 className="lt-card-title">STANDARD</h3>
            <div className="lt-card-rate">40% recurring</div>
            <ul className="lt-card-bullets">
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--mint">✓</span>
                40% recurring on monthly + annual subs
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--mint">✓</span>
                60-day cookie
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--mint">✓</span>
                Weekly Digistore payout
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--mint">✓</span>
                Full swipe copy + brand asset access
              </li>
            </ul>
            <a
              href={STANDARD_SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lt-card-cta lt-card-cta--mint"
            >
              JOIN STANDARD →
            </a>
          </article>

          {/* GOLD */}
          <article id="gold" className="lt-card lt-card--gold lt-card--featured">
            <div className="lt-card-tier">
              <span className="lt-card-tier-num">TIER 2</span>
              <span className="lt-card-tier-status lt-card-tier-status--gold">
                UNLOCKABLE
              </span>
            </div>
            <h3 className="lt-card-title lt-card-title--gold">GOLD</h3>
            <div className="lt-card-rate lt-card-rate--gold">50% recurring</div>
            <ul className="lt-card-bullets">
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gold">★</span>
                50% recurring (vs 40% Standard)
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gold">★</span>
                Custom vanity code: loot.works/yourhandle → DS24
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gold">★</span>
                Early-access to product drops
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gold">★</span>
                Priority support
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gold">★</span>
                Featured in monthly leaderboard
              </li>
            </ul>

            <div className="lt-unlock">
              <div className="lt-unlock-label">UNLOCK REQUIREMENT</div>
              <div className="lt-unlock-text">
                $1,000 in referred sales within 90 days · auto-promoted
              </div>
              <div className="lt-progress">
                <div className="lt-progress-track">
                  <div className="lt-progress-fill" style={{ width: "0%" }} />
                </div>
                <div className="lt-progress-numbers">
                  <span>$0</span>
                  <span>$1,000</span>
                </div>
                {/* TODO(David): wire to logged-in user's referred-sales total */}
              </div>
            </div>

            <a
              href={GOLD_SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="lt-card-cta lt-card-cta--mint"
            >
              START AT STANDARD →
            </a>
          </article>

          {/* FOUNDING 20 (anchor target — separate from the deep #founding-20 section) */}
          <article className="lt-card lt-card--gradient">
            <div className="lt-card-tier">
              <span className="lt-card-tier-num">TIER 3</span>
              <span className="lt-card-tier-status lt-card-tier-status--gradient">
                INVITATION OR APPLY
              </span>
            </div>
            <h3 className="lt-card-title lt-card-title--gradient">FOUNDING 20</h3>
            <div className="lt-card-rate lt-card-rate--gradient">
              60% setup + 40% lifetime
            </div>
            <ul className="lt-card-bullets">
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gradient">🪐</span>
                60% setup + 40% lifetime recurring (vs 50% Gold)
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gradient">🪐</span>
                Free Pro account for life (forever)
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gradient">🪐</span>
                Physical kit: stickers + Kronos pin + custom thrifted tag
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gradient">🪐</span>
                Monthly leaderboard: $500/$300/$200/$100 cash prizes
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gradient">🪐</span>
                365-day cookie (vs 60-day Standard)
              </li>
              <li>
                <span className="lt-bullet-icon lt-bullet-icon--gradient">🪐</span>
                Direct founder line · Coach Pick feature
              </li>
            </ul>

            <div className="lt-spots">
              <span className="lt-spots-dot" aria-hidden="true" />
              <strong>{FOUNDING_CLAIMED}</strong> of {FOUNDING_TOTAL} spots claimed
            </div>

            <a
              href="#founding-20-form"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("founding-20-form");
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - 80;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
              className="lt-card-cta lt-card-cta--gold"
            >
              APPLY FOR FOUNDING 20 →
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}

const LADDER_TIERS_STYLES = `
.lt-section { padding: 64px 0; position: relative; }
@media (min-width: 768px) { .lt-section { padding: 96px 0; } }
.lt-section .lt-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.lt-section .lt-header { text-align: center; margin-bottom: 48px; max-width: 720px; margin-left: auto; margin-right: auto; }
.lt-section .lt-eyebrow {
  font: 500 11px/1 var(--mono, var(--font-space-mono), monospace);
  letter-spacing: 0.28em;
  color: #F5C518;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.lt-section .lt-headline {
  font: 600 clamp(36px, 7vw, 72px)/1 var(--display, var(--font-manrope), sans-serif);
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 14px;
  text-transform: uppercase;
}
.lt-section .lt-sub {
  font: 400 16px/1.55 var(--display);
  color: rgba(255,255,255,0.65);
}

.lt-section .lt-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 960px) {
  .lt-section .lt-grid { grid-template-columns: 1fr 1fr 1fr; gap: 20px; align-items: stretch; }
}

.lt-section .lt-card {
  display: flex;
  flex-direction: column;
  padding: 28px 24px;
  background: rgba(10,10,10,0.6);
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms ease;
}
.lt-section .lt-card:hover { transform: translateY(-3px); }

.lt-section .lt-card--mint {
  border-color: rgba(92,224,184,0.3);
  box-shadow: 0 0 0 1px rgba(92,224,184,0.05), 0 8px 24px rgba(0,0,0,0.4);
}
.lt-section .lt-card--gold {
  border-color: rgba(245,197,24,0.45);
  box-shadow: 0 0 0 1px rgba(245,197,24,0.08), 0 0 32px rgba(245,197,24,0.06), 0 12px 32px rgba(0,0,0,0.5);
  background: linear-gradient(180deg, rgba(245,197,24,0.03) 0%, rgba(10,10,10,0.6) 100%);
}
.lt-section .lt-card--gradient {
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, rgba(10,10,10,0.7), rgba(10,10,10,0.85)) padding-box,
    linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%) border-box;
  box-shadow: 0 0 32px rgba(92,224,184,0.1), 0 0 32px rgba(245,197,24,0.08), 0 12px 32px rgba(0,0,0,0.5);
}
@media (min-width: 960px) {
  .lt-section .lt-card--featured { transform: scale(1.02); }
  .lt-section .lt-card--featured:hover { transform: scale(1.02) translateY(-3px); }
}

.lt-section .lt-card-tier {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.lt-section .lt-card-tier-num {
  font: 700 10px/1 var(--mono);
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.4);
}
.lt-section .lt-card-tier-status {
  font: 500 9px/1 var(--mono);
  letter-spacing: 0.12em;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.02);
}
.lt-section .lt-card-tier-status--mint { color: #5CE0B8; border: 1px solid rgba(92,224,184,0.25); }
.lt-section .lt-card-tier-status--gold { color: #F5C518; border: 1px solid rgba(245,197,24,0.3); }
.lt-section .lt-card-tier-status--gradient {
  color: #fff;
  border: 1px solid transparent;
  background:
    linear-gradient(rgba(10,10,10,1), rgba(10,10,10,1)) padding-box,
    linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%) border-box;
}

.lt-section .lt-card-title {
  font: 600 32px/1 var(--display);
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.lt-section .lt-card-title--gold { color: #F5C518; font-size: 36px; }
.lt-section .lt-card-title--gradient {
  font-size: 36px;
  background: linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lt-section .lt-card-rate {
  font: 700 12px/1 var(--mono);
  letter-spacing: 0.1em;
  color: #5CE0B8;
  text-transform: uppercase;
  margin-bottom: 24px;
}
.lt-section .lt-card-rate--gold { color: #F5C518; }
.lt-section .lt-card-rate--gradient {
  background: linear-gradient(135deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lt-section .lt-card-bullets {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}
.lt-section .lt-card-bullets li {
  display: flex; align-items: flex-start; gap: 10px;
  font: 400 14px/1.5 var(--display);
  color: rgba(255,255,255,0.85);
}
.lt-section .lt-bullet-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  font-size: 12px;
  margin-top: 2px;
}
.lt-section .lt-bullet-icon--mint { color: #5CE0B8; }
.lt-section .lt-bullet-icon--gold { color: #F5C518; }
.lt-section .lt-bullet-icon--gradient { font-size: 14px; }

.lt-section .lt-unlock {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: rgba(245,197,24,0.05);
  border: 1px solid rgba(245,197,24,0.2);
  border-radius: 10px;
}
.lt-section .lt-unlock-label {
  font: 500 9px/1 var(--mono);
  letter-spacing: 0.16em;
  color: rgba(245,197,24,0.85);
  margin-bottom: 6px;
}
.lt-section .lt-unlock-text {
  font: 400 13px/1.45 var(--display);
  color: rgba(255,255,255,0.85);
  margin-bottom: 12px;
}
.lt-section .lt-progress-track {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}
.lt-section .lt-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
}
.lt-section .lt-progress-numbers {
  display: flex; justify-content: space-between;
  font: 500 9px/1 var(--mono);
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.08em;
}

.lt-section .lt-spots {
  display: flex;
  align-items: center;
  gap: 8px;
  font: 500 12px/1 var(--mono);
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.85);
  margin-bottom: 20px;
  padding: 12px 14px;
  border: 1px dashed rgba(245,197,24,0.3);
  border-radius: 10px;
}
.lt-section .lt-spots strong {
  color: #F5C518;
  font-weight: 700;
  font-size: 16px;
}
.lt-section .lt-spots-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #F5C518;
  box-shadow: 0 0 8px rgba(245,197,24,0.6);
  animation: lt-spots-pulse 2.4s ease-in-out infinite;
}
@keyframes lt-spots-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.lt-section .lt-card-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font: 700 12px/1 var(--mono);
  letter-spacing: 0.08em;
  padding: 14px 20px;
  text-decoration: none;
  border-radius: 100px;
  transition: transform 0.15s, box-shadow 0.2s;
}
.lt-section .lt-card-cta--mint {
  background: transparent;
  color: #5CE0B8;
  border: 1px solid rgba(92,224,184,0.5);
}
.lt-section .lt-card-cta--mint:hover {
  background: #5CE0B8; color: #0A0A0A; border-color: #5CE0B8;
  box-shadow: 0 0 24px rgba(92,224,184,0.3);
}
.lt-section .lt-card-cta--gold {
  background: linear-gradient(180deg, #F5C518 0%, #E0B414 100%);
  color: #0A0A0A;
  border: none;
  box-shadow: 0 8px 24px rgba(245,197,24,0.3);
}
.lt-section .lt-card-cta--gold:hover {
  box-shadow: 0 10px 32px rgba(245,197,24,0.45);
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .lt-section .lt-spots-dot { animation: none; }
  .lt-section .lt-card:hover { transform: none; }
  .lt-section .lt-card-cta--gold:hover { transform: none; }
}
`;
