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
    // Face-forward crop: zoom to the head and clip the shoulders. 1.5x (not
    // 1.7x, which clipped the ears + halo) keeps the whole head, gold halo,
    // and ears in frame; tx centers horizontally and ty centers the FACE
    // (~0.34 down the art) in the size×size box, so the box is a face-
    // centered square that seats predictably on the bubble's first text line.
    const inner = Math.round(size * 1.5);
    const tx = Math.round((size - inner) / 2);
    const ty = Math.round(size / 2 - 0.34 * inner);
    return (
      <span
        style={{
          // block (not inline-block) so the wrapper adds no baseline gap —
          // the glyph box is exactly size×size for clean flex seating.
          display: "block",
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
            transform: `translate(${tx}px, ${ty}px)`,
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
