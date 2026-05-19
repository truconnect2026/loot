"use client";

import FlipCoyote from "@/components/shared/FlipCoyote";
import { FontLoader, SaturnGlyph, ScreenFrame, TOKENS } from "../_frame";

export default function FlipOrSkipGameScreen() {
  return (
    <ScreenFrame>
      <FontLoader />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 18,
          right: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SaturnGlyph size={18} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            FLIP OR SKIP
          </span>
        </div>
        <span
          className="ms-mono"
          style={{
            fontSize: 12,
            color: TOKENS.mint,
            fontWeight: 700,
          }}
        >
          #142
        </span>
      </div>

      {/* Day strip */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 18,
          right: 18,
        }}
      >
        <div
          className="ms-mono"
          style={{
            fontSize: 10,
            color: TOKENS.mint,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Day 142.
        </div>
        <div
          aria-hidden
          style={{
            height: 1,
            background: TOKENS.mint,
            opacity: 0.3,
            marginTop: 8,
          }}
        />
      </div>

      {/* Flip + speech bubble */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 12,
          right: 18,
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <FlipCoyote mood="smirk" size={150} />
        <div style={{ paddingTop: 26, flex: 1, position: "relative" }}>
          <div
            style={{
              position: "relative",
              padding: "10px 12px",
              border: `1px solid ${TOKENS.mint}`,
              background: "rgba(0,0,0,0.85)",
              color: TOKENS.mint,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 13,
              minHeight: 44,
              maxWidth: 200,
              lineHeight: 1.4,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 1,
                border: "1px solid rgba(92, 224, 184, 0.4)",
                pointerEvents: "none",
              }}
            />
            Aight whatchu got.
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: 6,
                bottom: 4,
                color: TOKENS.mint,
                fontSize: 10,
                letterSpacing: "0.1em",
                opacity: 0.7,
              }}
            >
              •
            </span>
            <svg
              style={{ position: "absolute", left: -14, top: 12 }}
              width="16"
              height="18"
              viewBox="0 0 16 18"
              aria-hidden
            >
              <path
                d="M 14 2 A 18 6 -23 0 0 0 9"
                fill="none"
                stroke={TOKENS.mint}
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Today's Drop card */}
      <div
        style={{
          position: "absolute",
          top: 296,
          left: 18,
          right: 18,
          border: "1px solid rgba(92, 224, 184, 0.4)",
          padding: "14px 14px",
        }}
      >
        <div
          className="ms-mono"
          style={{
            fontSize: 10,
            color: TOKENS.mint,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Today&apos;s Drop
        </div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 600,
            lineHeight: 1.15,
            marginBottom: 4,
            color: "#fff",
          }}
        >
          Pyrex Butterprint 403 Cinderella
        </div>
        <div
          className="ms-mono"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            marginBottom: 10,
          }}
        >
          1957–68 · Pyrex
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          Turquoise farm scene. Mixing bowl. Thrift shelf staple.
        </div>
        <div
          className="ms-mono"
          style={{
            fontSize: 11,
            color: TOKENS.mint,
          }}
        >
          Condition: Clean, no chips
        </div>
      </div>

      {/* CALL IT button */}
      <div
        className="ms-pulse"
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 528,
          padding: "16px 0",
          background: TOKENS.mint,
          color: "#000",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.15em",
          textAlign: "center",
        }}
      >
        CALL IT
      </div>

      {/* Bottom rule */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 36,
        }}
      >
        <div
          className="ms-mono"
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            letterSpacing: "0.08em",
          }}
        >
          one item · three guesses · one shot
        </div>
      </div>
    </ScreenFrame>
  );
}
