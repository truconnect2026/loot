"use client";

import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

const SUPPORT_EMAIL = "lootworks.goflip@gmail.com";

export default function SupportContact() {
  return (
    <section style={{ padding: "clamp(48px,8vw,80px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <FadeUp>
          <Eyebrow text="affiliate support" color={C.purple} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <div
            style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "0 0 8px" }}>
              Email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                style={{ color: C.mint, textDecoration: "underline" }}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p
              style={{
                margin: "0 0 8px",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
              }}
            >
              We respond within 24h. Real humans.
            </p>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.5)",
                fontSize: 14,
              }}
            >
              Need custom creative or co-marketing? Hit us up.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
