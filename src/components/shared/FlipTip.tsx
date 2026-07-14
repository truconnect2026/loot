"use client";

import { useEffect, useState } from "react";
import { FlipBubble } from "@/components/shared/FlipBubble";
import type { FlipCoyoteMood } from "@/components/shared/FlipCoyote";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { space } from "@/lib/design/tokens";

/**
 * FlipTip — a first-run callout in Flip's voice. Inline in page flow (no
 * overlay, no backdrop, no spotlight): a mini Flip head + mono mint
 * bubble + dismiss X.
 *
 * Motion: on show, the mini-Flip peeks in (translateY + rotate settle,
 * --ease-out), the line types on, and the bubble's mint edge breathes
 * once; the glyph then holds a slow idle bob (~5s). Dismiss exits fast
 * (scale/fade, --ease-in) and the tip collapses its own height so the
 * content above closes the gap.
 *
 * Gating: shows once per surface (localStorage lw-guide-<id>); dismiss
 * persists. Callers ensure max one FlipTip per screen and never mount it
 * on a surface that has an active empty-state guide.
 *
 * Reduced motion: no peek, no typewriter, no idle — the full bubble
 * renders static and intentional; dismiss is an instant unmount.
 */
export function FlipTip({
  id,
  text,
  mood = "smirk",
}: {
  id: string;
  text: string;
  mood?: FlipCoyoteMood;
}) {
  const reduced = useReducedMotion();
  // null = reading localStorage; "shown"; "exiting"; "hidden".
  const [state, setState] = useState<"shown" | "exiting" | "hidden" | null>(
    null,
  );

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(`lw-guide-${id}`) === "1";
    } catch {
      /* private mode */
    }
    setState(seen ? "hidden" : "shown");
  }, [id]);

  function dismiss() {
    try {
      localStorage.setItem(`lw-guide-${id}`, "1");
    } catch {
      /* private mode */
    }
    if (reduced) {
      setState("hidden");
      return;
    }
    setState("exiting");
    window.setTimeout(() => setState("hidden"), 190);
  }

  if (state === null || state === "hidden") return null;

  const play = state === "shown" && !reduced;

  return (
    <div
      className={`ft${play ? " ft-play" : ""}`}
      style={{
        position: "relative",
        // Shrink to the bubble's own width (glyph + gap + capped bubble)
        // so the dismiss X hugs the bubble's top-right corner instead of
        // floating at the far edge of a full-width block.
        width: "fit-content",
        maxWidth: "min(100%, 380px)",
        marginTop: 12,
        // Reserve a full section gap (space[5] = 20) below the tip so the
        // section that follows (carousel / feeds placeholder / footer)
        // never crowds it — the reserve is the tip's own, not borrowed
        // from the next block's margin, so it holds in every feed state.
        marginBottom: space[5],
        animation:
          state === "exiting"
            ? "ftExit 180ms var(--ease-in) both"
            : undefined,
      }}
    >
      <style>{`
        .ft-play .fb-glyph { animation: ftPeek var(--motion-medium) var(--ease-out) both; }
        .ft-play .fb-bubble { animation: ftBubbleBreath 1000ms var(--ease-out) 280ms 1 both; }
        .ft .fb-glyph { animation: ftIdle 5s var(--ease-out) 1.2s infinite; }
      `}</style>
      <FlipBubble
        text={text}
        play={play}
        mood={mood}
        glyphSize={30}
        startDelay={260}
        fontSize={12.5}
        maxWidth="min(100%, 340px)"
      />
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(10,8,14,0.9)",
          color: "rgba(255,255,255,0.55)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          lineHeight: 1,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
