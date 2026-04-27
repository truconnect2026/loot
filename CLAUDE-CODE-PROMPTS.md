# LOOT — Claude Code Prompts

## Before you start

In your terminal, before launching Claude Code:

```bash
claude config set autoAccept true
```

This turns on auto-accept mode so Claude Code doesn't pause for permission on every file create/edit. You can also pass the --auto-accept flag when launching:

```bash
claude --auto-accept
```

Navigate to your loot repo folder, make sure SPEC.md is in the root, then launch Claude Code.

---

## Prompt 1: Project setup

```
Read SPEC.md in this directory. It is the complete product spec for this project. Do everything it says.

Set up a Next.js 15 project with App Router, TypeScript, and Tailwind CSS in this directory. Create the full folder structure exactly as defined in the "File Structure" section of SPEC.md. Install these dependencies: @supabase/supabase-js @supabase/ssr @zxing/browser @anthropic-ai/sdk stripe mapbox-gl. Install dev dependencies: @types/mapbox-gl.

Set up tailwind.config.ts with all the design tokens from the "Design Tokens" section — the custom colors, border radius values, and font families.

Create globals.css with the CSS custom properties from the design tokens section, import Outfit (weights 300, 500, 600) and JetBrains Mono (weights 500, 700) from Google Fonts, and set the base body background to --bg-page.

Create the root layout.tsx that wraps the app with the font classes and renders children on the --bg-page background.

Create empty placeholder page.tsx files at each route (/, /app, /account) that just return a div with the route name so I can verify routing works.

Do not build any components or real page content yet. Just the foundation.
```

---

## Prompt 2: Shared components

```
Read SPEC.md section "Shared Components." Build all 7 components in src/components/shared/ exactly as specced:

1. DotGridBackground — two SVG pattern layers (isometric grid + dot grid) with CSS pulse animation
2. CoinMark — SVG coin icon, props for size and color, also export a spinning loader variant
3. CoinRain — canvas particle system, 28 coins, gravity physics, triggered by active prop
4. AnimNum — hook that animates a number from 0 to target with cubic ease-out over 800ms
5. BottomSheet — slide-up panel with backdrop blur, drag handle, swipe-to-dismiss, spring animation
6. PageTransition — wrapper that slides pages left/right on navigation
7. TilePressable — wrapper for all tappable elements with press state (bg shift + translateY)

Follow every detail in the spec — colors, sizes, timing values, animation curves. Use the CSS custom properties from the design tokens. No animation libraries, only CSS transitions and one canvas component.
```

---

## Prompt 3: Login page

```
Read SPEC.md section "Login Page." Build the login page at src/app/page.tsx using the shared components.

Elements top to bottom: CoinMark + LOOT wordmark with the design line detail, Google OAuth button, divider with "or", email input row with arrow send button.

Use DotGridBackground behind everything. Flexbox centered layout, max-w-[300px].

For auth, set up Supabase client in src/lib/supabase.ts with placeholder env vars (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY). Wire up the Google button to Supabase signInWithOAuth and the email input to signInWithOtp. Add middleware.ts that redirects authed users to /app and unauthed users to /.

Don't worry about the social proof line yet — that's post-launch.
```

---

## Prompt 4: Dashboard page

```
Read SPEC.md section "Dashboard Page." Build the complete dashboard at src/app/app/page.tsx.

Build these page-specific components in src/components/dashboard/:
- StatsBar with 4 cells, AnimNum on all values, PROFIT as hero number (Outfit 300 18px)
- ScanButtons with the two side-by-side buttons framed by hairlines
- FeedCard component used 4 times in a 2x2 grid (Deals Near You, Penny Drops, Free Finds, Store Clearance) with asymmetric border radius, left accent bar, sonar-ping badge animation
- ToolTile component used 8 times in a 2x4 grid (Shelf Scanner, Price Check, Yard Sale Map, Estate Sales, Haul Log, Fake Checker, Liquidation Analyzer, Scrap Finder)
- ScanOverlay fullscreen camera overlay with corner brackets, scan line, pulse rings, progress bar
- VerdictSheet using BottomSheet with verdict-colored top border, stat grids, and generate listing CTA

Use mock data for now — hardcoded scan history and feed counts. The scan buttons should open the ScanOverlay and after a simulated delay show the VerdictSheet with mock data. BUY verdict triggers CoinRain.

Wire up the avatar to navigate to /account. Wire up feed cards and tool tiles to log their name to console for now (we'll add sub-views later).
```

---

## Prompt 5: Account page

```
Read SPEC.md section "Account Page." Build the complete account page at src/app/account/page.tsx.

Build these components in src/components/account/:
- ProfileCard with left-aligned horizontal layout (avatar, name, email, PRO pill), dashed separator, subscription section with price and recessed stat cells, cancel text
- SettingsTile reusable component for each setting row
- ZipInput with inline edit (display → input transition on tap)
- RadiusSheet using BottomSheet with a slider inside
- BoloList sub-view with keyword tiles, delete, and add functionality
- NotificationToggles with main toggle and 3 conditional sub-toggles

Use the grouped spacing specified in the spec (6px within location group, 16px between groups, 24px before sign out).

Wire up the back arrow to navigate to /app. Use mock data for the profile and settings. The sign out button should call Supabase signOut and redirect to /.
```

---

## Prompt 6: Backend

```
Read SPEC.md section "Backend." Set up the full backend.

1. Create the Supabase migration file at supabase/migrations/001_initial.sql with the exact schema from the spec (profiles, bolo_keywords, scans, listings, penny_items, notification_prefs tables with RLS policies).

2. Build all API routes in src/app/api/ as defined in the spec:
   - /api/scan — accepts barcode UPC or image, calls UPCitemdb for product info, calls eBay Browse API for sold comps, calls Claude Haiku for verdict, saves to scans table
   - /api/shelf-scan — accepts image, calls Claude Sonnet vision, returns array of identified items with values
   - /api/price-check — accepts item name string, calls eBay Browse API, returns pricing summary
   - /api/listing — accepts scan data, calls Claude Haiku, returns FB listing title and description
   - /api/fake-check — accepts image, calls Claude Sonnet vision for authentication
   - /api/tag-decode — accepts image, calls Claude Sonnet vision for price tag decoding
   - /api/scrap-id — accepts image, calls Claude Sonnet vision for metal identification
   - /api/liquidation — accepts manifest URL, fetches and parses, cross-refs comps, returns verdict
   - /api/feeds/* — query listings table filtered by user zip + radius
   - /api/export — generate CSV from user's scans table

3. Create lib wrappers: src/lib/claude.ts, src/lib/ebay.ts, src/lib/upc.ts, src/lib/scanner.ts

4. Add all needed env vars to .env.example: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_MAPBOX_TOKEN

Use the Claude system prompts from the "Scan Engine" section of the spec.
```

---

## Prompt 7: Wire it all together

```
Read SPEC.md. Connect the frontend to the backend.

1. Replace all mock data in the dashboard with real Supabase queries. Stats bar pulls from the scans table. Feed cards pull counts from the listings and penny_items tables.

2. Wire the ScanOverlay to use the real barcode scanner (BarcodeDetector with @zxing/browser fallback) and real camera. On successful scan, call /api/scan and display the result in VerdictSheet.

3. Wire the AI Vision button to capture a photo and send to /api/scan with the image.

4. Wire the "GENERATE FB LISTING" button in VerdictSheet to call /api/listing and display the result (copy to clipboard).

5. Wire the account page settings to read/write from Supabase profiles table. Zip code, search radius, BOLO keywords, and notification preferences should persist.

6. Wire the haul log tool tile to show the scan history from Supabase with the ability to mark items as sold.

7. Set up Stripe: create a checkout session endpoint, a webhook handler for invoice.paid, and link the "cancel anytime" text to Stripe Customer Portal. Add a scan count check for free tier users (5/day limit).

8. Deploy to Vercel. Add all env vars to the Vercel project settings.
```

---

## Tips

- If Claude Code asks a clarifying question, don't answer in chat. Add the answer to SPEC.md and say: "I updated SPEC.md with that info. Re-read it and continue."

- If something looks wrong after a prompt finishes, be specific: "The FeedCard badge animation isn't working. Re-read the sonar-ping spec in SPEC.md under Feed Grid and fix it." Don't say "fix the animations."

- If you want to iterate on a specific component: "Re-read SPEC.md. The BottomSheet spring animation feels too bouncy. Change the cubic-bezier from (0.34, 1.4, 0.64, 1) to (0.34, 1.2, 0.64, 1) and test it."

- Run `npm run dev` after each prompt to visually verify before moving to the next one.
