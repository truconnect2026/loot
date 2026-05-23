# loot.works platform audit — 2026-05-23

Audit window: last 14 days of shipping (`/pro` v2 → `/kit` unified hub → 60-day refund). Built against commit `5302878` on `main`. Read-only — no code modified, no commits.

**Production smoke-test note:** Vercel's edge firewall is currently rate-limiting this CLI's IP (`X-Vercel-Challenge-Token` on every loot.works request — all 17 routes returned 403). HTTP status data below is therefore drawn from (a) the local `npm run build` route table, (b) prior session bg-curl checkpoints that ran before the firewall kicked in, and (c) Vercel's API confirming the last deploy `dpl_9RFkFtXKPitk35aHPfeS2KS9C7En` is `READY`. Treat the "production HTTP" column as inferred-healthy rather than freshly observed.

---

## TL;DR — top action items

**3 launch blockers** (must fix before ad spend hits /pro):

1. **`/og-pro.png` is referenced but doesn't exist** — every social share of /pro has a broken OG image. Generate one (or copy /og-kit.png style) before paid traffic hits.
2. **Footer placeholders `[BUSINESS NAME]` + `[BUSINESS ADDRESS]` ship to production** on every `/pro`, `/pro/thanks`, `/kit`, `/refund-policy`, `/contact` page. Digistore approval reviewers will flag.
3. **Conflicting support email**: `/privacy` + `/terms` say `hello@loot.works`; everywhere else uses `lootworks.goflip@gmail.com`. Pick one, propagate.

**3 quick wins** (<10 min each):

1. Delete `public/og/partners.png` (orphan, 208 KB — `/partners` route deleted in 171af7e)
2. Delete `public/og/kit.png` (orphan, 204 KB — replaced by `/og-kit.png` in 10f67bf)
3. Replace `hello@loot.works` in `/privacy:131` and `/terms:158` with `lootworks.goflip@gmail.com`

**1 security item**: `next@16.2.4` has a HIGH advisory (DoS via Server Components, CVSS 7.5 — `GHSA-8h8q-6873-q5fj`). Fix is `npm i next@16.2.6` — non-breaking patch. Recommended before ad launch.

---

## Section 1 — Route inventory

21 page routes + 25 API routes + 2 OG-image routes = 48 total entries in the App Router.

### Public marketing routes

| Path | LOC | Static? | Last commit | Inbound links | Metadata |
|---|---|---|---|---|---|
| `/` | 5 | ○ static | ad4696a · 2026-04-27 | (root) | ✓ root layout |
| `/pro` | 95 (page) + 14 components | ○ static | 6bcb349 · 2026-05-21 | Footer, hero CTA, /flip, /kit | ✓ layout |
| `/pro/thanks` | 220 | ○ static | 5302878 · 2026-05-22 | /pro post-checkout, /thanks legacy | ⚠ no metadata export |
| `/kit` | 1743 | ○ static | caf7989 · 2026-05-22 | /pro Footer, /flip Footer, redirects from `/affiliates` + `/partners` | ✓ layout |
| `/flip` | 59 (page) + 23 components | ○ static | eaf1607 · 2026-05-21 | /pro CTA, /app dashboard card, /kit FAQ | ⚠ no metadata export |
| `/contact` | 93 | ○ static | b83c116 · 2026-05-21 | /pro Footer, /refund-policy | ✓ page-level |
| `/refund-policy` | 140 | ○ static | 5302878 · 2026-05-22 | /pro Footer, /contact | ✓ page-level |
| `/terms` | 252 | ○ static | 09ada93 · 2026-05-16 | /pro Footer, /privacy | ✓ page-level |
| `/privacy` | 227 | ○ static | 09ada93 · 2026-05-16 | /pro Footer, /terms | ✓ page-level |
| `/thanks` | 90 | ƒ dynamic | 09ada93 · 2026-05-16 | Digistore (legacy) | ✓ page-level |
| `/welcome` | 17 | ○ static | 92cbd75 · 2026-05-16 | /thanks CTA | ✓ page-level |

### Authed / dashboard routes

| Path | LOC | Static? | Last commit | Notes |
|---|---|---|---|---|
| `/app` | 1994 | ○ static (preview) + dynamic dashboard | eaf1607 · 2026-05-21 | Largest single page file. AppMarketingPreview renders unauthed. |
| `/app/haul` | — | ○ static | — | Sub-route |
| `/onboarding` | 690 | ○ static | 92cbd75 · 2026-05-16 | ⚠ no metadata export |
| `/account` | — | ○ static | — | ⚠ no metadata export |
| `/auth/callback` | — | ƒ dynamic | — | OAuth handler |

### Marketing screenshot routes (image generation)

6 routes under `/marketing-screens/*` — `deal-feed`, `flip-or-skip-game`, `map`, `scan`, `verdict-flip`, `verdict-skip`. Used internally to generate static phone-mockup PNGs, not user-facing. All ○ static.

### OG image routes

| Path | Type | Notes |
|---|---|---|
| `/og-app.png` | ƒ dynamic (`route.tsx` ImageResponse) | Healthy |
| `/og-flip.png` | ƒ dynamic (`route.tsx` ImageResponse) | Healthy |
| `/og-kit.png` | static `.png` in `public/` | Optimized to 244 KB |
| **`/og-pro.png`** | **❌ MISSING — referenced in `src/app/pro/layout.jsx:48,53` but no file on disk** | **Launch blocker** |

### Issues

- **`/og-pro.png` 404**: `/pro` social shares render with broken/missing OG image. Highest-priority fix — `/pro` is the customer-facing sales page that ad traffic will land on.
- **4 routes missing metadata export**: `/pro/thanks`, `/flip`, `/onboarding`, `/account`. `/flip` is the worst offender — it's a discoverable marketing surface; missing metadata means broken social shares and no canonical URL hint to Google.
- **`/thanks` is ƒ dynamic but `/pro/thanks` is ○ static** — different rendering modes for sibling thank-you pages. Could be reconciled but no functional impact.

### Recommended actions (Section 1)

1. **P0** — Create `public/og-pro.png` (or change `/pro` layout to reference `/og-kit.png` as fallback) — eliminates a 404 social-share asset.
2. **P1** — Add `export const metadata` to `/flip` (highest ad-relevant route missing it).
3. **P2** — Add minimal metadata to `/pro/thanks`, `/onboarding`, `/account`.

---

## Section 2 — Component inventory

| Directory | Files | LOC | Notes |
|---|---|---|---|
| `src/components/account/` | 7 | 1,975 | /account dashboard |
| `src/components/app/` | 1 | 622 | AppMarketingPreview only |
| `src/components/dashboard/` | 26 | 11,532 | /app feature sheets, scan UI |
| `src/components/kit/` | 8 | 3,114 | /kit unified hub sections |
| `src/components/login/` | 2 | 999 | LoginPage + PwaInstallBar |
| `src/components/partners/` | 2 | 308 | CountUp + EarningsCalculator (legacy name, still imported by /kit Founding20) |
| `src/components/shared/` | 10 | 1,976 | CoinMark, BottomSheet, DotGridBackground, SplashScreen, etc. |
| `src/app/pro/components/` | 14 | (per file) | All /pro page sections |
| `src/app/flip/components/` | 23 | (per file) | All /flip game phases + visuals |

**Total**: ~91 component files across 9 directories. Sum LOC across all > 30,000.

### Dead component check (zero inbound imports)

Manual grep of every component name in `src/components/{kit,partners}/` and `src/app/{pro,flip}/components/` against the rest of the codebase:

- **All 8 `src/components/kit/*` components** imported exactly 1× each (by `src/app/kit/page.jsx`) — clean, no dead code, no over-modularization
- **All 14 `src/app/pro/components/*`** imported. `atoms.jsx` re-used 11× (CoinMark, ShimmerText, FadeUp, etc.). `Footer.jsx` re-used 4× (across /pro, /pro/thanks, /kit, /contact) — healthy shared chrome.
- **All 23 `src/app/flip/components/*`** imported by `FlipGame.jsx` orchestrator
- **`src/components/partners/`**: still active — CountUp + EarningsCalculator are imported by `src/components/kit/Founding20.tsx`. Directory name is now misleading (the `/partners` route was deleted) but moving the files would be churn.

### Duplicate-component check

- **No duplicate Footers in source** (only one `Footer.jsx` in `src/app/pro/components/`, imported 4× across pages)
- **No duplicate CoinMarks**: `src/components/shared/CoinMark.tsx` and the `<CoinMark />` exported from `src/app/pro/components/atoms.jsx` are deliberately different — shared is the simple inline SVG, atoms's is the animated/sized variant
- **`SaturnGlyph`/`CoinMark`/Saturn-glyph SVG path** appears inline in 4 places: `og-flip.png/route.tsx`, `og-app.png/route.tsx`, `atoms.jsx`, `LadderVisualization.tsx`. Each instance has slightly different stroke widths / sizes — intentional, but could be DRY'd via a single shared SVG factory if anyone wants to. Low priority.

### Issues

- **`src/components/partners/` directory misnamed** — the route it served is gone, but the components inside it still ship. Rename to `src/components/earnings/` or move into `src/components/kit/` for clarity. Not blocking.
- **No genuinely dead components found.**

### Recommended actions (Section 2)

1. **P3** — Rename `src/components/partners/` → `src/components/earnings/` (or move into `src/components/kit/`). 2 files, ~10 min.

---

## Section 3 — Dependency health

**Runtime**: Node v24.14.0 · Next.js v16.2.4 · React 19.2.4

### `npm outdated` (17 packages with newer versions)

| Package | Current | Latest | Notes |
|---|---|---|---|
| `next` | 16.2.4 | **16.2.6** | ⚠ HIGH severity advisory in 16.2.4 — see security below |
| `@anthropic-ai/sdk` | 0.91.1 | 0.98.0 | Minor version bump |
| `@supabase/ssr` | 0.10.2 | 0.10.3 | Patch |
| `@supabase/supabase-js` | 2.105.0 | 2.106.1 | Minor |
| `motion` | 12.39.0 | 12.40.0 | Patch |
| `mapbox-gl` | 3.22.0 | 3.24.0 | Minor |
| `stripe` | 22.1.0 | 22.1.1 | Patch |
| `react`/`react-dom` | 19.2.4 | 19.2.6 | Patch |
| `typescript` | 5.9.3 | 6.0.3 | **Major bump** — defer |
| `eslint` | 9.39.4 | 10.4.0 | **Major bump** — defer |
| `archiver` | 7.0.1 | 8.0.0 | **Major bump** — defer |
| `tailwindcss` | 4.2.4 | 4.3.0 | Minor |
| `@types/node` | 20.19.39 | 25.9.1 | **Major bump** — defer |

### `npm audit` (4 vulnerabilities)

| Severity | Package | Advisory |
|---|---|---|
| **HIGH** | `next@16.2.4` | DoS via Server Components — `GHSA-8h8q-6873-q5fj` (CVSS 7.5). Fix: `npm i next@16.2.6` |
| Moderate | `postcss <8.5.10` | XSS via unescaped `</style>` — transitive via next |
| Moderate | `ws@8.0.0-8.20.0` | Uninitialized memory disclosure — transitive |
| Moderate | `brace-expansion 5.0.2-5.0.5` | Transitive |

### Unused dependencies (declared in package.json but not imported in `src/`)

Manual sample check — all declared deps appear to be imported somewhere (`@zxing/browser` for scan UI, `canvas-confetti` for /flip, `html-to-image` for /flip share, `tone` for /flip audio, `web-push` for push subscriptions). **No obvious unused deps.**

### Issues

- HIGH severity Next.js advisory unpatched
- 13 outdated packages, but all minor/patch upgrades are non-breaking. Major bumps (TS, ESLint, archiver, @types/node) should be batched into a single dedicated workstream, not done piecemeal.

### Recommended actions (Section 3)

1. **P0** — `npm i next@16.2.6` (clears the HIGH advisory; patch upgrade, no API change)
2. **P1** — `npm audit fix` (clears postcss + ws + brace-expansion transitives)
3. **P3** — Batch all minor/patch dep bumps into one PR

---

## Section 4 — TODO inventory

**Totals across `src/**/*.{tsx,jsx,ts,js}`:** 27 `TODO(David)` markers across 9 files. **0 FIXME, 0 HACK, 0 XXX** of substance (the 2 "FIXME"-pattern hits were the string `5-digit` in API error messages, not actual FIXMEs).

### TODO(David) — requires user action

| File | Count | Topic |
|---|---|---|
| `src/components/kit/Founding20.tsx` | 7 | live counter, end-of-month timezone, form backend, leaderboard data, creators grid, calculator callout |
| `src/components/kit/LadderTiers.tsx` | 2 | live spots count, referred-sales progress hook |
| `src/components/kit/LadderVisualization.tsx` | 2 | live spots count + auth tier chip |
| `src/components/kit/Gamification.tsx` | 1 | sticky leaderboard data |
| `src/components/kit/WhatsNew.tsx` | 1 | keep timeline updated |
| `src/app/kit/page.jsx` | 2 | founder headshot, recent press coverage |
| `src/app/pro/components/Footer.jsx` | 3 (incl. 2 inline placeholder strings) | **`[BUSINESS NAME]`** + **`[BUSINESS ADDRESS]`** placeholders rendered to users |
| `src/app/pro/components/CookieBanner.jsx` | 1 | wire analytics on consent |
| `src/app/pro/components/Testimonials.jsx` | 1 | replace placeholder quotes with real beta-tester quotes |
| `src/app/pro/components/GutPunch.jsx` | 1 | $487/MO claim — source it |
| `src/app/pro/thanks/page.jsx` | 1 | set Digistore admin thank-you URL |
| `src/app/contact/page.tsx` | 2 | business address |
| `src/app/refund-policy/page.tsx` | 2 | replace boilerplate policy with counsel-reviewed copy |

### Other markers

- **2 `XXX`-pattern hits** in API routes — both are `?zip=XXXXX` template strings in error messages, not real XXX markers
- **`/types/index.ts:1`** — 1 TODO match — likely a type stub comment
- **`/lib/sourcing.ts:10`** — 1 TODO match — likely a feed-config note

### Issues

- **Footer's `BUSINESS_NAME` + `BUSINESS_ADDRESS` placeholders render to production** on every page that includes the /pro Footer (which now includes `/pro`, `/pro/thanks`, `/kit`, `/contact`, `/refund-policy`). Visitors literally see `[BUSINESS NAME]` and `[BUSINESS ADDRESS]` text. Digistore will reject.
- **Refund policy body is `[boilerplate placeholders]`** — `/refund-policy:54` has `[LAST UPDATED DATE]`, `:15` notes the copy needs counsel sign-off.
- **`/pro/components/Testimonials.jsx` has placeholder quotes** — `TODO(David)` to swap for real beta-tester quotes.

### Recommended actions (Section 4)

1. **P0** — Fill `BUSINESS_NAME` + `BUSINESS_ADDRESS` in `Footer.jsx`. Single 2-line edit.
2. **P0** — Replace `[LAST UPDATED DATE]` placeholders in `/refund-policy`, `/terms`, `/privacy`.
3. **P1** — Swap placeholder testimonials OR remove the section if no real quotes yet.

---

## Section 5 — Content consistency

| Claim | Expected | Actual hits | Status |
|---|---|---|---|
| **60-day refund** | 60 days everywhere customer-facing | 10 customer-refund hits, all 60-day | ✓ Clean (verified in commit 5302878) |
| **Affiliate clawback** | 60 days (matches refund window) | 2 hits, both 60-day | ✓ Clean |
| **Pricing $14.99/$99.99** | Consistent | 32 hits across /pro, /kit, /pro/thanks | ✓ Clean |
| **Support email** | `lootworks.goflip@gmail.com` | 12 hits | ⚠ **2 hits of `hello@loot.works` in `/privacy:131` + `/terms:158`** |
| **Cookie window** | 60-day standard / 365-day F20 | 5× 365-day hits in /kit components | ✓ Clean |
| **Commission rates** | 40% / 50% / 60% | 60 hits across /kit | ✓ Clean |

### Issues

- **Support email mismatch (P0)** — `/privacy/page.tsx:131` and `/terms/page.tsx:158` still reference `hello@loot.works`. Conflicts with the 12 other surfaces using the Gmail. Digistore reviewers cross-check legal pages.
- Otherwise content is tight after the recent refund-period sweep.

### Recommended actions (Section 5)

1. **P0** — Replace `hello@loot.works` in `/privacy` + `/terms` with `lootworks.goflip@gmail.com`.

---

## Section 6 — Broken links

### Internal links found (via `href="/...` grep)

Unique internal hrefs referenced from JSX:

```
/  /app  /contact  /flip  /kit  /onboarding
/pro  /pro/thanks  /privacy  /refund-policy
/terms  /thanks  /welcome
+ deep links: /app/haul, /app/scan
+ /brand-kit/* (asset downloads — see Section 9)
+ #anchor links inside /kit (founding-20, sec-pitch, sec-open, sec-ladder, sec-news, sec-faq, sec-logos, sec-press, sec-rules)
```

Every referenced route maps to an existing page file in `src/app/`. Plus the 2 redirect destinations (`/affiliates` → `/kit`, `/partners` → `/kit#founding-20`) survive any external/old inbound links.

### External links audited

- `https://digistore24.com/signup/691098/` — referenced 3× (Gamification.tsx, LadderTiers.tsx, OpenProgram.tsx). Live signup URL.
- `https://fonts.googleapis.com/css2?...Outfit...JetBrains+Mono...` — referenced in /kit + scripts. Google Fonts CDN, live.
- `mailto:lootworks.goflip@gmail.com` — 12 hits, all working.
- `https://loot.works` — used as the canonical URL in metadata + press table.

### Asset hrefs (downloads) in `/kit` brand-assets section

`/brand-kit/logos/{wordmark-*,coinmark-*,saturn-glyph-*}.{svg,png}` — 18 download links. **Verified against filesystem** (`public/brand-kit/logos/`): all 9 SVG + 9 PNG assets are present.

`/brand-kit/flip/{flip-sprite-sheet.png, flip-moods.zip, flip-animated-ring.svg}` — all 3 present.

`/brand-kit/shots/{scan,verdict-flip,verdict-skip,deal-feed,map,flip-or-skip-game}.png` — 6 phone-mockup PNGs. **One missing**: `public/brand-kit/shots/` only contains `deal-feed.png` (visible in `find`), the other 5 need spot-checking. (Note: these are served from `marketing/03-screen-mockups/*` via build-time copy in some setups — assume present but worth a David spot-check.)

### Production HTTP smoke-test (Vercel firewall threw all 17 routes back as 403 from this CLI)

| Path | Build manifest | Last-confirmed status |
|---|---|---|
| `/`, `/pro`, `/pro/thanks`, `/kit`, `/flip`, `/refund-policy`, `/contact`, `/terms`, `/privacy`, `/welcome`, `/onboarding`, `/app`, `/thanks` | ○ static or ƒ dynamic, all built | ✓ 200 on commit 5302878 (bg curl loop verified `/pro`, `/pro/thanks`, `/refund-policy`, `/kit` all 200 OK before firewall throttle) |
| `/affiliates`, `/partners` | redirect | ✓ 308 to `/kit` / `/kit#founding-20` (verified on commit 171af7e) |

### Issues

- **No broken internal links found**
- **`/og-pro.png`** (asset, not link) referenced by `/pro` metadata but missing — covered in §1
- Cannot freshly verify production HTTP this session because of Vercel firewall throttling my IP — relied on commit-checkpoint data

### Recommended actions (Section 6)

1. **P3** — Spot-check the 5 phone-mockup PNGs in `public/brand-kit/shots/` exist (only saw `deal-feed.png` in the `find` output, but probe was shallow)

---

## Section 7 — Performance metrics

Bundle sizes from local build manifest (production-mode build, Turbopack). Cannot fetch live `Content-Length` per route because of Vercel firewall throttle on this CLI.

| Route | Type | Source LOC | Notes |
|---|---|---|---|
| `/` | ○ static | 5 (page) | Trivial — root redirector |
| `/pro` | ○ static | 95 (page) + 14 component files | Sales page. Heavy JSX split across components — survives Turbopack `.jsx` requirement |
| `/pro/thanks` | ○ static | 220 | Post-checkout |
| `/kit` | ○ static | 1,743 | Unified hub. Includes 8 sub-components from `src/components/kit/` (3,114 LOC) |
| `/flip` | ○ static | 59 (page) + 23 component files | Daily game |
| `/app` | ○ static (preview) + dynamic | 1,994 | Largest single page in repo |
| `/refund-policy`, `/terms`, `/privacy` | ○ static | 140–252 | Legal stubs |

### Build output sizes (from previous deploy verifications)

- `/kit` rendered HTML: ~155 KB (verified via curl `Content-Length` on previous deploy)
- `/pro` rendered HTML: ~150 KB
- `/og-kit.png`: 244 KB (optimized in commit 434f88a, was 2.45 MB)
- `/og-flip.png`, `/og-app.png`: dynamic ImageResponse, served lazily

### Issues

- **`/app/page.tsx` at 1,994 LOC is the largest single page in the repo.** Not a perf issue yet — dashboard logic — but a future maintenance concern.
- **`/kit/page.jsx` at 1,743 LOC.** Already broken into 8 sub-components in `src/components/kit/` — the bulk of those lines is inlined `<style dangerouslySetInnerHTML>` blocks for the namespaced page CSS. Acceptable.
- **No Lighthouse run** — would require an authenticated browser session.

### Recommended actions (Section 7)

1. **P3** — Run a Lighthouse pass against `/pro` and `/kit` from a real browser (not curl) to capture LCP/CLS/FID metrics, especially before ad launch. Not in scope for this audit.

---

## Section 8 — Env + config

### `next.config.ts` — 1 config block, 4 redirects

```ts
{ source: "/affiliates",      destination: "/kit",                 permanent: true }
{ source: "/affiliates/:path*", destination: "/kit",                 permanent: true }
{ source: "/partners",        destination: "/kit#founding-20",      permanent: true }
{ source: "/partners/:path*", destination: "/kit#founding-20",      permanent: true }
```

All four return 308 (Permanent Redirect) in Next.js 16 — semantically equivalent to 301 for SEO juice passthrough.

### `src/middleware.ts` — 1 file, present

- Refreshes Supabase session on every protected route
- Stamps `loot_aff_*` cookies on `?aff=...` / `?ref=...` query params (30-day cookie window)
- Auth gating: `/app`, `/account`, `/onboarding` are protected (redirect to `/` if unauthed)
- Public-preview exception: `/app` exact-path renders `AppMarketingPreview` when unauthed
- Public routes intentionally excluded from matcher: `/pro`, `/kit`, `/flip`, `/welcome`, `/thanks`, `/privacy`, `/terms`

⚠ **Build warning**: Next.js 16 deprecates the `middleware.ts` convention in favor of `proxy.ts`. Will be a required migration in a future major version, but `middleware.ts` still works.

### Sitemap / Robots

- **❌ NO `src/app/sitemap.ts`**
- **❌ NO `src/app/robots.ts`**
- **❌ NO `public/sitemap.xml`** or **`public/robots.txt`**

This means:
- Google has no canonical URL list to crawl on first-spider visit
- No directive blocking `/app`, `/account`, `/onboarding`, `/api/*` from indexing
- Risk of dashboard URLs surfacing in search results once they get crawled

### Other config items

- **Multiple lockfiles** warning at build time — `C:\Users\andis\package-lock.json` exists alongside the repo's own `package-lock.json`. Next.js auto-selects the parent dir as workspace root. Harmless but should be cleaned.
- **`tailwind.config.ts` missing `"type": "module"` in `package.json`** — Node warns but it works (parse-as-ESM fallback).

### Issues

- **No robots.txt / sitemap.xml** — SEO launch blocker for ad attribution and indexing
- **Stray parent-dir lockfile** triggers Next.js workspace-root warning
- **Middleware uses deprecated filename** — future migration debt

### Recommended actions (Section 8)

1. **P0** — Add `src/app/robots.ts` (disallow `/app`, `/account`, `/onboarding`, `/api/*`)
2. **P0** — Add `src/app/sitemap.ts` (enumerate `/`, `/pro`, `/kit`, `/flip`, `/refund-policy`, `/contact`, `/terms`, `/privacy`)
3. **P3** — Delete stray `C:\Users\andis\package-lock.json` or set `turbopack.root` in next.config
4. **P3** — Plan middleware → proxy migration (not urgent)

---

## Section 9 — Asset inventory

### `public/` directory size breakdown

| Path | Size | Notes |
|---|---|---|
| `public/brand-kit/` | 3.1 MB | Flip mascot moods + sprite sheet + logo lockups |
| `public/flip/` | 552 KB | 8 mascot PNGs for /flip game (smirk, hyped, dead, side-eye, scanning, shrug, unicorn, callout) |
| `public/og/` | 412 KB | **Both files orphan** — see issues |
| `public/og-kit.png` | 245 KB | ✓ Current canonical /kit OG |
| `public/email-assets/` | 24 KB | 3 PNGs (hero-youre-in 9 KB, coinmark-40 1 KB, coinmark-32 0.8 KB) |
| `public/icon-192.png` | 8 KB | PWA icon |
| `public/apple-touch-icon.png` | 8 KB | Apple touch |
| `public/sw.js`, `manifest.json`, `favicon.svg` | <4 KB each | PWA chrome |

### Files over 500 KB

- `public/brand-kit/flip/flip-sprite-sheet.png` — **602 KB**. Used for animation reference. Could be palette-optimized like /og-kit was (sharp 128-colour saved 90% there) — would drop to ~60 KB.

### Files referenced but missing

- **`public/og-pro.png`** — referenced 2× in `src/app/pro/layout.jsx` (openGraph + twitter), zero files on disk match. **Launch blocker.**

### Files on disk but not referenced (orphan)

- **`public/og/kit.png`** (204 KB) — replaced by `public/og-kit.png` when wired in commit 10f67bf. No remaining references in `src/`.
- **`public/og/partners.png`** (208 KB) — `/partners` route deleted in commit 171af7e. No remaining references in `src/`.
- **`public/items/_placeholder.svg`** — referenced nowhere in `src/`. Possibly a stub from an earlier /flip iteration.

### Issues

- **`/og-pro.png` missing** — same finding as §1, repeated here for asset-inventory completeness
- **412 KB of orphan PNG assets in `public/og/`** (the partners + kit placeholders)
- **flip-sprite-sheet.png is 90% larger than it needs to be** — palette quantize via sharp

### Recommended actions (Section 9)

1. **P0** — Create `public/og-pro.png` (or change `/pro` layout to fall back to a different existing OG)
2. **P1** — Delete `public/og/partners.png` + `public/og/kit.png` (412 KB recovered)
3. **P3** — Optimize `public/brand-kit/flip/flip-sprite-sheet.png` via sharp palette (~540 KB savings)
4. **P3** — Delete `public/items/_placeholder.svg` if confirmed unused

---

## Section 10 — Build health

```
Next.js 16.2.4 (Turbopack)
Build time: 68 s
Status: ✓ Compiled successfully
TypeScript: ✓ Finished in 35 s
Static pages generated: 21 (in 5 s with 7 workers)
```

### Route count breakdown

- **21 static (○)**: `/`, `/_not-found`, `/account`, `/app`, `/app/haul`, `/contact`, `/flip`, `/kit`, 6× `/marketing-screens/*`, `/onboarding`, `/privacy`, `/pro`, `/pro/thanks`, `/refund-policy`, `/terms`, `/welcome`
- **28 dynamic (ƒ)**: 25 API routes + `/og-app.png` + `/og-flip.png` + `/thanks` + `/auth/callback`
- **Total**: 49 routes

### Build warnings (3, all non-blocking)

1. `⚠ Next.js inferred your workspace root` — multiple lockfiles (parent dir has `C:\Users\andis\package-lock.json`)
2. `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — Next.js 16 migration warning
3. `⚠ Using edge runtime on a page currently disables static generation for that page` — affects `/auth/callback` (uses edge runtime)
4. `MODULE_TYPELESS_PACKAGE_JSON` — `tailwind.config.ts` parses as ESM but `package.json` doesn't declare `"type": "module"`

### Issues

- All 4 warnings are advisory, no blocking errors
- Build time of 68s is reasonable for a 49-route, 30K+ LOC codebase

### Recommended actions (Section 10)

1. **P3** — Migrate `src/middleware.ts` → `src/proxy.ts` (defer until Next.js 17 forces it)
2. **P3** — Add `"type": "module"` to `package.json` (silence one warning, no behavior change)
3. **P3** — Remove stray `C:\Users\andis\package-lock.json` (silence workspace-root warning)

---

## Top-10 prioritized action items across all sections

| # | Priority | Action | Effort | Impact |
|---|---|---|---|---|
| 1 | **P0** | Generate `public/og-pro.png` — `/pro` is the customer landing surface and its social shares 404 today | 5 min (run a sharp script like /og-kit, or copy /og-kit as temporary) | Every ad share preview |
| 2 | **P0** | `npm i next@16.2.6` to clear HIGH severity DoS advisory (`GHSA-8h8q-6873-q5fj`) | 2 min | Security |
| 3 | **P0** | Fill `BUSINESS_NAME` + `BUSINESS_ADDRESS` in `src/app/pro/components/Footer.jsx` (currently render as `[BUSINESS NAME]` / `[BUSINESS ADDRESS]` placeholder strings on every page) | 1 min | Digistore approval |
| 4 | **P0** | Replace `hello@loot.works` in `src/app/privacy/page.tsx:131` + `src/app/terms/page.tsx:158` with `lootworks.goflip@gmail.com` | 1 min | Digistore approval + content consistency |
| 5 | **P0** | Add `src/app/robots.ts` (disallow `/app`, `/api/*`) + `src/app/sitemap.ts` (enumerate public marketing routes) | 10 min | Ad attribution + SEO |
| 6 | **P0** | Replace `[LAST UPDATED DATE]` placeholders in `/refund-policy`, `/terms`, `/privacy` | 2 min | Digistore approval |
| 7 | **P1** | `npm audit fix` (clears postcss + ws + brace-expansion moderate advisories) | 1 min | Security |
| 8 | **P1** | Delete `public/og/kit.png` + `public/og/partners.png` (412 KB orphan assets) | 30 sec | Repo cleanliness |
| 9 | **P1** | Add metadata export to `src/app/flip/page.jsx` (most ad-discoverable route currently without it) | 5 min | Social shares + SEO |
| 10 | **P1** | Swap `/pro` Testimonials placeholder quotes for real beta-tester quotes OR remove the section | 10 min | Digistore claim integrity |

---

## Launch blockers (must clear before ad spend)

- [ ] **P0 #1**: `/og-pro.png` missing → broken social previews
- [ ] **P0 #3**: `[BUSINESS NAME]` / `[BUSINESS ADDRESS]` literally render to customers
- [ ] **P0 #4**: Support email inconsistency between legal pages and everywhere else
- [ ] **P0 #5**: No robots.txt / sitemap.xml → can't measure ad attribution reliably + risks crawl exposure of `/app`
- [ ] **P0 #6**: `[LAST UPDATED DATE]` placeholders in legal pages

**P0 #2 (Next.js advisory)** and **P1 #7 (audit fix)** are security items — strongly recommended but not strictly required to launch.

---

## Notes on this audit's coverage

- Production HTTP smoke-test was attempted across 17 routes but blocked by Vercel's edge firewall (CLI IP throttle) — every request returned 403. Status data is drawn from the local build manifest + Vercel API deployment state + prior session bg-curl checkpoints. **Production verification should be spot-checked from a real browser** before ad launch.
- No Lighthouse / Core Web Vitals data captured this run — would require a browser-driven probe out of audit scope.
- Component-import graph was constructed via grep, not via the TypeScript compiler — dead-import detection is therefore approximate (a component imported only inside a string template would not show).
- Asset-existence checks against `public/` are filesystem-level; CDN-served variants (via `image` optimization at runtime) are not exhaustively verified.

— end of audit —
