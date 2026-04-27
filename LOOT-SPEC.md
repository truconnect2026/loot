# LOOT — Build Spec for Claude Code

## How to use this file

This is the complete spec for LOOT, a reseller arbitrage PWA. Drop this file into your project root as SPEC.md. Reference it in every Claude Code prompt: "Read SPEC.md, then build [specific thing]."

The spec is structured as buildable units. Each section is a self-contained prompt you can copy into Claude Code. Don't ask Claude Code to "build the whole app" — give it one section at a time and let it finish before moving on.

## Prompt strategy (minimize token usage)

1. First prompt: "Read SPEC.md. Set up the Next.js 15 project with TypeScript, Tailwind, and the design tokens from the spec. Create the folder structure and install dependencies. Don't build any pages yet."

2. Second prompt: "Read SPEC.md section 'Shared Components.' Build all 7 shared components."

3. Third prompt: "Read SPEC.md section 'Login Page.' Build it using the shared components."

4. Fourth prompt: "Read SPEC.md section 'Dashboard Page.' Build it using the shared components."

5. Fifth prompt: "Read SPEC.md section 'Account Page.' Build it using the shared components."

6. Sixth prompt: "Read SPEC.md section 'Backend.' Set up Supabase auth, database schema, and API routes."

7. Seventh prompt: "Read SPEC.md section 'Scan Engine.' Build the barcode scanner, Claude API integration, and eBay comps lookup."

Seven prompts. That's the whole app. Each prompt is scoped enough that Claude Code won't spiral. Each references the spec so you don't re-explain anything.

---

## Design Tokens

```css
/* Paste into tailwind config or globals.css */

/* Backgrounds */
--bg-page: #120e18;
--bg-surface: #17122A;
--bg-recessed: #120e18;

/* Borders */
--border-default: #2A2240;
--border-subtle: #1E1835;
--border-dim: #3D2E55;

/* Text */
--text-primary: #C8C0D8;
--text-muted: #5A4E70;
--text-dim: #3D2E55;

/* Accents */
--accent-mint: #5CE0B8;
--accent-camel: #D4A574;
--accent-red: #E8636B;
--accent-blue: #7B8FFF;

/* Accent surfaces (8% opacity fills) */
--accent-mint-surface: #5CE0B814;
--accent-mint-border: #5CE0B840;
--accent-camel-surface: #D4A57414;
--accent-camel-border: #D4A57440;
--accent-red-surface: #E8636B14;
--accent-red-border: #E8636B40;

/* Specific */
--profit-glow: 0 0 20px #5CE0B815;
--press-bg: #1F1835;
```

```
Fonts:
- Outfit: weights 300, 500, 600
- JetBrains Mono: weights 500, 700
- All numbers: font-feature-settings: "tnum"

Border radius system:
- Asymmetric cards (feeds, account tiles): 4px top-left, 14px other three
- Standard cards/buttons: 14px all
- Small elements (badges, recessed cells): 6-8px
- Stats bar container: 10px
```

---

## Shared Components

### DotGridBackground
Full-viewport background with two SVG pattern layers.
- Layer 1: isometric diamond grid, stroke #5CE0B8 at 0.015 opacity, static
- Layer 2: dot grid, 2px circles #5CE0B8, 36px spacing, 0.03 opacity
- CSS animation: dots pulse 0.02 → 0.04 opacity, 8s infinite ease-in-out
- Implementation: two CSS background-image properties with inline SVG data URIs, layered
- No canvas, no JS

### CoinMark
SVG component. Circle with horizontal line through center, line extends 2px past circle. Stroke-only, 1.5px.
- Props: size (default 24), color (default --accent-mint)
- Used in: header (24px), favicon (16px), loading spinner (32px with CSS rotate 2s linear infinite at 0.4 opacity)

### CoinRain
Canvas component.
- Triggers via boolean prop `active`
- 28 particles: ellipses (4-10px radius), alternating #5CE0B8 / #8AF0D4
- Physics: gravity (vy += 0.12), horizontal drift (vx = random -1 to 1), rotation, opacity fade (-0.004/frame)
- Duration: ~1.5s (180 frames), self-cleans
- Position: fixed, inset 0, z-50, pointer-events none
- Canvas resolution: 2x for retina

### AnimNum
React hook/component.
- Props: value (number), prefix (string, default ""), duration (ms, default 800)
- Uses requestAnimationFrame, cubic ease-out: 1 - Math.pow(1 - progress, 3)
- Returns rounded integer display value
- Tabular figures on the rendered text

### BottomSheet
- Props: open (boolean), onClose, borderColor (string), children
- Backdrop: fixed inset 0, bg black/70, backdrop-blur 8px, z-40
- Sheet: bg --bg-surface, border-top 2px solid borderColor, border-radius 20px 20px 0 0
- Drag handle: 36px × 4px, bg --border-default, border-radius 2px, centered, 8px from top
- Animation: translateY 100% → 0, 400ms cubic-bezier(0.34, 1.4, 0.64, 1)
- Swipe to dismiss: track touch deltaY, if > 100px close
- Tap backdrop to close

### PageTransition
- Wraps page content
- Forward: translateX(0) → translateX(-100%) outgoing, translateX(100%) → translateX(0) incoming
- Back: reverse
- Duration 250ms ease-out
- Implementation: layout wrapper with CSS transitions, direction tracked via state/context

### TilePressable
- Wraps any tappable card/tile
- onPressDown: bg → --press-bg, translateY(1px), 80ms
- onPressUp: spring back, 150ms
- Props: children, onTap, className

---

## Login Page

Route: / (redirect to /app if authed)

Full viewport, flexbox column, center center, min-h-screen. Content max-w-[300px] mx-auto px-8.

Top to bottom:
1. Logo group: CoinMark (24px) + "LOOT" text (JetBrains Mono 700 40px --accent-mint tracking-[0.06em]), horizontal flex, gap-2. Design line: 1px line extending 40px right from end of text, --accent-mint at 0.15 opacity, vertically centered. mb-14.

2. Google button: TilePressable wrapper. w-full h-[52px] bg-[--bg-surface] border border-[--border-default] rounded-[14px]. Interior: Google "G" SVG (18px) left with pl-4, "Continue with Google" Outfit 500 15px --text-primary centered. Loading state: text fades to "Connecting..."

3. Divider: full-width 1px line --border-default, "or" centered in JetBrains Mono 10px --text-dim with bg-matching padding to break line. my-5.

4. Email row: flex horizontal. Input: flex-1, bg-[--bg-surface] border border-[--border-default] rounded-l-[14px] h-[50px] px-4 Outfit 14px. Placeholder "email" in --text-dim. Focus: border transitions to --accent-mint-border 200ms. Send button: bg-[--accent-mint-surface] border border-[--accent-mint-border] rounded-r-[14px] h-[50px] w-[50px]. Arrow → icon 18px --accent-mint. On send: arrow morphs to checkmark, text becomes "check your email".

5. Social proof (post-launch only): mt-10, JetBrains Mono 11px --text-muted, centered. Pull from Supabase aggregate query.

Background: DotGridBackground component.

Auth: Supabase Auth, Google OAuth + magic link. Session in httpOnly cookie. Middleware redirects authed users to /app.

---

## Dashboard Page

Route: /app (redirect to / if not authed)

Background: DotGridBackground. Full scroll, no sticky. max-w-[480px] mx-auto px-[18px].

### Header
flex justify-between items-center. Left: CoinMark (20px) + "LOOT" JetBrains Mono 700 20px --accent-mint tracking-[0.06em] + design line (same spec, 40px). Right: avatar 32px circle bg-[--bg-surface] border border-[--border-default], initials Outfit 500 13px --text-muted. Tap → navigate to /account.

### Stats Bar
mt-4. Unified container bg-[--bg-surface] border border-[--border-default] rounded-[10px] h-[44px] flex.

4 cells, flex-1 each, text-center, py-[10px]:
| Label | Value color | Value weight/size |
|-------|-----------|-----------------|
| SCANS | --text-primary | JetBrains Mono 700 15px |
| BUYS | --accent-mint | JetBrains Mono 700 15px |
| SPENT | --text-primary | JetBrains Mono 700 15px |
| PROFIT | --accent-mint | Outfit 300 18px + text-shadow --profit-glow |

Labels: JetBrains Mono 7px --text-muted tracking-[0.10em].
All values wrapped in AnimNum.

### Scan Buttons
mt-4. Full-width 0.5px line --border-default. mt-4.
flex gap-2, two buttons flex-1.

Each: TilePressable, h-[64px] rounded-[14px], flex-col items-center justify-center gap-[7px].

| Button | BG | Border | Icon | Text |
|--------|-----|--------|------|------|
| SCAN UPC | --accent-mint 8% | --accent-mint 25% | barcode stroke 26px | JetBrains Mono 700 10px tracking-[0.08em] |
| AI VISION | --accent-camel 8% | --accent-camel 25% | camera stroke 26px | JetBrains Mono 700 10px tracking-[0.08em] |

On press: scale(0.97) 100ms. Opens ScanOverlay.

New user hint below (hidden after first scan): "works at thrift stores, yard sales, and retail clearance" JetBrains Mono 9px --text-dim text-center.

mt-4. Full-width 0.5px line --border-default. mt-4.

### Feed Grid
2×2, gap-2.

Each FeedCard: TilePressable. w-[calc(50%-4px)] h-[100px]. bg-[--bg-surface] border border-[--border-default]. Border-radius: 4px top-left, 14px others. Left accent bar: 3px wide pseudo-element, rounded 2px ends, accent color. Binary opacity: recent items (< 30min) = full, else 0.5.

Interior (p-[14px]):
- Icon 20px, top-left
- Title: Outfit 600 13px --text-primary, below icon
- Subtitle: JetBrains Mono 9px --text-muted, below title
- Badge: bottom-right, 4px dot with sonar ring animation (1px ring → 8px, fade, 2.5s ease-out loop) + count JetBrains Mono 9px

Cards:
| # | Name | Subtitle | Icon | Accent |
|---|------|----------|------|--------|
| 1 | Deals Near You | FB + Craigslist flips | map-pin | mint |
| 2 | Penny Drops | weekly Dollar General list | tag | camel |
| 3 | Free Finds | free stuff worth reselling | gift | mint |
| 4 | Store Clearance | markdowns below resale | shopping-bag | camel |

New user (no zip): badge replaced with "set zip in settings" (or "updated Tuesdays" for Penny) in JetBrains Mono 9px --text-muted.

### Tool Grid
mt-4. "MORE TOOLS" label: JetBrains Mono 9px --text-dim tracking-[0.10em], 0.5px lines on each side. mb-3.

2-col grid, gap-2. Each ToolTile: TilePressable. h-[60px] bg-[--bg-surface] border border-[--border-subtle] rounded-[12px]. Interior: icon 16px left pl-3, title Outfit 600 12px --text-primary center, chevron --text-dim right pr-3.

| Row | Left | Right |
|-----|------|-------|
| 1 | Shelf Scanner | Price Check |
| 2 | Yard Sale Map | Estate Sales |
| 3 | Haul Log | Fake Checker |
| 4 | Liquidation Analyzer | Scrap Finder |

### Bottom: pb-10

### ScanOverlay
Fixed fullscreen, bg #120e18/95, z-30. Flex col center center.

Scanner frame: 200×200, border 1.5px accent/30, rounded-[16px], relative, overflow hidden.
- 4 corner brackets: absolute, 28×28, 3px solid accent
- Scan line: absolute, horizontal, accent gradient (transparent→color→transparent), 2px, animate top 5%→88%, 1.5s ease-in-out infinite
- 3 pulse rings: absolute, centered, expanding circles, 1px border accent (decreasing opacity), animate scale 0.85→1.4 + fade, 2s staggered 0.4s

Below: mode text JetBrains Mono 12px --text-muted. Progress bar 180×3px. Cancel button.

### VerdictSheet
BottomSheet with borderColor per verdict.

Content:
- Method label: JetBrains Mono 10px --text-muted uppercase
- Name: Outfit 600 17px --text-primary
- Badge: centered, JetBrains Mono 700 16px, color/bg/border per verdict (mint/red/camel)
- 3-col grid: COST (--text-primary), SELL (--accent-mint), PROFIT (verdict color). Recessed cells bg-[--bg-recessed] rounded-[10px] p-3. Values JetBrains Mono 700 22px.
- 2×2 grid: ROI, PLATFORM, FEE, COMPS. Recessed cells, labels 9px --text-muted, values 12px --text-primary (COMPS in --accent-mint).
- CTA: "GENERATE FB LISTING" full-width bg-[--accent-mint-surface] border border-[--accent-mint-border] rounded-[12px] p-[14px] JetBrains Mono 700 12px --accent-mint. Lightning icon left.

BUY → trigger CoinRain.

---

## Account Page

Route: /account

DotGridBackground. Back arrow top-left (chevron-left 18px --text-muted, on press → --text-primary 80ms), navigates back via PageTransition.

### Profile Card
mt-4. bg-[--bg-surface] border border-[--border-default] rounded-[4px_14px_14px_14px] p-5.

Horizontal layout: flex items-center gap-[14px].
- Avatar: 44px circle, border 1px --text-muted/30, initials Outfit 500 16px --text-muted
- Name: Outfit 600 17px --text-primary
- Email: JetBrains Mono 11px --text-muted (below name, 4px gap)
- PRO pill: ml-auto, bg-[--accent-mint-surface] border border-[--accent-mint-border] rounded-[4px], "PRO" JetBrains Mono 700 8px --accent-mint px-[10px] py-[4px]

Dashed line: mt-4 mb-4, 2px dash 6px gap --border-default.

Subscription:
- "$9.99" JetBrains Mono 700 24px --text-primary + "/mo" JetBrains Mono 400 12px --text-muted
- Two recessed cells (bg-[--bg-recessed] rounded-[8px] p-[10px]) side by side gap-2: RENEWS date + SCANS "unlimited" (--accent-mint)
- "cancel anytime" Outfit 400 12px --accent-red, text-center, mt-[10px], taps to Stripe

### Settings Tiles
mt-4. Stack of tiles, grouped spacing:

Group 1 (gap-[6px]):

**Zip code** — 52px. "Zip code" Outfit 600 13px left. Recessed cell right: JetBrains Mono 700 14px --accent-mint. Tap: inline edit, border → --accent-mint-border 200ms.

**Search radius** — 52px. "Search radius" left. Recessed cell "15 mi" JetBrains Mono 700 14px --text-primary right. Tap: BottomSheet with slider (track 3px --bg-recessed, fill --accent-mint/30, thumb 16px circle --bg-surface border --accent-mint-border).

**BOLO keywords** — 52px. "BOLO keywords" left. "6 keywords" JetBrains Mono 12px --text-muted + chevron right. Tap: PageTransition to sub-list. Sub-list: keyword tiles (44px, text left, X icon --accent-red right, delete = remove from state). Add tile: dashed border, plus icon, inline input.

Gap mt-4:

**Push notifications** — 52px (expands when on). "Push notifications" left. Toggle right: 36×20px track, rounded-[10px]. Off: bg-[--bg-recessed] border-[--border-default] thumb-[--border-default] left. On: bg-[--accent-mint/15] border-[--accent-mint/25] thumb-[--accent-mint] right. Transition 200ms cubic-bezier(0.34, 1.4, 0.64, 1). When on: 3 sub-toggles fade in (200ms staggered 50ms): "Deal alerts" / "BOLO matches" / "Penny drops" — Outfit 400 12px --text-muted, smaller toggles 28×16px, inset pl-4.

Gap mt-4:

**Export haul log** — 60px. "Export haul log" left + "CSV for taxes" JetBrains Mono 9px --text-muted subtitle. Download icon 16px --accent-mint right. Tap: icon 0.3 opacity during export, "exported" text appears 2s.

Gap mt-6:

**Sign out** — 52px. "Sign out" Outfit 600 13px --accent-red left. Door-arrow icon --accent-red right. Border 1px --accent-red/15. Tap: Supabase signOut → redirect to /.

### Bottom: pb-10

---

## Backend

### Supabase Schema

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  zip_code text,
  search_radius_miles int default 15,
  has_scanned boolean default false,
  created_at timestamptz default now()
);

-- BOLO keywords
create table bolo_keywords (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  keyword text not null,
  created_at timestamptz default now()
);

-- Scan history / haul log
create table scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  method text check (method in ('barcode', 'vision')),
  item_name text,
  upc text,
  cost numeric(10,2),
  sell_price numeric(10,2),
  profit numeric(10,2),
  verdict text check (verdict in ('BUY', 'PASS', 'MAYBE')),
  platform text,
  fee numeric(10,2),
  comps_data jsonb,
  image_url text,
  sold boolean default false,
  sold_price numeric(10,2),
  sold_at timestamptz,
  created_at timestamptz default now()
);

-- Scraped listings (deals, free stuff, clearance)
create table listings (
  id uuid default gen_random_uuid() primary key,
  source text check (source in ('fb_marketplace', 'craigslist', 'craigslist_free', 'nextdoor', 'yard_sale', 'estate_sale')),
  title text,
  price numeric(10,2),
  estimated_value numeric(10,2),
  profit_estimate numeric(10,2),
  url text,
  image_url text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  zip_code text,
  category text,
  is_free boolean default false,
  posted_at timestamptz,
  scraped_at timestamptz default now(),
  listing_hash text unique
);

-- Penny list items
create table penny_items (
  id uuid default gen_random_uuid() primary key,
  store text check (store in ('dollar_general', 'dollar_tree')),
  item_name text,
  upc text,
  source_url text,
  week_of date,
  created_at timestamptz default now()
);

-- Notification preferences
create table notification_prefs (
  user_id uuid references profiles(id) primary key,
  deals boolean default true,
  bolo boolean default true,
  pennies boolean default true
);

-- RLS: users can only read/write their own data
-- listings and penny_items are readable by all authed users
```

### API Routes (Next.js App Router)

```
/api/scan          POST  — barcode or image → Claude + eBay comps → verdict
/api/shelf-scan    POST  — shelf image → Claude Vision → multiple items
/api/price-check   POST  — item name → eBay comps → pricing summary
/api/listing       POST  — scan data → Claude → FB listing copy
/api/fake-check    POST  — image → Claude Vision → auth assessment
/api/tag-decode    POST  — tag image → Claude Vision → decoded pricing
/api/scrap-id      POST  — image → Claude Vision → metal ID + value
/api/liquidation   POST  — manifest URL → parse + comps → verdict
/api/feeds/deals   GET   — listings filtered by user zip + radius
/api/feeds/free    GET   — free listings filtered by user zip + radius
/api/feeds/pennies GET   — current week penny items
/api/feeds/clearance GET — clearance items below resale in user zip
/api/export        GET   — CSV export of user's scan history
```

### Cron Jobs (Vercel Cron)

```
0 */6 * * *   scrape FB Marketplace by zip codes of active users
0 */6 * * *   scrape Craigslist free + for-sale by zip
0 14 * * MON  scrape penny list blogs (Krazy Coupon Lady, TheFreebieGuy, PennyPinchinMom)
0 8 * * *     scrape yard sale sites (Gsalr, EstateSales.org)
0 */12 * * *  scrape scrap yard prices
0 * * * *     run new listings through Claude Haiku batch enrichment
```

---

## Scan Engine

### Barcode flow
1. BarcodeDetector API (check support with `'BarcodeDetector' in window`)
2. Fallback: @zxing/browser ZXingBrowser.BrowserMultiFormatReader
3. Camera: getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
4. On decode → UPC string
5. UPC → UPCitemdb API (free, 100/day) → product name + details
6. Product name → eBay Browse API (search sold items, free 5k/day) → recent sold prices
7. All data → Claude Haiku API call with system prompt:

```
You are a reselling arbitrage expert. Given an item and its eBay sold comps, determine if it's worth buying to resell on Facebook Marketplace.

Respond in JSON:
{
  "verdict": "BUY" | "PASS" | "MAYBE",
  "sell_price": number,
  "profit": number,
  "platform": "FB Local" | "FB Shipped",
  "fee": number,
  "reasoning": "string",
  "listing_title": "string",
  "listing_description": "string"
}

FB Local = 0% fee. FB Shipped = 10% fee. Default to FB Local.
BUY = profit margin > $15 or > 100% ROI.
MAYBE = profit $5-15.
PASS = profit < $5 or no reliable comps.
```

### Vision flow (AI Vision, shelf scan, fake check, tag decode, scrap ID)
1. Camera capture or file upload → base64 image
2. Image → Claude Sonnet 4.6 API with task-specific system prompt
3. Response → parsed and displayed

### Shelf scan specific:
System prompt tells Claude to identify every visible item (book spines, product labels, etc), return a JSON array of items with estimated values, ranked by profit potential.

---

## File Structure

```
loot/
├── SPEC.md                          ← this file
├── next.config.ts
├── tailwind.config.ts               ← design tokens
├── package.json
├── public/
│   ├── favicon.svg                  ← CoinMark
│   └── manifest.json                ← PWA manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← root layout, fonts, DotGridBackground
│   │   ├── page.tsx                 ← login page (/)
│   │   ├── app/
│   │   │   └── page.tsx             ← dashboard (/app)
│   │   ├── account/
│   │   │   └── page.tsx             ← account (/account)
│   │   └── api/
│   │       ├── scan/route.ts
│   │       ├── shelf-scan/route.ts
│   │       ├── price-check/route.ts
│   │       ├── listing/route.ts
│   │       ├── fake-check/route.ts
│   │       ├── tag-decode/route.ts
│   │       ├── scrap-id/route.ts
│   │       ├── liquidation/route.ts
│   │       ├── feeds/
│   │       │   ├── deals/route.ts
│   │       │   ├── free/route.ts
│   │       │   ├── pennies/route.ts
│   │       │   └── clearance/route.ts
│   │       └── export/route.ts
│   ├── components/
│   │   ├── shared/
│   │   │   ├── DotGridBackground.tsx
│   │   │   ├── CoinMark.tsx
│   │   │   ├── CoinRain.tsx
│   │   │   ├── AnimNum.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   └── TilePressable.tsx
│   │   ├── login/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsBar.tsx
│   │   │   ├── ScanButtons.tsx
│   │   │   ├── FeedCard.tsx
│   │   │   ├── ToolTile.tsx
│   │   │   ├── ScanOverlay.tsx
│   │   │   └── VerdictSheet.tsx
│   │   └── account/
│   │       ├── ProfileCard.tsx
│   │       ├── SettingsTile.tsx
│   │       ├── ZipInput.tsx
│   │       ├── RadiusSheet.tsx
│   │       ├── BoloList.tsx
│   │       └── NotificationToggles.tsx
│   ├── lib/
│   │   ├── supabase.ts              ← client + server clients
│   │   ├── claude.ts                ← API wrapper
│   │   ├── ebay.ts                  ← Browse API wrapper
│   │   ├── upc.ts                   ← UPCitemdb wrapper
│   │   └── scanner.ts               ← BarcodeDetector + zxing
│   └── types/
│       └── index.ts                 ← TypeScript types for all entities
└── supabase/
    └── migrations/
        └── 001_initial.sql          ← schema from above
```

---

## Pricing & Stripe

Three tiers:
- Free: 5 scans/day, no feeds, no shelf scanner, no yard sale map
- Pro $9.99/mo: everything unlimited
- Annual $89.99/yr: same as Pro

Stripe Checkout for subscription creation. Stripe Customer Portal for management/cancellation. Webhook on invoice.paid to update Supabase profile. Check scan count against daily limit for free users in /api/scan.

---

## Feature List (complete)

Core scanning:
1. Single-item barcode scan → verdict
2. Single-item AI vision → verdict
3. Shelf scanner (photo of shelf → batch item ID)
4. Price check (type item name → comps)

Feeds (scraped + enriched):
5. Deals Near You (FB MP + CL underpriced)
6. Free Finds (CL free + FB free + Nextdoor + Buy Nothing)
7. Penny Drops (DG + Dollar Tree weekly penny lists)
8. Store Clearance (BrickSeek + retail app clearance below resale)

Tools:
9. Yard Sale Map (scraped sales on Mapbox + AI ranking + route)
10. Estate Sale Scanner (preview photo AI analysis)
11. Haul Log + P&L (scan history, mark sold, running profit)
12. Fake Checker (AI authentication of designer items)
13. Liquidation Lot Analyzer (paste manifest → verdict)
14. Scrap Metal Finder (yard map + prices + AI metal ID)
15. BOLO Alerts (keyword matching on radar feeds → push)
16. Price Tag Decoder (snap clearance tag → decoded)
17. Listing Generator (Claude writes FB listing from scan)
18. Flip Calculator (cross-platform fee comparison, inside verdict sheet)

Settings:
19. Clearance Calendar (markdown schedules inside Penny Drops feed)
20. Coupon + Clearance Stacking tips (inside Penny Drops feed)

---

## Monthly Cost

At launch (personal use): ~$10-15 (Claude API tokens only, everything else free tier)
At 100 users: ~$30-50 (Claude API scales, everything else still free tier except maybe Vercel Pro at $20)
Breakeven: 2-4 Pro subscribers
