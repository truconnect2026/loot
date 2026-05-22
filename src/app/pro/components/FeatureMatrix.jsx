"use client";

import { useState } from "react";
import { C } from "../lib/colors.js";
import { CheckIcon, Eyebrow, FadeUp } from "./atoms.jsx";

const featureRows = [
  { f: "Daily scans", free: "3", pro: "Unlimited", a: "mint" },
  { f: "AI vision identification", free: "check", pro: "check", a: null },
  { f: "Live eBay sold comps", free: "Limited", pro: "Real-time", a: "mint" },
  { f: "FLIP OR SKIP daily game", free: "check", pro: "check", a: null },
  { f: "Haul tracking", free: "Last 7 days", pro: "Full history", a: "mint" },
  { f: "Yard sale map", free: "—", pro: "Live + alerts", a: "gold" },
  { f: "BOLO alerts", free: "—", pro: "Push + email", a: "gold" },
  { f: "Price trend graphs", free: "—", pro: "90-day history", a: "gold" },
  { f: "Brand authenticator", free: "—", pro: "AI-powered", a: "gold" },
  { f: "Export to spreadsheet", free: "—", pro: "CSV / Sheets", a: "gold" },
  { f: "Community BOLO feed", free: "Read-only", pro: "Post + react", a: "mint" },
  { f: "Priority support", free: "—", pro: "24h response", a: "gold" },
];

const thBase = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "16px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.4)",
  textAlign: "center",
};
const tdBase = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 13,
  padding: "14px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  verticalAlign: "middle",
};

function accentClr(a) {
  return a === "gold" ? C.gold : a === "mint" ? C.mint : "#fff";
}

export default function FeatureMatrix() {
  const [hov, setHov] = useState(-1);
  return (
    <section style={{ padding: "clamp(80px,10vw,128px) 24px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <FadeUp>
          <Eyebrow text="the whole arsenal" color={C.gold} />
        </FadeUp>

        <FadeUp delay={0.15}>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px,9vw,96px)",
              lineHeight: 1.3,
              paddingBottom: "0.5em",
              marginBottom: 48,
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
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }} role="table">
              <thead>
                <tr>
                  <th style={{ ...thBase, textAlign: "left", width: "50%" }}>FEATURE</th>
                  <th style={{ ...thBase, width: "25%" }}>FREE</th>
                  <th style={{ ...thBase, width: "25%", color: C.gold }}>PRO</th>
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
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: r.a === "gold" ? 600 : 400,
                        color: r.a === "gold" ? C.gold : "rgba(255,255,255,0.75)",
                      }}
                    >
                      {r.f}
                    </td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "center",
                        color: r.free === "—" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {r.free === "check" ? <CheckIcon color="rgba(255,255,255,0.45)" /> : r.free}
                    </td>
                    <td
                      style={{
                        ...tdBase,
                        textAlign: "center",
                        color: r.a ? accentClr(r.a) : "#fff",
                        fontWeight: r.a ? 700 : 400,
                      }}
                    >
                      {r.pro === "check" ? <CheckIcon color={r.a ? accentClr(r.a) : "#fff"} /> : r.pro}
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
