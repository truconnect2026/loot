"use client";

import { useState } from "react";

export interface Deal {
  id: string;
  title: string;
  price: number; // 0 when isFree
  estimatedValue: number;
  distance: string; // e.g. "2.3 mi"
  source: string; // raw, e.g. "fb_marketplace", "craigslist_free", "nextdoor"
  isFree: boolean;
  postedAt: string; // human-formatted, e.g. "3h ago"
  url: string;
}

// Map a raw source string to a recognizable platform name. Used to be
// short codes ("FB" / "CL" / "ND") but new users couldn't decode them
// at a glance. Spelled-out names trade a few pixels of pill width for
// universal recognition.
export function sourceTag(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("marketplace") || s.includes("fb")) return "Facebook";
  if (s.includes("craigslist")) return "Craigslist";
  if (s.includes("nextdoor")) return "Nextdoor";
  return raw;
}

// Brand-tinted pill colors for the source label. Each platform gets
// its recognizable hue at low alpha so the pill reads as that brand
// at a glance without the badge dominating the card. Free listings
// override this and use the mint "FREE" tint regardless of source.
function sourcePillTint(raw: string): { bg: string; border: string; color: string } {
  const s = raw.toLowerCase();
  if (s.includes("marketplace") || s.includes("fb")) {
    return {
      bg: "rgba(24,119,242,0.10)",
      border: "rgba(24,119,242,0.15)",
      color: "#4A9AF5",
    };
  }
  if (s.includes("craigslist")) {
    return {
      bg: "rgba(92,44,140,0.10)",
      border: "rgba(92,44,140,0.15)",
      color: "#8B5FC7",
    };
  }
  if (s.includes("nextdoor")) {
    return {
      bg: "rgba(0,165,80,0.10)",
      border: "rgba(0,165,80,0.15)",
      color: "#00C853",
    };
  }
  return {
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)",
    color: "#C8C0D8",
  };
}

// Map a raw source string to a "find on …" CTA label. Lowercase
// per the voice rule; platform names are proper nouns and stay
// capitalized. Wording shifted from "open on" to "find on" because
// the CTA now opens a platform search for the deal title rather
// than the (synthetic) original listing URL.
export function sourceCtaLabel(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("marketplace") || s.includes("fb")) return "find on Facebook";
  if (s.includes("craigslist")) return "find on Craigslist";
  if (s.includes("nextdoor")) return "browse Nextdoor";
  return "find listing";
}

// Build the platform-specific search URL the deal CTA should open.
// Synthetic deals (Claude-generated) carry a `url` field that's not
// a real listing, so the CTA falls back to the platform's own search
// surface. Nextdoor doesn't expose a public search URL — link to
// the homepage instead so the user can pivot manually.
export function dealSearchUrl(deal: Deal): string {
  const s = deal.source.toLowerCase();
  const q = encodeURIComponent(deal.title);
  if (s.includes("marketplace") || s.includes("fb")) {
    return `https://www.facebook.com/marketplace/search/?query=${q}`;
  }
  if (s.includes("craigslist")) {
    return `https://craigslist.org/search/?query=${q}`;
  }
  if (s.includes("nextdoor")) {
    return "https://nextdoor.com";
  }
  return deal.url || "#";
}

export function dealProfit(deal: Deal): number {
  return deal.estimatedValue - (deal.isFree ? 0 : deal.price);
}

// Parse human-formatted "3h ago" / "45m ago" / "1d ago" into rough hours.
// Returns 0 on parse failure (treats as just-posted).
function hoursSincePosted(postedAt: string): number {
  const m = postedAt.toLowerCase().match(/(\d+)\s*([mhd])/);
  if (!m) return 0;
  const n = parseInt(m[1] ?? "0", 10);
  const unit = m[2];
  if (unit === "m") return n / 60;
  if (unit === "h") return n;
  if (unit === "d") return n * 24;
  return 0;
}

// Compress "3h ago" → "3h" so the freshness chip stays compact when
// pairing label + time together.
function shortPostedAt(postedAt: string): string {
  return postedAt.replace(/\s*ago$/i, "").trim();
}

interface FreshnessSignal {
  label: string;
  /** Cool desaturated for "available", warm camel for "going fast". */
  dotColor: string;
}

// Recent posts → "going fast" (high competition signal, lots of eyes).
// Older posts → "likely available" (sat through the early-bird hour and
// is probably still there). 4h cutoff is heuristic; tune with real data.
function freshnessFor(postedAt: string): FreshnessSignal {
  const hours = hoursSincePosted(postedAt);
  if (hours < 4) return { label: "going fast", dotColor: "#D4A574" };
  return { label: "likely available", dotColor: "#74B6A0" };
}

interface DealCardProps {
  deal: Deal;
  onTap: (deal: Deal) => void;
}

export default function DealCard({ deal, onTap }: DealCardProps) {
  const [pressed, setPressed] = useState(false);
  const tag = sourceTag(deal.source);
  const profit = dealProfit(deal);
  const fresh = freshnessFor(deal.postedAt);
  const timeShort = shortPostedAt(deal.postedAt);

  // Left accent stripe — 2px ribbon graded by profit tier so a
  // returning user can scan a carousel of cards and pattern-match
  // "which one's worth driving for" before reading numbers. Tier
  // breakpoints match the verdict-system cadence on the scan side
  // (mint = strong, camel = decent, neutral = below threshold).
  const accentColor =
    profit >= 50
      ? "#5CE0B8"
      : profit >= 20
        ? "#D4A574"
        // A3: below-threshold was rgba(255,255,255,0.06) — identical to the
        // card border, so it read as "no stripe" and looked inconsistent
        // next to the mint/camel cards. Raised to the textDim token so every
        // card shows a deliberate graded ribbon (mint > camel > dim).
        : "#3D2E55";

  return (
    <button
      type="button"
      onClick={() => onTap(deal)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: "relative",
        flexShrink: 0,
        // A2: 232 -> 200 so the peeked 2nd card shows ~81% (readable, its
        // tail dissolving under the right fade) instead of a ~56% half-cut
        // with chopped text.
        width: 200,
        // Bumped from 152 → 164 so the "estimated resale" caption
        // under the resale value has room without compressing the title.
        minHeight: 164,
        display: "flex",
        flexDirection: "column",
        // Opaque page-bg base + 3% white tint on top so the dashboard
        // grid can't bleed through the card surface. Press-state
        // brightening is handled by the parent transform; bg stays
        // a stable opaque surface.
        backgroundColor: "#120e18",
        // Directional 145deg light wash layered over the flat 3%
        // tint — gives each card a subtle "lit from upper-left"
        // gradient so they feel like physical surfaces under angled
        // light rather than flat panels.
        backgroundImage:
          "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, transparent 50%), linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03))",
        // Uniform hairline on all four sides. The profit-tier accent
        // moved to a child overlay (see <span> below) so border-
        // radius can't clip it short on the rounded corners.
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        scrollSnapAlign: "start",
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition:
          "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)",
        // Primary card depth — soft drop + a faint inset hairline so
        // every deal card lifts off the dashboard with the same
        // weight as the stats card and sourcing tiles.
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.03) inset, inset 0 1px 0 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Profit-tier accent stripe — absolute-positioned overlay so
          the card's borderRadius doesn't clip it short on the rounded
          top-left / bottom-left corners (which it does when the
          accent is implemented as borderLeft). Inset 8px from top
          and bottom so the bar reads as a deliberate ribbon, not a
          full-height edge stroke. 3px width gives it visible weight
          on phone screens. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 2,
          backgroundColor: accentColor,
          pointerEvents: "none",
        }}
      />

      {/* Header row — source pill (spelled out) on left, freshness signal
          on right. The freshness label tells the user whether to drive now
          or skip; the dot color encodes the same in <100ms scan time. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {(() => {
          // Free listings keep the existing mint identity regardless
          // of source; otherwise paint the platform's brand tint so
          // Facebook reads blue, Craigslist purple, Nextdoor green.
          const tint = deal.isFree
            ? {
                bg: "rgba(92,224,184,0.18)",
                border: "rgba(92,224,184,0.30)",
                color: "#5CE0B8",
              }
            : sourcePillTint(deal.source);
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: 6,
                backgroundColor: tint.bg,
                border: `1px solid ${tint.border}`,
                fontFamily: "var(--font-body)",
                fontSize: 10,
                fontWeight: 600,
                color: tint.color,
                lineHeight: 1.2,
              }}
            >
              {tag}
            </span>
          );
        })()}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-body)",
            fontSize: 10,
            color: "#5A4E70",
            lineHeight: 1.2,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: fresh.dotColor,
            }}
          />
          {fresh.label} · {timeShort}
        </span>
      </div>

      {/* Title — 2-line clamp */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 600,
          color: "#C8C0D8",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {deal.title}
      </div>

      {/* Price row — listed price → estimated resale, with a caption
          stacked underneath it so the user knows the $45 isn't an
          asking price, it's a Claude-generated resale estimate.
          marginTop:auto pushes the row to the bottom of available space,
          just above the absolute distance/profit band. */}
      <div
        style={{
          marginTop: "auto",
          marginBottom: 24,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        {deal.isFree ? (
          // Extra-bold + faint mint halo — "FREE" is the most
          // exciting word in reselling (highest possible margin),
          // so the typography earns a slight glow that the priced
          // listings don't get.
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#5CE0B8",
              lineHeight: 1,
              textShadow: "0 0 12px rgba(92, 224, 184, 0.2)",
            }}
          >
            FREE
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 700,
              color: "#C8C0D8",
              lineHeight: 1,
              fontFeatureSettings: '"tnum"',
            }}
          >
            ${deal.price}
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#5A4E70",
            lineHeight: 1,
            // The 11px arrow shares the row baseline with the larger
            // 14/15px prices; on a shared baseline the smaller glyph's
            // optical midline falls ~2px low, so lift it to point straight
            // across rather than dip.
            position: "relative",
            top: -2,
          }}
        >
          →
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1,
              fontFeatureSettings: '"tnum"',
              // High-value finds ($200+) get a mint gradient text
              // treatment so the eye lands on the biggest wins
              // before reading the dollar amount. Lower-value deals
              // keep the flat mint — gradient on every card would
              // dilute the cue.
              ...(profit >= 200
                ? {
                    backgroundImage:
                      "linear-gradient(135deg, #5CE0B8 0%, #8BFFD4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : { color: "#5CE0B8" }),
            }}
          >
            ${deal.estimatedValue}
          </span>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 9,
              color: "rgba(255,255,255,0.40)",
              lineHeight: 1,
            }}
          >
            estimated resale
          </span>
        </div>
      </div>

      {/* Distance — bottom-left. bottom:15 (vs the profit chip's 12)
          because the chip is a padded, taller box; matching raw bottoms
          left the two bottom-row labels ~4px out of optical register. */}
      <span
        style={{
          position: "absolute",
          bottom: 15,
          left: 14,
          fontFamily: "var(--font-body)",
          fontSize: 10,
          color: "#5A4E70",
        }}
      >
        {deal.distance}
      </span>

      {/* Profit chip — bottom-right. Now a distinct chip with mint surface
          + border so it reads as a separate data point from the bare mint
          $45 resale value above. Same pattern used on EmptyHero's profit
          chip; consistent across the app. */}
      {profit > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 14,
            backgroundColor: "rgba(92,224,184,0.10)",
            border: "1px solid rgba(92,224,184,0.20)",
            borderRadius: 6,
            padding: "3px 8px",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 700,
            color: "#5CE0B8",
            fontFeatureSettings: '"tnum"',
            lineHeight: 1.2,
            // Slow breath — money numbers should feel alive, not
            // static. 2.5s ease-in-out keeps the pulse subliminal.
            animation: "dealProfitBreath 2.5s ease-in-out infinite",
          }}
        >
          +${profit}
        </div>
      )}
      <style>{`
        @keyframes dealProfitBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </button>
  );
}
