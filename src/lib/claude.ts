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

export interface VerdictResult {
  verdict: Verdict;
  sellPrice: number;
  profit: number;
  platform: "FB Local";
  fee: 0;
  reasoning: string;
  confidence: Confidence;
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
PASS = profit below 5 dollars or item is unlikely to sell locally.`;

interface RawVerdictJson {
  verdict?: string;
  sellPrice?: number;
  profit?: number;
  platform?: string;
  fee?: number;
  reasoning?: string;
  confidence?: string;
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
