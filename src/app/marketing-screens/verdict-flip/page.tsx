"use client";

import FlipCoyote from "@/components/shared/FlipCoyote";
import {
  FontLoader,
  PyrexBowl,
  SaturnGlyph,
  ScreenFrame,
  TOKENS,
} from "../_frame";

export default function VerdictFlipScreen() {
  return (
    <ScreenFrame>
      <FontLoader />

      {/* Top bar — back chevron + puzzle id */}
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
          <SaturnGlyph size={14} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: TOKENS.mint,
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

      {/* Floating Flip — hyped, top-right */}
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 12,
          zIndex: 6,
        }}
      >
        <FlipCoyote mood="hyped" size={72} />
      </div>

      {/* Item Card */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 18,
          right: 18,
          border: "1px solid rgba(92, 224, 184, 0.3)",
          background: "linear-gradient(180deg, #07120e 0%, #050b09 100%)",
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
          PYREX BUTTERPRINT 403
        </div>
        <div
          className="ms-mono"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            marginTop: 4,
          }}
        >
          1957–68 · Pyrex
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
          <PyrexBowl size={180} />
        </div>
      </div>

      {/* Verdict pill */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 18,
          right: 18,
          background: TOKENS.mint,
          padding: "16px 0",
          textAlign: "center",
          color: "#000",
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
          🐺 FLIP
        </div>
      </div>

      {/* Profit math row */}
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
          $4
        </span>
        <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
          <path
            d="M2 10 H24 M18 4 L26 10 L18 16"
            stroke={TOKENS.mint}
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
            color: TOKENS.mint,
          }}
        >
          $85
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
          { label: "BUY", value: "$4" },
          { label: "RESELL", value: "$85" },
          { label: "ROI", value: "21×" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              className="ms-mono"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: TOKENS.mint,
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
            background: TOKENS.mint,
            opacity: 0.4,
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
          <SaturnGlyph size={12} />
          <span
            className="ms-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: TOKENS.mint,
              fontWeight: 600,
            }}
          >
            FLIP&apos;S BOLO
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
          Butterprint 403s clearing $80–95. Cinderella handle = the move.
        </div>
      </div>

      {/* CTA strip */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 22,
          padding: "12px 0",
          textAlign: "center",
          border: `1px solid ${TOKENS.mint}`,
          color: TOKENS.mint,
          fontSize: 12,
          letterSpacing: "0.2em",
          fontWeight: 600,
        }}
      >
        LIST IT NOW →
      </div>
    </ScreenFrame>
  );
}
