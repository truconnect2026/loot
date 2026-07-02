export interface KnownPressing {
  canonical: string;  // "Artist – Album" — canonical display name for correctName snapping
  aliases: string[];  // alternate forms / common OCR misreads
}

export const KNOWN_PRESSINGS: readonly KnownPressing[] = [
  // Jazz
  { canonical: "Miles Davis – Kind of Blue",              aliases: ["kind of blue", "kind of blue miles davis"] },
  { canonical: "Miles Davis – Bitches Brew",              aliases: ["bitches brew"] },
  { canonical: "Miles Davis – In a Silent Way",           aliases: ["in a silent way"] },
  { canonical: "John Coltrane – A Love Supreme",          aliases: ["a love supreme", "love supreme"] },
  { canonical: "John Coltrane – Blue Train",              aliases: ["blue train"] },
  { canonical: "John Coltrane – My Favorite Things",      aliases: ["my favorite things coltrane"] },
  { canonical: "Bill Evans – Waltz for Debby",            aliases: ["waltz for debby", "waltz for debbie"] },
  { canonical: "Thelonious Monk – Monk's Dream",          aliases: ["monks dream", "monk dream"] },
  { canonical: "Charles Mingus – Mingus Ah Um",           aliases: ["mingus ah um", "mingus ah-um"] },
  { canonical: "Herbie Hancock – Head Hunters",           aliases: ["head hunters", "headhunters"] },
  { canonical: "Dave Brubeck – Time Out",                 aliases: ["time out brubeck"] },
  { canonical: "Chet Baker – Chet Baker Sings",           aliases: ["chet baker sings"] },
  // Classic Rock
  { canonical: "Pink Floyd – The Dark Side of the Moon", aliases: ["dark side of the moon", "dark side moon", "dsotm"] },
  { canonical: "Pink Floyd – Wish You Were Here",         aliases: ["wish you were here"] },
  { canonical: "Pink Floyd – Animals",                    aliases: ["pink floyd animals"] },
  { canonical: "The Beatles – Abbey Road",                aliases: ["abbey road", "abbey road beatles"] },
  { canonical: "The Beatles – Sgt. Pepper's Lonely Hearts Club Band", aliases: ["sgt pepper", "sgt peppers", "lonely hearts club"] },
  { canonical: "Led Zeppelin – IV",                       aliases: ["led zeppelin iv", "zeppelin iv", "zoso", "led zep iv"] },
  { canonical: "Led Zeppelin – Physical Graffiti",        aliases: ["physical graffiti"] },
  { canonical: "Fleetwood Mac – Rumours",                 aliases: ["rumours", "rumors fleetwood mac"] },
  { canonical: "David Bowie – The Rise and Fall of Ziggy Stardust", aliases: ["ziggy stardust", "ziggy"] },
  { canonical: "The Velvet Underground – The Velvet Underground & Nico", aliases: ["velvet underground nico", "banana album"] },
  { canonical: "Jimi Hendrix – Are You Experienced",      aliases: ["are you experienced"] },
  { canonical: "Bob Dylan – Highway 61 Revisited",        aliases: ["highway 61", "highway 61 revisited"] },
  { canonical: "Bob Dylan – Blonde on Blonde",            aliases: ["blonde on blonde"] },
  { canonical: "The Doors – The Doors",                   aliases: ["the doors debut", "doors self titled"] },
  // Soul / R&B / Funk
  { canonical: "Marvin Gaye – What's Going On",           aliases: ["whats going on", "what's going on marvin"] },
  { canonical: "Al Green – Let's Stay Together",          aliases: ["lets stay together"] },
  { canonical: "Curtis Mayfield – Superfly",              aliases: ["superfly", "super fly"] },
  { canonical: "Stevie Wonder – Songs in the Key of Life", aliases: ["songs in the key of life", "songs key of life"] },
  { canonical: "James Brown – Live at the Apollo",        aliases: ["live at the apollo", "james brown apollo"] },
  { canonical: "Isaac Hayes – Hot Buttered Soul",         aliases: ["hot buttered soul"] },
  { canonical: "Gil Scott-Heron – Pieces of a Man",       aliases: ["pieces of a man", "pieces of man"] },
  // Hip-Hop
  { canonical: "A Tribe Called Quest – The Low End Theory", aliases: ["low end theory", "tribe called quest low end"] },
  { canonical: "De La Soul – 3 Feet High and Rising",    aliases: ["3 feet high", "three feet high rising"] },
  { canonical: "Eric B & Rakim – Paid in Full",           aliases: ["paid in full", "eric b rakim paid"] },
  { canonical: "N.W.A – Straight Outta Compton",          aliases: ["straight outta compton", "nwa straight outta"] },
  { canonical: "Public Enemy – It Takes a Nation of Millions", aliases: ["it takes a nation", "nation of millions"] },
  // Electronic / Dance
  { canonical: "Kraftwerk – Trans-Europe Express",        aliases: ["trans europe express"] },
  { canonical: "Daft Punk – Random Access Memories",      aliases: ["random access memories"] },
  { canonical: "Aphex Twin – Selected Ambient Works 85-92", aliases: ["selected ambient works", "ambient works 85 92"] },
  // Other collectable
  { canonical: "Buena Vista Social Club",                 aliases: ["buena vista social", "buena vista club"] },
  { canonical: "Johnny Cash – At Folsom Prison",          aliases: ["at folsom prison", "folsom prison cash"] },
  { canonical: "Joni Mitchell – Blue",                    aliases: ["blue joni mitchell"] },
  { canonical: "Tom Waits – Rain Dogs",                   aliases: ["rain dogs"] },
];
