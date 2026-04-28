"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import CoinMark from "@/components/shared/CoinMark";
import DotGridBackground from "@/components/shared/DotGridBackground";
import TilePressable from "@/components/shared/TilePressable";

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

// Arrow-right icon for send button
function ArrowIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-mint)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={5} y1={12} x2={19} y2={12} />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Checkmark icon for sent state
function CheckIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-mint)"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function LoginPage() {
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
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

  return (
    <>
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
        <div style={{ width: "100%", maxWidth: 300, paddingLeft: 32, paddingRight: 32 }}>
          {/* ── 1. Logo group ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 56,
            }}
          >
            <CoinMark size={28} />
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                fontSize: 40,
                color: "var(--accent-mint)",
                letterSpacing: "0.06em",
                lineHeight: 1,
              }}
            >
              LOOT
            </span>
            {/* Design line — 40px, 0.15 opacity */}
            <div
              style={{
                width: 40,
                height: 1,
                backgroundColor: "var(--accent-mint)",
                opacity: 0.15,
                flexShrink: 0,
                alignSelf: "center",
              }}
            />
          </div>

          {/* ── 2. Google button ── */}
          <TilePressable
            onTap={handleGoogle}
            className=""
          >
            <div
              style={{
                width: "100%",
                height: 52,
                backgroundColor: "var(--bg-surface)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow:
                  "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                position: "relative",
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
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "var(--text-primary)",
                  transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
                  opacity: googleLoading ? 0 : 1,
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
                  color: "var(--text-muted)",
                  transition: "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)",
                  opacity: googleLoading ? 1 : 0,
                }}
              >
                Connecting...
              </span>
            </div>
          </TilePressable>

          {/* ── 3. Divider ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "var(--border-subtle)",
              }}
            />
            <span
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 10,
                color: "var(--text-dim)",
                backgroundColor: "var(--bg-page)",
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "var(--border-subtle)",
              }}
            />
          </div>

          {/* ── 4. Email row ── */}
          {emailSent ? (
            <div
              style={{
                textAlign: "center",
                fontFamily: "var(--font-outfit), sans-serif",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--accent-mint)",
                height: 50,
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
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmail();
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 50,
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRight: "none",
                  boxShadow:
                    "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4)",
                  borderRadius: "14px 0 0 14px",
                  paddingLeft: 16,
                  paddingRight: 16,
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(92, 224, 184, 0.25)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              />
              <button
                onClick={handleEmail}
                disabled={emailLoading}
                style={{
                  width: 50,
                  height: 50,
                  flexShrink: 0,
                  backgroundColor: "rgba(92, 224, 184, 0.06)",
                  border: "1px solid rgba(92, 224, 184, 0.12)",
                  borderRadius: "0 14px 14px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
