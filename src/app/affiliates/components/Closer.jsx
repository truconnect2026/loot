"use client";

import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

const DIGISTORE_SIGNUP = "https://digistore24.com/signup/691098/";

const STEPS = [
  { n: "1", body: "Sign up via Digistore", link: DIGISTORE_SIGNUP, linkLabel: "(takes ~2 min)" },
  { n: "2", body: "Grab your unique link from the Digistore dashboard" },
  { n: "3", body: "Start posting. We'll do the rest." },
];

export default function Closer() {
  return (
    <section
      style={{
        padding: "clamp(96px,12vw,160px) 24px",
        position: "relative",
        zIndex: 1,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="get started" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              color: "#fff",
              margin: "0 0 40px",
            }}
          >
            READY TO <span style={{ color: C.mint }}>PRINT?</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div
            style={{
              background: "rgba(92,224,184,0.04)",
              border: `1px solid ${C.mint}`,
              borderRadius: 20,
              padding: "clamp(28px,4vw,40px)",
              textAlign: "left",
              boxShadow: "0 0 40px rgba(92,224,184,0.12)",
            }}
          >
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 28px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: "var(--font-bebas), sans-serif",
                      fontSize: 36,
                      color: C.mint,
                      lineHeight: 1,
                      width: 36,
                      flexShrink: 0,
                    }}
                  >
                    {s.n}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-manrope), sans-serif",
                      fontSize: 16,
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.5,
                      paddingTop: 6,
                    }}
                  >
                    {s.body}
                    {s.link && (
                      <>
                        {" "}
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.mint, textDecoration: "underline" }}
                        >
                          {s.linkLabel}
                        </a>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>

            <a
              href={DIGISTORE_SIGNUP}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: 28,
                letterSpacing: "0.04em",
                background: "linear-gradient(180deg, #6FE5C0 0%, #5CE0B8 100%)",
                color: C.bg,
                textDecoration: "none",
                padding: "22px 32px",
                borderRadius: 6,
                borderTop: "1px solid rgba(255,255,255,0.3)",
                boxShadow:
                  "0 12px 48px rgba(92,224,184,0.4), inset 0 0 0 1px rgba(92,224,184,0.3)",
                animation: "pulseGlow 3s ease-in-out infinite",
                transition: "transform 0.15s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              JOIN THE PROGRAM →
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
