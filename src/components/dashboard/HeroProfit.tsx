"use client";

import { useState } from "react";
import AnimNum from "@/components/shared/AnimNum";

type Period = "today" | "week" | "month" | "all";

interface HeroProfitProps {
  todayProfit: number;
  yesterdayProfit: number;
  weekProfit: number;
  monthProfit: number;
  allTimeProfit: number;
  todayScans: number;
  todayBuys: number;
  todaySpent: number;
  dailyProfitHistory: number[];
}

const PERIODS: Period[] = ["today", "week", "month", "all"];

const PERIOD_COPY: Record<Period, { pill: string; header: string }> = {
  today: { pill: "Today", header: "TODAY'S PROFIT" },
  week: { pill: "Week", header: "THIS WEEK" },
  month: { pill: "Month", header: "THIS MONTH" },
  all: { pill: "All", header: "ALL TIME" },
};

interface PillProps {
  active: boolean;
  label: string;
  onTap: () => void;
}

function Pill({ active, label, onTap }: PillProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontWeight: 500,
        fontSize: 9,
        lineHeight: 1,
        backgroundColor: active ? "rgba(92,224,184,0.10)" : "transparent",
        color: active ? "#5CE0B8" : "#5A4E70",
        border: active
          ? "1px solid rgba(92,224,184,0.15)"
          : "1px solid transparent",
        cursor: "pointer",
        transition:
          "background-color 150ms cubic-bezier(0.16,1,0.3,1), color 150ms cubic-bezier(0.16,1,0.3,1), border-color 150ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {label}
    </button>
  );
}

interface SparklineProps {
  history: number[];
}

// Sparkline — 7-point line chart with gradient area fill below. Falls back
// to a flat grey baseline when every point is zero.
function Sparkline({ history }: SparklineProps) {
  const allZero = history.every((v) => v === 0);
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const W = 100;
  const H = 28;
  const PAD_TOP = 2;
  const PAD_BOTTOM = 2;
  const Y_AVAIL = H - PAD_TOP - PAD_BOTTOM;

  const points = history.map((v, i) => {
    const x =
      history.length <= 1 ? W / 2 : (i / (history.length - 1)) * W;
    const y = allZero
      ? H - PAD_BOTTOM
      : PAD_TOP + Y_AVAIL * (1 - (v - min) / range);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const lastX = points[points.length - 1]?.[0] ?? W;
  const firstX = points[0]?.[0] ?? 0;
  const areaPath = `${linePath} L${lastX.toFixed(2)},${H} L${firstX.toFixed(2)},${H} Z`;

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="hp-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5CE0B8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#5CE0B8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {!allZero && <path d={areaPath} fill="url(#hp-spark-fill)" />}
      <path
        d={linePath}
        fill="none"
        stroke={allZero ? "#5A4E70" : "#5CE0B8"}
        strokeOpacity={allZero ? 0.2 : 0.4}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface SecondaryStatProps {
  label: string;
  value: string;
  valueColor: string;
}

function SecondaryStat({ label, value, valueColor }: SecondaryStatProps) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <span style={{ color: "#5A4E70" }}>{label}:</span>
      <span style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

function StatDivider() {
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

export default function HeroProfit({
  todayProfit,
  yesterdayProfit,
  weekProfit,
  monthProfit,
  allTimeProfit,
  todayScans,
  todayBuys,
  todaySpent,
  dailyProfitHistory,
}: HeroProfitProps) {
  const [period, setPeriod] = useState<Period>("today");

  const value =
    period === "today"
      ? todayProfit
      : period === "week"
        ? weekProfit
        : period === "month"
          ? monthProfit
          : allTimeProfit;

  const isNegative = value < 0;
  const isZero = value === 0;

  const heroColor = isZero ? "#5A4E70" : isNegative ? "#E8636B" : "#5CE0B8";
  const heroGlow = isZero
    ? "none"
    : isNegative
      ? "0 0 32px rgba(232,99,107,0.15)"
      : "0 0 32px rgba(92,224,184,0.15)";

  // Delta chip — only "today vs yesterday" is computable from current props.
  // Week/month deltas would need lastWeekProfit/lastMonthProfit; hidden until
  // those props get added.
  let deltaText: string | null = null;
  let deltaPositive = true;
  if (period === "today" && yesterdayProfit !== 0) {
    const diff = todayProfit - yesterdayProfit;
    deltaPositive = diff >= 0;
    const sign = diff >= 0 ? "+" : "-";
    deltaText = `${sign}$${Math.abs(diff)} vs yesterday`;
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%), rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.2), 0 8px 24px -4px rgba(0,0,0,0.3)",
        padding: 20,
      }}
    >
      {/* Top row — period header + selector pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 8,
            color: "#5A4E70",
            letterSpacing: "0.12em",
          }}
        >
          {PERIOD_COPY[period].header}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {PERIODS.map((p) => (
            <Pill
              key={p}
              label={PERIOD_COPY[p].pill}
              active={period === p}
              onTap={() => setPeriod(p)}
            />
          ))}
        </div>
      </div>

      {/* Hero number — Outfit 300 with LED glow */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "baseline",
          color: heroColor,
          textShadow: heroGlow,
          transition:
            "color 200ms cubic-bezier(0.16,1,0.3,1), text-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {isNegative && (
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontWeight: 300,
              fontSize: 44,
              lineHeight: 1,
            }}
          >
            -
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 300,
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          $
        </span>
        <AnimNum
          value={Math.abs(value)}
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 300,
            fontSize: 44,
            lineHeight: 1,
          }}
        />
      </div>

      {/* Delta chip */}
      {deltaText && (
        <div style={{ marginTop: 6, display: "flex" }}>
          <div
            style={{
              backgroundColor: deltaPositive
                ? "rgba(92,224,184,0.08)"
                : "rgba(232,99,107,0.08)",
              borderRadius: 6,
              padding: "3px 8px",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontWeight: 500,
              fontSize: 10,
              color: deltaPositive ? "#5CE0B8" : "#E8636B",
            }}
          >
            {deltaText}
          </div>
        </div>
      )}

      {/* Sparkline */}
      <div style={{ marginTop: 12 }}>
        <Sparkline history={dailyProfitHistory} />
      </div>

      {/* Secondary stats — always today's numbers */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 10,
        }}
      >
        <SecondaryStat
          label="Scans"
          value={`${todayScans}`}
          valueColor="#C8C0D8"
        />
        <StatDivider />
        <SecondaryStat
          label="Buys"
          value={`${todayBuys}`}
          valueColor="#5CE0B8"
        />
        <StatDivider />
        <SecondaryStat
          label="Spent"
          value={`$${todaySpent}`}
          valueColor="#C8C0D8"
        />
      </div>
    </div>
  );
}
