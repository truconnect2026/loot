"use client";

import CoinMark from "@/components/shared/CoinMark";
import DotGridBackground from "@/components/shared/DotGridBackground";

/**
 * Route-level loading state for /account.
 *
 * Shown by Next.js automatically while the account page's server
 * shell (or its first client paint) resolves. Visually paired with
 * the boot SplashScreen so the transition from dashboard → account
 * stays in the brand visual system, but stripped down to just the
 * spinning Saturn + breathing dots — no wordmark, no tagline, no
 * glow ring. Quick acknowledgment of the navigation, not a full
 * brand moment.
 */
export default function AccountLoading() {
  return (
    <>
      <style>{`
        @keyframes accountLoadingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes accountLoadingDot {
          0%, 100% {
            opacity: 0.08;
            transform: scale(0.7);
            box-shadow: 0 0 0px rgba(92, 224, 184, 0);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.15);
            box-shadow: 0 0 8px rgba(92, 224, 184, 0.18);
          }
        }
      `}</style>

      <DotGridBackground variant="grid" />

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            opacity: 0.4,
            animation: "accountLoadingSpin 8s linear infinite",
            willChange: "transform",
          }}
        >
          <CoinMark size={36} color="#5CE0B8" />
        </span>

        {/* Three breathing dots — same stagger pattern as the boot
            splash but at 0.4 peak opacity instead of 0.65 so this
            transition state reads as a quieter cousin of the boot
            moment. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {[0, 0.25, 0.5].map((delay, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#5CE0B8",
                animation: `accountLoadingDot 1.6s ease-in-out ${delay}s infinite`,
                willChange: "transform, opacity",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
