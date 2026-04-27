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
    ref.current.style.transition = "transform 80ms ease-out, background-color 80ms ease-out";
    ref.current.style.transform = "translateY(1px)";
    ref.current.style.backgroundColor = "var(--press-bg)";
  }, []);

  const pressUp = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transition = "transform 150ms ease-out, background-color 150ms ease-out";
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
