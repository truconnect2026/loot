"use client";

import { useEffect, useState } from "react";
import { C } from "../lib/colors.js";

/**
 * Minimal cookie consent — no library, no analytics SDK gymnastics.
 *
 * Persists choice in localStorage under "loot-cookie-consent" (values:
 * "accepted" | "rejected"). Any analytics layer that loads later should
 * read `window.__cookieConsent` (also written here) before firing.
 *
 * TODO(David): if you later add Vercel Analytics / PostHog / Segment to
 * this page, gate the SDK init on `window.__cookieConsent === "accepted"`.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const choice = localStorage.getItem("loot-cookie-consent");
      if (choice) {
        window.__cookieConsent = choice;
        return;
      }
      setVisible(true);
    } catch {
      // Private mode — assume rejected, no banner spam.
      window.__cookieConsent = "rejected";
    }
  }, []);

  const onChoice = (choice) => {
    try {
      localStorage.setItem("loot-cookie-consent", choice);
    } catch { /* private mode — choice is session-only */ }
    window.__cookieConsent = choice;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 9998,
        margin: "0 auto",
        maxWidth: 720,
        padding: 16,
        background: "rgba(7,5,16,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(92,224,184,0.3)",
        borderRadius: 12,
        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        fontFamily: "var(--font-manrope), sans-serif",
      }}
    >
      <p
        style={{
          flex: "1 1 240px",
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        We use cookies to improve loot.works.{" "}
        <a
          href="/privacy"
          style={{ color: C.mint, textDecoration: "underline" }}
        >
          Privacy Policy
        </a>
        .
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChoice("rejected")}
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "10px 18px",
            borderRadius: 6,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => onChoice("accepted")}
          style={{
            background: C.mint,
            color: "#070510",
            border: "none",
            padding: "10px 22px",
            borderRadius: 6,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
