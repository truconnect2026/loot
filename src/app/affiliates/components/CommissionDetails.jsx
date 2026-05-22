"use client";

import { C } from "../../pro/lib/colors.js";
import { Eyebrow, FadeUp } from "../../pro/components/atoms.jsx";

const INFO_GRID = [
  { label: "COOKIE WINDOW", value: "60 DAYS", color: "mint" },
  { label: "PAYOUT METHOD", value: "PayPal / Bank / Check via Digistore", color: "white" },
  { label: "PAYOUT THRESHOLD", value: "$50", color: "mint" },
  { label: "PAYOUT FREQUENCY", value: "WEEKLY", color: "mint" },
  { label: "REFUND CLAWBACK", value: "Yes — standard 7-day window applies", color: "muted" },
];

const colorFor = (key) =>
  key === "mint" ? C.mint : key === "muted" ? "rgba(255,255,255,0.6)" : "#fff";

const thBase = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  padding: "16px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.5)",
  textAlign: "left",
};

const tdBase = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 14,
  padding: "16px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
};

export default function CommissionDetails() {
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="the numbers" color={C.mint} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.0,
              margin: "0 0 40px",
            }}
          >
            WHAT YOU <span style={{ color: C.mint }}>EARN.</span>
          </h2>
        </FadeUp>

        {/* Data table */}
        <FadeUp delay={0.25}>
          <div
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              border: "1px solid rgba(92,224,184,0.25)",
              borderRadius: 14,
              background: C.card,
              marginBottom: 32,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }} role="table">
              <thead>
                <tr>
                  <th style={thBase}>PLAN</th>
                  <th style={thBase}>CUSTOMER PAYS</th>
                  <th style={{ ...thBase, color: C.gold }}>YOUR COMMISSION</th>
                  <th style={thBase}>RECURRING</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdBase, color: "#fff", fontWeight: 700 }}>Monthly</td>
                  <td style={tdBase}>$14.99/mo</td>
                  <td style={{ ...tdBase, color: C.gold, fontWeight: 700, fontSize: 18 }}>$5.99/mo</td>
                  <td style={{ ...tdBase, color: C.mint }}>YES — every month</td>
                </tr>
                <tr>
                  <td style={{ ...tdBase, color: "#fff", fontWeight: 700 }}>Annual</td>
                  <td style={tdBase}>$99.99/yr</td>
                  <td style={{ ...tdBase, color: C.gold, fontWeight: 700, fontSize: 18 }}>$39.99/yr</td>
                  <td style={{ ...tdBase, color: C.mint }}>YES — every year</td>
                </tr>
              </tbody>
            </table>
          </div>
        </FadeUp>

        <FadeUp delay={0.35}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {INFO_GRID.map((row, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 8,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontFamily:
                      row.color === "mint"
                        ? "var(--font-bebas), sans-serif"
                        : "var(--font-mono), monospace",
                    fontSize: row.color === "mint" ? 28 : 13,
                    fontWeight: row.color === "mint" ? 400 : 500,
                    lineHeight: 1.3,
                    color: colorFor(row.color),
                    letterSpacing: row.color === "mint" ? "0.02em" : "0.02em",
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
