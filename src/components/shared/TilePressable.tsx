"use client";

import { useCallback, useRef, type ReactNode } from "react";

/**
 * Wrapper for all tappable cards/tiles.
 * onPressDown: bg → --press-bg, translateY(1px), 80ms
 * onPressUp: spring back, 150ms
 */

interface TilePressableProps {
  children: ReactNode;
  onTap?: () => void;
  className?: string;
}

export default function TilePressable({
  children,
  onTap,
  className,
}: TilePressableProps) {
  const ref = useRef<HTMLDivElement>(null);

  const pressDown = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transition =
      "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)";
    ref.current.style.transform = "translateY(1px)";
    ref.current.style.backgroundColor = "var(--press-bg)";
  }, []);

  const pressUp = useCallback(() => {
    if (!ref.current) return;
    // Spring curve overshoots slightly so the release feels physical.
    ref.current.style.transition =
      "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)";
    ref.current.style.transform = "translateY(0)";
    ref.current.style.backgroundColor = "";
  }, []);

  const handleClick = useCallback(() => {
    onTap?.();
  }, [onTap]);

  return (
    <div
      ref={ref}
      className={className}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onPointerDown={pressDown}
      onPointerUp={pressUp}
      onPointerLeave={pressUp}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pressDown();
          onTap?.();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          pressUp();
        }
      }}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      {children}
    </div>
  );
}
