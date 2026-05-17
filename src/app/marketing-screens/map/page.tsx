"use client";

import { FontLoader, ScreenFrame, TabBar, TOKENS } from "../_frame";

type Pin = {
  x: number;
  y: number;
  hot?: boolean;
  selected?: boolean;
};

const PINS: Pin[] = [
  { x: 80, y: 230 },
  { x: 160, y: 180, hot: true },
  { x: 230, y: 260 },
  { x: 90, y: 380 },
  { x: 200, y: 350, hot: true, selected: true },
  { x: 300, y: 420 },
  { x: 140, y: 480 },
  { x: 280, y: 560 },
];

export default function MapScreen() {
  return (
    <ScreenFrame>
      <FontLoader />

      {/* Map background (dark + suggestive grid) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "#0a0d0c",
        }}
      />

      {/* Vector road network */}
      <svg
        width="390"
        height="844"
        viewBox="0 0 390 844"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Land blocks for depth */}
        <rect x="0" y="0" width="390" height="844" fill="#0a0d0c" />
        <path
          d="M 0 200 Q 100 220 200 200 T 390 210 L 390 280 Q 280 260 180 280 T 0 270 Z"
          fill="#10140f"
          opacity="0.7"
        />
        <path
          d="M 0 500 Q 120 480 220 510 T 390 490 L 390 580 Q 250 600 130 580 T 0 590 Z"
          fill="#10140f"
          opacity="0.7"
        />
        {/* River/highway curve */}
        <path
          d="M -20 420 Q 80 380 180 420 T 410 410"
          stroke="#2a3030"
          strokeWidth="6"
          fill="none"
          opacity="0.55"
        />

        {/* Horizontal roads */}
        {[180, 260, 340, 420, 500, 580, 660].map((y) => (
          <line
            key={`h${y}`}
            x1="0"
            y1={y}
            x2="390"
            y2={y}
            stroke="#2c3230"
            strokeWidth={y === 420 ? 0 : 1.2}
            opacity="0.7"
          />
        ))}
        {/* Vertical roads */}
        {[60, 130, 200, 270, 330].map((x) => (
          <line
            key={`v${x}`}
            x1={x}
            y1="160"
            x2={x}
            y2="700"
            stroke="#2c3230"
            strokeWidth="1.2"
            opacity="0.7"
          />
        ))}
        {/* Diagonal main road */}
        <line
          x1="20"
          y1="700"
          x2="370"
          y2="220"
          stroke="#363c39"
          strokeWidth="2.5"
          opacity="0.8"
        />
      </svg>

      {/* Compass / scale chip */}
      <div
        style={{
          position: "absolute",
          right: 14,
          top: 130,
          padding: "4px 8px",
          background: "rgba(10, 10, 10, 0.7)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <span
          className="ms-mono"
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.16em",
          }}
        >
          5 MI
        </span>
      </div>

      {/* Pins */}
      {PINS.map((p, i) => {
        const r = p.hot ? 11 : 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x - r,
              top: p.y - r,
              width: r * 2,
              height: r * 2,
              zIndex: p.selected ? 5 : 3,
            }}
          >
            {p.hot && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle, rgba(92,224,184,0.45) 0%, rgba(92,224,184,0) 70%)",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                background: TOKENS.mint,
                border: p.selected ? "2px solid #fff" : "1.5px solid #07120e",
                boxShadow: p.hot
                  ? `0 0 12px ${TOKENS.mint}`
                  : "0 1px 3px rgba(0,0,0,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: r * 0.7,
                height: r * 0.7,
                borderRadius: 999,
                background: "#07120e",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        );
      })}

      {/* Search bar */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 18,
          right: 18,
          padding: "12px 14px",
          background: "rgba(10, 10, 10, 0.78)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(92, 224, 184, 0.25)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 4,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
            stroke={TOKENS.mint}
            strokeWidth="1.8"
          />
          <line
            x1="15.5"
            y1="15.5"
            x2="20"
            y2="20"
            stroke={TOKENS.mint}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="ms-mono"
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Within 5 mi · McDonough, GA
        </span>
      </div>

      {/* Stats row under search */}
      <div
        style={{
          position: "absolute",
          top: 78,
          left: 18,
          right: 18,
          display: "flex",
          gap: 8,
          zIndex: 4,
        }}
      >
        {[
          { label: "HOT", value: "2" },
          { label: "TODAY", value: "8" },
          { label: "AVG ROI", value: "12×" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              padding: "6px 8px",
              background: "rgba(10, 10, 10, 0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            <div
              className="ms-mono"
              style={{
                fontSize: 14,
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
                fontSize: 8,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.18em",
                marginTop: 3,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Selected pin card — anchored to the selected pin */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 420,
          padding: "12px 14px",
          background: "#07120e",
          border: `1px solid ${TOKENS.mint}`,
          zIndex: 6,
        }}
      >
        {/* Connector line from pin */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 182,
            top: -38,
            width: 1,
            height: 38,
            background: TOKENS.mint,
            opacity: 0.55,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              className="ms-mono"
              style={{
                fontSize: 9,
                color: TOKENS.mint,
                letterSpacing: "0.2em",
                marginBottom: 4,
              }}
            >
              🔥 HOT PIN · 0.6 MI
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: 4,
              }}
            >
              Saturday Estate Sale
            </div>
            <div
              className="ms-mono"
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.4,
              }}
            >
              8am–2pm · Vintage, tools, vinyl
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            padding: "10px 0",
            textAlign: "center",
            background: TOKENS.mint,
            color: "#000",
            fontSize: 11,
            letterSpacing: "0.22em",
            fontWeight: 700,
          }}
        >
          DIRECTIONS →
        </div>
      </div>

      <TabBar active="map" />
    </ScreenFrame>
  );
}
