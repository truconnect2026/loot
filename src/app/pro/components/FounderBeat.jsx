"use client";

import { C } from "../lib/colors.js";
import {
  Eyebrow,
  FadeUp,
  SECTION_BODY_SIZE,
  SECTION_HEADLINE_STYLE,
  SECTION_PADDING,
  SectionShell,
} from "./atoms.jsx";
import FlipCoyote from "@/components/shared/FlipCoyote";

// THE HUMAN — turns faceless SaaS into a peer's tool. Real and honest: one
// solo maker built loot because guessing at resale value costs real money,
// and built it for resellers — not for VCs, not to harvest data. Kronos (the
// brand's face) fronts the maker's voice so this ships now without needing a
// personal photo (an optional real-asset slot, flagged below). "smirk" — the
// knowing, been-there flipper look, distinct from the hero/closer "hyped".
// Short by design: it humanizes, it does not delay the buy. Entrance is the
// shared FadeUp; reduced motion renders the end-state (static Kronos PNG).
export default function FounderBeat() {
  return (
    <section
      className="pro-snap-section"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: SECTION_PADDING,
        position: "relative",
        zIndex: 1,
      }}
    >
      <SectionShell maxWidth={620}>
        <FadeUp>
          <Eyebrow text="— why i built this" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.12}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <FlipCoyote mood="smirk" size={92} />
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <h2
            style={{
              ...SECTION_HEADLINE_STYLE,
              textAlign: "center",
              paddingBottom: "0.25em",
              marginBottom: 16,
            }}
          >
            BUILT BY A FLIPPER. <span style={{ color: C.mint }}>NOT A BOARDROOM.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: SECTION_BODY_SIZE,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.6,
              textAlign: "center",
              margin: "0 0 20px",
            }}
          >
            one person builds loot. i made it because guessing at resale value costs real money &mdash; the
            bad buys, the dead stock, the good ones you walk right past. so i built the tool i wanted in the
            aisle: point, get real numbers, decide.
          </p>
        </FadeUp>

        {/* "no data selling" elevated from an FAQ answer to a stated VALUE —
            resellers are burned by apps that sell their behavior. Honest: the
            app already doesn't, and there's no investor pushing it to. */}
        <FadeUp delay={0.4}>
          <p
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: 15,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
              textAlign: "center",
              margin: "0 0 22px",
            }}
          >
            no investors telling me to juice engagement.{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>
              your scans and hauls stay yours &mdash; i don&apos;t sell your behavior to anyone.
            </span>
          </p>
        </FadeUp>

        <FadeUp delay={0.48}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {["solo-built", "for resellers", "no data selling", "no vc"].map((chip) => (
              <span
                key={chip}
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(92,224,184,0.85)",
                  border: "1px solid rgba(92,224,184,0.3)",
                  background: "rgba(92,224,184,0.05)",
                  borderRadius: 999,
                  padding: "6px 12px",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </FadeUp>

        {/* REAL-ASSET SLOT (David, OPTIONAL): a real founder photo/handle can
            replace the Kronos avatar above, or sit here as a signature line
            (e.g. "— David · building loot solo to fund robotics work"). Left
            Kronos-fronted for now; it ships and stands on its own. */}
      </SectionShell>
    </section>
  );
}
