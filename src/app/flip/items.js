/**
 * @typedef {Object} FlipItem
 * @property {number} id              1-30 unique
 * @property {string} slug            kebab-case, matches PNG filename in /public/items/
 * @property {string} image           public path "/items/<slug>.png"
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

const i = (id, slug, name, era, brand, category, hint, buyEst, resellEst, isFlip, difficulty, rarity) => ({
  id,
  slug,
  image: `/items/${slug}.png`,
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
  // ─── FLIPS (18) — varied difficulty ────────────────────────────────────────
  i(1, "pyrex-butterprint-403", "Pyrex Butterprint 403", "1957–68", "Pyrex", "vintage glassware",
    "Cinderella handles. Turquoise farm scene.", 4, 85, true, "easy", "mid"),
  i(2, "le-creuset-dutch-oven", "Le Creuset 7.25qt Dutch Oven", "Any", "Le Creuset", "kitchen",
    "Flame orange. Cast iron enameled. The size people pay for.", 20, 180, true, "easy", "high"),
  i(3, "big-e-levis-501", "Levi's 501 Big E Redline", "Pre-1971", "Levi's", "denim",
    "Capital E tab. Selvedge redline inside leg. Flip the cuff.", 5, 220, true, "trick", "grail"),
  i(4, "carhartt-detroit-j97", "Carhartt Detroit Jacket J97", "1990s", "Carhartt", "workwear",
    "Brown duck. Blanket lining. Made in USA tag.", 8, 140, true, "medium", "mid"),
  i(5, "pendleton-wool-blanket", "Pendleton Wool Blanket", "1960s–80s", "Pendleton", "textiles",
    "Geometric Native pattern. Heavy. Label intact.", 12, 160, true, "medium", "high"),
  i(6, "lodge-cast-iron-8", "Lodge Cast Iron #8", "Pre-1990", "Lodge", "kitchen",
    "Heat ring. Smooth interior. Pre-logo era.", 7, 75, true, "medium", "mid"),
  i(7, "nike-single-stitch-tee", "Vintage Nike Single-Stitch Tee", "1980s–early 90s", "Nike", "vintage tee",
    "Single-stitch sleeve. USA tag. Faded just right.", 3, 65, true, "medium", "mid"),
  i(8, "coleman-200a-lantern", "Coleman 200A Red Lantern", "1970s", "Coleman", "vintage camping",
    "Red enamel. Single mantle. Date-stamped underneath.", 6, 90, true, "easy", "mid"),
  i(9, "fleetwood-mac-rumours-og", "Fleetwood Mac Rumours OG", "1977", "Warner Bros", "vinyl",
    "BSK 3010 catalog. Textured sleeve. No barcode.", 6, 80, true, "medium", "mid"),
  i(10, "coach-leather-bag-usa", "Coach Leather Bag (Made in USA)", "1980s–90s", "Coach", "leather",
    "Glove-tanned. Brass hardware. Creed inside.", 10, 95, true, "medium", "mid"),
  i(11, "polo-rl-stadium-92", "Polo RL Stadium 1992", "1992", "Polo Ralph Lauren", "vintage outerwear",
    "P-Wing logo. Stadium graphic. Heavy cotton.", 12, 400, true, "trick", "grail"),
  i(12, "y2k-mudd-cargo", "Y2K Mudd Cargo Jeans", "1999–2003", "Mudd", "y2k",
    "Low-rise. Flare. Stitched back-pocket logo.", 4, 55, true, "easy", "common"),
  i(13, "sp5der-hoodie", "Sp5der Hoodie (authentic)", "2020s", "Sp5der", "streetwear",
    "Web graphic. Neon. Stitching density tells the truth.", 25, 280, true, "medium", "high"),
  i(14, "hellstar-tee-nwt", "Hellstar Studios Tee NWT", "2020s", "Hellstar", "streetwear",
    "Studio drop. Distressed graphic. Holographic tag.", 15, 120, true, "easy", "high"),
  i(15, "stanley-green-thermos", "Vintage Stanley Green Thermos", "1970s–80s", "Stanley", "vintage gear",
    "Hammered green enamel. Cork still inside. No dents.", 5, 35, true, "easy", "common"),
  i(16, "ball-mason-blue-half-gallon", "Ball Mason Blue Half-Gallon", "1900s–20s", "Ball", "vintage glassware",
    "Aqua blue. \"Perfect Mason\" embossed. Zinc lid.", 8, 45, true, "medium", "mid"),
  i(17, "pyrex-spring-blossom", "Pyrex Spring Blossom Green", "1970s", "Pyrex", "vintage glassware",
    "Avocado green. Common pattern. Still moves.", 3, 30, true, "easy", "common"),
  i(18, "bauer-pottery-red", "Bauer Ringware Red", "1930s–40s", "Bauer", "pottery",
    "Concentric rings. Chinese red glaze. Marked underfoot.", 10, 85, true, "trick", "mid"),

  // ─── SKIPS (12) — low value, common, or damaged ────────────────────────────
  i(19, "generic-floral-figurine", "Generic Floral Figurine", "modern", "Unknown", "decor",
    "Mass-produced ceramic. Smells like grandma's mall booth.", 2, 4, false, "easy", "common"),
  i(20, "walmart-era-vase", "Walmart-Era Glass Vase", "2010s", "Unknown", "decor",
    "Big box origin. No marks. Plain.", 1, 3, false, "easy", "common"),
  i(21, "cracked-pyrex-snowflake", "Cracked Pyrex Snowflake (damaged)", "1970s", "Pyrex", "vintage glassware",
    "Right pattern, but a visible hairline crack on the rim.", 2, 5, false, "trick", "common"),
  i(22, "faded-modern-disney-plush", "Faded Modern Disney Plush", "2010s", "Disney", "plush",
    "Mass licensed. Faded from sun. Not a vintage Pooh.", 1, 2, false, "easy", "common"),
  i(23, "ceramic-christmas-mug", "Ceramic Christmas Mug", "2010s", "Unknown", "kitchen",
    "Generic holiday motif. Decal not painted.", 1, 1, false, "easy", "common"),
  i(24, "broken-porcelain-figurine", "Broken Porcelain Figurine", "1980s", "Unknown", "decor",
    "Repaired with visible glue. Chipped hand.", 1, 0, false, "easy", "common"),
  i(25, "pier1-soy-candle", "Modern Pier 1 Candle", "2020s", "Pier 1", "decor",
    "Big-retail candle. Used. Not collectible.", 2, 3, false, "easy", "common"),
  i(26, "old-tinsel-garland", "Old Tinsel Garland", "1990s", "Unknown", "decor",
    "Tangled silver tinsel. Not antique mercury glass.", 1, 1, false, "easy", "common"),
  i(27, "live-laugh-love-sign", "\"Live Laugh Love\" Sign", "2010s", "Unknown", "decor",
    "MDF + vinyl letters. The sign of a hard pass.", 2, 2, false, "easy", "common"),
  i(28, "sun-faded-plastic-flowers", "Sun-Faded Plastic Flowers", "modern", "Unknown", "decor",
    "UV-bleached. Brittle stems. Estate-sale filler.", 1, 1, false, "easy", "common"),
  i(29, "generic-canvas-tote", "Generic Canvas Tote", "2020s", "Unknown", "bag",
    "Stained. Branded for a 2019 conference. Pass.", 1, 2, false, "easy", "common"),
  i(30, "copper-pot-no-maker", "Copper Pot, No Maker Mark", "20th century", "Unknown", "kitchen",
    "Copper-look, but no maker stamp. Likely thin-plated.", 8, 12, false, "trick", "common"),
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
