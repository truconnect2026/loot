/**
 * Kronos — character mascot. PNG-sprite based; 8 mood variants live in
 * public/flip/flip-${mood}.png. The locked design is a head+shoulders
 * portrait: near-black coyote, mint (#5CE0B8) neon outline, gold
 * (#F5C518) halo + Saturn-ring chain pendant, hoodie. Source art ships
 * on a solid white canvas and is de-matted to transparent 320px sprites
 * by scripts/whiteKeyFlip.mjs.
 *
 * Renders a square <img> at `size × size` pixels (320×320 = 2x retina
 * against the 160px default); object-fit: contain preserves the aspect
 * ratio on any size. The gold halo is baked in — there is no separate
 * spinning-ring layer.
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
