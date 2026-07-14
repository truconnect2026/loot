"use client";

import FlipCoyote from "@/components/shared/FlipCoyote";
import {
  CeramicBird,
  FontLoader,
  SaturnGlyph,
  ScreenFrame,
  TOKENS,
} from "../_frame";

export default function VerdictSkipScreen() {
  return (
    <ScreenFrame>
      <FontLoader />

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 0,
          right: 0,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 3,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18l-6-6 6-6"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SaturnGlyph size={14} color={TOKENS.red} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: TOKENS.red,
              fontWeight: 600,
            }}
          >
            VERDICT
          </span>
        </div>
        <span
          className="ms-mono"
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          #1042
        </span>
      </div>

      {/* Floating Flip — dead mood, top-right */}
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 12,
          zIndex: 6,
        }}
      >
        <FlipCoyote mood="dead" size={72} />
      </div>

      {/* Item Card */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 18,
          right: 18,
          border: "1px solid rgba(255, 107, 107, 0.3)",
          background: "linear-gradient(180deg, #120808 0%, #0a0505 100%)",
          padding: "16px 14px 14px",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.1,
            color: "#fff",
            paddingRight: 60,
          }}
        >
          MILLER STUDIO CERAMIC BIRD
        </div>
        <div
          className="ms-mono"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            marginTop: 4,
          }}
        >
          1970s · Mass-produced
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 14,
            marginBottom: 6,
            height: 170,
          }}
        >
          <CeramicBird size={153} />
        </div>
      </div>

      {/* Verdict pill */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 18,
          right: 18,
          background: TOKENS.red,
          padding: "16px 0",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          💀 SKIP
        </div>
      </div>

      {/* Profit math row — negative */}
      <div
        style={{
          position: "absolute",
          top: 472,
          left: 18,
          right: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <span
          className="ms-mono"
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          $8
        </span>
        <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
          <path
            d="M2 10 H24 M18 4 L26 10 L18 16"
            stroke={TOKENS.red}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="ms-mono"
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: TOKENS.red,
          }}
        >
          $4
        </span>
      </div>

      {/* Stats row */}
      <div
        style={{
          position: "absolute",
          top: 530,
          left: 18,
          right: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "14px 0",
        }}
      >
        {[
          { label: "BUY", value: "$8" },
          { label: "RESELL", value: "$4" },
          { label: "ROI", value: "0.5×" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              className="ms-mono"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: TOKENS.red,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              className="ms-mono"
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.2em",
                marginTop: 6,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* BOLO callout */}
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 18,
          right: 18,
        }}
      >
        <div
          aria-hidden
          style={{
            height: 1,
            background: TOKENS.red,
            opacity: 0.45,
            marginBottom: 12,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <SaturnGlyph size={12} color={TOKENS.red} />
          <span
            className="ms-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: TOKENS.red,
              fontWeight: 600,
            }}
          >
            KRONOS&apos; BOLO
          </span>
        </div>
        <div
          className="ms-mono"
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.5,
          }}
        >
          Mass-produced. Flooded market. Walk away.
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 22,
          padding: "12px 0",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "rgba(255,255,255,0.65)",
          fontSize: 12,
          letterSpacing: "0.2em",
          fontWeight: 600,
        }}
      >
        SCAN NEXT →
      </div>
    </ScreenFrame>
  );
}
