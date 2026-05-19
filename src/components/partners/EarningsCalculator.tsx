"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateEarnings,
  formatAudience,
  sliderToAudience,
} from "@/lib/earnings";

const fmtMoney = (n: number) =>
  `$${new Intl.NumberFormat("en-US").format(Math.round(n))}`;

/**
 * Smoothly interpolates from the current display value to `target` over
 * `duration`ms using ease-out cubic. Respects prefers-reduced-motion
 * (snaps to target). Restarts smoothly when target changes mid-animation.
 */
function useSmoothValue(target: number, duration = 320): number {
  const [display, setDisplay] = useState(target);
  const startRef = useRef({ from: target, at: 0, to: target });

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(target);
      return;
    }
    startRef.current = { from: display, at: performance.now(), to: target };
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.max(
        0,
        Math.min(1, (now - startRef.current.at) / duration),
      );
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(
        startRef.current.from +
          (startRef.current.to - startRef.current.from) * eased,
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

type SliderProps = {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  minLabel: string;
  maxLabel: string;
  helper?: string;
  onChange: (v: number) => void;
};

function Slider({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  minLabel,
  maxLabel,
  helper,
  onChange,
}: SliderProps) {
  return (
    <div className="ec-slider">
      <div className="ec-slider-head">
        <span className="ec-slider-label">{label}</span>
        <span className="ec-slider-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className="ec-slider-range">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {helper && <div className="ec-helper">{helper}</div>}
    </div>
  );
}

export default function EarningsCalculator() {
  const [audSlider, setAudSlider] = useState(58); // ~25k default
  const [convSlider, setConvSlider] = useState(5); // 0.5%
  const [mixSlider, setMixSlider] = useState(70); // 70% monthly

  const audienceSize = useMemo(() => sliderToAudience(audSlider), [audSlider]);
  const conversionRate = convSlider / 1000;
  const monthlyMix = mixSlider / 100;

  const outputs = useMemo(
    () => calculateEarnings({ audienceSize, conversionRate, monthlyMix }),
    [audienceSize, conversionRate, monthlyMix],
  );

  const signups = useSmoothValue(outputs.signupsPerMonth);
  const m1 = useSmoothValue(outputs.month1Earnings);
  const y1 = useSmoothValue(outputs.year1Earnings);
  const y3 = useSmoothValue(outputs.threeYearEarnings);

  const signupsDisplay =
    outputs.signupsPerMonth < 1 && audienceSize > 0
      ? "< 1 / mo"
      : `${Math.round(signups).toLocaleString()} / mo`;

  return (
    <section className="earnings-calculator wrap wrap--wide" aria-label="Earnings calculator">
      <div className="section-label" style={{ color: "#5CE0B8" }}>
        DO THE MATH
      </div>
      <h2 className="ec-title">See what Loot pays you.</h2>
      <p className="ec-dek">Drag the sliders. We&rsquo;ll show you the year.</p>
      <div className="ec-grid">
        <div className="ec-sliders">
          <Slider
            label="AUDIENCE SIZE"
            value={audSlider}
            display={formatAudience(audienceSize)}
            min={0}
            max={100}
            minLabel="1k"
            maxLabel="500k"
            onChange={setAudSlider}
          />
          <Slider
            label="CONVERSION RATE"
            value={convSlider}
            display={`${(convSlider / 10).toFixed(1)}%`}
            min={1}
            max={50}
            minLabel="0.1%"
            maxLabel="5%"
            helper="industry avg is 0.3–0.8% for creator affiliate programs"
            onChange={setConvSlider}
          />
          <Slider
            label="PLAN MIX"
            value={mixSlider}
            display={`${mixSlider} / ${100 - mixSlider}`}
            min={0}
            max={100}
            minLabel="all annual"
            maxLabel="all monthly"
            helper="annual subs pay more upfront, less recurring"
            onChange={setMixSlider}
          />
        </div>
        <div className="ec-outputs">
          <div className="ec-out ec-out-sm">
            <span className="ec-out-label">signups per month</span>
            <span className="ec-out-value ec-out-value-sm">{signupsDisplay}</span>
          </div>
          <div className="ec-out">
            <span className="ec-out-label">month 1</span>
            <span className="ec-out-value">{fmtMoney(m1)}</span>
          </div>
          <div className="ec-out ec-out-hero">
            <span className="ec-out-label">year 1</span>
            <span className="ec-out-value ec-out-value-hero">{fmtMoney(y1)}</span>
          </div>
          <div className="ec-out">
            <span className="ec-out-label">over 3 years</span>
            <span className="ec-out-value">{fmtMoney(y3)}</span>
            <span className="ec-out-sub">if you keep posting at this pace</span>
          </div>
        </div>
      </div>
      <p className="ec-footnote">
        // recurring assumes 8% monthly churn · industry avg · founding 20 rates applied
      </p>
    </section>
  );
}
