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
 *        periwinkle / camel) at low alpha. Subtle scale-up on entrance.
 *   z 1  DotGridBackground — same grid the dashboard uses, faded in
 *        tight behind the atmosphere.
 *   z 2  Film-grain noise — fractalNoise SVG at 0.015 opacity. Felt
 *        more than seen; gives the dark surface a brushed-metal feel.
 *   z 10 Logo group — radial mint glow → spinning Saturn → LOOT
 *        wordmark → tagline → breathing dots. Staggered entrance, dots
 *        loop forever; one-shot entrances use fill-mode `both` so the
 *        elements stay invisible until their delay elapses (no flash
 *        of un-styled / fully-opaque content) and hold their final
 *        state after the animation completes.
 *
 * Entrance schedule — the full sequence completes in ~1.4s so the
 * splash feels like it lands quickly even on a 1.6s total visibility
 * window:
 *   0.00s  mesh atmosphere starts
 *   0.10s  dot grid starts
 *   0.15s  radial logo glow starts
 *   0.25s  Saturn icon fades in
 *   0.35s  LOOT wordmark fades in
 *   0.65s  tagline fades in
 *   0.90s  breathing dots fade in (then loop forever)
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
          100% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes splashGridFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashGlowExpand {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
        }
        @keyframes splashCoinFadeIn {
          from { opacity: 0; }
          to { opacity: 0.85; }
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
          to { opacity: 0.55; }
        }
        @keyframes splashDotsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashDotBreathe {
          0%, 100% {
            opacity: 0.12;
            transform: scale(0.7);
            box-shadow: 0 0 0px rgba(92, 224, 184, 0);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.2);
            box-shadow: 0 0 10px rgba(92, 224, 184, 0.25);
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
        {/* Layer 1 — mesh atmosphere. Three accent-tinted radials.
            Alphas bumped from 0.04/0.03/0.02 → 0.07/0.06/0.05 so they
            actually register on OLED phone screens — anything below
            ~0.04 is invisible against near-black on those displays. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background:
              "radial-gradient(ellipse 65% 55% at 25% 35%, rgba(92, 224, 184, 0.07) 0%, transparent 65%), " +
              "radial-gradient(ellipse 55% 65% at 75% 65%, rgba(123, 143, 255, 0.06) 0%, transparent 65%), " +
              "radial-gradient(ellipse 80% 45% at 50% 95%, rgba(212, 165, 116, 0.05) 0%, transparent 55%)",
            animation:
              "splashMeshDrift 1.5s ease-out 0s both",
            transformOrigin: "center",
          }}
        />

        {/* Layer 2 — DotGridBackground in its grid variant. Tight
            entrance so the grid lands while the atmosphere is still
            arriving — 0.1s delay just gives the mesh a one-frame
            head start, not a long wait. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            animation:
              "splashGridFadeIn 1.0s ease-out 0.1s both",
          }}
        >
          <DotGridBackground variant="grid" />
        </div>

        {/* Layer 3 — film grain. 0.015 opacity reads as physical
            surface texture, not pattern. */}
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
            }}
          >
            {/* Radial glow — anchored behind the icon. 340px halo
                with a slow 4-stop falloff. Center alpha at 0.12 is
                the threshold where the halo actually reads on OLED
                phone screens against near-black; previous 0.07 was
                literally invisible. The translate(-50%,-50%) on
                both keyframe anchors keeps the scale-in centered
                on the icon. */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                // 26 = center of the 52px icon. The transform's
                // translate(-50%) handles centering the 340px glow
                // around that point, so no margin offset is needed.
                left: 26,
                width: 340,
                height: 340,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at center, rgba(92, 224, 184, 0.12) 0%, rgba(92, 224, 184, 0.06) 25%, rgba(92, 224, 184, 0.02) 45%, transparent 65%)",
                animation:
                  "splashGlowExpand 1.5s ease-out 0.15s both",
              }}
            />

            {/* Spinning Saturn — 52px, 85% mint. The fade and the
                rotation live on separate elements so they don't
                fight for `transform`. Outer span owns opacity
                (entrance), inner span owns rotation (continuous). */}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                animation:
                  "splashCoinFadeIn 600ms ease-out 0.25s both",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  animation: "splashCoinSpin 8s linear infinite",
                  willChange: "transform",
                }}
              >
                <CoinMark size={52} color="#5CE0B8" />
              </span>
            </span>

            {/* LOOT wordmark — full-brightness mint, two-layer halo
                (40px tight + 80px ambient) so the text reads as a
                light source projecting outward, not paint on the
                surface. */}
            <span
              style={{
                marginLeft: 16,
                fontFamily: "var(--font-jetbrains-mono)",
                fontWeight: 700,
                fontSize: 42,
                letterSpacing: "0.15em",
                lineHeight: 1,
                color: "#5CE0B8",
                textShadow:
                  "0 0 40px rgba(92, 224, 184, 0.12), 0 0 80px rgba(92, 224, 184, 0.04)",
                animation:
                  "splashWordFadeIn 600ms ease-out 0.35s both",
              }}
            >
              LOOT
            </span>
          </div>

          {/* Tagline — three-word whisper. Bumped from 0.4 → 0.55
              opacity so it reads at arm's length on a phone in
              normal lighting. */}
          <div
            style={{
              marginTop: 12,
              fontFamily: "var(--font-outfit)",
              fontWeight: 400,
              fontSize: 13,
              letterSpacing: "0.08em",
              color: "rgba(200, 192, 216, 1)",
              animation:
                "splashTaglineFadeIn 500ms ease-out 0.65s both",
            }}
          >
            scan. price. flip.
          </div>

          {/* Breathing dots — three mint dots that pulse on a wave.
              Wrapper fades in; each dot then breathes independently
              with a 0.25s stagger. Peak opacity 0.65 + 10px / 0.25
              alpha glow at 50% of the keyframe makes them visibly
              register without competing with the wordmark. */}
          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              animation:
                "splashDotsFadeIn 400ms ease-out 0.9s both",
            }}
          >
            {[0, 0.25, 0.5].map((delay, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  display: "inline-block",
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
