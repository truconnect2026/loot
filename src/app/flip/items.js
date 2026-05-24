/**
 * @typedef {Object} FlipItem
 * @property {number} id              1-36 unique
 * @property {string} slug            kebab-case, matches PNG filename in /public/flip/items/
 * @property {string} image           public path "/flip/items/<slug>.png" (or placeholder)
 * @property {string} name            Display name
 * @property {string} era             Year range or decade
 * @property {string} brand           Brand or maker
 * @property {string} category        Coarse category (e.g. "vintage glassware")
 * @property {string} hint            One-liner shown on card
 * @property {number} buyEst          Typical thrift buy price (USD)
 * @property {number} resellEst       Typical eBay resell price (USD)
 * @property {number} netEst          resellEst after ~30% fees+shipping
 * @property {boolean} isFlip         true = swipe right (FLIP), false = swipe left (SKIP)
 * @property {"easy"|"medium"|"hard"|"trick"} difficulty
 * @property {"common"|"mid"|"high"|"grail"} rarity
 */

// Photo bank lives at public/flip/items/<slug>.png. The 24 FLIPS below each
// have a matching photo. The 12 SKIPS are photo-less and fall back to the
// shared placeholder — no per-skip art required since they exist primarily
// to be reflexively dismissed.
const PHOTO_BASE = "/flip/items";
const PLACEHOLDER = "/items/_placeholder.svg";

const i = (id, slug, name, era, brand, category, hint, buyEst, resellEst, isFlip, difficulty, rarity, hasPhoto = true) => ({
  id,
  slug,
  image: hasPhoto ? `${PHOTO_BASE}/${slug}.png` : PLACEHOLDER,
  name,
  era,
  brand,
  category,
  hint,
  buyEst,
  resellEst,
  netEst: Math.max(0, Math.round(resellEst * 0.7)),
  isFlip,
  difficulty,
  rarity,
});

/** @type {FlipItem[]} */
export const ITEMS = [
  // ─── FLIPS (24) — each slug maps to public/flip/items/<slug>.png ───────────
  i(1, "pyrex-butterprint", "Pyrex Butterprint 403", "1957–68", "Pyrex", "vintage glassware",
    "Cinderella handles. Turquoise farm scene.", 4, 85, true, "easy", "mid"),
  i(2, "lecreuset-dutch", "Le Creuset 7.25qt Dutch Oven", "Any", "Le Creuset", "kitchen",
    "Flame orange. Cast iron enameled. The size people pay for.", 20, 180, true, "easy", "high"),
  i(3, "levis-501", "Levi's 501 Big E Redline", "Pre-1971", "Levi's", "denim",
    "Capital E tab. Selvedge redline inside leg. Flip the cuff.", 5, 220, true, "trick", "grail"),
  i(4, "carhartt-jacket", "Carhartt Detroit Jacket J97", "1990s", "Carhartt", "workwear",
    "Brown duck. Blanket lining. Made in USA tag.", 8, 140, true, "medium", "mid"),
  i(5, "flannel-shirt", "Pendleton Wool Board Shirt", "1960s–80s", "Pendleton", "vintage flannel",
    "100% wool. Plaid. Lodge label. Made in USA.", 8, 90, true, "medium", "mid"),
  i(6, "lodge-skillet", "Lodge Cast Iron #8", "Pre-1990", "Lodge", "kitchen",
    "Heat ring. Smooth interior. Pre-logo era.", 7, 75, true, "medium", "mid"),
  i(7, "nike-white", "Nike Air Force 1 Low (white)", "Any", "Nike", "sneakers",
    "All-white leather. AF1 heel stamp. No creasing.", 22, 90, true, "easy", "mid"),
  i(8, "fishing-lures", "Vintage Fishing Lure Box (Heddon)", "1940s–60s", "Heddon", "vintage gear",
    "Wooden body. Glass eyes. Original paper-insert box.", 8, 130, true, "medium", "mid"),
  i(9, "vintage-radio", "Vintage Transistor Radio (Zenith)", "1950s–60s", "Zenith", "vintage electronics",
    "Bakelite case. Round dial. Brass grille. Powers on.", 10, 95, true, "medium", "mid"),
  i(10, "coach-bag", "Coach Leather Bag (Made in USA)", "1980s–90s", "Coach", "leather",
    "Glove-tanned. Brass hardware. Creed inside.", 10, 95, true, "medium", "mid"),
  i(11, "vintage-hoodie", "Champion Reverse-Weave Hoodie", "1980s–90s", "Champion", "vintage athletic",
    "Heavy cotton. Side gussets. Reverse-weave construction.", 7, 85, true, "easy", "mid"),
  i(12, "denim-jacket", "Vintage Denim Jacket (Lee / Wrangler)", "1970s–80s", "Lee / Wrangler", "denim",
    "Heavy denim. Pearl snaps. Made in USA. Faded soft.", 6, 70, true, "easy", "mid"),
  i(13, "typewriter", "Vintage Royal Typewriter", "1940s–60s", "Royal / Smith Corona", "vintage electronics",
    "All-metal. Glossy enamel. Working keys + ribbon.", 18, 150, true, "medium", "high"),
  i(14, "polaroid-camera", "Polaroid SX-70", "1972–81", "Polaroid", "vintage electronics",
    "Folds flat. Leather + chrome. Original SX-70.", 15, 180, true, "medium", "high"),
  i(15, "copper-pot", "Hammered French Copper Pot", "Vintage", "Mauviel-style", "kitchen",
    "Hammered copper. Brass handles. Tin lining intact.", 15, 120, true, "medium", "mid"),
  i(16, "mason-jars", "Ball Mason Blue Half-Gallon", "1900s–37", "Ball", "vintage glassware",
    "Aqua blue. \"Perfect Mason\" embossed. Zinc lid.", 2, 45, true, "medium", "mid"),
  i(17, "pyrex-casserole", "Pyrex Snowflake Casserole", "1956–67", "Pyrex", "vintage glassware",
    "Turquoise w/ white snowflake. Original lid = bonus.", 5, 70, true, "easy", "mid"),
  i(18, "sterling-flatware", "Sterling Silver Flatware Set", "Early–mid 1900s", "Various", "silver",
    "Heavy. \"STERLING\" stamped handles. Full set in case.", 25, 240, true, "medium", "high"),
  i(19, "adidas-sambas", "Adidas Samba OG (gum sole)", "Any", "Adidas", "sneakers",
    "White leather. Black stripes. T-toe overlay. Gum sole.", 18, 110, true, "easy", "mid"),
  i(20, "air-jordans", "Air Jordan 1 (varsity red)", "1985 OG / retros", "Nike", "sneakers",
    "Red/white/black. Wings logo. Nike Air on heel.", 35, 280, true, "easy", "high"),
  i(21, "anchor-hocking", "Anchor Hocking Bubble Glass", "1940s–60s", "Anchor Hocking", "vintage glassware",
    "Pressed glass. Bubble pattern. Heavy lead-feel.", 3, 45, true, "medium", "mid"),
  i(22, "depression-glass", "Pink Depression Glass", "1929–40", "Various", "vintage glassware",
    "Soft pink. Pressed pattern. Translucent in light.", 4, 65, true, "medium", "mid"),
  i(23, "fireking-jadeite", "Fire-King Jadeite Mug Set", "1940s–70s", "Anchor Hocking Fire-King", "vintage glassware",
    "Opaque jade green. \"Fire-King\" bottom stamp.", 5, 80, true, "easy", "mid"),
  i(24, "leather-briefcase", "Vintage Leather Briefcase", "1960s–80s", "Hartmann / Coach", "leather",
    "Full-grain. Brass hardware. Combo locks.", 12, 110, true, "medium", "mid"),

  // ─── SKIPS (12) — low value, common, damaged. No photos. ───────────────────
  i(25, "generic-floral-figurine", "Generic Floral Figurine", "modern", "Unknown", "decor",
    "Mass-produced ceramic. Smells like grandma's mall booth.", 2, 4, false, "easy", "common", false),
  i(26, "walmart-era-vase", "Walmart-Era Glass Vase", "2010s", "Unknown", "decor",
    "Big box origin. No marks. Plain.", 1, 3, false, "easy", "common", false),
  i(27, "cracked-pyrex-snowflake", "Cracked Pyrex Snowflake (damaged)", "1970s", "Pyrex", "vintage glassware",
    "Right pattern, but a visible hairline crack on the rim.", 2, 5, false, "trick", "common", false),
  i(28, "faded-modern-disney-plush", "Faded Modern Disney Plush", "2010s", "Disney", "plush",
    "Mass licensed. Faded from sun. Not a vintage Pooh.", 1, 2, false, "easy", "common", false),
  i(29, "ceramic-christmas-mug", "Ceramic Christmas Mug", "2010s", "Unknown", "kitchen",
    "Generic holiday motif. Decal not painted.", 1, 1, false, "easy", "common", false),
  i(30, "broken-porcelain-figurine", "Broken Porcelain Figurine", "1980s", "Unknown", "decor",
    "Repaired with visible glue. Chipped hand.", 1, 0, false, "easy", "common", false),
  i(31, "pier1-soy-candle", "Modern Pier 1 Candle", "2020s", "Pier 1", "decor",
    "Big-retail candle. Used. Not collectible.", 2, 3, false, "easy", "common", false),
  i(32, "old-tinsel-garland", "Old Tinsel Garland", "1990s", "Unknown", "decor",
    "Tangled silver tinsel. Not antique mercury glass.", 1, 1, false, "easy", "common", false),
  i(33, "live-laugh-love-sign", "\"Live Laugh Love\" Sign", "2010s", "Unknown", "decor",
    "MDF + vinyl letters. The sign of a hard pass.", 2, 2, false, "easy", "common", false),
  i(34, "sun-faded-plastic-flowers", "Sun-Faded Plastic Flowers", "modern", "Unknown", "decor",
    "UV-bleached. Brittle stems. Estate-sale filler.", 1, 1, false, "easy", "common", false),
  i(35, "generic-canvas-tote", "Generic Canvas Tote", "2020s", "Unknown", "bag",
    "Stained. Branded for a 2019 conference. Pass.", 1, 2, false, "easy", "common", false),
  i(36, "copper-pot-no-maker", "Copper Pot, No Maker Mark", "20th century", "Unknown", "kitchen",
    "Copper-look, but no maker stamp. Likely thin-plated.", 8, 12, false, "trick", "common", false),
];

// ─── Back-compat shims ─────────────────────────────────────────────────────
// layout.tsx + og-app.png/route.tsx still import these from this module. The
// new game uses getDailyItems() from lib/dailySeed.js instead; these stay
// only so existing OG metadata keeps generating a stable preview.

export const getPuzzleNumber = () => {
  const epoch = new Date("2026-05-01").getTime();
  return Math.floor((Date.now() - epoch) / 86400000) + 1;
};

export const getDailyIndex = () => {
  // Stable rotation through the bank for OG-image purposes only.
  const n = getPuzzleNumber();
  return ((n - 1) % ITEMS.length + ITEMS.length) % ITEMS.length;
};
