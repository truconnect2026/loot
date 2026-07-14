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
 * Gating: a tip shows until the user EXPLICITLY dismisses it (the X), which
 * writes localStorage lw-guide-<id> and hides it forever. It PERSISTS across
 * tab navigation within a session (mount -> nav away -> nav back -> still
 * there); only the X dismisses it. A session slot (sessionStorage
 * lw-guide-session = the claiming tip's id, NOT a boolean) caps VISIBLE
 * first-run tips at one per session so tips on different tabs never stack —
 * a tip recognizes its OWN id in the slot on remount and stays visible. An
 * undismissed tip may show again in a later session. Callers ensure max one
 * FlipTip per screen and never mount it on a surface with an active
 * empty-state guide.
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
    let sessionOwner = "";
    try {
      seen = localStorage.getItem(`lw-guide-${id}`) === "1";
      // The single per-session slot holds the id of whichever tip claimed it
      // (NOT a boolean). Storing the id is what lets THIS tip recognize its
      // own claim on remount and stay visible instead of hiding itself.
      sessionOwner = sessionStorage.getItem("lw-guide-session") || "";
    } catch {
      /* private mode */
    }
    // Dismissed forever (only the X sets this) -> never show again.
    if (seen) {
      setState("hidden");
      return;
    }
    // Slot held by a DIFFERENT tip -> don't stack; stay hidden this session
    // (never dismissed, so it may show in a later session).
    if (sessionOwner && sessionOwner !== id) {
      setState("hidden");
      return;
    }
    // Claim the slot once. On remount (tab nav away + back) the slot already
    // equals our id, so we skip the claim and stay VISIBLE — the tip persists
    // until the user taps X. Mounting NEVER marks it seen.
    if (!sessionOwner) {
      try {
        sessionStorage.setItem("lw-guide-session", id);
      } catch {
        /* private mode */
      }
    }
    setState("shown");
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
        // Equal section-gap margins (space[5] = 20) top and bottom so the
        // tip sits in the flow as a first-class card with even rhythm,
        // not a callout wedged tight to one side. The bottom is also the
        // tip's own reserve so nothing below crowds it in any feed state.
        marginTop: space[5],
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
        glyphSize={40}
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
