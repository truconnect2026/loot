"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import CoinMark from "@/components/shared/CoinMark";
import DotGridBackground from "@/components/shared/DotGridBackground";
import PwaInstallBar from "@/components/login/PwaInstallBar";

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
  // Send button is interactive UI, not money — stroke is white per the
  // role system, no longer mint.
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={1.5}
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
          ? "rgba(255,255,255,0.09)"
          : "rgba(255,255,255,0.06)",
        // Border removed — the auth card already carries one. Two nested
        // borders read as boxed-in. The button now relies on its slightly
        // brighter bg + inset highlight to separate from the card surface.
        border: "none",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        position: "relative",
        cursor: "pointer",
        padding: 0,
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
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
          fontWeight: 500,
          fontSize: 15,
          color: "rgba(255,255,255,0.85)",
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
          color: "rgba(255,255,255,0.5)",
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

  // Interactive surface — white-forward per the role system. Mint here
  // would falsely signal "money" on a button whose only job is "submit".
  const restShadow =
    "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.3)";
  const pressShadow =
    "0 0 0 1px rgba(255,255,255,0.18), 0 0 24px -4px rgba(255,255,255,0.20)";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        // 54×52 right cap of the email input row — icon-only. The
        // outer (right) corner radius matches the email input's
        // outer (left) corner radius so the joined pair reads as
        // one unified input pill, not as a flat box bolted onto a
        // rounded input. flexShrink stops the input from squeezing
        // it. Inner edge stays sharp (0) since it abuts the input.
        width: 54,
        height: 52,
        flexShrink: 0,
        backgroundColor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: pressed ? pressShadow : restShadow,
        borderRadius: "0 20px 20px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
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

  // Sunken email input — trough shadow, focus blooms a faint white glow.
  // (Mint here would falsely read as "money is involved" on a sign-in field.)
  const inputBaseShadow = "inset 0 1px 2px 0 rgba(0,0,0,0.4)";
  const inputFocusShadow =
    "inset 0 1px 2px 0 rgba(0,0,0,0.4), 0 0 16px -4px rgba(255,255,255,0.12)";

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Saturn icon — gentle vertical drift, 5s loop. Baseline nudged
           down 2px (resting at translateY(2px), floating up to 0) so the
           planet sits optically centered with the LOOT wordmark cap-height
           rather than appearing slightly high. Pure transform = GPU. */
        @keyframes saturnFloat {
          0%, 100% { transform: translateY(2px); }
          50% { transform: translateY(0); }
        }
        /* LOOT wordmark — soft breathing glow. The visible LOOT stays calm;
           a duplicate text-shadow layer fades in over it. Animating opacity
           only keeps the effect on the compositor thread. */
        @keyframes lootGlowPulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <DotGridBackground variant="login" />

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
        {/* 36px translateY shifts the whole composition (logo, auth
            card, social proof, tagline, install hint) below true
            center so the cluster's vertical balance feels right
            against the deep bottom space. Using transform instead of
            margin/padding so the centering math doesn't get torqued
            on different viewport heights — the visual offset is
            constant across iPhone SE through iPad. */}
        <div
          style={{
            width: "100%",
            maxWidth: 340,
            paddingLeft: 24,
            paddingRight: 24,
            transform: "translateY(36px)",
          }}
        >
          {/* ── Logo ── 64 → 44 to pull the wordmark closer to the
              auth card. The page used to feel like wordmark / dead
              space / card / dead space; this tightens the
              composition so the Saturn icon, wordmark, card, and
              tagline read as one cohesive unit. The viewport-level
              minHeight + justifyContent:center still centers the
              whole stack vertically — it just centers a more
              compact stack now. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 44,
            }}
          >
            <div
              style={{
                display: "flex",
                animation: "saturnFloat 5s ease-in-out infinite",
                willChange: "transform",
              }}
            >
              <CoinMark size={32} color="#5CE0B8" />
            </div>
            {/* LOOT — base layer (calm) + glow overlay (breathing).
                Brand-identity exception to the font role system: the
                logotype stays in JetBrains Mono regardless of the
                "monospace = uppercase labels only" rule. */}
            <span
              style={{
                position: "relative",
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: 44,
                color: "#5CE0B8",
                letterSpacing: "0.08em",
                lineHeight: 1,
                display: "inline-block",
              }}
            >
              LOOT
              {/* Glow layer — transparent text, all the visible mass is in
                  the text-shadow. Opacity-only animation = compositor only. */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  color: "transparent",
                  textShadow:
                    "0 0 14px rgba(92,224,184,0.55), 0 0 28px rgba(92,224,184,0.30)",
                  pointerEvents: "none",
                  animation:
                    "lootGlowPulse 5s ease-in-out infinite",
                  willChange: "opacity",
                }}
              >
                LOOT
              </span>
            </span>
          </div>

          {/* ── Auth glass card ── */}
          <div
            data-particle-clip="true"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 8px 32px -8px rgba(0,0,0,0.5)",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <GoogleButton onTap={handleGoogle} loading={googleLoading} />

            {/* ── Divider ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              />
              <span
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.15)",
                }}
              >
                or
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              />
            </div>

            {/* ── Email row ── */}
            {emailSent ? (
              <div
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 14,
                  // Success confirmation, not money. White-forward per role
                  // system; the success cue is the message itself, not color.
                  color: "var(--ui-primary)",
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                check your email
              </div>
            ) : (
              <div style={{ display: "flex" }}>
                <input
                  ref={inputRef}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEmail();
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 52,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    border: emailFocused
                      ? "1px solid rgba(255,255,255,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                    borderRight: "none",
                    boxShadow: emailFocused
                      ? inputFocusShadow
                      : inputBaseShadow,
                    borderRadius: "20px 0 0 20px",
                    paddingLeft: 16,
                    paddingRight: 16,
                    fontFamily: "var(--font-body)",
                    // 16px minimum — iOS Safari auto-zooms into any
                    // input below 16. Visual size bumped from 14 → 16
                    // to keep the page from yanking on focus.
                    fontSize: 16,
                    color: "var(--text-primary)",
                    outline: "none",
                    transition:
                      "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
                <SendButton onTap={handleEmail} disabled={emailLoading} />
              </div>
            )}
          </div>

          {/* ── Social proof ── quiet trust signal, not a sales pitch.
              Hierarchy flipped: dropped from 30 → 22% white so the
              tagline below outranks it visually. Social proof is
              secondary — it reinforces trust; the tagline explains
              the product. Voice rule applies: lowercase, no terminal
              period. The number is a placeholder until real metrics
              are wired up — keep the copy editable in one place. */}
          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.22)",
              letterSpacing: "0.04em",
              animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
              animationDelay: "600ms",
            }}
          >
            trusted by 12,000+ resellers
          </div>

          {/* ── Tagline ── concrete three-beat product description.
              Promoted from 20 → 38% white so it reads more clearly
              than the social proof above — the tagline does the work
              of explaining the product, social proof is secondary
              reinforcement. Voice rule: all lowercase, no terminal
              period, commas allowed mid-line (see globals.css for
              the full rule). */}
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "rgba(255, 255, 255, 0.38)",
              letterSpacing: "0.10em",
              animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
              animationDelay: "700ms",
            }}
          >
            scan thrift finds, check online prices, flip for profit
          </div>

          {/* Home-screen install hint — moved out of fixed-position
              and into the cluster's bottom edge so the gap to the
              tagline is constant across viewports (was a "chasm" on
              tall viewports with the previous fixed positioning).
              Centered via the parent's alignItems on the outer flex
              container — but this row is centered on its own to be
              safe across any container alignment. 14px gap above
              keeps the bottom group (social proof → tagline → hint)
              reading as one tight cluster. */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "center",
              animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
              animationDelay: "780ms",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 36,
                paddingLeft: 14,
                paddingRight: 14,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                backdropFilter: "blur(12px) saturate(140%)",
                WebkitBackdropFilter: "blur(12px) saturate(140%)",
              }}
            >
              {/* Phone icon with downward arrow — same shape as the
                  PwaInstallBar's primary phone glyph at smaller scale. */}
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.40)"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x={5} y={2} width={14} height={20} rx={2.5} />
                <path d="M12 8v6" />
                <polyline points="9 11 12 14 15 11" />
              </svg>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.50)",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                add to home screen
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Install bar — only renders for users on a platform that can
          install (iOS Safari, or Android/Chromium browsers that fire
          beforeinstallprompt). Self-gates on standalone mode, the
          7-day cooldown, the session-dismiss flag, and the installed
          flag. Pinned to the viewport bottom inside the safe area;
          login content stays untouched. */}
      <PwaInstallBar />
    </>
  );
}
