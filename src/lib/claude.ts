import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY must be set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

export type Verdict = "BUY" | "PASS" | "MAYBE";
export type Confidence = "high" | "medium" | "low";
export type SellSpeed = "FAST" | "MODERATE" | "SLOW";

export interface PlatformRankEntry {
  platform: string;
  estimatedNetProfit: number;
  reasoning: string;
}

export interface VerdictResult {
  verdict: Verdict;
  sellPrice: number;
  profit: number;
  platform: "FB Local";
  fee: 0;
  reasoning: string;
  confidence: Confidence;
  daysToSell: number;
  sellSpeed: SellSpeed;
  platformRanking: PlatformRankEntry[];
}

const VERDICT_SYSTEM = `You are an expert reseller specializing in Facebook Marketplace flipping. Given an item name and purchase cost, estimate its realistic resale value on Facebook Marketplace sold locally (no shipping, no fees).

Consider: what this item actually sells for locally (not retail price), realistic condition for a thrift store or yard sale find, how quickly it would sell, and your confidence level.

Respond ONLY with valid JSON, no markdown, no backticks, no explanation outside the JSON:
{
  "verdict": "BUY" or "PASS" or "MAYBE",
  "sellPrice": number,
  "profit": number,
  "platform": "FB Local",
  "fee": 0,
  "reasoning": "one sentence why",
  "confidence": "high" or "medium" or "low"
}

BUY = profit above 15 dollars or ROI above 100 percent.
MAYBE = profit 5 to 15 dollars.
PASS = profit below 5 dollars or item is unlikely to sell locally.

Also estimate how long this item will typically take to sell on the recommended platform. Return two additional fields: 'daysToSell' (number, your best estimate of median days from listing to sale — a popular children's book lot on FB Marketplace might be 2-4 days, a mid-range KitchenAid mixer on FB local might be 5-10 days, a niche vintage collectible on eBay might be 45-90 days, commodity electronics on FB usually 1-3 days) and 'sellSpeed' (string, one of 'FAST' if under 7 days, 'MODERATE' if 7-30 days, 'SLOW' if over 30 days). Be conservative and realistic.

Also return a field 'platformRanking' as an array of the top 3 selling platforms, each with: platform (string — one of 'Facebook Local', 'Facebook Shipped', 'eBay', 'Poshmark', 'Mercari'), estimatedNetProfit (number, after platform fees: FB Local 0%, FB Shipped 10%, eBay 13.25%+$0.30, Poshmark 20% or $2.95 flat under $15, Mercari 10%), reasoning (string, one sentence). Rank by estimatedNetProfit descending. Consider item type: furniture/heavy items best on FB Local, clothing/shoes on Poshmark, collectibles/niche on eBay, general merchandise on Mercari.`;

interface RawVerdictJson {
  verdict?: string;
  sellPrice?: number;
  profit?: number;
  platform?: string;
  fee?: number;
  reasoning?: string;
  confidence?: string;
  daysToSell?: number;
  sellSpeed?: string;
  platformRanking?: unknown;
}

// Coerce a sellSpeed string to the strict union, defaulting to MODERATE.
// MODERATE is the safe fallback because most resale items take 7-30 days
// — coloring an unknown speed as FAST/SLOW would mislead the user.
function normalizeSellSpeed(raw: unknown): SellSpeed {
  if (raw === "FAST" || raw === "MODERATE" || raw === "SLOW") return raw;
  if (typeof raw === "string") {
    const s = raw.toUpperCase();
    if (s === "FAST" || s === "MODERATE" || s === "SLOW") return s;
  }
  return "MODERATE";
}

// Walks Claude's platformRanking array and shapes each entry into a
// PlatformRankEntry. Rejects entries without a platform string so the
// UI never renders an empty row. Caps at 3 entries — the prompt asks
// for top-3 but the model occasionally over-runs.
function normalizePlatformRanking(raw: unknown): PlatformRankEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      const obj = (it ?? {}) as Record<string, unknown>;
      const platform = String(obj.platform ?? "").trim();
      if (!platform) return null;
      return {
        platform,
        estimatedNetProfit: Number(obj.estimatedNetProfit ?? 0),
        reasoning: String(obj.reasoning ?? ""),
      };
    })
    .filter((e): e is PlatformRankEntry => e !== null)
    .slice(0, 3);
}

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseJsonObject<T>(raw: string): T {
  // Tolerate code-fence wrappers and stray prose around the JSON object.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object in model response: ${raw.slice(0, 200)}`);
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

export async function getVerdict(args: {
  itemName: string;
  cost: number;
  imageDescription?: string;
}): Promise<VerdictResult> {
  const prompt = `Item: ${args.itemName}
Cost: $${args.cost.toFixed(2)}${args.imageDescription ? `\nVisual notes: ${args.imageDescription}` : ""}

Return the verdict JSON.`;

  const message = await getClient().messages.create({
    model: HAIKU,
    max_tokens: 512,
    system: VERDICT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = parseJsonObject<RawVerdictJson>(extractText(message));

  const verdict: Verdict =
    raw.verdict === "BUY" || raw.verdict === "PASS" || raw.verdict === "MAYBE"
      ? raw.verdict
      : "PASS";

  const confidence: Confidence =
    raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low"
      ? raw.confidence
      : "medium";

  return {
    verdict,
    sellPrice: Number(raw.sellPrice ?? 0),
    profit: Number(raw.profit ?? 0),
    platform: "FB Local",
    fee: 0,
    reasoning: String(raw.reasoning ?? ""),
    confidence,
    daysToSell: Number.isFinite(Number(raw.daysToSell))
      ? Number(raw.daysToSell)
      : 14,
    sellSpeed: normalizeSellSpeed(raw.sellSpeed),
    platformRanking: normalizePlatformRanking(raw.platformRanking),
  };
}

const VISION_SYSTEM = `You are an expert at identifying retail and thrift items from photos. Identify the single primary product visible. Respond with ONLY valid JSON:
{
  "name": "the most specific product name you can give (brand + model + size if visible)",
  "brand": "brand if visible, else null",
  "category": "broad category (e.g. \\"kitchen\\", \\"electronics\\", \\"clothing\\")"
}

Return a SHORT, clean product name under 40 characters. Example: "Jumex Pineapple-Coconut Nectar" not "Jumex Jumex Pineapple-Coconut Nectar from Concentrate 15.5 fl oz (460 mL) can". Drop redundant brand repetitions, size/weight details, and UPC info.`;

export interface VisionIdentifyResult {
  name: string;
  brand: string | null;
  category: string | null;
}

export async function identifyFromImage(
  imageBase64: string
): Promise<VisionIdentifyResult> {
  // Strip data URI prefix if present.
  const stripped = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const message = await getClient().messages.create({
    model: SONNET,
    max_tokens: 512,
    system: VISION_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: stripped,
            },
          },
          {
            type: "text",
            text: "Identify the item.",
          },
        ],
      },
    ],
  });

  const raw = parseJsonObject<{
    name?: string;
    brand?: string | null;
    category?: string | null;
  }>(extractText(message));

  return {
    name: String(raw.name ?? "Unknown item"),
    brand: raw.brand ?? null,
    category: raw.category ?? null,
  };
}

const LISTING_SYSTEM = `You write Facebook Marketplace listings that sell fast. Given an item and target price, produce an optimized title and description.

Title rules:
- Under 80 characters
- Lead with brand + model + key attribute
- No emoji, no all-caps spam

Description rules:
- 3-6 short lines
- Lead with one sentence describing the item
- Bullet key features / dimensions / condition
- End with pickup/shipping note
- No emoji

Respond with ONLY valid JSON:
{
  "title": "string",
  "description": "string",
  "suggested_price": number
}`;

export interface ListingResult {
  title: string;
  description: string;
  suggestedPrice: number;
}

export async function generateListing(args: {
  itemName: string;
  sellPrice: number;
  reasoning?: string;
}): Promise<ListingResult> {
  const prompt = `Item: ${args.itemName}
Target sell price: $${args.sellPrice.toFixed(2)}
${args.reasoning ? `Context: ${args.reasoning}\n` : ""}
Return the listing JSON.`;

  const message = await getClient().messages.create({
    model: HAIKU,
    max_tokens: 1024,
    system: LISTING_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = parseJsonObject<{
    title?: string;
    description?: string;
    suggested_price?: number;
  }>(extractText(message));

  return {
    title: String(raw.title ?? args.itemName),
    description: String(raw.description ?? ""),
    suggestedPrice: Number(raw.suggested_price ?? args.sellPrice),
  };
}

// ──────────────────────────────────────────────────────────────────
// Tool calls: shelf-scan, price-check, fake-check, tag-decode,
// scrap-id, liquidation. Each is a single Claude call with a
// dedicated system prompt. The image-based tools use Sonnet (vision)
// at ~1024 tokens; the text-based tools use Haiku at ~768 tokens.
// All return loosely-typed objects parsed from the model's JSON —
// the route handlers expose them to clients as-is so the UI can
// render whatever fields the model produces. parseJsonObject and
// extractText already tolerate code-fence wrappers and stray prose.
// ──────────────────────────────────────────────────────────────────

async function callImageTool(
  imageBase64: string,
  systemPrompt: string,
): Promise<Record<string, unknown>> {
  const stripped = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const message = await getClient().messages.create({
    model: SONNET,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: stripped,
            },
          },
          { type: "text", text: "Analyze the image." },
        ],
      },
    ],
  });
  return parseJsonObject<Record<string, unknown>>(extractText(message));
}

async function callTextTool(
  userPrompt: string,
  systemPrompt: string,
  model: string = HAIKU,
): Promise<Record<string, unknown>> {
  const message = await getClient().messages.create({
    model,
    max_tokens: 768,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return parseJsonObject<Record<string, unknown>>(extractText(message));
}

// Shelf scan — multi-item identification with per-platform pricing.
// Claude returns cost (estimated thrift price) + sell prices for FB
// Local, FB Shipped, and eBay; the model also picks the best platform
// after computing fees (FB Local 0%, FB Shipped 10%, eBay 13.25% +
// $0.30) and assigns BUY/MAYBE/PASS using the same thresholds the
// barcode verdict path uses (BUY > $15 or > 100% ROI, MAYBE $5-15,
// PASS < $5). The route handler does NOT recompute these — letting
// the model do the math keeps the JSON shape stable and means the UI
// can ignore fee tables entirely.
const SHELF_SCAN_SYSTEM = `You are an expert thrift store reseller analyzing a photo of items on a shelf, table, or display. Identify every distinct item visible in the image. For each item, estimate what a thrift store would price it at, what it could sell for on Facebook Marketplace locally, and what it would sell for on eBay (based on your knowledge of typical eBay sold listings for similar items).

Return ONLY valid JSON — no markdown, no backticks, no explanation text. Return an object with a single key "items" whose value is an array of objects with these exact fields:

  name (string, specific descriptive name),
  cost (number, estimated thrift store price in dollars),
  sellFBLocal (number, estimated Facebook Marketplace local pickup price),
  sellFBShipped (number, estimated FB Marketplace shipped price, accounting for shipping costs the buyer pays),
  sellEbay (number, estimated eBay sold price based on your knowledge of comparable sold listings),
  profit (number, use the highest of the three sell prices minus cost),
  bestPlatform (string, one of "FB Local" / "FB Shipped" / "eBay" — whichever gives the best NET profit after fees: FB Local 0% fee, FB Shipped 10% fee, eBay 13.25% + $0.30 fee),
  verdict (string, one of BUY/MAYBE/PASS — BUY if best net profit > 15 or ROI > 100%, MAYBE if net profit 5-15, PASS if net profit < 5 or negative),
  confidence (string, one of HIGH/MEDIUM/LOW based on how clearly you can identify and price the item),
  description (string, brief note on condition, brand recognition, why it's worth grabbing or not).

Rank the array by profit descending. Limit your response to the 10 most profitable items only — never more — so the JSON fits in the response budget without truncation.

Be conservative and realistic with pricing estimates. For thrift store cost, use typical Goodwill/Salvation Army prices in the Southeast US (books $1-3, clothing $3-8, housewares $3-10, furniture $15-50). For Facebook Marketplace resale, estimate what items ACTUALLY sell for locally, not aspirational listing prices. For eBay, estimate based on SOLD listings, not current listings. Account for the fact that most items at thrift stores are NOT worth reselling — be honest about PASS verdicts. Only mark BUY if you are genuinely confident someone could profit $15+ after the time investment of listing and selling.

For each item, also estimate 'daysToSell' (number, median days from listing to sale on the best platform) and 'sellSpeed' (string: 'FAST' under 7 days, 'MODERATE' 7-30 days, 'SLOW' over 30 days). Be realistic about sell-through times.

Adjust your verdict for sell speed: items that take 30+ days to sell need at least $25 profit to be a BUY (not $15). Items that sell in under 7 days can be BUY at $10+ profit since the capital turns over fast.

Also return a field 'platformRanking' as an array of the top 3 selling platforms, each with: platform (string — one of 'Facebook Local', 'Facebook Shipped', 'eBay', 'Poshmark', 'Mercari'), estimatedNetProfit (number, after platform fees: FB Local 0%, FB Shipped 10%, eBay 13.25%+$0.30, Poshmark 20% or $2.95 flat under $15, Mercari 10%), reasoning (string, one sentence). Rank by estimatedNetProfit descending. Consider item type: furniture/heavy items best on FB Local, clothing/shoes on Poshmark, collectibles/niche on eBay, general merchandise on Mercari.`;

export type ShelfScanPlatform = "FB Local" | "FB Shipped" | "eBay";

export interface ShelfScanItem {
  name: string;
  cost: number;
  sellFBLocal: number;
  sellFBShipped: number;
  sellEbay: number;
  profit: number;
  bestPlatform: ShelfScanPlatform;
  verdict: Verdict;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  daysToSell: number;
  sellSpeed: SellSpeed;
  platformRanking: PlatformRankEntry[];
}

export interface ShelfScanResult {
  items: ShelfScanItem[];
}

function normalizePlatform(raw: unknown): ShelfScanPlatform {
  if (raw === "FB Local" || raw === "FB Shipped" || raw === "eBay") return raw;
  // Tolerate common case variants the model occasionally emits.
  if (typeof raw === "string") {
    const s = raw.toLowerCase().replace(/\s+/g, "");
    if (s === "fblocal" || s === "facebooklocal") return "FB Local";
    if (s === "fbshipped" || s === "facebookshipped") return "FB Shipped";
    if (s === "ebay") return "eBay";
  }
  return "FB Local";
}

function normalizeShelfConfidence(raw: unknown): "HIGH" | "MEDIUM" | "LOW" {
  if (raw === "HIGH" || raw === "MEDIUM" || raw === "LOW") return raw;
  if (typeof raw === "string") {
    const s = raw.toUpperCase();
    if (s === "HIGH" || s === "MEDIUM" || s === "LOW") return s;
  }
  return "MEDIUM";
}

// Walks a (possibly truncated) shelf-scan response and salvages every
// complete item object inside the `items` array. Brace-counts with
// proper string-state tracking so a brace inside a name ("foo}bar")
// doesn't fool it. Used as a fallback when JSON.parse fails on the
// full response — a 10-item cap in the system prompt + max_tokens
// 4096 should keep this rare, but Sonnet still occasionally over-runs.
function recoverShelfItems(raw: string): unknown[] {
  // Strip code-fence wrappers if the model added them despite the
  // "no markdown" instruction.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = (fenced ? fenced[1] : raw).trim();

  // Locate the items array. Look for the literal `"items"` key first,
  // then fall back to the first `[` if the model dropped the wrapper.
  const itemsKey = text.indexOf('"items"');
  let arrayStart = -1;
  if (itemsKey !== -1) {
    arrayStart = text.indexOf("[", itemsKey);
  }
  if (arrayStart === -1) {
    arrayStart = text.indexOf("[");
  }
  if (arrayStart === -1) return [];

  const items: unknown[] = [];
  let i = arrayStart + 1;

  while (i < text.length) {
    // Skip whitespace + commas between objects.
    while (i < text.length && /[\s,]/.test(text[i])) i++;
    if (i >= text.length) break;
    // End-of-array sentinel — not truncated, just done.
    if (text[i] === "]") break;
    if (text[i] !== "{") break;

    // Walk this object, brace-counting while respecting strings + escapes.
    let depth = 0;
    let inString = false;
    let escape = false;
    const objStart = i;
    let objEnd = -1;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          objEnd = j;
          break;
        }
      }
    }
    if (objEnd === -1) break; // Truncated mid-object — stop salvaging.

    try {
      items.push(JSON.parse(text.slice(objStart, objEnd + 1)));
    } catch {
      break; // Object looked closed but didn't parse; bail.
    }
    i = objEnd + 1;
  }

  return items;
}

export async function shelfScan(imageBase64: string): Promise<ShelfScanResult> {
  const stripped = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  // Inline SDK call (instead of callImageTool) so we can bump
  // max_tokens to 4096 — the default 1024 was truncating mid-array
  // on shelves with 8+ items — and run a recovery parser when the
  // response still over-runs.
  const message = await getClient().messages.create({
    model: SONNET,
    max_tokens: 4096,
    system: SHELF_SCAN_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: stripped,
            },
          },
          { type: "text", text: "Analyze the image." },
        ],
      },
    ],
  });
  const text = extractText(message);

  // Happy path first — parse the whole object. Falls through to the
  // brace-counted salvage if the response was truncated and JSON.parse
  // throws.
  let rawItems: unknown[] = [];
  try {
    const parsed = parseJsonObject<{ items?: unknown }>(text);
    if (Array.isArray(parsed.items)) rawItems = parsed.items;
  } catch {
    rawItems = recoverShelfItems(text);
  }
  if (rawItems.length === 0) {
    // One last attempt: maybe parseJsonObject worked but items wasn't
    // an array (e.g. the model returned a bare array). Try recovery
    // either way before giving up.
    rawItems = recoverShelfItems(text);
  }

  return {
    items: rawItems.map((it) => {
      const obj = (it ?? {}) as Record<string, unknown>;
      const verdictRaw = obj.verdict;
      const verdict: Verdict =
        verdictRaw === "BUY" ||
        verdictRaw === "PASS" ||
        verdictRaw === "MAYBE"
          ? verdictRaw
          : "PASS";
      return {
        name: String(obj.name ?? "Unknown item"),
        cost: Number(obj.cost ?? 0),
        sellFBLocal: Number(obj.sellFBLocal ?? 0),
        sellFBShipped: Number(obj.sellFBShipped ?? 0),
        sellEbay: Number(obj.sellEbay ?? 0),
        profit: Number(obj.profit ?? 0),
        bestPlatform: normalizePlatform(obj.bestPlatform),
        verdict,
        confidence: normalizeShelfConfidence(obj.confidence),
        description: String(obj.description ?? ""),
        daysToSell: Number.isFinite(Number(obj.daysToSell))
          ? Number(obj.daysToSell)
          : 14,
        sellSpeed: normalizeSellSpeed(obj.sellSpeed),
        platformRanking: normalizePlatformRanking(obj.platformRanking),
      };
    }),
  };
}

const PRICE_CHECK_SYSTEM = `You are a resale pricing expert. Estimate realistic resale prices based on what items actually sell for, not retail or asking prices. Respond with ONLY a JSON object, no markdown:
{
  "average_sold_price": number,
  "price_range": { "low": number, "high": number },
  "demand": "hot" or "moderate" or "slow",
  "best_platform": "string",
  "notes": "string"
}`;

export interface PriceCheckResult {
  average_sold_price: number;
  price_range: { low: number; high: number };
  demand: "hot" | "moderate" | "slow";
  best_platform: string;
  notes: string;
}

export async function priceCheck(itemName: string): Promise<PriceCheckResult> {
  const raw = await callTextTool(
    `For the item "${itemName}", estimate: average eBay sold price (last 90 days), price range (low/high), demand level (hot/moderate/slow), best platform to sell on, and any notes. Return as JSON.`,
    PRICE_CHECK_SYSTEM,
  );
  const range = (raw.price_range ?? {}) as Record<string, unknown>;
  const demandRaw = raw.demand;
  return {
    average_sold_price: Number(raw.average_sold_price ?? 0),
    price_range: {
      low: Number(range.low ?? 0),
      high: Number(range.high ?? 0),
    },
    demand:
      demandRaw === "hot" || demandRaw === "moderate" || demandRaw === "slow"
        ? demandRaw
        : "moderate",
    best_platform: String(raw.best_platform ?? ""),
    notes: String(raw.notes ?? ""),
  };
}

const FAKE_CHECK_SYSTEM = `You are an authentication expert for luxury and designer goods. Examine the image and assess authenticity. Respond with ONLY a JSON object, no markdown:
{
  "verdict": "likely_authentic" or "suspicious" or "likely_fake",
  "confidence": number from 0 to 100,
  "red_flags": ["string", ...],
  "indicators": ["string", ...],
  "recommendation": "string"
}`;

export interface FakeCheckResult {
  verdict: "likely_authentic" | "suspicious" | "likely_fake";
  confidence: number;
  red_flags: string[];
  indicators: string[];
  recommendation: string;
}

export async function fakeCheck(imageBase64: string): Promise<FakeCheckResult> {
  const raw = await callImageTool(imageBase64, FAKE_CHECK_SYSTEM);
  const verdictRaw = raw.verdict;
  return {
    verdict:
      verdictRaw === "likely_authentic" ||
      verdictRaw === "suspicious" ||
      verdictRaw === "likely_fake"
        ? verdictRaw
        : "suspicious",
    confidence: Math.max(0, Math.min(100, Number(raw.confidence ?? 0))),
    red_flags: Array.isArray(raw.red_flags)
      ? (raw.red_flags as unknown[]).map(String)
      : [],
    indicators: Array.isArray(raw.indicators)
      ? (raw.indicators as unknown[]).map(String)
      : [],
    recommendation: String(raw.recommendation ?? ""),
  };
}

const TAG_DECODE_SYSTEM = `You are a retail clearance expert. The image is a photo of a store price tag or clearance sticker. Decode it. Respond with ONLY a JSON object, no markdown:
{
  "store": "string",
  "original_price": number,
  "markdown_price": number,
  "clearance_codes": ["string", ...],
  "code_meanings": ["string", ...],
  "notes": "string"
}`;

export interface TagDecodeResult {
  store: string;
  original_price: number;
  markdown_price: number;
  clearance_codes: string[];
  code_meanings: string[];
  notes: string;
}

export async function tagDecode(imageBase64: string): Promise<TagDecodeResult> {
  const raw = await callImageTool(imageBase64, TAG_DECODE_SYSTEM);
  return {
    store: String(raw.store ?? ""),
    original_price: Number(raw.original_price ?? 0),
    markdown_price: Number(raw.markdown_price ?? 0),
    clearance_codes: Array.isArray(raw.clearance_codes)
      ? (raw.clearance_codes as unknown[]).map(String)
      : [],
    code_meanings: Array.isArray(raw.code_meanings)
      ? (raw.code_meanings as unknown[]).map(String)
      : [],
    notes: String(raw.notes ?? ""),
  };
}

const SCRAP_ID_SYSTEM = `You are a scrap metal identification expert. Identify the metal(s) in the image. Respond with ONLY a JSON object, no markdown:
{
  "metal_type": "string",
  "estimated_purity": "string",
  "current_price_per_pound": number,
  "weight_estimate_lbs": number,
  "total_estimated_value": number,
  "identification_notes": "string"
}`;

export interface ScrapIdResult {
  metal_type: string;
  estimated_purity: string;
  current_price_per_pound: number;
  weight_estimate_lbs: number;
  total_estimated_value: number;
  identification_notes: string;
}

export async function scrapId(imageBase64: string): Promise<ScrapIdResult> {
  const raw = await callImageTool(imageBase64, SCRAP_ID_SYSTEM);
  return {
    metal_type: String(raw.metal_type ?? ""),
    estimated_purity: String(raw.estimated_purity ?? ""),
    current_price_per_pound: Number(raw.current_price_per_pound ?? 0),
    weight_estimate_lbs: Number(raw.weight_estimate_lbs ?? 0),
    total_estimated_value: Number(raw.total_estimated_value ?? 0),
    identification_notes: String(raw.identification_notes ?? ""),
  };
}

const LIQUIDATION_SYSTEM = `You are a liquidation lot analyst. Analyze the manifest and estimate the lot's resale potential. Respond with ONLY a JSON object, no markdown:
{
  "total_items": number,
  "estimated_retail_value": number,
  "estimated_resale_value": number,
  "roi_estimate": number,
  "top_items": [{"name": "string", "estimated_value": number}, ...],
  "risk_factors": ["string", ...],
  "verdict": "buy" or "pass" or "maybe",
  "notes": "string"
}`;

export interface LiquidationTopItem {
  name: string;
  estimated_value: number;
}

export interface LiquidationResult {
  total_items: number;
  estimated_retail_value: number;
  estimated_resale_value: number;
  roi_estimate: number;
  top_items: LiquidationTopItem[];
  risk_factors: string[];
  verdict: "buy" | "pass" | "maybe";
  notes: string;
}

export async function liquidationAnalyze(
  manifestText: string,
): Promise<LiquidationResult> {
  const raw = await callTextTool(
    `Analyze this liquidation manifest:\n\n${manifestText.slice(0, 8000)}\n\nReturn the JSON.`,
    LIQUIDATION_SYSTEM,
  );
  const verdictRaw = raw.verdict;
  return {
    total_items: Number(raw.total_items ?? 0),
    estimated_retail_value: Number(raw.estimated_retail_value ?? 0),
    estimated_resale_value: Number(raw.estimated_resale_value ?? 0),
    roi_estimate: Number(raw.roi_estimate ?? 0),
    top_items: Array.isArray(raw.top_items)
      ? (raw.top_items as unknown[]).map((it) => {
          const obj = (it ?? {}) as Record<string, unknown>;
          return {
            name: String(obj.name ?? "Unknown"),
            estimated_value: Number(obj.estimated_value ?? 0),
          };
        })
      : [],
    risk_factors: Array.isArray(raw.risk_factors)
      ? (raw.risk_factors as unknown[]).map(String)
      : [],
    verdict:
      verdictRaw === "buy" || verdictRaw === "pass" || verdictRaw === "maybe"
        ? verdictRaw
        : "maybe",
    notes: String(raw.notes ?? ""),
  };
}

// ──────────────────────────────────────────────────────────────────
// Condition grading — Pro-only multi-image tool. Claude looks at up
// to 6 photos of one item and returns a 5-tier grade plus flaws,
// positives, price impact, and a one-line summary. The route gate
// (api/condition-grade) handles the Pro check; this just runs the
// model call.
// ──────────────────────────────────────────────────────────────────

const CONDITION_GRADE_SYSTEM = `You are an expert condition grader for resale items. Grade on a 5-tier scale:
MINT (A): No visible flaws. Appears new/near-new.
EXCELLENT (B): Minimal wear, 1-2 uses. No stains/pilling/scratches.
GOOD (C): Light wear, minor imperfections. Most resale items fall here.
FAIR (D): Obvious wear, stains, damage. Price 40-60% below GOOD comps.
POOR (F): Heavy wear/damage. Only worth selling if rare.

Examine every photo. Look for: stains, pilling, fading, scratches, chips, cracks, missing parts, broken zippers, yellowing, wear patterns, sole wear, spine creasing, surface damage.

Return ONLY JSON: { "grade": "MINT"|"EXCELLENT"|"GOOD"|"FAIR"|"POOR", "gradeLabel": "A"|"B"|"C"|"D"|"F", "confidence": number (0-100), "flaws": string[], "positives": string[], "priceImpact": string, "summary": string }`;

export type ConditionGrade =
  | "MINT"
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "POOR";
export type ConditionGradeLabel = "A" | "B" | "C" | "D" | "F";

export interface ConditionGradeResult {
  grade: ConditionGrade;
  gradeLabel: ConditionGradeLabel;
  confidence: number;
  flaws: string[];
  positives: string[];
  priceImpact: string;
  summary: string;
}

function normalizeGrade(raw: unknown): ConditionGrade {
  if (
    raw === "MINT" ||
    raw === "EXCELLENT" ||
    raw === "GOOD" ||
    raw === "FAIR" ||
    raw === "POOR"
  )
    return raw;
  if (typeof raw === "string") {
    const s = raw.toUpperCase();
    if (s === "MINT" || s === "EXCELLENT" || s === "GOOD" || s === "FAIR" || s === "POOR")
      return s;
  }
  return "GOOD";
}

function normalizeGradeLabel(raw: unknown): ConditionGradeLabel {
  if (raw === "A" || raw === "B" || raw === "C" || raw === "D" || raw === "F")
    return raw;
  return "C";
}

export async function conditionGrade(
  imagesBase64: string[],
): Promise<ConditionGradeResult> {
  // Cap at 6 images; the system prompt promises that ceiling.
  const images = imagesBase64.slice(0, 6).map((img) =>
    img.replace(/^data:image\/\w+;base64,/, ""),
  );
  const content: Anthropic.Messages.ContentBlockParam[] = images.map((data) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data,
    },
  }));
  content.push({
    type: "text",
    text:
      images.length === 1
        ? "Grade this item's condition based on the photo."
        : `Grade this item's condition based on all ${images.length} photos.`,
  });

  const message = await getClient().messages.create({
    model: SONNET,
    max_tokens: 1024,
    system: CONDITION_GRADE_SYSTEM,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });
  const raw = parseJsonObject<{
    grade?: unknown;
    gradeLabel?: unknown;
    confidence?: unknown;
    flaws?: unknown;
    positives?: unknown;
    priceImpact?: unknown;
    summary?: unknown;
  }>(extractText(message));

  return {
    grade: normalizeGrade(raw.grade),
    gradeLabel: normalizeGradeLabel(raw.gradeLabel),
    confidence: Math.max(0, Math.min(100, Number(raw.confidence ?? 0))),
    flaws: Array.isArray(raw.flaws) ? (raw.flaws as unknown[]).map(String) : [],
    positives: Array.isArray(raw.positives)
      ? (raw.positives as unknown[]).map(String)
      : [],
    priceImpact: String(raw.priceImpact ?? ""),
    summary: String(raw.summary ?? ""),
  };
}

// ──────────────────────────────────────────────────────────────────
// Flip Coach — chat helper. Trims history to the last 20 turns
// before the API call so a long-running conversation never blows
// the token budget. The route handler does the localStorage-based
// daily limit check on the client; the server is stateless.
// ──────────────────────────────────────────────────────────────────

const FLIP_COACH_SYSTEM = `You are Flip Coach, an expert reselling advisor inside the Loot app. You help users make money flipping thrift store finds. You know pricing strategies, platform fees, what to look for at thrift stores, condition grading, shipping optimization, listing best practices, beginner mistakes, and seasonal trends. Keep responses concise (2-4 sentences for simple questions, 1-2 short paragraphs for complex ones). Be practical and specific. Use real dollar amounts. Never be vague.`;

export interface FlipCoachTurn {
  role: "user" | "assistant";
  content: string;
}

export async function flipCoach(args: {
  message: string;
  history: FlipCoachTurn[];
}): Promise<string> {
  // Trim to the last 20 turns to cap token spend on long
  // conversations. The active message is appended below.
  const trimmed = args.history.slice(-20);
  const messages: Anthropic.Messages.MessageParam[] = [
    ...trimmed.map((t) => ({
      role: t.role,
      content: t.content,
    })),
    {
      role: "user" as const,
      content: args.message,
    },
  ];

  const message = await getClient().messages.create({
    model: HAIKU,
    max_tokens: 512,
    system: FLIP_COACH_SYSTEM,
    messages,
  });
  return extractText(message).trim();
}

// ──────────────────────────────────────────────────────────────────
// Feed generators — Claude-as-search for the dashboard carousels
// and sourcing cards. Each function asks Haiku to imagine a
// realistic feed of listings for the user's zip + radius (or for
// pennies/clearance, a realistic national snapshot). The results
// are NOT real listings — they are plausible synthetic data driven
// by the model's knowledge of resale patterns. The route handlers
// cache the output for 4 hours per (zip, feed_type) so this
// generator only runs ~6 times per zip per day at worst.
// ──────────────────────────────────────────────────────────────────

async function callFeedTool(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048,
): Promise<unknown[]> {
  const message = await getClient().messages.create({
    model: HAIKU,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = extractText(message);
  // The feed prompts ask for a JSON array; tolerate either
  // { items: [...] } or a bare [...] response.
  const parsed = parseFeedJson(text);
  return Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.items)
      ? ((parsed as Record<string, unknown>).items as unknown[])
      : [];
}

function parseFeedJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  // Try array first, then object.
  const arrStart = candidate.indexOf("[");
  const arrEnd = candidate.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    try {
      return JSON.parse(candidate.slice(arrStart, arrEnd + 1));
    } catch {
      /* fall through */
    }
  }
  const objStart = candidate.indexOf("{");
  const objEnd = candidate.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    return JSON.parse(candidate.slice(objStart, objEnd + 1));
  }
  throw new Error(`No JSON in feed response: ${raw.slice(0, 200)}`);
}

const DEALS_FEED_SYSTEM = `You are a resale arbitrage expert. Generate realistic Facebook Marketplace and Craigslist listings that a reseller would want to flip. Focus on furniture, electronics, vintage items, brand-name kitchen appliances, and collectibles. Asking prices should be UNDERPRICED relative to resale value — these are the kinds of underpriced posts a reseller jumps on. Respond with ONLY a JSON array, no markdown, no prose. Each element:
{
  "title": "string (lowercase per LOOT voice; proper nouns capitalized)",
  "platform": "Facebook" or "Craigslist",
  "asking_price": number,
  "estimated_resale_value": number,
  "profit_estimate": number,
  "category": "string",
  "age_hours": number between 1 and 48,
  "distance_miles": number
}`;

export interface DealsFeedItem {
  title: string;
  platform: "Facebook" | "Craigslist";
  asking_price: number;
  estimated_resale_value: number;
  profit_estimate: number;
  category: string;
  age_hours: number;
  distance_miles: number;
}

export async function dealsFeed(
  zip: string,
  radius: number,
): Promise<DealsFeedItem[]> {
  const items = await callFeedTool(
    DEALS_FEED_SYSTEM,
    `Zip code: ${zip}\nRadius: ${radius} miles\nGenerate 8-12 listings as a JSON array.`,
  );
  return items.map((it) => {
    const obj = (it ?? {}) as Record<string, unknown>;
    const platformRaw = obj.platform;
    return {
      title: String(obj.title ?? "Unknown listing"),
      platform: platformRaw === "Craigslist" ? "Craigslist" : "Facebook",
      asking_price: Number(obj.asking_price ?? 0),
      estimated_resale_value: Number(obj.estimated_resale_value ?? 0),
      profit_estimate: Number(obj.profit_estimate ?? 0),
      category: String(obj.category ?? ""),
      age_hours: Math.max(1, Math.min(48, Number(obj.age_hours ?? 6))),
      distance_miles: Math.max(0, Number(obj.distance_miles ?? 0)),
    };
  });
}

const FREE_FEED_SYSTEM = `You are a resale arbitrage expert. Generate realistic FREE listings — items people give away on Craigslist Free, Facebook Marketplace, and Nextdoor that have actual resale value. Focus on furniture, electronics, appliances, and building materials. Respond with ONLY a JSON array, no markdown. Each element:
{
  "title": "string (lowercase per LOOT voice; proper nouns capitalized)",
  "platform": "Craigslist" or "Facebook" or "Nextdoor",
  "estimated_resale_value": number,
  "category": "string",
  "age_hours": number between 1 and 24,
  "distance_miles": number
}`;

export interface FreeFeedItem {
  title: string;
  platform: "Craigslist" | "Facebook" | "Nextdoor";
  estimated_resale_value: number;
  category: string;
  age_hours: number;
  distance_miles: number;
}

export async function freeFeed(
  zip: string,
  radius: number,
): Promise<FreeFeedItem[]> {
  const items = await callFeedTool(
    FREE_FEED_SYSTEM,
    `Zip code: ${zip}\nRadius: ${radius} miles\nGenerate 6-8 free listings as a JSON array.`,
  );
  return items.map((it) => {
    const obj = (it ?? {}) as Record<string, unknown>;
    const platformRaw = obj.platform;
    const platform: FreeFeedItem["platform"] =
      platformRaw === "Craigslist" || platformRaw === "Nextdoor"
        ? platformRaw
        : "Facebook";
    return {
      title: String(obj.title ?? "Unknown listing"),
      platform,
      estimated_resale_value: Number(obj.estimated_resale_value ?? 0),
      category: String(obj.category ?? ""),
      age_hours: Math.max(1, Math.min(24, Number(obj.age_hours ?? 4))),
      distance_miles: Math.max(0, Number(obj.distance_miles ?? 0)),
    };
  });
}

const PENNIES_FEED_SYSTEM = `You are a retail clearance expert. Generate current penny drop and deep-clearance items that resellers hunt at Dollar General, Dollar Tree, Walmart, and Target. Focus on seasonal items, discontinued products, and known penny categories. Respond with ONLY a JSON array, no markdown. Each element:
{
  "store": "Dollar General" or "Dollar Tree" or "Walmart" or "Target",
  "item_name": "string",
  "original_price": number,
  "clearance_price": number,
  "estimated_resale_value": number,
  "category": "string",
  "notes": "string"
}`;

export interface PenniesFeedItem {
  store: string;
  item_name: string;
  original_price: number;
  clearance_price: number;
  estimated_resale_value: number;
  category: string;
  notes: string;
}

export async function penniesFeed(): Promise<PenniesFeedItem[]> {
  const items = await callFeedTool(
    PENNIES_FEED_SYSTEM,
    `Generate 8-10 current penny drops and deep clearance items as a JSON array.`,
  );
  return items.map((it) => {
    const obj = (it ?? {}) as Record<string, unknown>;
    return {
      store: String(obj.store ?? ""),
      item_name: String(obj.item_name ?? ""),
      original_price: Number(obj.original_price ?? 0),
      clearance_price: Number(obj.clearance_price ?? 0),
      estimated_resale_value: Number(obj.estimated_resale_value ?? 0),
      category: String(obj.category ?? ""),
      notes: String(obj.notes ?? ""),
    };
  });
}

const CLEARANCE_FEED_SYSTEM = `You are a retail arbitrage expert. Generate current retail clearance deals worth flipping. Focus on electronics, toys, home goods, and health & beauty at major retailers. Respond with ONLY a JSON array, no markdown. Each element:
{
  "store": "string",
  "item_name": "string",
  "clearance_price": number,
  "estimated_resale_value": number,
  "profit_estimate": number,
  "category": "string",
  "platform_to_sell": "Amazon" or "eBay" or "Facebook"
}`;

export interface ClearanceFeedItem {
  store: string;
  item_name: string;
  clearance_price: number;
  estimated_resale_value: number;
  profit_estimate: number;
  category: string;
  platform_to_sell: "Amazon" | "eBay" | "Facebook";
}

// ──────────────────────────────────────────────────────────────────
// BOLO match — used by the /api/cron/bolo-check route. Per user,
// asks Haiku whether any of their watch-list keywords correspond
// to plausible deals near them right now. Returns matches the cron
// can fan out as push notifications.
// ──────────────────────────────────────────────────────────────────

const BOLO_SYSTEM = `You are a resale arbitrage expert. Given a reseller's watch list keywords and their service area, identify any items currently likely to be available locally that match those keywords AND are worth flipping. If nothing meaningful is available, return an empty array. Respond with ONLY a JSON array, no markdown:
[
  {
    "title": "string",
    "estimated_price": number,
    "estimated_resale_value": number,
    "platform": "Facebook" or "Craigslist" or "Nextdoor",
    "keyword_matched": "string"
  }
]`;

export interface BoloMatch {
  title: string;
  estimated_price: number;
  estimated_resale_value: number;
  platform: string;
  keyword_matched: string;
}

export async function boloMatch(args: {
  keywords: string[];
  zip: string;
  radius: number;
}): Promise<BoloMatch[]> {
  if (args.keywords.length === 0) return [];
  const items = await callFeedTool(
    BOLO_SYSTEM,
    `Watch list keywords: ${args.keywords.join(", ")}\nZip: ${args.zip}\nRadius: ${args.radius} miles\nReturn matches as a JSON array. If nothing matches, return [].`,
  );
  return items
    .map((it) => {
      const obj = (it ?? {}) as Record<string, unknown>;
      return {
        title: String(obj.title ?? ""),
        estimated_price: Number(obj.estimated_price ?? 0),
        estimated_resale_value: Number(obj.estimated_resale_value ?? 0),
        platform: String(obj.platform ?? ""),
        keyword_matched: String(obj.keyword_matched ?? ""),
      };
    })
    .filter((m) => m.title.length > 0);
}

export async function clearanceFeed(): Promise<ClearanceFeedItem[]> {
  const items = await callFeedTool(
    CLEARANCE_FEED_SYSTEM,
    `Generate 6-8 retail clearance deals as a JSON array.`,
  );
  return items.map((it) => {
    const obj = (it ?? {}) as Record<string, unknown>;
    const platformRaw = obj.platform_to_sell;
    const platform: ClearanceFeedItem["platform_to_sell"] =
      platformRaw === "Amazon" || platformRaw === "eBay"
        ? platformRaw
        : "Facebook";
    return {
      store: String(obj.store ?? ""),
      item_name: String(obj.item_name ?? ""),
      clearance_price: Number(obj.clearance_price ?? 0),
      estimated_resale_value: Number(obj.estimated_resale_value ?? 0),
      profit_estimate: Number(obj.profit_estimate ?? 0),
      category: String(obj.category ?? ""),
      platform_to_sell: platform,
    };
  });
}
