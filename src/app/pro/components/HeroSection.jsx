"use client";

import { track } from "@vercel/analytics";
import { C } from "../lib/colors.js";
import { CheckIcon, CTAButton, Eyebrow, FadeUp } from "./atoms.jsx";
import FlipCoyote from "@/components/shared/FlipCoyote";
import VerdictCardLive from "./VerdictCardLive.jsx";
import { useInView, usePrefersReducedMotion } from "../hooks/usePageHooks.jsx";

const HERO_STYLES = `
.pro-hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  /* svh-fluid, no height breakpoint: 12px in a 620px webview, easing
     continuously to 40px by ~700px. IG chrome collapse mid-scroll now
     GLIDES instead of restructuring. */
  gap: clamp(12px, calc((100vh - 586px) * 0.35), 40px);
  gap: clamp(12px, calc((100svh - 586px) * 0.35), 40px);
  align-items: center;
}
@media (min-width: 1024px) {
  .pro-hero-grid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 56px; }
}
/* One centered axis: Kronos anchor, eyebrow, headline, and offer all
   compose on the same centerline so the header reads as one designed
   opening statement instead of three stranded elements. The snap-align
   and scroll-margin are untouched — text-align cannot move the box. */
.pro-hero-text { min-width: 0; scroll-snap-align: start; scroll-margin-top: 10px; text-align: center; }
/* Kronos halo breath — compositor-only (opacity+transform). The 0%/100%
   frame IS the designed still: under reduced motion the global clamp in
   pro.module.css settles it exactly here, a fixed soft mint aura. */
@keyframes heroKronosHalo {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50%      { opacity: 0.8;  transform: scale(1.07); }
}
/* Press acknowledgment is now owned SOLELY by the CTAButton atom (unified
   0.97 scale + brightness dip on house timing, identical across every CLAIM).
   The old .hero-cta-lockup !important override that forced 0.97 here is
   removed so the hero button no longer fights the atom's inline press. */
/* svh-fluid section padding with a vh fallback line (engines without svh
   must still get a bounded value, not a dropped declaration). */
.pro-hero-section {
  padding: clamp(18px, calc((100vh - 580px) * 0.45), 62px) 24px clamp(48px, calc((100vh - 530px) * 0.5), 84px) !important;
  padding: clamp(18px, calc((100svh - 580px) * 0.45), 62px) 24px clamp(48px, calc((100svh - 530px) * 0.5), 84px) !important;
}
.pro-hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  width: 100%;
  max-width: 380px;
  /* Interior rest point: a swipe that runs out of steam over the hero
     tail settles with the mockup centered instead of slicing the CTA
     card / mockup top. snap-stop stays default (normal) so a committed
     swipe still carries through to the next section. */
  scroll-snap-align: center;
}
@media (max-width: 640px) {
  /* Hero proof element — bleed most (not all) of the section's side
     padding so it reads as near full-width, while leaving a sliver of
     room for the glow behind it to actually show rather than being
     clipped by the viewport edge (html/body are overflow-x: hidden). */
  .pro-hero-visual {
    max-width: none;
    width: calc(100% + 32px);
    margin: 16px -16px 0;
    /* 8/24 (was 16/16): with the 16px top margin the phone had 32px of
       air above and 16 below — it sat low. Redistributing INSIDE the
       same 32px padding total keeps the element's height, box position,
       and snap-align:center rest byte-identical while landing the frame
       at 24px above / 24px below — centered in its envelope. */
    padding: 8px 0 24px;
  }
}
@media (min-width: 1024px) {
  .pro-hero-visual { max-width: 400px; margin: 0; justify-content: flex-end; }
}
.pro-hero-visual::before {
  content: '';
  position: absolute;
  inset: -10% -6% -10% -6%;
  background: radial-gradient(ellipse at center, rgba(92,224,184,0.22) 0%, rgba(92,224,184,0.07) 40%, transparent 70%);
  filter: blur(32px);
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s;
}
.pro-hero-visual.is-visible::before { opacity: 1; }
.pro-hero-ring {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
  pointer-events: none;
  opacity: 0.3;
}
/* Minimal CSS phone frame — dark bezel, rounded screen, no chrome.
   ONE layout at every viewport height (620–900+): a single 9/16 aspect
   whose WIDTH derives fluidly from 100svh, so shorter webviews get a
   proportionally smaller framed phone — never a different structure.
   The old max-height:700px aspect swap (9/19.5 ↔ 9/13.6) restructured
   the mockup mid-scroll when IG chrome collapsed; that class of bug is
   what this kills. */
.pro-phone-frame {
  position: relative;
  z-index: 1;
  width: min(100%, calc((100vh - 140px) * 0.5625));
  width: min(100%, calc((100svh - 140px) * 0.5625));
  margin: 0 auto;
  aspect-ratio: 9 / 16;
  background: linear-gradient(155deg, #1a1a1e 0%, #0a0a0c 60%);
  border-radius: clamp(32px, 11vw, 44px);
  padding: 12px;
  box-sizing: border-box;
  box-shadow:
    0 24px 48px rgba(0,0,0,0.5),
    0 0 40px rgba(92,224,184,0.18),
    inset 0 0 0 1px rgba(255,255,255,0.06);
}
.pro-phone-screen {
  container-type: inline-size;
  width: 100%;
  height: 100%;
  border-radius: clamp(22px, 8vw, 32px);
  background: #070510;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(92,224,184,0.15);
}
.pro-phone-btn {
  position: absolute;
  background: #232325;
  border-radius: 3px;
}
.pro-phone-btn--power { right: -2px; top: 20%; width: 3px; height: 64px; }
.pro-phone-btn--vol1  { left: -2px; top: 16%; width: 3px; height: 32px; }
.pro-phone-btn--vol2  { left: -2px; top: 24%; width: 3px; height: 32px; }
@media (prefers-reduced-motion: reduce) {
  .pro-hero-visual::before { opacity: 1 !important; transition: none !important; }
}
/* On desktop, dial headline down slightly so it lives alongside the
   mockup instead of pushing it off-screen. */
@media (min-width: 1024px) {
  .pro-hero-headline { font-size: clamp(64px, 8.5vw, 132px) !important; }
  .pro-hero-italic   { font-size: clamp(48px, 6.5vw, 100px) !important; }
}
/* In-app browser compression (Instagram/iOS webviews leave ~620-700px
   of usable height). TYPE TWEAKS ONLY — every structural rule (section
   padding, grid gap, mockup width, frame aspect/radius) is now fluid in
   the base styles, so crossing this boundary mid-scroll can no longer
   restructure the layout; it only nudges text rhythm. */
@media (max-height: 700px) {
  .pro-hero-headline { font-size: clamp(38px, 10.5vw, 56px) !important; line-height: 0.95 !important; }
  .pro-hero-italic { font-size: clamp(28px, 8vw, 42px) !important; margin: 0.08em 0 14px !important; }
  .pro-hero-sub { font-size: 14px !important; line-height: 1.45 !important; margin-bottom: 16px !important; }
  .pro-hero-trust { margin-bottom: 10px !important; }
  .pro-hero-annual { margin-bottom: 6px !important; }
}
`;

export default function HeroSection() {
  const [visualRef, visualInView] = useInView();
  const reducedMotion = usePrefersReducedMotion();
  const visualShown = reducedMotion || visualInView;

  return (
    <section
      className="pro-snap-section pro-hero-section"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />

      <div className="pro-hero-grid">
        <div className="pro-hero-text">
      {/* Kronos as the centerpiece — the ad's face, centered and sized up
          so he reads as the brand greeting, not a corner sticker. The
          breathing halo is a sibling OUTSIDE the drop-shadow filter (so
          the filter doesn't smear the gradient) and pulses on its own
          slower cadence than the float — two quiet, offset rhythms read
          as life, not looping. Reduced motion: float rests at its 0%
          pose, halo rests at its 0.45 frame — a composed, glowing still. */}
      <FadeUp delay={0.05}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", marginBottom: 4 }}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "-24%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(92,224,184,0.3) 0%, rgba(92,224,184,0.1) 52%, transparent 74%)",
                // BASE opacity = the animation's 0%/100% rest value. The
                // global reduced-motion clamp (pro.module.css) shortens the
                // animation but sets no fill-mode, so a stopped animation
                // reverts to THIS base — which must equal the rest keyframe
                // (same trick as kronosFloat's base transform:none matching
                // its rest pose). Without it the halo would rest at the CSS
                // default opacity:1, ~2× the intended glow, for reduce users.
                opacity: 0.45,
                animation: "heroKronosHalo 5.6s ease-in-out infinite",
                willChange: "transform, opacity",
                pointerEvents: "none",
              }}
            />
            <div
              className="pro-kronos-idle"
              style={{ position: "relative", filter: "drop-shadow(0 6px 22px rgba(92,224,184,0.32))" }}
            >
              <FlipCoyote mood="hyped" size={118} />
            </div>
          </div>
        </div>
      </FadeUp>
      {/* Eyebrow rides the same centerline directly under Kronos — one unit. */}
      <FadeUp delay={0.12}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Eyebrow text="— pro tier" color={C.mint} />
        </div>
      </FadeUp>

      {/* The headline arrives line-by-line on the house Reveal (260ms,
          --ease-out, 16px rise): setup lands, then the mint payoff lands
          its own beat 100ms later — one confident arrival, not a show.
          Reduced motion: Reveal renders both lines instantly at final
          position (shown = reduced, transition none). */}
      <FadeUp delay={0.18}>
        <h1
          className="pro-hero-headline"
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(64px,13vw,200px)",
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            color: "#fff",
            margin: 0,
          }}
        >
          KNOW WHAT IT&apos;S WORTH
        </h1>
      </FadeUp>
      <FadeUp delay={0.28}>
        {/* Line 2 — mint, ~75% size so it resolves as the payoff line rather
            than competing with the headline above. Static soft mint glow
            behind the glyphs for depth — no motion, no reduce branch needed. */}
        <p
          className="pro-hero-italic"
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(48px,9.75vw,150px)",
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
            fontStyle: "italic",
            color: C.mint,
            textShadow: "0 0 28px rgba(92,224,184,0.35)",
            margin: "0.1em 0 40px",
          }}
        >
          BEFORE YOU GRAB IT.
        </p>
      </FadeUp>

      <FadeUp delay={0.36}>
        <p
          className="pro-hero-sub"
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: "clamp(17px,2.2vw,24px)",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.65)",
            maxWidth: 620,
            margin: "0 auto 48px",
          }}
        >
          point your phone at anything in the bins. real comps in seconds. you&apos;ve already got
          the eye. this is the speed.
        </p>
      </FadeUp>

      <FadeUp delay={0.44}>
        {/* The offer as ONE composed unit on the centerline: right-sized
            CLAIM (the atom's fit-to-label default — the old width:100%
            override made it a slab in a detached outline box), price
            seated directly beneath as the button's caption, the annual
            plan elevated to a legible chip (it's the plan we want them
            on), trust row closing the frame. Handler, price strings, and
            plan logic untouched — recompose only. */}
        <div
          className="hero-cta-lockup"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            width: "100%",
            marginBottom: 18,
          }}
        >
          <CTAButton
            variant="primary"
            style={{ padding: "16px 44px", fontSize: 20 }}
            onClick={() => {
              track("pro_hero_cta_clicked", { location: "hero", plan_target: "pricing" });
              // Reduced-motion: instant jump, not an animated full-page scroll
              // (an explicit behavior:"smooth" overrides the CSS scroll-behavior
              // reduce override, so it must be guarded in JS).
              document.getElementById("pricing")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
            }}
          >
            CLAIM PRO
          </CTAButton>

          <div
            className="hero-price-stack"
            style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 5 }}
          >
            <span
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(30px,3.4vw,42px)",
                color: C.gold,
                lineHeight: 1,
              }}
            >
              $14.99
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              /mo
            </span>
          </div>

          {/* Annual alternative — elevated from dimmest-text-on-the-page to
              a quiet chip seated right under the monthly price. Same plan,
              same strings; SAVE $80 keeps the mint emphasis. */}
          <p
            className="pro-hero-annual"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              margin: 0,
              padding: "7px 14px",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 999,
            }}
          >
            <span>or</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.85)" }}>$99.99/yr</span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: "rgba(92,224,184,0.15)",
                border: `1px solid ${C.mint}`,
                color: C.mint,
                letterSpacing: "0.1em",
              }}
            >
              SAVE $80
            </span>
          </p>
        </div>

        {/* Money-back line — both silent objections ("what if it sucks" +
            "what if I'm trapped") answered right where the hero CLAIM
            happens, centered on the same axis. */}
        <div
          className="pro-hero-trust"
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            justifyContent: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            alignItems: "center",
            marginBottom: 0,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon size={14} color="rgba(92,224,184,0.8)" /> cancel anytime
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(92,224,184,0.9)" }}>
            <CheckIcon size={14} color="rgba(92,224,184,0.8)" /> 60-day money-back
          </span>
        </div>
      </FadeUp>
        </div>

        {/* Product visualization — a live-rendered verdict card, not a photo.
            Slightly stronger entrance (scale + glow bloom) since this is the
            anchor moment of the page. */}
        <div
          ref={visualRef}
          className={`pro-hero-visual${visualShown ? " is-visible" : ""}`}
          style={{
            opacity: visualShown ? 1 : 0,
            transform: visualShown ? "scale(1)" : "scale(0.96)",
            transition: reducedMotion
              ? "none"
              : "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Faint Saturn-ring motif ties the proof shot back to the
              brand's cosmic system — same ellipse-ring language as the
              closer's background decoration, just quieter here. */}
          <div className="pro-hero-ring" aria-hidden="true">
            <svg viewBox="0 0 400 400" style={{ width: "140%", height: "140%" }}>
              <ellipse cx="200" cy="200" rx="190" ry="52" stroke={C.mint} strokeWidth="0.6" fill="none" />
              <ellipse cx="200" cy="200" rx="160" ry="42" stroke={C.mint} strokeWidth="0.4" fill="none" opacity="0.6" />
            </svg>
          </div>

          <div className="pro-phone-frame">
            <div className="pro-phone-screen">
              <VerdictCardLive />
            </div>
            <div className="pro-phone-btn pro-phone-btn--power" aria-hidden="true" />
            <div className="pro-phone-btn pro-phone-btn--vol1" aria-hidden="true" />
            <div className="pro-phone-btn pro-phone-btn--vol2" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
