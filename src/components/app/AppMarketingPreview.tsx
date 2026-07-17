"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

// Demo data frozen here so AppMarketingPreview stays decoupled from /flip's
// item bank schema (which is changing). The marketing demo doesn't need real
// daily data — it just needs realistic-looking numbers and names.
const SCAN_DEMO = {
  name: "Pyrex Butterprint 403 Cinderella",
  era: "1957–68",
  brand: "Pyrex",
  resell: 85,
  buy: 4,
};

const BOLO_DEMO = [
  { id: 1, name: "Y2K Mudd Cargo Jeans", era: "1999–2003", condition: "Low-rise, flare", buy: 4, resell: 55, roi: "High" },
  { id: 2, name: "Pendleton Wool Blanket", era: "1960s–80s", condition: "No moth, label intact", buy: 12, resell: 160, roi: "High" },
  { id: 3, name: "Coleman 200A Lantern (red, 70s)", era: "1970s", condition: "Working, original glass", buy: 6, resell: 90, roi: "High" },
];

/**
 * AppMarketingPreview — what unauthed visitors see at /app.
 *
 * Same visual language as the logged-in dashboard (dark cards, mint accents,
 * mono labels) but populated with demo data and read-only. Every section
 * either links into a public route or invites sign-in. No data writes.
 *
 * Section order is intentional: hero → daily-game hook → product demo
 * (scan + map + BOLO) → trust line → pricing → sign in. The visitor sees
 * value before being asked for an email.
 */

// ─── inline SVG icons (no new deps) ──────────────────────────────────────────
function GoogleG() {
  return (
    <svg width={16} height={16} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function MapPinIcon({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="8" fill="rgba(92,224,184,0.18)" />
      <circle r="3" fill="#5CE0B8" />
      {label ? (
        <text x="11" y="3" fontSize="9" fill="#5CE0B8" fontFamily="ui-monospace,monospace" letterSpacing="0.08em">{label}</text>
      ) : null}
    </g>
  );
}

// ─── component ──────────────────────────────────────────────────────────────
export default function AppMarketingPreview() {
  const [emailValue, setEmailValue] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [flipRef, setFlipRef] = useState<null | {
    total: number;
    best: number;
    score: number;
  }>(null);

  // Detect ?ref=flip_results or flip_post_share and pull lifetime stats from
  // localStorage (written during the /flip game). Show a personalized hero
  // variant if we recognize the referral.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref !== "flip_results" && ref !== "flip_post_share") return;
    try {
      const total = parseInt(localStorage.getItem("fos-total-flipped") || "0", 10);
      const best = parseInt(localStorage.getItem("fos-best-score") || "0", 10);
      const score = parseInt(localStorage.getItem("fos-last-score") || "0", 10);
      localStorage.setItem("fos-came-from-flip", "true");
      const prev = parseInt(localStorage.getItem("fos-arrived-at-app-from-flip") || "0", 10);
      localStorage.setItem("fos-arrived-at-app-from-flip", String(prev + 1));
      localStorage.setItem("fos-conversion-time-start", String(Date.now()));
      setFlipRef({ total, best, score });
      // eslint-disable-next-line no-console
      console.log("[fos] arrived from /flip", { ref, total, best, score });
    } catch { /* private mode */ }
  }, []);

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValue.trim() || emailBusy) return;
    setEmailBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOtp({
        email: emailValue.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
      });
      setEmailSent(true);
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <main className="amp" data-dashboard-loaded="preview">
      <style>{PREVIEW_STYLES}</style>

      {/* 1. Hero card — flip-referral variant overrides default when present */}
      {flipRef ? (
        <section className="amp-hero amp-hero--flip-ref">
          <div className="amp-hero-stars" aria-hidden />
          <div className="amp-hero-inner">
            <div className="amp-eyebrow">🪐 LOOT.WORKS · CALLED FROM /FLIP</div>
            <h1 className="amp-hero-title amp-hero-title--gradient">READY FOR THE REAL THING?</h1>
            <p className="amp-hero-sub">
              You spotted ${flipRef.total.toLocaleString()} in our game. Real shelves move faster.
            </p>
            <div className="amp-flip-stats">
              <span>BUILT FOR RESELLERS</span>
              <span>·</span>
              <span>AI THRIFT ARBITRAGE</span>
              {flipRef.best > 0 && <><span>·</span><span>YOUR BEST: {flipRef.best}</span></>}
            </div>
            <div className="amp-hero-cta-row">
              <button onClick={signInWithGoogle} className="amp-btn amp-btn-solid">
                START SCANNING →
              </button>
              <Link href="/flip" className="amp-btn amp-btn-outline">
                PLAY AGAIN
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="amp-hero">
          <div className="amp-hero-stars" aria-hidden />
          <div className="amp-hero-inner">
            <div className="amp-eyebrow">LOOT.WORKS · LIVE</div>
            <h1 className="amp-hero-title">Scan. Price. Flip.</h1>
            <p className="amp-hero-sub">
              AI-powered thrift arbitrage. Real verdicts in seconds.
            </p>
            <div className="amp-hero-cta-row">
              <button onClick={signInWithGoogle} className="amp-btn amp-btn-solid">
                GET STARTED →
              </button>
              <Link href="/flip" className="amp-btn amp-btn-outline">
                PLAY THE GAME
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Daily flip-or-skip teaser — links to the swipe game */}
      <section className="amp-section">
        <Link
          href="/flip"
          className="amp-card"
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <div className="amp-eyebrow-row">
            <span className="amp-eyebrow">FLIP OR SKIP</span>
            <span className="amp-demo-pill">DAILY</span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            <strong>Today&rsquo;s round is live.</strong> 10 items. Right = flip. Left = skip.
          </div>
          <div
            style={{
              fontFamily: "var(--font-space-mono), monospace",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#5CE0B8",
            }}
          >
            PLAY →
          </div>
        </Link>
      </section>

      {/* 3. Live Scan demo */}
      <section className="amp-section">
        <div className="amp-eyebrow-row">
          <span className="amp-eyebrow">LIVE SCAN</span>
          <span className="amp-demo-pill">DEMO</span>
        </div>
        <div className="amp-card amp-scan">
          <div className="amp-scan-top">
            <div className="amp-scan-name">{SCAN_DEMO.name}</div>
            <div className="amp-scan-meta">{SCAN_DEMO.era} · {SCAN_DEMO.brand}</div>
          </div>
          <div className="amp-scan-grid">
            <div className="amp-scan-cell">
              <div className="amp-scan-label">EBAY SOLD AVG</div>
              <div className="amp-scan-value">${SCAN_DEMO.resell}</div>
            </div>
            <div className="amp-scan-cell">
              <div className="amp-scan-label">CONFIDENCE</div>
              <div className="amp-scan-value">94%</div>
            </div>
            <div className="amp-scan-cell amp-scan-cell--wide">
              <div className="amp-scan-label">VERDICT</div>
              <div className="amp-scan-verdict">
                🐺 WOLF — buy at ${SCAN_DEMO.buy - 2}–{SCAN_DEMO.buy + 2}
              </div>
            </div>
          </div>
          <div className="amp-scan-foot">real scans live in app →</div>
        </div>
      </section>

      {/* 4. Yard Sale Map preview */}
      <section className="amp-section">
        <div className="amp-eyebrow-row">
          <span className="amp-eyebrow">YARD SALE MAP</span>
          <span className="amp-demo-pill">DEMO</span>
        </div>
        <div className="amp-card amp-map">
          <svg viewBox="0 0 400 200" className="amp-map-svg" role="img" aria-label="Yard sale map preview">
            {/* faux road grid */}
            <defs>
              <pattern id="amp-roads" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" stroke="rgba(255,255,255,0.05)" fill="none" />
              </pattern>
            </defs>
            <rect width="400" height="200" fill="rgba(10,22,18,0.7)" />
            <rect width="400" height="200" fill="url(#amp-roads)" />
            <path d="M0 90 Q200 70 400 110" stroke="rgba(92,224,184,0.18)" strokeWidth="0.8" fill="none" />
            <path d="M0 140 Q160 165 400 130" stroke="rgba(92,224,184,0.14)" strokeWidth="0.8" fill="none" />
            <MapPinIcon x={68} y={64} />
            <MapPinIcon x={158} y={92} />
            <MapPinIcon x={232} y={62} />
            <MapPinIcon x={296} y={120} />
            <MapPinIcon x={352} y={86} />
          </svg>
          <div className="amp-map-caption">
            <strong>12</strong> yard sales near you this Saturday.
          </div>
        </div>
      </section>

      {/* 5. BOLO Feed preview */}
      <section className="amp-section">
        <div className="amp-eyebrow-row">
          <span className="amp-eyebrow">TODAY&rsquo;S BOLO</span>
          <span className="amp-demo-pill">DEMO</span>
        </div>
        <div className="amp-bolo-list">
          {BOLO_DEMO.map((it) => (
            <div key={it.id} className="amp-card amp-bolo">
              <div className="amp-bolo-name">{it.name}</div>
              <div className="amp-bolo-meta">{it.era} · {it.condition}</div>
              <div className="amp-bolo-prices">
                <span>
                  <em>buy</em> ${it.buy}
                </span>
                <span>
                  <em>resell</em> ${it.resell}
                </span>
                <span className="amp-bolo-roi">{it.roi}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Stats strip — non-quantified per claim-integrity audit
          (2026-05-24). Restore real numbers here only once Supabase
          aggregates + Digistore reporting can back them. */}
      <section className="amp-stats">
        <span><strong>Built</strong> for resellers</span>
        <span className="amp-stats-div" aria-hidden>·</span>
        <span><strong>AI</strong> thrift arbitrage</span>
        <span className="amp-stats-div" aria-hidden>·</span>
        <span><strong>Real</strong> comp data</span>
      </section>

      {/* 7. Pricing teaser */}
      <section className="amp-section">
        <div className="amp-eyebrow">PRICING</div>
        <div className="amp-card amp-pricing">
          <div className="amp-pricing-row">
            <div>
              <div className="amp-pricing-plan">Free</div>
              <div className="amp-pricing-detail">5 scans/day · daily Flip or Skip</div>
            </div>
            <div className="amp-pricing-price">$0</div>
          </div>
          <div className="amp-pricing-row amp-pricing-row--pro">
            <div>
              <div className="amp-pricing-plan">Pro</div>
              <div className="amp-pricing-detail">Unlimited scans · BOLO alerts · map · feed</div>
            </div>
            <div className="amp-pricing-price">$14.99<small>/mo</small></div>
          </div>
          <Link href="/pro" className="amp-pricing-cta">
            SEE PRO →
          </Link>
        </div>
      </section>

      {/* 8. Footer CTA — sign in */}
      <section className="amp-section amp-signin-section" id="signin">
        <div className="amp-eyebrow">SIGN IN TO START</div>
        <div className="amp-card amp-signin">
          {emailSent ? (
            <div className="amp-signin-sent">
              ✓ Magic link sent to <strong>{emailValue}</strong>. Check your email.
            </div>
          ) : (
            <>
              <button onClick={signInWithGoogle} className="amp-signin-google">
                <GoogleG />
                <span>Continue with Google</span>
              </button>
              <div className="amp-signin-divider"><span>or</span></div>
              <form onSubmit={signInWithEmail} className="amp-signin-email">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  disabled={emailBusy}
                  aria-label="Email address"
                />
                <button type="submit" disabled={emailBusy || !emailValue.trim()}>
                  {emailBusy ? "..." : "SEND →"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const PREVIEW_STYLES = `
.amp {
  --mint: #5CE0B8;
  --mint-dim: rgba(92,224,184,0.4);
  --mint-faint: rgba(92,224,184,0.15);
  --display: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --mono: var(--font-space-mono), ui-monospace, monospace;
  background: radial-gradient(ellipse at top, #0a1612 0%, #000 60%);
  color: #fff;
  min-height: 100vh;
  font-family: var(--display);
  padding-bottom: 56px;
}
.amp .amp-section { max-width: 720px; margin: 0 auto; padding: 20px; }
.amp .amp-eyebrow {
  display: inline-block;
  font-family: var(--mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.2em; color: var(--mint); text-transform: uppercase;
  margin-bottom: 12px;
}
.amp .amp-eyebrow-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.amp .amp-eyebrow-row .amp-eyebrow { margin-bottom: 0; }
.amp .amp-demo-pill {
  display: inline-block;
  font-family: var(--mono); font-weight: 700; font-size: 9px;
  letter-spacing: 0.2em; color: var(--mint);
  padding: 3px 8px; border: 1px solid var(--mint-dim);
  border-radius: 4px;
}
.amp .amp-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--mint-faint);
  border-radius: 12px;
  padding: 18px;
}

/* 1. Hero */
.amp .amp-hero {
  position: relative; padding: 56px 20px 40px; text-align: center; overflow: hidden;
}
.amp .amp-hero-stars {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image:
    radial-gradient(1px 1px at 22% 24%, rgba(255,255,255,0.85), transparent 50%),
    radial-gradient(1.5px 1.5px at 70% 32%, rgba(92,224,184,0.75), transparent 50%),
    radial-gradient(1px 1px at 14% 78%, rgba(255,255,255,0.6), transparent 50%),
    radial-gradient(1px 1px at 88% 64%, rgba(255,255,255,0.5), transparent 50%);
  background-size: 100% 100%;
}
.amp .amp-hero-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.amp .amp-hero-title {
  font-family: var(--display); font-weight: 700; font-size: 48px; line-height: 1;
  letter-spacing: -0.02em; color: var(--mint); margin: 8px 0 12px;
  text-shadow: 0 0 40px rgba(92,224,184,0.25);
}
.amp .amp-hero-sub {
  font-family: var(--display); font-weight: 300; font-size: 16px;
  color: rgba(255,255,255,0.7); margin: 0 0 24px;
}
.amp .amp-hero-cta-row {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
}
@media (min-width: 768px) {
  .amp .amp-hero { padding: 88px 24px 56px; }
  .amp .amp-hero-title { font-size: 72px; }
  .amp .amp-hero-sub { font-size: 18px; }
}
/* Flip-referral hero variant — only renders when user comes from /flip */
.amp .amp-hero--flip-ref {
  background:
    radial-gradient(ellipse at top, rgba(92,224,184,0.08) 0%, transparent 60%);
}
.amp .amp-hero-title--gradient {
  background: linear-gradient(90deg, #5CE0B8 0%, #F5C518 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent !important;
  text-shadow: none !important;
}
.amp .amp-flip-stats {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.18em; color: rgba(92,224,184,0.7); margin-bottom: 24px;
}

/* Buttons */
.amp .amp-btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  letter-spacing: 0.16em; padding: 14px 22px; text-decoration: none;
  min-height: 44px; min-width: 160px; cursor: pointer; border: none;
  transition: opacity 150ms ease, background 150ms ease, color 150ms ease;
}
.amp .amp-btn-solid { background: var(--mint); color: #000; }
.amp .amp-btn-solid:hover { opacity: 0.9; }
.amp .amp-btn-outline {
  background: transparent; color: var(--mint); border: 1px solid var(--mint);
}
.amp .amp-btn-outline:hover { background: var(--mint); color: #000; }

/* 3. Scan card */
.amp .amp-scan-top { margin-bottom: 14px; }
.amp .amp-scan-name {
  font-family: var(--display); font-weight: 600; font-size: 16px;
  line-height: 1.2; color: #fff;
}
.amp .amp-scan-meta {
  font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,0.5);
  margin-top: 4px;
}
.amp .amp-scan-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.amp .amp-scan-cell {
  padding: 10px 12px; border: 1px solid var(--mint-faint); border-radius: 8px;
  background: rgba(0,0,0,0.3);
}
.amp .amp-scan-cell--wide { grid-column: span 2; }
.amp .amp-scan-label {
  font-family: var(--mono); font-weight: 700; font-size: 9px;
  letter-spacing: 0.16em; color: rgba(255,255,255,0.45); margin-bottom: 4px;
}
.amp .amp-scan-value {
  font-family: var(--mono); font-weight: 700; font-size: 18px; color: var(--mint);
  font-variant-numeric: tabular-nums;
}
.amp .amp-scan-verdict {
  font-family: var(--mono); font-weight: 700; font-size: 13px;
  color: var(--mint); letter-spacing: 0.04em;
}
.amp .amp-scan-foot {
  margin-top: 14px; text-align: center;
  font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,0.4);
  letter-spacing: 0.08em;
}

/* 4. Map */
.amp .amp-map { padding: 0; overflow: hidden; }
.amp .amp-map-svg { display: block; width: 100%; height: auto; }
.amp .amp-map-caption {
  padding: 14px 18px; text-align: center;
  font-family: var(--display); font-weight: 400; font-size: 14px;
  color: rgba(255,255,255,0.7); border-top: 1px solid var(--mint-faint);
}
.amp .amp-map-caption strong { color: var(--mint); font-weight: 700; }

/* 5. BOLO list */
.amp .amp-bolo-list { display: flex; flex-direction: column; gap: 10px; }
.amp .amp-bolo-name {
  font-family: var(--display); font-weight: 600; font-size: 14px; color: #fff;
  margin-bottom: 4px;
}
.amp .amp-bolo-meta {
  font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.5);
  margin-bottom: 10px;
}
.amp .amp-bolo-prices {
  display: flex; flex-wrap: wrap; gap: 14px; align-items: baseline;
  font-family: var(--mono); font-size: 12px; color: rgba(255,255,255,0.85);
}
.amp .amp-bolo-prices em {
  font-style: normal; color: rgba(255,255,255,0.4); margin-right: 4px;
  letter-spacing: 0.1em; text-transform: uppercase; font-size: 9px;
}
.amp .amp-bolo-roi {
  margin-left: auto; color: var(--mint); font-weight: 700;
  letter-spacing: 0.08em; font-size: 10px;
}

/* 6. Stats strip */
.amp .amp-stats {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 14px; padding: 16px 20px; margin: 12px auto; max-width: 720px;
  border-top: 1px solid var(--mint-faint);
  border-bottom: 1px solid var(--mint-faint);
  font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,0.65);
  letter-spacing: 0.08em; text-transform: uppercase;
}
.amp .amp-stats strong { color: var(--mint); font-weight: 700; }
.amp .amp-stats-div { color: var(--mint); opacity: 0.6; }

/* 7. Pricing */
.amp .amp-pricing-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.amp .amp-pricing-row:last-of-type { border-bottom: none; padding-bottom: 0; }
.amp .amp-pricing-row--pro { border-left: 2px solid var(--mint); padding-left: 12px; margin-left: -14px; }
.amp .amp-pricing-plan {
  font-family: var(--display); font-weight: 600; font-size: 16px; color: #fff;
}
.amp .amp-pricing-detail {
  font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,0.5);
  margin-top: 2px;
}
.amp .amp-pricing-price {
  font-family: var(--mono); font-weight: 700; font-size: 20px; color: var(--mint);
  font-variant-numeric: tabular-nums;
}
.amp .amp-pricing-price small {
  font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500;
}
.amp .amp-pricing-cta {
  display: block; text-align: center; margin-top: 14px;
  font-family: var(--mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.18em; color: var(--mint); text-decoration: none;
  padding: 12px; border: 1px solid var(--mint-dim);
  transition: background 150ms ease, color 150ms ease;
}
.amp .amp-pricing-cta:hover { background: var(--mint); color: #000; }

/* 8. Sign in */
.amp .amp-signin-section { padding-top: 8px; }
.amp .amp-signin { display: flex; flex-direction: column; gap: 12px; }
.amp .amp-signin-google {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 18px; min-height: 48px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff; cursor: pointer;
  font-family: var(--display); font-weight: 500; font-size: 14px;
  transition: background 150ms ease;
}
.amp .amp-signin-google:hover { background: rgba(255,255,255,0.1); }
.amp .amp-signin-divider {
  position: relative; text-align: center;
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.2em; color: rgba(255,255,255,0.35);
}
.amp .amp-signin-divider::before,
.amp .amp-signin-divider::after {
  content: ''; position: absolute; top: 50%; width: 38%;
  height: 1px; background: rgba(255,255,255,0.08);
}
.amp .amp-signin-divider::before { left: 0; }
.amp .amp-signin-divider::after { right: 0; }
.amp .amp-signin-divider span { background: transparent; padding: 0 12px; position: relative; z-index: 1; }
.amp .amp-signin-email { display: flex; gap: 0; }
.amp .amp-signin-email input {
  flex: 1; padding: 0 14px; min-height: 48px;
  background: rgba(0,0,0,0.3); color: #fff;
  border: 1px solid rgba(255,255,255,0.08);
  border-right: none;
  font-family: var(--display); font-size: 16px; /* >=16px avoids iOS zoom */
  outline: none;
  transition: border-color 150ms ease;
}
.amp .amp-signin-email input:focus { border-color: var(--mint-dim); }
.amp .amp-signin-email button {
  padding: 0 18px; background: var(--mint); color: #000;
  border: none; cursor: pointer; min-height: 48px;
  font-family: var(--mono); font-weight: 700; font-size: 12px;
  letter-spacing: 0.14em;
  transition: opacity 150ms ease;
}
.amp .amp-signin-email button:disabled { opacity: 0.5; cursor: not-allowed; }
.amp .amp-signin-sent {
  text-align: center;
  font-family: var(--mono); font-size: 13px; color: var(--mint);
  padding: 16px;
}
.amp .amp-signin-sent strong { color: #fff; font-weight: 500; }
`;
