"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  className?: string;
  /** Pass true to disable IntersectionObserver and animate immediately on mount. */
  immediate?: boolean;
};

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

const formatNumber = (n: number, decimals: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

/**
 * CountUp — animates a number from 0 to `value` once the element scrolls into
 * view. Respects prefers-reduced-motion (renders final value instantly).
 * Includes the final value in a visually-hidden span for SEO/screen readers.
 */
export default function CountUp({
  value,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  delay = 0,
  className,
  immediate = false,
}: Props) {
  const [display, setDisplay] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (hasAnimated) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      setHasAnimated(true);
      return;
    }

    const run = () => {
      setHasAnimated(true);
      let raf = 0;
      const start = performance.now() + delay;
      const tick = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - start) / duration));
        if (t > 0) {
          setDisplay(value * easeOutQuart(t));
        }
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };

    if (immediate || !ref.current) {
      return run();
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, duration, delay, immediate, hasAnimated]);

  return (
    <span ref={ref} className={className} aria-live="polite">
      <span aria-hidden="true">
        {prefix}
        {formatNumber(display, decimals)}
        {suffix}
      </span>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {prefix}
        {formatNumber(value, decimals)}
        {suffix}
      </span>
    </span>
  );
}
