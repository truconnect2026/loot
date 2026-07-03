"use client";

import { useEffect, useState } from "react";
import FlipCoyote from "@/components/shared/FlipCoyote";
import { colors, radius, elevation, motion as motionTokens, type as typeScale } from "@/lib/design/tokens";

/**
 * Anon-scan wall — shown in place of the scan result when a logged-out
 * visitor's one free scan (see src/lib/anon-scan-gate.ts) is spent.
 * A conversion moment, not an error: same bordered mint-panel language
 * as VerdictSheet / the /pro verdict card, not a toast or raw JSON.
 */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function SignupWallCard() {
  const reducedMotion = usePrefersReducedMotion();
  const [entered, setEntered] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const goToSignUp = () => {
    window.location.href = "/";
  };
  const goToLogIn = () => {
    window.location.href = "/";
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        boxSizing: "border-box",
        background: colors.bgBase,
        border: `1px solid ${colors.mintBorder}`,
        borderRadius: radius.lg,
        boxShadow: `${elevation[2]}, ${elevation.rim}`,
        padding: "28px 24px",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        textAlign: "center",
        opacity: !reducedMotion && !entered ? 0 : 1,
        transform: !reducedMotion && !entered ? "translateY(24px)" : "translateY(0)",
        transition: reducedMotion
          ? "none"
          : `opacity ${motionTokens.slow}ms ${motionTokens.easeOut}, transform ${motionTokens.slow}ms ${motionTokens.easeOut}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <FlipCoyote mood="smirk" size={56} />
      </div>

      <div
        style={{
          ...typeScale.label,
          textTransform: "uppercase",
          color: colors.mint,
          marginBottom: 10,
        }}
      >
        that&apos;s your free one
      </div>

      <div
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 21,
          color: "#fff",
          lineHeight: 1.25,
          marginBottom: 10,
        }}
      >
        make an account to keep scanning
      </div>

      <div
        style={{
          ...typeScale.bodyM,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.5,
          marginBottom: 24,
        }}
      >
        free members get the daily flip-or-skip game. pro unlocks unlimited scans.
      </div>

      <button
        type="button"
        onClick={goToSignUp}
        style={{
          width: "100%",
          fontFamily: "var(--font-display)",
          fontSize: 20,
          letterSpacing: "0.04em",
          background: colors.mint,
          color: colors.bgBase,
          border: "none",
          borderRadius: radius.md,
          padding: "16px 0",
          cursor: "pointer",
          boxShadow: colors.mintGlow,
        }}
      >
        SIGN UP FREE &rarr;
      </button>

      <button
        type="button"
        onClick={goToLogIn}
        style={{
          display: "block",
          margin: "16px auto 0",
          background: "none",
          border: "none",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          cursor: "pointer",
        }}
      >
        already have an account? log in
      </button>
    </div>
  );
}
