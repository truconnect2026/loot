"use client";

import { useState } from "react";
import { C } from "../lib/colors.js";
import { CheckIcon, Eyebrow, FadeUp } from "./atoms.jsx";

// FREE tier is the daily FLIP OR SKIP game only — no scans, no comps, no
// alerts. Verified against FREE_SCAN_LIMIT = 0 in src/lib/limits.ts: a
// non-Pro user hitting /api/scan or /api/shelf-scan always gets 403.
// Every PRO cell is mint (the "yes" signal); gold is reserved for the PRO
// column header / section emphasis only, not sprinkled per row.
const featureRows = [
  { f: "FLIP OR SKIP daily game", free: "check", pro: "check" },
  { f: "Daily scans", free: "—", pro: "Unlimited" },
  { f: "AI vision identification", free: "—", pro: "check" },
  { f: "Live eBay sold comps", free: "—", pro: "Real-time" },
  { f: "Haul tracking", free: "—", pro: "Full history" },
  { f: "Yard sale map", free: "—", pro: "Live + alerts" },
  { f: "BOLO alerts", free: "—", pro: "Push + email" },
  { f: "Price trend graphs", free: "—", pro: "90-day history" },
  { f: "Brand authenticator", free: "—", pro: "AI-powered" },
  { f: "Export to spreadsheet", free: "—", pro: "CSV / Sheets" },
  { f: "Community BOLO feed", free: "—", pro: "Post + react" },
  { f: "Priority support", free: "—", pro: "24h response" },
];

const thBase = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "14px 6px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.4)",
  textAlign: "center",
};
const tdBase = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: "clamp(11px,3vw,13px)",
  padding: "12px 6px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  verticalAlign: "middle",
};

export default function FeatureMatrix() {
  const [hov, setHov] = useState(-1);
  return (
    <section
      className="pro-snap-section"
      style={{ padding: "clamp(52px,6.5vw,84px) 24px", position: "relative", zIndex: 1 }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="the whole arsenal" color={C.gold} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: 40,
            }}
          >
            FREE VS <span style={{ color: C.gold }}>PRO.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              borderRadius: 14,
            }}
          >
            {/* No forced minWidth — both columns must fit and stay legible
                at 375px without needing to scroll the table sideways. */}
            <table style={{ width: "100%", borderCollapse: "collapse" }} role="table">
              <thead>
                <tr>
                  <th style={{ ...thBase, textAlign: "left", width: "44%" }}>FEATURE</th>
                  <th style={{ ...thBase, width: "26%" }}>FREE</th>
                  <th style={{ ...thBase, width: "30%", color: C.gold }}>PRO</th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((r, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHov(i)}
                    onMouseLeave={() => setHov(-1)}
                    style={{
                      background: hov === i ? "rgba(255,255,255,0.025)" : "transparent",
                      transition: "background 0.2s",
                    }}
                  >
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "left",
                        fontFamily: "var(--font-manrope), sans-serif",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.78)",
                      }}
                    >
                      {r.f}
                    </td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "center",
                        color: r.free === "—" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {r.free === "check" ? <CheckIcon color="rgba(255,255,255,0.6)" /> : r.free}
                    </td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "center",
                        color: C.mint,
                        fontWeight: 700,
                      }}
                    >
                      {r.pro === "check" ? <CheckIcon color={C.mint} /> : r.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
