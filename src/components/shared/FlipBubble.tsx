"use client";

import { useEffect, useRef, useState } from "react";
import FlipCoyote, { type FlipCoyoteMood } from "@/components/shared/FlipCoyote";

/**
 * Flip speaking — the /flip game + Coach bubble aesthetic (black surface,
 * full mint border, mono mint text, tail bottom-left) with a mini Flip
 * head and an optional typewriter. The one voice unit reused by the
 * Sourcing zero-store guide and the FlipTip callouts.
 *
 * Motion: when `play` is true the line types on (steps cadence via JS,
 * ~26ms/char) and the mint edge breathes once. When `play` is false —
 * because the intro already ran OR reduce-motion is on — the FULL line
 * renders immediately: a finished, intentional bubble, not a paused one.
 */
export function FlipBubble({
  text,
  play = false,
  mood = "smirk",
  glyphSize = 30,
  startDelay = 0,
  fontSize = 13,
  maxWidth,
}: {
  text: string;
  play?: boolean;
  mood?: FlipCoyoteMood;
  glyphSize?: number;
  startDelay?: number;
  fontSize?: number;
  maxWidth?: number | string;
}) {
  const [shown, setShown] = useState(play ? 0 : text.length);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!play) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t + startDelay;
      if (t < start) {
        raf.current = requestAnimationFrame(step);
        return;
      }
      const target = Math.min(
        text.length,
        Math.floor((t - start) / 26),
      );
      if (target !== i) {
        i = target;
        setShown(i);
      }
      if (i < text.length) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [play, text, startDelay]);

  return (
    <div
      className="fb-row"
      style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth }}
    >
      <span className="fb-glyph" style={{ flexShrink: 0, marginTop: 4 }}>
        <FlipCoyote mood={mood} size={glyphSize} />
      </span>
      <div
        className="fb-bubble"
        style={{
          position: "relative",
          backgroundColor: "rgba(0,0,0,0.85)",
          border: "1px solid #5CE0B8",
          borderRadius: "10px 10px 10px 2px",
          padding: "10px 12px",
          fontFamily: "var(--font-space-mono)",
          fontSize,
          color: "#5CE0B8",
          lineHeight: 1.4,
          letterSpacing: "0.01em",
          whiteSpace: "pre-wrap",
          minWidth: 0,
        }}
      >
        {text.slice(0, shown)}
        {play && shown < text.length && (
          <span aria-hidden="true" className="fb-caret" />
        )}
      </div>
    </div>
  );
}
