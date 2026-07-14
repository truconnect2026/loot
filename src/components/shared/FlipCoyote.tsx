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
  /** Face-forward crop for SMALL inline glyphs (~40px: FlipBubble / coach
   * avatars). The locked art is a head+shoulders portrait, so at small
   * sizes object-fit:contain shrinks the actual face to a ~14px dark blob
   * with the hoodie/shoulders dominating. `crop` zooms to the head (keeping
   * the signature gold halo) and clips the shoulders so Kronos stays
   * recognizable. Off by default — the large hero renders show the full
   * portrait. */
  crop?: boolean;
}

export default function FlipCoyote({
  mood = "smirk",
  size = 160,
  crop = false,
}: FlipCoyoteProps) {
  if (crop) {
    const inner = Math.round(size * 1.7);
    return (
      <span
        style={{
          display: "inline-block",
          width: size,
          height: size,
          overflow: "hidden",
          lineHeight: 0,
          flexShrink: 0,
        }}
      >
        <img
          src={`/flip/flip-${mood}.png`}
          alt={`Kronos ${mood}`}
          width={inner}
          height={inner}
          style={{
            width: inner,
            height: inner,
            objectFit: "contain",
            // center horizontally, lift so the face (upper third) fills the box
            transform: `translate(${Math.round((size - inner) / 2)}px, ${Math.round(-size * 0.15)}px)`,
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      </span>
    );
  }
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
