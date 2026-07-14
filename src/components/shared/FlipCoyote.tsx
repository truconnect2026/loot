/**
 * Flip — character mascot. PNG-sprite based as of the post-c3b083a
 * commit; 8 mood variants live in public/flip/flip-${mood}.png and
 * are sourced from the 2x2-grid sheets cropped via
 * cropFlipSprites.mjs at the repo root.
 *
 * Renders a square <img> at `size × size` pixels. The PNG is
 * authored at 320×320 (2x retina against the 160px default) and
 * scales down via the wrapping <img> width/height; object-fit:
 * contain preserves the aspect ratio on any size.
 *
 * Saturn-ring spin animation is GONE — the rings are baked into
 * each PNG at a fixed angle. Trade-off accepted as part of the
 * sprite swap; if motion needs to return, the move is to either
 * animate the whole <img> (which would tilt the face too) or to
 * layer a transparent spinning ring overlay on top.
 */

export type FlipCoyoteMood =
  | "smirk"
  | "hyped"
  | "sideeye"
  | "dead"
  | "scanning"
  | "unicorn"
  | "shrug"
  | "callout";

interface FlipCoyoteProps {
  mood?: FlipCoyoteMood;
  size?: number;
}

export default function FlipCoyote({
  mood = "smirk",
  size = 160,
}: FlipCoyoteProps) {
  return (
    <img
      src={`/flip/flip-${mood}.png`}
      alt={`Kronos ${mood}`}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        // Disable drag-ghost on the character — it's a UI element,
        // not user content.
        userSelect: "none",
        pointerEvents: "none",
      }}
      draggable={false}
    />
  );
}
