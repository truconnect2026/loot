"use client";

import { useState } from "react";
import AnimNum from "@/components/shared/AnimNum";

type Period = "today" | "week" | "month" | "all";

interface HeroProfitProps {
  // Potential — sum of scan-time profit estimates per period. The big
  // headline number. Updates the moment the user scans a BUY.
  todayProfit: number;
  yesterdayProfit: number;
  weekProfit: number;
  monthProfit: number;
  allTimeProfit: number;
  // Realized — sum of (sold_price - cost) per period. The quiet secondary
  // number that confirms what's actually in the bank. Stays at $0 until
  // the user marks something sold.
  todayRealized: number;
  weekRealized: number;
  monthRealized: number;
  allTimeRealized: number;
  todayScans: number;
  todayBuys: number;
  todaySpent: number;
  dailyProfitHistory: number[];
}

const PERIODS: Period[] = ["today", "week", "month", "all"];

// Headers say "FOUND" instead of "PROFIT" so the user reads the number
// as potential-flips-discovered, not money-in-pocket. Realized money sits
// underneath as a secondary line.
const PERIOD_COPY: Record<Period, { pill: string; header: string }> = {
  today: { pill: "Today", header: "FOUND TODAY" },
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
        fontFamily: "var(--font-body)",
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
  todayRealized,
  weekRealized,
  monthRealized,
  allTimeRealized,
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

  // Realized for the same period — the period switcher controls both
  // numbers so they stay aligned.
  const realized =
    period === "today"
      ? todayRealized
      : period === "week"
        ? weekRealized
        : period === "month"
          ? monthRealized
          : allTimeRealized;

  // Three visual states.
  // STATE_A — empty: no activity at all. Compact status-bar treatment.
  // STATE_B — has data but not enough days to draw a sparkline.
  // STATE_C — full: pills, hero, delta, sparkline, real stats.
  const hasAnyData =
    todayProfit !== 0 || todayScans > 0 || todayBuys > 0 || todaySpent > 0;
  const nonZeroDays = dailyProfitHistory.filter((v) => v !== 0).length;
  const hasSparkline = nonZeroDays >= 3;
  const isEmpty = !hasAnyData;
  const isEarly = hasAnyData && !hasSparkline;

  const isNegative = value < 0;
  const isZero = value === 0;

  // Empty state shows the $0 in ghost mint (0.2 alpha) rather than
  // dim plum. It's still zero, but the money color hints at what
  // the number becomes after the first BUY scan. Pulse animation
  // (defined in JSX below) gives the ghost number an "awaiting
  // input" cadence. Populated zero stays plum (no money to celebrate
  // yet), negative stays red (real loss).
  const heroColor = isEmpty
    ? "rgba(92, 224, 184, 0.2)"
    : isZero
      ? "#5A4E70"
      : isNegative
        ? "#E8636B"
        : "#5CE0B8";
  const heroGlow =
    isEmpty || isZero
      ? "none"
      : isNegative
        ? "0 0 32px rgba(232,99,107,0.15)"
        : "0 0 32px rgba(92,224,184,0.15)";
  // Empty hero shrinks to 28px so the card collapses to a status bar.
  // Dollar sign now matches the number's font-size so they sit on
  // the same baseline and feel like one currency-glyph unit; the
  // visual hierarchy comes from the $'s opacity (rendered at 0.5
  // on the JSX below) instead of a smaller font.
  // D2: in the empty state the $0 is a placeholder, not the message — shrink
  // it (28 -> 20) so it stops dominating the invitation below it.
  const heroNumberSize = isEmpty ? 20 : 44;
  const heroDollarSize = heroNumberSize;

  // Period pills are meaningless when every period reads $0. Hide
  // them whenever no day has nonzero data — that includes the
  // pristine empty state AND the "scanned but only PASS verdicts"
  // state (hasAnyData=true but nonZeroDays=0). User sees one less
  // row of dead $0 / $0 / $0 / $0 tabs.
  const showPills = nonZeroDays > 0;

  // Bottom stat row needs at LEAST two of the three numbers non-zero
  // before it shows. "Scans: 1 | Buys: 0 | Spent: $0" is two zeros
  // and reads worse than just hiding the row. The "only Scans>0"
  // case gets a friendly one-liner ("1 scan so far — keep going")
  // that validates the action without exposing the empty buys/spent.
  const nonZeroSecondary = [todayScans > 0, todayBuys > 0, todaySpent > 0]
    .filter(Boolean).length;
  const showSecondaryRow = nonZeroSecondary >= 2;
  const showOnlyScansLine = todayScans > 0 && nonZeroSecondary === 1;

  // Delta chip — only "today vs yesterday" is computable from current props.
  // Week/month deltas would need lastWeekProfit/lastMonthProfit; hidden until
  // those props get added. Also hidden in the empty state.
  let deltaText: string | null = null;
  let deltaPositive = true;
  if (!isEmpty && period === "today" && yesterdayProfit !== 0) {
    const diff = todayProfit - yesterdayProfit;
    deltaPositive = diff >= 0;
    const sign = diff >= 0 ? "+" : "-";
    deltaText = `${sign}$${Math.abs(diff)} vs yesterday`;
  }

  // Secondary-stat colors flatten to dim plum in the empty state.
  const scansColor = isEmpty ? "#3D2E55" : "#C8C0D8";
  const buysColor = isEmpty ? "#3D2E55" : "#5CE0B8";
  const spentColor = isEmpty ? "#3D2E55" : "#C8C0D8";

  return (
    <div
      style={{
        // Empty-state surface gets a top-left mint whisper (0.03)
        // fading into the dark base — the scoreboard hints at the
        // money color even at $0. Populated state keeps the original
        // soft white gradient since the live numbers carry their own
        // mint without help. backgroundImage paints over
        // backgroundColor; the image is a solid color stack so the
        // dashboard grid still can't bleed through.
        backgroundColor: "#120e18",
        backgroundImage: isEmpty
          ? "linear-gradient(165deg, rgba(92, 224, 184, 0.06) 0%, rgba(23, 18, 42, 0.9) 45%, rgba(16, 12, 30, 0.95) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        // Primary card depth — soft drop + a 1px inset hairline that
        // catches light along the top edge, giving the surface a lit
        // bevel. The previous deeper stack got reduced as part of the
        // global card-depth pass (cards now read consistent across
        // the app instead of HeroProfit floating with extra weight).
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.03) inset, inset 0 1px 0 0 rgba(255,255,255,0.06)",
        // 12px top across both states so the section header
        // (FOUND TODAY / PROFIT) sits close to the card's top edge
        // instead of floating in dead space. Empty state still
        // tighter on the sides + bottom for its compact status-bar
        // shape; populated state keeps 20 horiz/bottom for the
        // sparkline + secondary stats grid below.
        padding: isEmpty ? "12px 16px 16px" : "12px 20px 20px",
        // ease-out-expo approximation for the state-change shape shifts.
        transition: "padding 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top row — period header + selector pills (pills hidden when empty) */}
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
            // Section label — uppercase category header, stays mono per the
            // font role system.
            fontFamily: "var(--font-label)",
            fontSize: 8,
            color: "#5A4E70",
            letterSpacing: "0.12em",
          }}
        >
          {/* Empty state shows the same "FOUND TODAY" header as a
              fresh user with their first scan — keeps the label
              consistent with the default selected period rather
              than swapping in a generic "PROFIT" word. */}
          {isEmpty ? "FOUND TODAY" : PERIOD_COPY[period].header}
        </div>
        {showPills && (
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
        )}
      </div>

      {/* Hero number — Outfit 300; in the empty state, the number sits inline
          next to a one-line nudge so the whole card reads as a status bar.
          The number itself pulses opacity 0.3 ↔ 0.5 in empty mode so a
          fresh-account "$0" reads as "waiting for data" rather than as
          a flat tombstone. */}
      <style>{`
        @keyframes heroEmptyPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes hpDrift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        .hp-drift { display: inline-block; animation: hpDrift 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hp-drift { animation: none; }
        }
      `}</style>
      <div
        style={{
          marginTop: isEmpty ? 4 : 12,
          display: "flex",
          alignItems: "baseline",
          gap: isEmpty ? 12 : 0,
          color: heroColor,
          textShadow: heroGlow,
          transition:
            "color 200ms cubic-bezier(0.16,1,0.3,1), text-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            animation: isEmpty
              ? "heroEmptyPulse 3s ease-in-out infinite"
              : undefined,
          }}
        >
          {isNegative && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: heroNumberSize,
                lineHeight: 1,
              }}
            >
              -
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: heroDollarSize,
              lineHeight: 1,
              // 0.5 opacity makes the $ visually lighter than the
              // number while keeping the same physical font-size, so
              // the two share a clean baseline and read as one
              // currency-glyph unit instead of "small prefix sitting
              // next to a big digit."
              opacity: 0.5,
            }}
          >
            $
          </span>
          <AnimNum
            value={Math.abs(value)}
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: heroNumberSize,
              lineHeight: 1,
            }}
          />
        </div>
        {isEmpty && (
          // Action-pointed copy that physically points to the scan
          // buttons sitting just below this card. Mint arrow draws
          // the eye downward; the rest of the line at low-key gray
          // keeps the energy on the action, not the words.
          <span
            style={{
              fontFamily: "var(--font-body)",
              // D2: this is the actual CTA in the empty state — promote it to
              // lead (16/600, full-contrast text) so a new user reads "go
              // find" instead of the discouraging ghost "$0".
              fontWeight: 600,
              fontSize: 16,
              color: "#C8C0D8",
              lineHeight: 1.3,
              display: "inline-flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            scan your first find{" "}
            <span className="hp-drift" style={{ color: "#5CE0B8" }}>↓</span>
          </span>
        )}
      </div>

      {/* Realized profit — secondary metric. Only shown once the
          user has actually sold something (realized > 0). The
          previous "$0 realized · sell items to track" placeholder
          duplicated the empty-state's "start scanning to track
          profits" copy on the same card, so it's gone — show the
          line only when there's a real number behind it. */}
      {!isEmpty && realized > 0 && (
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "var(--text-muted)",
            fontFeatureSettings: '"tnum"',
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            ${realized}
          </span>
          <span> realized</span>
        </div>
      )}

      {/* Delta chip — only when not empty and we have a comparator */}
      {!isEmpty && deltaText && (
        <div style={{ marginTop: 6, display: "flex" }}>
          <div
            style={{
              backgroundColor: deltaPositive
                ? "rgba(92,224,184,0.08)"
                : "rgba(232,99,107,0.08)",
              borderRadius: 6,
              padding: "3px 8px",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 10,
              color: deltaPositive ? "#5CE0B8" : "#E8636B",
            }}
          >
            {deltaText}
          </div>
        </div>
      )}

      {/* Sparkline (full) / "tracking for X days" (early) / hidden (empty) */}
      {!isEmpty && (
        <div style={{ marginTop: 12 }}>
          {isEarly ? (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                color: "#5A4E70",
              }}
            >
              {/* Zero-day case is actionable, not a status report —
                  there's no profit history yet to "track." Once a
                  single profitable scan exists this swaps to the
                  "tracking for X days" label. */}
              {nonZeroDays === 0
                ? "start scanning to track profits"
                : `tracking for ${nonZeroDays} ${nonZeroDays === 1 ? "day" : "days"}`}
            </div>
          ) : (
            <Sparkline history={dailyProfitHistory} />
          )}
        </div>
      )}

      {/* Single-action one-liner — when only Scans is non-zero
          (Buys + Spent both 0), show a brief encouraging line
          instead of the full Scans|Buys|Spent grid. Two visible
          zeros next to a single 1 reads worse than just the
          headline. Once the user records a BUY (Buys/Spent become
          non-zero), the full row below takes over. */}
      {showOnlyScansLine && (
        <>
          <div
            style={{
              marginTop: 8,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#5A4E70",
              fontFeatureSettings: '"tnum"',
            }}
          >
            <span style={{ color: "#5CE0B8", fontWeight: 600 }}>
              {todayScans}
            </span>{" "}
            scan{todayScans === 1 ? "" : "s"} so far — keep going
          </div>
          {/* Subtle progress track — width proportional to
              scans/10 so the user sees mint creep in even at 1
              scan. Capped at 100% (10+ scans fills the bar) so a
              high-volume day still reads as "you're on fire" rather
              than overflowing the track. */}
          <div
            style={{
              marginTop: 6,
              height: 2,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, todayScans * 10)}%`,
                height: "100%",
                backgroundColor: "rgba(92, 224, 184, 0.3)",
                borderRadius: 2,
                transition:
                  "width 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </>
      )}

      {/* Secondary stats — only renders when at least TWO of the
          three numbers are non-zero. A single number with two zeros
          beside it ("Scans: 1 | Buys: 0 | Spent: $0") reads worse
          than the showOnlyScansLine above; the row earns its keep
          once the user has actual breadth of activity. */}
      {showSecondaryRow && (
        <div
          style={{
            marginTop: isEmpty ? 8 : 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-body)",
            fontSize: isEmpty ? 9 : 10,
          }}
        >
          <SecondaryStat
            label="Scans"
            value={`${todayScans}`}
            valueColor={scansColor}
          />
          <StatDivider />
          <SecondaryStat
            label="Buys"
            value={`${todayBuys}`}
            valueColor={buysColor}
          />
          <StatDivider />
          <SecondaryStat
            label="Spent"
            value={`$${todaySpent}`}
            valueColor={spentColor}
          />
        </div>
      )}
    </div>
  );
}
