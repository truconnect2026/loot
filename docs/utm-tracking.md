# UTM tracking — outbound link scheme

Every external CTA on `loot.works` is tagged with a consistent UTM
payload so that, once paid ad spend turns on, we can tell which page
and which placement converted. Internal Next.js navigations between
our own pages keep using the existing `?ref=` pattern instead and are
intentionally out of scope here.

## Scheme

| Param          | Value                                | Notes                                    |
|----------------|--------------------------------------|------------------------------------------|
| `utm_source`   | `loot_works`                         | Always the site as source.               |
| `utm_medium`   | `internal`                           | Always — link from our own surfaces.     |
| `utm_campaign` | `pro_purchase` \| `affiliate_signup` | Domain bucket. Add new buckets sparingly.|
| `utm_content`  | placement slug — see registry below  | Specific surface that fired the click.   |

Use the helper at [`src/lib/utm.js`](../src/lib/utm.js) — `withUTM(url, content, campaign?)` — instead of
hand-formatting. `campaign` defaults to `pro_purchase`.

## Campaign buckets

### `pro_purchase`
Outbound links that send a visitor to the Pro subscription checkout
(`checkout-ds24.com/product/691098`).

### `affiliate_signup`
Outbound links that send a visitor to the Digistore affiliate program
signup (`digistore24.com/signup/691098/`).

## `utm_content` registry

Each entry is the canonical slug used at a specific placement on the
site. **Add new entries here when you wire a new CTA** — this file is
the source of truth that ad reports will be cross-referenced against.

### `pro_purchase` bucket

| `utm_content`           | Location                                                           |
|-------------------------|--------------------------------------------------------------------|
| `pro_pricing_monthly`   | `/pro` — pricing card, monthly button                              |
| `pro_pricing_annual`    | `/pro` — pricing card, annual button                               |
| `pro_closer`            | `/pro` — final "Claim Pro Now" closer CTA                          |

### `affiliate_signup` bucket

| `utm_content`             | Location                                                         |
|---------------------------|------------------------------------------------------------------|
| `kit_open_program`        | `/kit` — Open Program section ("GET YOUR LINK →")                |
| `kit_ladder_standard`     | `/kit` — Ladder Tiers Standard card ("JOIN STANDARD →")          |
| `kit_ladder_gold`         | `/kit` — Ladder Tiers Gold card ("START AT STANDARD →")          |
| `kit_ready_toast`         | `/kit` — gamification toast after 5 copies ("GET YOUR LINK →")   |
| `kit_copies_chip`         | `/kit` — bottom-right copies chip after threshold                |

## What's out of scope

- **`/app/*` authed routes** — these are post-conversion and don't
  need ad attribution. `digistore-affiliate.ts` builds checkout URLs
  using Digistore's native `aff` / `campaign` params (affiliate
  attribution, not UTM) and is left alone here.
- **`DIGISTORE_FIND_ORDER_URL`** (customer login) — referenced only
  from `/account` and is a support link, not a conversion path.
- **Internal Next.js router pushes** — use `?ref=` (`/app?ref=welcome_email`),
  not UTM.

## Adding a new CTA

1. Import the helper:
   ```js
   import { withUTM } from "@/lib/utm";
   ```
2. Pick a `utm_content` slug. Format: `{page}_{section_or_intent}` (e.g.
   `pro_pricing_monthly`, `kit_ladder_gold`). Lowercase, snake_case.
3. Pick the campaign bucket (`pro_purchase` or `affiliate_signup`) — or
   open a new bucket if this is a genuinely new domain.
4. Build the URL:
   ```js
   const url = withUTM("https://digistore24.com/signup/691098/", "kit_new_thing", "affiliate_signup");
   ```
5. **Add a row to the registry above.** This is the part that's easy
   to forget — without the registry, reports become a guessing game.
