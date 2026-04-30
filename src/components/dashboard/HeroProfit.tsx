"use client";

import { useState } from "react";
import AnimNum from "@/components/shared/AnimNum";

export type HeroPeriod = "today" | "week" | "month" | "all";

interface HeroProfitProps {
  todayProfit: number;
  yesterdayProfit: number;
  weekProfit: number;
  monthProfit: number;
  allTimeProfit: number;
  todayScans: number;
  todayBuys: number;
  todaySpent: number;
  /** Daily profit, oldest first, length 7. Powers the sparkline. */
  dailyProfitHistory: number[];
  /** When true, show shimmer skeletons in place of the hero number. */
  loading?: boolean;
}

interface PillProps {
  label: string;
  active: boolean;
  onTap: () => void;
}

function Pill({ label, active, onTap }: PillProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        backgroundColor: active ? "rgba(92,224,184,0.10)" : "transparent",
        border: active
          ? "1px solid rgba(92,224,184,0.15)"
          : "1px solid transparent",
        color: active ? "#5CE0B8" : "#5A4E70",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontWeight: 500,
        fontSize: 9,
        letterSpacing: "0.04em",
        cursor: "pointer",
        transform: pressed ? "scale(0.95)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {label}
    </button>
  );
}

const PERIOD_LABEL: Record<HeroPeriod, string> = {
  today: "TODAY'S PROFIT",
  week: "THIS WEEK",
  month: "THIS MONTH",
  all: "ALL TIME",
};

function Sparkline({ values }: { values: number[] }) {
  const W = 100; // viewBox width units
  const H = 28;
  const pad = 2;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const allFlat = max === min;

  const x = (i: number) =>
    values.length <= 1
      ? W / 2
      : (i / (values.length - 1)) * (W - pad * 2) + pad;
  const y = (v: number) => {
    if (allFlat) return H - pad;
    const t = (v - min) / (max - min);
    return H - pad - t * (H - pad * 2);
  };

  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  const areaPath =
    values.length === 0
      ? ""
      : `${linePath} L ${x(values.length - 1).toFixed(2)} ${H} L ${x(0).toFixed(2)} ${H} Z`;

  if (allFlat) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 28, display: "block" }}
        aria-hidden="true"
      >
        <line
          x1={pad}
          x2={W - pad}
          y1={H - pad}
          y2={H - pad}
          stroke="#5A4E70"
          strokeOpacity={0.2}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 28, display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5CE0B8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#5CE0B8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkArea)" />
      <path
        d={linePath}
        fill="none"
        stroke="#5CE0B8"
        strokeOpacity={0.4}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        // vector-effect keeps the line visually 1.5px even though the SVG
        // is non-uniformly scaled by preserveAspectRatio="none".
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface DeltaInfo {
  text: string;
  positive: boolean;
}

function deltaFor(period: HeroPeriod, props: HeroProfitProps): DeltaInfo | null {
  if (period === "today") {
    if (props.yesterdayProfit === 0 && props.todayProfit === 0) return null;
    const diff = props.todayProfit - props.yesterdayProfit;
    if (diff === 0 && props.yesterdayProfit === 0) return null;
    const sign = diff >= 0 ? "+" : "−";
    return {
      text: `${sign}$${Math.abs(diff)} vs yesterday`,
      positive: diff >= 0,
    };
  }
  if (period === "week") {
    // Compare current week to its 7-day baseline (history sum minus today).
    const history7 = props.dailyProfitHistory.reduce((a, b) => a + b, 0);
    const previousPeriod = history7 - props.todayProfit;
    if (previousPeriod <= 0) return null;
    const pct = Math.round(
      ((props.weekProfit - previousPeriod) / previousPeriod) * 100
    );
    if (Number.isNaN(pct)) return null;
    const sign = pct >= 0 ? "+" : "−";
    return {
      text: `${sign}${Math.abs(pct)}% vs last week`,
      positive: pct >= 0,
    };
  }
  return null;
}

export default function HeroProfit(props: HeroProfitProps) {
  const [period, setPeriod] = useState<HeroPeriod>("today");

  const profit =
    period === "today"
      ? props.todayProfit
      : period === "week"
        ? props.weekProfit
        : period === "month"
          ? props.monthProfit
          : props.allTimeProfit;

  const isZero = profit === 0;
  const isNegative = profit < 0;

  const profitColor = isNegative
    ? "#E8636B"
    : isZero
      ? "#5A4E70"
      : "#5CE0B8";
  const profitGlow = isNegative
    ? "0 0 32px rgba(232,99,107,0.15)"
    : isZero
      ? "none"
      : "0 0 32px rgba(92,224,184,0.15)";

  const delta = deltaFor(period, props);

  return (
    <div
      style={{
        // Glass surface with the lit-from-above gradient on top — this is
        // the single most prominent element on the dashboard.
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%), rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.2), 0 8px 24px -4px rgba(0,0,0,0.3)",
        padding: 20,
      }}
    >
      {/* Two-line period header — label on its own line, pills on the next.
          Stacking them avoids horizontal cramping on narrow phones. */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontWeight: 500,
          fontSize: 8,
          letterSpacing: "0.12em",
          color: "#5A4E70",
          textTransform: "uppercase",
          textAlign: "left",
        }}
      >
        {PERIOD_LABEL[period]}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-start" }}>
        <Pill label="Today" active={period === "today"} onTap={() => setPeriod("today")} />
        <Pill label="Week" active={period === "week"} onTap={() => setPeriod("week")} />
        <Pill label="Month" active={period === "month"} onTap={() => setPeriod("month")} />
        <Pill label="All" active={period === "all"} onTap={() => setPeriod("all")} />
      </div>

      {/* Hero number sits 16px below the pills. Crossfade from shimmer to
          real content once stats land — both layers occupy the same slot so
          the layout doesn't jump. */}
      <div style={{ position: "relative", marginTop: 16, height: 44 }}>
        <div
          aria-hidden={!props.loading}
          style={{
            position: "absolute",
            top: 4,
            left: 0,
            width: 120,
            height: 36,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.04)",
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s linear infinite",
            opacity: props.loading ? 1 : 0,
            transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden={props.loading}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 2,
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 300,
            color: profitColor,
            textShadow: profitGlow,
            lineHeight: 1,
            opacity: props.loading ? 0 : 1,
            transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <span style={{ fontSize: 24 }}>$</span>
          <AnimNum
            value={profit}
            style={{
              fontSize: 44,
              fontWeight: 300,
              color: profitColor,
              fontFeatureSettings: '"tnum"',
            }}
          />
        </div>
      </div>

      {/* Delta chip */}
      {delta && (
        <div style={{ marginTop: 6 }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: delta.positive
                ? "rgba(92,224,184,0.08)"
                : "rgba(232,99,107,0.08)",
              color: delta.positive ? "#5CE0B8" : "#E8636B",
              borderRadius: 6,
              padding: "3px 8px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 500,
              fontSize: 10,
            }}
          >
            {delta.text}
          </span>
        </div>
      )}

      {/* Sparkline */}
      <div style={{ marginTop: 12 }}>
        <Sparkline values={props.dailyProfitHistory} />
      </div>

      {/* Today's secondary stats */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <SecondaryStat label="Scans" value={`${props.todayScans}`} />
        <Divider />
        <SecondaryStat
          label="Buys"
          value={`${props.todayBuys}`}
          valueColor="#5CE0B8"
        />
        <Divider />
        <SecondaryStat label="Spent" value={`$${props.todaySpent}`} />
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 1,
        height: 14,
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    />
  );
}

function SecondaryStat({
  label,
  value,
  valueColor = "#C8C0D8",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 10,
        display: "flex",
        gap: 4,
      }}
    >
      <span style={{ color: "#5A4E70" }}>{label}:</span>
      <span style={{ color: valueColor, fontFeatureSettings: '"tnum"' }}>
        {value}
      </span>
    </div>
  );
}
