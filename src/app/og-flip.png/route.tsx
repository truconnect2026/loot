import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

const SIZE = { width: 1200, height: 630 };
const MINT = "#5CE0B8";
const GOLD = "#F5C518";
const RED = "#ef4444";
const BLUE = "#3B82F6";
const BLACK = "#0a0a0a";
const COSMIC_BLACK = "#070510"; // matches /og-pro.png + /og-kit.png

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

// Bebas Neue regular — pinned v14 TTF on Google's CDN. Satori (the engine
// behind ImageResponse) doesn't support woff2, so we fetch TTF directly.
// Loaded lazily on first request; the Vercel edge runtime caches the fetch.
const BEBAS_TTF_URL =
  "https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9Wlhyw.ttf";
let bebasPromise: Promise<ArrayBuffer> | null = null;
function loadBebas() {
  if (!bebasPromise) {
    bebasPromise = fetch(BEBAS_TTF_URL).then((r) => {
      if (!r.ok) throw new Error(`Bebas Neue fetch failed: ${r.status}`);
      return r.arrayBuffer();
    });
  }
  return bebasPromise;
}

// Deterministic starfield matching og-pro.png's pipeline — 60 stars, mixed
// white/gold/mint/blue, seeded with a fixed PRNG so the layout is stable
// across regenerations. Mulberry32 in 12 lines.
function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
type Star = { x: number; y: number; r: number; color: string; opacity: number };
function buildStars(): Star[] {
  const rng = mulberry32(0xc051e711);
  const colors: { c: string; w: number }[] = [
    { c: "#ffffff", w: 0.55 },
    { c: GOLD, w: 0.15 },
    { c: MINT, w: 0.12 },
    { c: BLUE, w: 0.1 },
    { c: "#ffffff", w: 0.08 },
  ];
  const out: Star[] = [];
  for (let i = 0; i < 60; i++) {
    const x = Math.round(rng() * 1200);
    const y = Math.round(rng() * 630);
    const sizeRoll = rng();
    const r = sizeRoll > 0.92 ? 2.2 : sizeRoll > 0.65 ? 1.4 : 0.9;
    const opacity = 0.4 + rng() * 0.5;
    const wRoll = rng();
    let acc = 0;
    let pick = colors[0];
    for (const c of colors) {
      acc += c.w;
      if (wRoll <= acc) {
        pick = c;
        break;
      }
    }
    out.push({ x, y, r, color: pick.c, opacity });
  }
  return out;
}

type Tier = "wolf" | "solid" | "mid" | "rip";

const TIER_META: Record<Tier, { label: string; glyph: string; color: string; mood: string }> = {
  wolf: { label: "WOLF", glyph: "🐺", color: MINT, mood: "hyped" },
  solid: { label: "SOLID", glyph: "💪", color: MINT, mood: "smirk" },
  mid: { label: "MID", glyph: "😬", color: "#ffffff", mood: "sideeye" },
  rip: { label: "RIP", glyph: "💀", color: RED, mood: "dead" },
};

function SaturnGlyph({ color = MINT, size = 44 }: { color?: string; size?: number }) {
  const ratio = size / 40;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth={2 * ratio} />
      <ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke={color} strokeWidth={1.5 * ratio} transform="rotate(-23 20 20)" />
    </svg>
  );
}

function CosmicMascot({ mood = "smirk", color = MINT, size = 200 }: { mood?: string; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <ellipse cx="80" cy="80" rx="70" ry="20" fill="none" stroke={color} strokeWidth="2" transform="rotate(-23 80 80)" />
      <path d="M 50 50 L 44 22 L 66 42 Z" fill="none" stroke={color} strokeWidth="2" />
      <path d="M 110 50 L 116 22 L 94 42 Z" fill="none" stroke={color} strokeWidth="2" />
      <ellipse cx="80" cy="86" rx="38" ry="36" fill="none" stroke={color} strokeWidth="2" />
      {mood === "hyped" && (
        <>
          <ellipse cx="62" cy="80" rx="4" ry="4" fill={color} />
          <ellipse cx="98" cy="80" rx="4" ry="4" fill={color} />
          <path d="M 60 100 Q 80 120 100 100" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {mood === "smirk" && (
        <>
          <path d="M 60 80 Q 67 76 74 80" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="98" cy="80" rx="3.5" ry="3" fill={color} />
          <path d="M 64 104 Q 80 112 96 102" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {mood === "sideeye" && (
        <>
          <ellipse cx="68" cy="80" rx="3.5" ry="3" fill={color} />
          <ellipse cx="92" cy="80" rx="3.5" ry="3" fill={color} />
          <line x1="62" y1="106" x2="98" y2="106" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {mood === "dead" && (
        <>
          <line x1="56" y1="76" x2="68" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="68" y1="76" x2="56" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="92" y1="76" x2="104" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="104" y1="76" x2="92" y2="84" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="62" y1="108" x2="98" y2="108" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function CosmicBg() {
  return (
    <>
      {/* Saturn ring extending off-frame on right */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex" }}>
        <svg viewBox="0 0 1200 630" width="1200" height="630">
          <ellipse cx="900" cy="315" rx="800" ry="120" fill="none" stroke={MINT} strokeWidth="1.5" opacity="0.25" transform="rotate(-23 900 315)" />
          <ellipse cx="900" cy="315" rx="640" ry="80" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.15" transform="rotate(-23 900 315)" />
        </svg>
      </div>
      {/* Aurora top */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 200,
          background: `linear-gradient(180deg, ${MINT}33 0%, ${BLUE}22 40%, transparent 100%)`,
          display: "flex",
        }}
      />
      {/* Dot grid */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(${MINT}22 1.5px, transparent 1.5px)`,
          backgroundSize: "32px 32px",
          opacity: 0.5,
          display: "flex",
        }}
      />
      {/* Scattered stars */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {[
          [120, 90, 2, "#fff", 0.5],
          [240, 60, 1, GOLD, 0.7],
          [400, 120, 2, "#fff", 0.4],
          [560, 80, 1.5, BLUE, 0.7],
          [720, 110, 2, "#fff", 0.5],
          [900, 70, 1, GOLD, 0.6],
          [1080, 130, 2, "#fff", 0.4],
          [100, 460, 2, "#fff", 0.4],
          [320, 520, 1.5, GOLD, 0.6],
          [580, 480, 1, "#fff", 0.5],
          [780, 540, 2, "#fff", 0.4],
          [1020, 500, 1.5, BLUE, 0.6],
        ].map(([cx, cy, r, color, op], i) => (
          <svg key={i} style={{ position: "absolute", left: cx as number, top: cy as number, display: "flex" }} width={(r as number) * 2 + 2} height={(r as number) * 2 + 2}>
            <circle cx={(r as number) + 1} cy={(r as number) + 1} r={r as number} fill={color as string} opacity={op as number} />
          </svg>
        ))}
      </div>
    </>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const day = url.searchParams.get("day");
  const item = url.searchParams.get("item");
  const scoreRaw = url.searchParams.get("score");
  const totalRaw = url.searchParams.get("total");
  const dollarsRaw = url.searchParams.get("dollars");
  const tierRaw = url.searchParams.get("tier") as Tier | null;
  const gridRaw = url.searchParams.get("grid");

  const isResult = scoreRaw !== null && totalRaw !== null && dollarsRaw !== null && tierRaw !== null;

  if (isResult) {
    const tier = (TIER_META[tierRaw as Tier] ? (tierRaw as Tier) : "mid");
    const tm = TIER_META[tier];
    const grid = (gridRaw || "").slice(0, 10);

    const response = new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: BLACK, display: "flex", flexDirection: "column", position: "relative" }}>
          <CosmicBg />

          {/* Top-left wordmark */}
          <div style={{ position: "absolute", top: 48, left: 56, display: "flex", alignItems: "center", gap: 14 }}>
            <SaturnGlyph />
            <div style={{ fontSize: 22, color: MINT, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.05em", display: "flex" }}>
              loot.works/flip
            </div>
          </div>

          {/* Top-right DAY chip */}
          {day && (
            <div
              style={{
                position: "absolute", top: 48, right: 56,
                padding: "8px 18px", border: `2px solid ${MINT}`,
                color: MINT, fontSize: 18,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing: "0.16em", display: "flex",
              }}
            >
              DAY {day}
            </div>
          )}

          {/* Mascot upper-right */}
          <div style={{ position: "absolute", top: 140, right: 80, display: "flex" }}>
            <CosmicMascot mood={tm.mood} color={tm.color} size={160} />
          </div>

          {/* Center score */}
          <div
            style={{
              position: "absolute", top: 110, left: 60, right: 0,
              fontSize: 200, fontWeight: 900, lineHeight: 1,
              letterSpacing: "-0.04em",
              color: tm.color,
              fontFamily: "system-ui, sans-serif",
              display: "flex",
            }}
          >
            {scoreRaw}/{totalRaw}
          </div>

          {/* Dollars */}
          <div
            style={{
              position: "absolute", top: 340, left: 60,
              fontSize: 64, fontWeight: 700,
              color: GOLD,
              display: "flex", letterSpacing: "0.01em",
            }}
          >
            ${dollarsRaw} SPOTTED
          </div>

          {/* Tier pill */}
          <div
            style={{
              position: "absolute", top: 430, left: 60,
              fontSize: 40, fontWeight: 900,
              color: tier === "mid" || tier === "rip" ? "#000" : "#000",
              background: tm.color,
              padding: "12px 26px",
              display: "flex", gap: 16, alignItems: "center",
              letterSpacing: "0.05em",
            }}
          >
            <span>{tm.glyph}</span><span>{tm.label}</span>
          </div>

          {/* Emoji grid bottom-left */}
          {grid && (
            <div
              style={{
                position: "absolute", bottom: 48, left: 60,
                fontSize: 36, display: "flex", letterSpacing: "0.06em",
              }}
            >
              {grid}
            </div>
          )}

          {/* Bottom-right tag */}
          <div
            style={{
              position: "absolute", bottom: 56, right: 60,
              fontSize: 22, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: MINT, opacity: 0.85, letterSpacing: "0.05em", display: "flex",
            }}
          >
            play daily →
          </div>
        </div>
      ),
      { ...SIZE, headers: CACHE_HEADERS },
    );
    return response;
  }

  // Evergreen / per-day — cosmic editorial system, matches /og-pro.png and
  // /og-kit.png. Bebas Neue for the headline, JetBrains Mono fallback chain
  // for the mono accents.
  let bebasData: ArrayBuffer | null = null;
  try {
    bebasData = await loadBebas();
  } catch {
    // Network blip or upstream changes — fall back to system sans-serif
    // (still bold + condensed-looking at 140px) rather than 500ing the OG.
    bebasData = null;
  }

  const stars = buildStars();
  const headlineFont = bebasData ? "Bebas Neue" : "system-ui, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: COSMIC_BLACK,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Layered cosmic gradient — subtle nebula bloom in opposing corners */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              `radial-gradient(ellipse 700px 500px at 18% 12%, rgba(123,143,255,0.08), transparent 65%),` +
              `radial-gradient(ellipse 900px 700px at 78% 88%, rgba(92,224,184,0.06), transparent 60%)`,
            display: "flex",
          }}
        />

        {/* Dot grid — same 32px cadence as og-pro */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            display: "flex",
          }}
        />

        {/* Saturn ring — lower-right, off-canvas, mint particle stroke at -23deg */}
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -100,
            width: 700,
            height: 700,
            transform: "rotate(-23deg)",
            display: "flex",
          }}
        >
          <svg viewBox="0 0 700 700" width="700" height="700">
            <ellipse cx="350" cy="350" rx="320" ry="92" fill="none" stroke={MINT} strokeWidth="1.2" opacity="0.32" strokeDasharray="1.5 4" />
            <ellipse cx="350" cy="350" rx="270" ry="76" fill="none" stroke={MINT} strokeWidth="1" opacity="0.22" strokeDasharray="1 3" />
            <ellipse cx="350" cy="350" rx="380" ry="110" fill="none" stroke={MINT} strokeWidth="1" opacity="0.22" strokeDasharray="1 3" />
            <circle cx="350" cy="350" r="150" fill="rgba(40,30,60,0.4)" stroke="rgba(123,143,255,0.45)" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Starfield — 60 deterministic pinpoints */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <svg viewBox="0 0 1200 630" width="1200" height="630">
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.color} opacity={s.opacity} />
            ))}
          </svg>
        </div>

        {/* Top-left wordmark — mono mint caps */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 64,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <SaturnGlyph color={MINT} size={36} />
          <div
            style={{
              fontSize: 24,
              color: MINT,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.28em",
              fontWeight: 500,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            LOOT.WORKS&nbsp;&nbsp;/&nbsp;&nbsp;FLIP
          </div>
        </div>

        {/* Per-day chip — top-right, mono mint outlined */}
        {day && (
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 64,
              padding: "10px 18px",
              border: `2px solid ${MINT}`,
              color: MINT,
              fontSize: 18,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.18em",
              display: "flex",
            }}
          >
            DAY {day}
          </div>
        )}

        {/* Editorial headline stack — center-left vertical alignment, mirrors og-pro */}
        <div
          style={{
            position: "absolute",
            left: 64,
            top: 230,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: 140,
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            FLIP OR SKIP.
          </div>
          {/* Faux-italic via skew — Bebas Neue regular has no italic glyphs,
              and Satori can't synthesize one. CSS skewX keeps the geometry
              honest at OG-render scale. */}
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: 80,
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: GOLD,
              textTransform: "uppercase",
              transform: "skewX(-10deg)",
              transformOrigin: "left",
              marginTop: 8,
              display: "flex",
            }}
          >
            DAILY DROP.
          </div>
          <div
            style={{
              fontSize: 24,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: MINT,
              textTransform: "uppercase",
              marginTop: 36,
              display: "flex",
            }}
          >
            10 ITEMS&nbsp;&nbsp;·&nbsp;&nbsp;TRUST YOUR GUT
          </div>
        </div>

        {/* Per-day item — optional accent line below the stack */}
        {item && (
          <div
            style={{
              position: "absolute",
              bottom: 110,
              left: 64,
              fontSize: 22,
              color: MINT,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.06em",
              display: "flex",
              maxWidth: 760,
              opacity: 0.85,
            }}
          >
            today: {item}
          </div>
        )}

        {/* Bottom-left URL — mono mint 50% opacity, matches og-pro footer */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 64,
            fontSize: 14,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: MINT,
            opacity: 0.55,
            letterSpacing: "0.18em",
            display: "flex",
          }}
        >
          loot.works/flip
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: CACHE_HEADERS,
      fonts: bebasData
        ? [{ name: "Bebas Neue", data: bebasData, weight: 400, style: "normal" }]
        : undefined,
    },
  );
}
