"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import CoinMark from "@/components/shared/CoinMark";
import DotGridBackground from "@/components/shared/DotGridBackground";

// Google "G" logo — official colors
function GoogleIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 48 48">
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

function PaperPlaneIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5CE0B8"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={22} y1={2} x2={11} y2={13} />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
          : "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: pressed
          ? "0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3)",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        padding: 0,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Shimmer band — travels left→right over 4s, then pauses 8s */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 60,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          animation: "loot-google-shimmer 12s linear infinite",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          display: "flex",
          opacity: loading ? 0 : 1,
          transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <GoogleIcon />
      </span>
      <span
        style={{
          fontFamily: "var(--font-outfit), sans-serif",
          fontWeight: 500,
          fontSize: 15,
          color: "rgba(255,255,255,0.85)",
          opacity: loading ? 0 : 1,
          transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
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
          fontFamily: "var(--font-outfit), sans-serif",
          fontWeight: 500,
          fontSize: 15,
          color: "rgba(255,255,255,0.5)",
          transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: loading ? 1 : 0,
          pointerEvents: "none",
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

  const restShadow =
    "inset 0 1px 0 0 rgba(92,224,184,0.18), 0 1px 2px rgba(0,0,0,0.3)";
  const pressShadow =
    "0 0 0 1px rgba(92,224,184,0.20), 0 0 24px -4px rgba(92,224,184,0.35)";

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: 54,
        height: 52,
        flexShrink: 0,
        backgroundColor: "rgba(92,224,184,0.10)",
        border: "1px solid rgba(92,224,184,0.18)",
        borderLeft: "none",
        boxShadow: pressed ? pressShadow : restShadow,
        borderRadius: "0 16px 16px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        transform: pressed ? "scale(0.95)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top-edge shine */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -1,
          left: 8,
          right: 8,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          pointerEvents: "none",
        }}
      />
      <PaperPlaneIcon />
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

  // Sunken email input — trough shadow, focus blooms a faint mint glow.
  const inputBaseShadow = "inset 0 1px 2px 0 rgba(0,0,0,0.4)";
  const inputFocusShadow =
    "inset 0 1px 2px 0 rgba(0,0,0,0.4), 0 0 16px -4px rgba(92,224,184,0.15)";

  return (
    <>
      <style>{`
        @keyframes loginLogoEntry {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loginCardEntry {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginCardColorResponse {
          0%, 100% {
            box-shadow:
              inset 0 1px 0 0 rgba(255,255,255,0.10),
              0 2px 6px -1px rgba(0,0,0,0.25),
              0 16px 48px -8px rgba(0,0,0,0.55);
          }
          50% {
            box-shadow:
              inset 0 1px 0 0 rgba(92,224,184,0.10),
              0 2px 6px -1px rgba(0,0,0,0.25),
              0 16px 48px -8px rgba(92,224,184,0.12);
          }
        }
        @keyframes loot-logo-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes loot-google-shimmer {
          0% { transform: translateX(-100%); }
          33.333% { transform: translateX(calc(340px + 200%)); }
          100% { transform: translateX(calc(340px + 200%)); }
        }
        @keyframes loot-input-pulse {
          0%, 100% { border-color: rgba(255,255,255,0.06); }
          50% { border-color: rgba(255,255,255,0.10); }
        }
        .loot-email-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .loot-email-input::-webkit-input-placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>

      <DotGridBackground variant="login" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          paddingTop: "28vh",
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
          }}
        >
          {/* ── Logo ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 64,
              position: "relative",
              animation: "loginLogoEntry 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            {/* Light source — soft mint glow radiating from behind logo */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 320,
                height: 160,
                background:
                  "radial-gradient(ellipse, rgba(92,224,184,0.08) 0%, transparent 70%)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                animation: "loot-logo-breathe 4s ease-in-out infinite",
              }}
            >
              <CoinMark size={32} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 44,
                color: "#4AEDC4",
                letterSpacing: "0.08em",
                lineHeight: 1,
              }}
            >
              LOOT
            </span>
            <div
              style={{
                width: 64,
                height: 1,
                backgroundColor: "rgba(92,224,184,0.25)",
                flexShrink: 0,
                alignSelf: "center",
              }}
            />
          </div>

          {/* ── Auth glass card ── */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.10), 0 2px 6px -1px rgba(0,0,0,0.25), 0 16px 48px -8px rgba(0,0,0,0.55)",
              borderRadius: 16,
              padding: 24,
              animation:
                "loginCardEntry 500ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both, loginCardColorResponse 15s ease-in-out 800ms infinite",
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
                  backgroundColor: "rgba(255,255,255,0.025)",
                }}
              />
              <span
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  fontFamily: "var(--font-jetbrains-mono), monospace",
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
                  backgroundColor: "rgba(255,255,255,0.025)",
                }}
              />
            </div>

            {/* ── Email row ── */}
            {emailSent ? (
              <div
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 500,
                  fontSize: 14,
                  color: "var(--accent-mint)",
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
                  className="loot-email-input"
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
                      ? "1px solid rgba(92,224,184,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                    borderRight: "none",
                    boxShadow: emailFocused
                      ? inputFocusShadow
                      : inputBaseShadow,
                    borderRadius: "16px 0 0 16px",
                    paddingLeft: 16,
                    paddingRight: 16,
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    outline: "none",
                    animation: emailFocused
                      ? "none"
                      : "loot-input-pulse 3s ease-in-out infinite",
                    transition:
                      "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
                <SendButton onTap={handleEmail} disabled={emailLoading} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
