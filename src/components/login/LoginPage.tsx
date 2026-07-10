"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import CoinMark from "@/components/shared/CoinMark";
import LoginBackdrop from "@/components/login/LoginBackdrop";
import PwaInstallBar from "@/components/login/PwaInstallBar";

/**
 * LOGIN AS THE TRAILER. The backdrop (LoginBackdrop) pantomimes the
 * product on loop — point → lock → price — while the card reads as the
 * scanner's own housing. Auth engine untouched: handleGoogle /
 * handleEmail / redirect targets are byte-identical to the previous
 * revision; everything else is stagecraft.
 *
 * Entrance chains after SplashGate: the splash covers the page for
 * 1200ms then fades 400ms (see SplashGate MIN_VISIBLE_MS). We detect
 * the splash overlay at mount and start the choreography at 1250ms —
 * the stars settle INTO the splash's fade-out, so the two read as one
 * dissolve, and the pre-entrance frame is never visible. When there is
 * no splash (in-session router.push back to /, e.g. sign-out), the
 * entrance plays immediately. Reduced motion skips all choreography
 * and renders the finished page.
 *
 * SIGNATURE (option b): the backdrop's first reticle lock snaps
 * closed precisely as the card lands (~860ms) — the page finds ITS
 * first item as you arrive. Chosen over the full-viewport sweep: it
 * fuses the arrival with the product's core gesture instead of adding
 * a generic boot effect, and the scan-line sweep is already the Home
 * hero's language.
 */

const PROOF_LINES = [
  "real ebay solds, not asking prices",
  "barcode · item · shelf · crate",
  "verdict in about a second",
];

// Google "G" logo — official colors
function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function ArrowIcon() {
  // Dark stroke — the send cap is now a mint surface; the arrow reads
  // as engraved into the instrument.
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0A2C22"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2" />
    </svg>
  );
}

interface GoogleButtonProps {
  onTap: () => void;
  loading: boolean;
}

function GoogleButton({ onTap, loading }: GoogleButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: "100%",
        height: 54,
        backgroundColor: pressed
          ? "rgba(255,255,255,0.12)"
          : "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: pressed
          ? "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(92,224,184,0.45), 0 0 22px -6px rgba(92,224,184,0.5)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.3)",
        borderRadius: 15,
        display: "flex",
        alignItems: "center",
        position: "relative",
        cursor: "pointer",
        padding: 0,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 130ms ease",
      }}
    >
      <div style={{ paddingLeft: 16, flexShrink: 0, display: "flex" }}>
        <GoogleIcon />
      </div>
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 15,
          color: "rgba(255,255,255,0.92)",
          transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: loading ? 0 : 1,
        }}
      >
        Continue with Google
      </span>
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: 15,
          color: "rgba(255,255,255,0.55)",
          transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: loading ? 1 : 0,
        }}
      >
        Connecting...
      </span>
    </button>
  );
}

interface SendButtonProps {
  onTap: () => void;
  disabled: boolean;
}

function SendButton({ onTap, disabled }: SendButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label="Send magic link"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        // 54×52 right cap of the email input row — the mint firing
        // stud on the instrument. Outer radius matches the input's
        // left radius so the pair reads as one pill.
        width: 54,
        height: 52,
        flexShrink: 0,
        background: "linear-gradient(180deg, #6FE5C0 0%, #4FD1A5 100%)",
        border: "none",
        boxShadow: pressed
          ? "0 0 0 1px rgba(92,224,184,0.55), 0 0 24px -4px rgba(92,224,184,0.55), inset 0 1px 0 rgba(255,255,255,0.3)"
          : "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px -2px rgba(92,224,184,0.4)",
        borderRadius: "0 20px 20px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        filter: pressed ? "brightness(0.95)" : "none",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), filter 100ms ease",
      }}
    >
      <ArrowIcon />
    </button>
  );
}

export default function LoginPage() {
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── stagecraft state (zero auth coupling) ──────────────────────────
  const [phase, setPhase] = useState<"pre" | "enter" | "static">("pre");
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [chargeKey, setChargeKey] = useState(0);
  const [[proofIdx, proofPrev], setProof] = useState<[number, number | null]>([0, null]);

  // Entrance: chain after the splash if it's up, fire immediately if not.
  useEffect(() => {
    let m = false;
    try {
      m = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch { /* default: animate */ }
    if (m) {
      setReduced(true);
      setPhase("static");
      return;
    }
    // SplashScreen renders a fixed z-9999 overlay (SplashGate keeps it
    // up 1200ms + 400ms fade). Read-only sniff — we own neither.
    let splashUp = false;
    try {
      splashUp = Array.from(document.querySelectorAll("div")).some(
        (d) => d.style.zIndex === "9999" && d.style.position === "fixed",
      );
    } catch { /* treat as no splash */ }
    const t = window.setTimeout(() => setPhase("enter"), splashUp ? 1250 : 60);
    return () => window.clearTimeout(t);
  }, []);

  // Master pause — every animation on the page freezes when hidden.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Proof-line rotation — 5s crossfade cycle; holds while hidden;
  // reduced motion shows the first line, static.
  useEffect(() => {
    if (reduced || phase === "pre") return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setProof(([cur]) => [(cur + 1) % PROOF_LINES.length, cur]);
    }, 5000);
    return () => window.clearInterval(id);
  }, [reduced, phase]);

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleEmail() {
    if (!email || emailLoading) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setEmailLoading(false);
    if (!error) setEmailSent(true);
  }

  const rootClass =
    "lp" +
    (phase === "pre" ? " lp--pre" : phase === "enter" ? " lp--enter" : "") +
    (paused ? " lp--paused" : "");

  return (
    <div className={rootClass}>
      <style>{STYLES}</style>
      <LoginBackdrop phase={phase} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 340,
            paddingLeft: 24,
            paddingRight: 24,
            transform: "translateY(22px)",
          }}
        >
          {/* ── THE MARK — Bebas mint, ring glint on a 6s orbit ── */}
          <div
            className="lp-a lp-a--mark"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 11,
              marginBottom: 12,
            }}
          >
            <div style={{ position: "relative", display: "flex" }}>
              <CoinMark size={40} color="#5CE0B8" />
              {/* glint traveling CoinMark's ring ellipse (its 24-unit
                  arc path scaled ×40/24). Hidden where offset-path is
                  unsupported — the mark stands alone gracefully. */}
              <span className="lp-glint" aria-hidden="true" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-bebas-neue), sans-serif",
                fontSize: 54,
                lineHeight: 0.9,
                color: "#5CE0B8",
                letterSpacing: "0.045em",
                textShadow:
                  "0 0 22px rgba(92,224,184,0.4), 0 0 44px rgba(92,224,184,0.18)",
                transform: "translateY(2px)",
              }}
            >
              LOOT.WORKS
            </span>
          </div>

          {/* ── identity line — eyebrow + value ── */}
          <div
            className="lp-a lp-a--tag"
            style={{ textAlign: "center", marginBottom: 30 }}
          >
            <div
              style={{
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.24em",
                color: "rgba(92,224,184,0.8)",
              }}
            >
              BUILT FOR RESELLERS
            </div>
            <div
              style={{
                marginTop: 7,
                fontFamily: "var(--font-manrope), sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.62)",
                letterSpacing: "0.02em",
                // balances the two-line wrap at 390px (no-op where unsupported)
                textWrap: "balance",
              }}
            >
              scan thrift finds. check real prices. flip for profit.
            </div>
          </div>

          {/* ── THE INSTRUMENT — house glass, specular top edge ── */}
          <div className="lp-a lp-a--card" style={{ position: "relative" }}>
            <div className="lp-bloom" aria-hidden="true" />
            <div
              style={{
                position: "relative",
                backgroundColor: "rgba(7,5,16,0.78)",
                border: "1px solid rgba(92,224,184,0.22)",
                backdropFilter: "blur(16px) saturate(140%)",
                WebkitBackdropFilter: "blur(16px) saturate(140%)",
                boxShadow:
                  "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 -2px 20px -8px rgba(92,224,184,0.16), 0 12px 36px -12px rgba(0,0,0,0.6)",
                borderRadius: 22,
                padding: 22,
              }}
            >
              <GoogleButton onTap={handleGoogle} loading={googleLoading} />

              {/* ── divider ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 18,
                  marginBottom: 18,
                }}
              >
                <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
                <span
                  style={{
                    paddingLeft: 12,
                    paddingRight: 12,
                    fontFamily: "var(--font-space-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.32)",
                  }}
                >
                  OR
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* ── email row ── */}
              {emailSent ? (
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.88)",
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 9,
                  }}
                >
                  {/* confirmation moment: mint check + one pulse ring */}
                  <span style={{ position: "relative", display: "flex" }}>
                    <span className="lp-sent-ring" aria-hidden="true" />
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#5CE0B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx={12} cy={12} r={10} opacity={0.5} />
                      <path d="M8 12.5l2.6 2.6L16 9.5" />
                    </svg>
                  </span>
                  link sent. check your inbox.
                </div>
              ) : (
                <div className="lp-well" style={{ display: "flex", position: "relative", borderRadius: 20 }}>
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => {
                      setEmailFocused(true);
                      setChargeKey((k) => k + 1);
                    }}
                    onBlur={() => setEmailFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEmail();
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 52,
                      backgroundColor: "rgba(0,0,0,0.35)",
                      border: emailFocused
                        ? "1px solid rgba(92,224,184,0.55)"
                        : "1px solid rgba(255,255,255,0.09)",
                      borderRight: "none",
                      boxShadow: emailFocused
                        ? "inset 0 1px 2px 0 rgba(0,0,0,0.4), 0 0 16px -4px rgba(92,224,184,0.35)"
                        : "inset 0 1px 2px 0 rgba(0,0,0,0.4)",
                      borderRadius: "20px 0 0 20px",
                      paddingLeft: 16,
                      paddingRight: 16,
                      fontFamily: "var(--font-body)",
                      // 16px minimum — iOS Safari auto-zooms below 16.
                      fontSize: 16,
                      color: "var(--text-primary)",
                      outline: "none",
                      transition:
                        "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                  <SendButton onTap={handleEmail} disabled={emailLoading} />
                  {/* FOCUS CHARGE — one traveling light around the well's
                      perimeter per focus (fresh key), then the input's own
                      mint border holds the glow. */}
                  {chargeKey > 0 && emailFocused && !reduced && (
                    <span key={chargeKey} className="lp-charge" aria-hidden="true">
                      <span className="lp-charge-spin" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── proof line — quiet rotating truths ── */}
          <div
            className="lp-a lp-a--proof"
            style={{ marginTop: 18, position: "relative", height: 15 }}
          >
            {proofPrev !== null && (
              <span key={"p" + proofPrev} className="lp-proof lp-proof--out">
                {PROOF_LINES[proofPrev]}
              </span>
            )}
            <span
              key={"c" + proofIdx}
              className={proofPrev !== null ? "lp-proof lp-proof--in" : "lp-proof"}
            >
              {PROOF_LINES[proofIdx]}
            </span>
          </div>
        </div>
      </div>

      {/* Install bar — untouched. Self-gates per platform + cooldowns. */}
      <PwaInstallBar />
    </div>
  );
}

const STYLES = `
/* ── entrance choreography — plays once, chained after the splash ── */
.lp--pre .lp-a { opacity: 0; }
.lp--enter .lp-a {
  opacity: 0;
  animation: lpRise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.lp--enter .lp-a--mark { animation-delay: 140ms; }
.lp--enter .lp-a--tag { animation-delay: 300ms; }
.lp--enter .lp-a--card { animation-delay: 420ms; animation-duration: 460ms; }
.lp--enter .lp-a--proof { animation-delay: 660ms; animation-duration: 320ms; }
@keyframes lpRise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
/* card-landing glow bloom — brightens then hands off to the resting lift */
.lp-bloom {
  position: absolute; inset: -26px; border-radius: 40px;
  background: radial-gradient(ellipse at center, rgba(92,224,184,0.16) 0%, transparent 65%);
  opacity: 0; pointer-events: none;
}
.lp--enter .lp-bloom { animation: lpBloom 950ms ease-out 480ms both; }
@keyframes lpBloom { 0% { opacity: 0; } 45% { opacity: 1; } 100% { opacity: 0; } }

/* ── master pause — one class freezes the whole stage ── */
.lp--paused, .lp--paused * { animation-play-state: paused !important; }

/* ── ring glint — travels CoinMark's ellipse (6s orbit) ── */
.lp-glint {
  position: absolute; left: 0; top: 0;
  width: 3px; height: 3px; border-radius: 50%;
  background: #C9F7E7;
  box-shadow: 0 0 7px rgba(92,224,184,0.95), 0 0 2px rgba(255,255,255,0.9);
  offset-path: path("M 30.82 20.43 A 18.33 5.83 -25 0 0 9.18 19.57 A 18.33 5.83 -25 0 0 30.82 20.43");
  animation: lpGlint 6s linear infinite;
}
@keyframes lpGlint {
  0% { offset-distance: 0%; opacity: 0.3; }
  40% { opacity: 0.3; }
  55% { opacity: 1; }
  92% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0.3; }
}
@supports not (offset-path: path("M 0 0 L 1 1")) {
  .lp-glint { display: none; }
}

/* ── focus charge — one lap of light around the email well ── */
.lp-well { z-index: 0; }
.lp-charge {
  position: absolute; inset: 0; border-radius: 20px; padding: 1.5px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  overflow: hidden; pointer-events: none;
  animation: lpChargeFade 750ms ease-out both;
}
.lp-charge-spin {
  position: absolute; left: -55%; top: -220%; width: 210%; height: 540%;
  background: conic-gradient(transparent 0deg 285deg, rgba(92,224,184,0.95) 330deg, transparent 360deg);
  animation: lpChargeSpin 420ms ease-out both;
}
@keyframes lpChargeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes lpChargeFade { 0%, 55% { opacity: 1; } 100% { opacity: 0; } }

/* ── magic-link confirmation pulse ── */
.lp-sent-ring {
  position: absolute; inset: -3px; border-radius: 50%;
  border: 1.5px solid rgba(92,224,184,0.8);
  animation: lpSentPulse 650ms ease-out 1 both;
  pointer-events: none;
}
@keyframes lpSentPulse {
  from { transform: scale(0.7); opacity: 1; }
  to { transform: scale(1.9); opacity: 0; }
}

/* ── rotating proof line ── */
.lp-proof {
  position: absolute; left: 0; right: 0; top: 0;
  text-align: center;
  font-family: var(--font-space-mono), monospace;
  font-size: 10px; letter-spacing: 0.14em;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
}
.lp-proof--in { animation: lpProofIn 420ms ease both; }
.lp-proof--out { animation: lpProofOut 420ms ease both; }
@keyframes lpProofIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lpProofOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-5px); } }

/* ── keyboard flow — visible focus on every interactive element ── */
.lp button:focus-visible {
  outline: 2px solid rgba(92,224,184,0.75);
  outline-offset: 2px;
}

/* ── reduced motion: the finished page, standing still ── */
@media (prefers-reduced-motion: reduce) {
  .lp, .lp * { animation: none !important; }
  .lp--pre .lp-a { opacity: 1; }
  .lp-glint, .lp-charge, .lp-bloom, .lp-sent-ring { display: none !important; }
  .lp-proof--out { display: none; }
}
`;
