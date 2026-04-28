import "server-only";
import Anthropic from "@anthropic-ai/sdk";

import type { EbayComp } from "./ebay";

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

export interface VerdictResult {
  verdict: Verdict;
  sellPrice: number;
  profit: number;
  platform: "FB Local" | "FB Shipped";
  fee: number;
  reasoning: string;
  listingTitle: string;
  listingDescription: string;
}

const VERDICT_SYSTEM = `You are a reselling arbitrage expert. Given an item and its eBay sold comps, determine if it's worth buying to resell on Facebook Marketplace.

Respond with ONLY valid JSON in this exact shape:
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

FB Local = 0% fee. FB Shipped = 10% fee. Default to FB Local for items under 5lb and bulky items locally.
BUY = profit margin > $15 or > 100% ROI.
MAYBE = profit $5-15.
PASS = profit < $5 or no reliable comps.`;

interface RawVerdictJson {
  verdict?: string;
  sell_price?: number;
  profit?: number;
  platform?: string;
  fee?: number;
  reasoning?: string;
  listing_title?: string;
  listing_description?: string;
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
  comps: EbayComp[];
  brand?: string;
  category?: string;
}): Promise<VerdictResult> {
  const compsSummary = args.comps.length
    ? args.comps
        .slice(0, 10)
        .map(
          (c) =>
            `- $${c.price.toFixed(2)} ${c.condition ?? "unknown"} — ${c.title}`
        )
        .join("\n")
    : "(no comps found)";

  const prompt = `Item: ${args.itemName}
${args.brand ? `Brand: ${args.brand}\n` : ""}${args.category ? `Category: ${args.category}\n` : ""}Cost: $${args.cost.toFixed(2)}

Recent eBay sold/active comps:
${compsSummary}

Return the verdict JSON.`;

  const message = await getClient().messages.create({
    model: HAIKU,
    max_tokens: 1024,
    system: VERDICT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = parseJsonObject<RawVerdictJson>(extractText(message));

  const platform = raw.platform === "FB Shipped" ? "FB Shipped" : "FB Local";
  const verdict =
    raw.verdict === "BUY" || raw.verdict === "PASS" || raw.verdict === "MAYBE"
      ? raw.verdict
      : "PASS";

  return {
    verdict,
    sellPrice: Number(raw.sell_price ?? 0),
    profit: Number(raw.profit ?? 0),
    platform,
    fee: Number(raw.fee ?? 0),
    reasoning: String(raw.reasoning ?? ""),
    listingTitle: String(raw.listing_title ?? args.itemName),
    listingDescription: String(raw.listing_description ?? ""),
  };
}

const VISION_SYSTEM = `You are an expert at identifying retail and thrift items from photos. Identify the single primary product visible. Respond with ONLY valid JSON:
{
  "name": "the most specific product name you can give (brand + model + size if visible)",
  "brand": "brand if visible, else null",
  "category": "broad category (e.g. \\"kitchen\\", \\"electronics\\", \\"clothing\\")"
}`;

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
