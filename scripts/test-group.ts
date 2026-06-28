import { groupSeries } from "../src/lib/groupSeries";
import type { BatchValuation } from "../src/lib/claude";

function item(
  index: number,
  name: string,
  estResale: number,
  demand: "High" | "Medium" | "Low" = "Medium",
  verdict?: "BUY" | "PASS" | "MAYBE",
): BatchValuation {
  const v: "BUY" | "PASS" | "MAYBE" =
    verdict ?? (estResale >= 15 ? "BUY" : estResale >= 8 ? "MAYBE" : "PASS");
  return {
    index,
    name,
    verdict: v,
    sellPrice: estResale,
    sellSpeed: "MODERATE",
    reasoning: "test",
    estResale,
    resaleLow: Math.round(estResale * 0.7 * 100) / 100,
    resaleHigh: Math.round(estResale * 1.3 * 100) / 100,
    daysToSell: "2-4 weeks",
    demand,
    platform: "eBay",
    idConfidence: "medium",
    needsVerify: false,
    groupId: null,
    groupRole: "single",
  };
}

const INPUT: BatchValuation[] = [
  item(0,  "City of Bones (Mortal Instruments)",              3.50),
  item(1,  "City of Ashes (Mortal Instruments)",              3.50),
  item(2,  "City of Lost Souls (Mortal Instrum...)",          3.50),
  item(3,  "City of Heavenly Fire (Mortal In...)",            4.00),
  item(4,  "City of Fallen Angels (The Mortal ...)",          3.50),
  item(5,  "City of Glass (The Mortal Instruments)",          3.50),
  item(6,  "Clockwork Angel (The Infernal Devices)",          4.00),
  item(7,  "Clockwork Prince (The Infernal Devices)",         4.00),
  item(8,  "Clockwork Princess (The Infernal Devices)",       4.50),
  item(9,  "Sailor Moon Manga Series (multiple volumes)",    18.00, "High"),
  item(10, "Soul Eater Manga Series (multiple volumes)",     15.00, "High"),
  item(11, "Killua Zoldyck Funko Pop (Hunter x Hunter)",    12.00, "High", "MAYBE"),
  item(12, "Luffy Bento Box",                                 8.00, "Medium", "MAYBE"),
  item(13, "The Hunger Games",                                3.00, "Low"),
  item(14, "Catching Fire",                                   3.00, "Low"),
  item(15, "Mockingjay",                                      3.00, "Low"),
  item(16, "Harry Potter and the Sorcerer's Stone",           5.00),
  item(17, "Harry Potter and the Chamber of Secrets",         4.00),
  item(18, "Harry Potter and the Prisoner of Azkaban",        5.00),
  item(19, "Harry Potter and the Goblet of Fire",             5.00),
  item(20, "One Piece Vol 1",                                12.00, "High"),
  item(21, "One Piece Vol 2",                                10.00, "High"),
  item(22, "One Piece Vol 3",                                12.00, "High"),
  item(23, "KitchenAid Mixer (Red)",                         45.00, "High", "BUY"),
  item(24, "Vintage Pyrex Bowl Set",                         22.00, "Medium", "BUY"),
  item(25, "LEGO Star Wars Millennium Falcon",               35.00, "High", "BUY"),
  item(26, "Nintendo DS Lite (Black)",                       18.00, "High", "BUY"),
  item(27, "Random Romance Novel",                            2.00, "Low"),
];

console.log(`\n=== INPUT: ${INPUT.length} items ===\n`);

const OUTPUT = groupSeries(INPUT);

console.log(`\n=== OUTPUT: ${OUTPUT.length} items ===\n`);

const COL = [56, 12, 24, 7, 9];
const header = [
  "name".padEnd(COL[0]),
  "groupRole".padEnd(COL[1]),
  "groupId".padEnd(COL[2]),
  "verdict".padEnd(COL[3]),
  "estResale",
].join(" | ");
console.log(header);
console.log("-".repeat(header.length));

for (const v of OUTPUT) {
  const prefix = v.groupRole === "lot-anchor" ? "★ " : v.groupRole === "lot-member" ? "  └ " : "  ";
  const nameCol = (prefix + v.name).slice(0, COL[0]).padEnd(COL[0]);
  console.log(
    [
      nameCol,
      (v.groupRole ?? "single").padEnd(COL[1]),
      (v.groupId ?? "null").padEnd(COL[2]),
      v.verdict.padEnd(COL[3]),
      `$${v.estResale.toFixed(2)}`,
    ].join(" | "),
  );
}
