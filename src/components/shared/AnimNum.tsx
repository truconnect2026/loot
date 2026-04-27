"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated number component — counts from previous value to target
 * with cubic ease-out over `duration` ms. Tabular figures.
 */

interface AnimNumProps {
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

function useAnimatedNumber(target: number, duration: number): number {
  const [display, setDisplay] = useState(target);
  const startRef = useRef(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export default function AnimNum({
  value,
  prefix = "",
  duration = 800,
  className,
  style,
}: AnimNumProps) {
  const display = useAnimatedNumber(value, duration);

  return (
    <span
      className={className}
      style={{
        fontFeatureSettings: '"tnum"',
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {prefix}{display}
    </span>
  );
}

export { useAnimatedNumber };
