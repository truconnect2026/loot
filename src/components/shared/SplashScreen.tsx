"use client";

import CoinMark from "@/components/shared/CoinMark";
import DotGridBackground from "@/components/shared/DotGridBackground";

/**
 * Full-screen splash — first frame the user sees while the app boots.
 *
 * Layered atmosphere over #0A0812 (slightly darker than the app's normal
 * #120e18 so the transition INTO the app feels like lights coming on):
 *
 *   z 0  meshAtmosphere — three accent-tinted radial gradients (mint /
 *        periwinkle / camel) at low alpha. Slowly scales 1.00 → 1.05 as
 *        it fades in.
 *   z 1  DotGridBackground — the same grid the dashboard uses, faded in
 *        with a 0.3s delay so the atmosphere lands first.
 *   z 2  Film-grain noise — fractalNoise SVG at 0.015 opacity. Felt more
 *        than seen; gives the dark surface a brushed-metal feel.
 *   z 10 Logo group — soft mint glow ring → spinning Saturn → LOOT
 *        wordmark → tagline → breathing dots. Staggered entrance, dots
 *        loop forever; entrances are one-shot (forwards fill-mode).
 *
 * `exiting` — when true, the whole shell fades out over 400ms. Caller
 * is responsible for unmounting after that animation completes.
 */

interface SplashScreenProps {
  exiting?: boolean;
}

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function SplashScreen({ exiting = false }: SplashScreenProps) {
  return (
    <>
      <style>{`
        @keyframes splashMeshDrift {
          0% { opacity: 0; transform: scale(1.0); }
          30% { opacity: 1; }
          100% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes splashGridFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashGlowPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
        }
        @keyframes splashCoinFadeIn {
          from { opacity: 0; }
          to { opacity: 0.7; }
        }
        @keyframes splashCoinSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splashWordFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashTaglineFadeIn {
          from { opacity: 0; }
          to { opacity: 0.4; }
        }
        @keyframes splashDotsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashDotBreathe {
          0%, 100% {
            opacity: 0.1;
            transform: scale(0.7);
            box-shadow: 0 0 0px rgba(92, 224, 184, 0);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.15);
            box-shadow: 0 0 8px rgba(92, 224, 184, 0.3);
          }
        }
        @keyframes splashExit {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      <div
        // The shell — full-bleed, locked to viewport. 100dvh on mobile
        // so iOS Safari's collapsing chrome doesn't leave a strip of
        // body bg uncovered. zIndex above film grain (100 in
        // layout.tsx) so the splash also sits above that overlay.
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          minHeight: "100vh",
          backgroundColor: "#0A0812",
          overflow: "hidden",
          zIndex: 9999,
          animation: exiting
            ? "splashExit 400ms ease-in forwards"
            : undefined,
          // pointer-events:none on exit so taps fall through to the
          // app underneath as soon as the fade starts.
          pointerEvents: exiting ? "none" : "auto",
        }}
      >
        {/* Layer 1 — mesh atmosphere. Three accent-tinted radials at
            low alpha. The slow scale-up gives the dark surface a
            sense of expanding rather than just sitting still. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(92, 224, 184, 0.04) 0%, transparent 70%), " +
              "radial-gradient(ellipse 50% 60% at 70% 60%, rgba(123, 143, 255, 0.03) 0%, transparent 70%), " +
              "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(212, 165, 116, 0.02) 0%, transparent 60%)",
            animation: "splashMeshDrift 3s ease-out forwards",
            transformOrigin: "center",
          }}
        />

        {/* Layer 2 — DotGridBackground in its grid variant, the same
            quiet graph-paper the dashboard uses. Wrapped in a fader
            div so the entrance is staggered behind the atmosphere. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            opacity: 0,
            animation:
              "splashGridFadeIn 1.5s ease-out 0.3s forwards",
          }}
        >
          <DotGridBackground variant="grid" />
        </div>

        {/* Layer 3 — film grain. 0.015 opacity reads as physical
            surface texture, not pattern. Sits above grid + below
            logo so the logo stays crisp. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            opacity: 0.015,
            backgroundImage: NOISE_SVG,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Logo group — flex-centered, owns its own zIndex so the
            atmosphere/grid/noise all paint underneath. */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
          }}
        >
          {/* Icon + wordmark row, with the radial glow positioned
              behind the icon. The glow lives inside this row so its
              transform-origin tracks the row's position. */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              // The wordmark is taller than the icon at 42px / 48px;
              // baseline-align so they sit visually balanced.
              alignSelf: "center",
            }}
          >
            {/* Radial glow — anchored behind the icon. Centered on
                the icon's center via translate(-50%,-50%). The
                animation interpolates the same translate so the
                glow doesn't snap during the scale-in. */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: 24, // center of the 48px icon
                width: 280,
                height: 280,
                marginLeft: -140,
                marginTop: 0,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at center, rgba(92, 224, 184, 0.07) 0%, rgba(92, 224, 184, 0.03) 30%, rgba(92, 224, 184, 0.01) 50%, transparent 70%)",
                opacity: 0,
                animation: "splashGlowPulse 2s ease-out forwards",
              }}
            />

            {/* Spinning Saturn — 48px, 70% mint, 8s rotation. The
                spin is slow enough that it reads as ambient life,
                not a loading spinner. Wrapped in two divs so the
                fade-in (opacity) and rotation (transform) live on
                separate elements — one CSS animation per axis. */}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                opacity: 0,
                animation:
                  "splashCoinFadeIn 800ms ease-out 200ms forwards",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  animation: "splashCoinSpin 8s linear infinite",
                  willChange: "transform",
                }}
              >
                <CoinMark size={48} color="#5CE0B8" />
              </span>
            </span>

            {/* LOOT wordmark — full-brightness mint, soft halo. */}
            <span
              style={{
                marginLeft: 14,
                fontFamily: "var(--font-jetbrains-mono)",
                fontWeight: 700,
                fontSize: 42,
                letterSpacing: "0.15em",
                lineHeight: 1,
                color: "#5CE0B8",
                textShadow:
                  "0 0 30px rgba(92, 224, 184, 0.15), 0 0 60px rgba(92, 224, 184, 0.05)",
                opacity: 0,
                animation:
                  "splashWordFadeIn 800ms ease-out 400ms forwards",
              }}
            >
              LOOT
            </span>
          </div>

          {/* Tagline — three-word whisper; barely visible. */}
          <div
            style={{
              marginTop: 12,
              fontFamily: "var(--font-outfit)",
              fontWeight: 400,
              fontSize: 13,
              letterSpacing: "0.08em",
              color: "rgba(200, 192, 216, 1)",
              opacity: 0,
              animation:
                "splashTaglineFadeIn 600ms ease-out 800ms forwards",
            }}
          >
            scan. price. flip.
          </div>

          {/* Breathing dots — three mint dots that pulse on a wave.
              Wrapper fades in last (1.2s delay); each dot then
              breathes independently with a 0.25s stagger. */}
          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: 0,
              animation:
                "splashDotsFadeIn 500ms ease-out 1200ms forwards",
            }}
          >
            {[0, 0.25, 0.5].map((delay, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  display: "block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#5CE0B8",
                  animation: `splashDotBreathe 1.6s ease-in-out ${delay}s infinite`,
                  willChange: "transform, opacity",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
