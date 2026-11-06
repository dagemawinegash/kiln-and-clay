// Placeholder catalogue. Every name, price and description here is invented for this demo.
import { seededRandom } from "./util.js";
import { FILTERS, SORTS, facetValues } from "../public/js/store-logic.js";

export const STORE = {
  name: "Kiln & Clay",
  tagline: "Tiles for walls, floors and everything between",
  currency: "GBP",
  freeDeliveryThreshold: 300,
  deliveryFee: 39,
  maxFreeSamples: 5,
  wastage: 0.1,
};

// Colour keys used by products and the image generator.
export const COLOURS = {
  pearl: { name: "Pearl", hex: "#ece6da", family: "White" },
  chalk: { name: "Chalk", hex: "#f4f2ee", family: "White" },
  ivory: { name: "Ivory", hex: "#efe7d4", family: "Cream" },
  cream: { name: "Cream", hex: "#e8dcc2", family: "Cream" },
  sage: { name: "Sage", hex: "#a7b59a", family: "Green" },
  forest: { name: "Forest", hex: "#2f5a43", family: "Green" },
  emerald: { name: "Emerald", hex: "#1f7a5c", family: "Green" },
  olive: { name: "Olive", hex: "#7a7a3e", family: "Green" },
  mint: { name: "Mint", hex: "#b9dccb", family: "Green" },
  teal: { name: "Teal", hex: "#2a7f84", family: "Blue" },
  sky: { name: "Sky", hex: "#9cc3df", family: "Blue" },
  navy: { name: "Navy", hex: "#22345e", family: "Blue" },
  indigo: { name: "Indigo", hex: "#33407a", family: "Blue" },
  cobalt: { name: "Cobalt", hex: "#2650a8", family: "Blue" },
  aqua: { name: "Aqua", hex: "#6fc3c0", family: "Blue" },
  blush: { name: "Blush", hex: "#e6b8b0", family: "Pink" },
  rose: { name: "Rose", hex: "#d58f92", family: "Pink" },
  lilac: { name: "Lilac", hex: "#b8a6cf", family: "Purple" },
  terracotta: { name: "Terracotta", hex: "#b8603e", family: "Orange" },
  rust: { name: "Rust", hex: "#9c4a2c", family: "Orange" },
  ochre: { name: "Ochre", hex: "#c9902f", family: "Yellow" },
  butter: { name: "Butter", hex: "#efd98c", family: "Yellow" },
  mustard: { name: "Mustard", hex: "#c8a12b", family: "Yellow" },
  grey: { name: "Dove Grey", hex: "#b4b2ad", family: "Grey" },
  charcoal: { name: "Charcoal", hex: "#3b3c3e", family: "Grey" },
  anthracite: { name: "Anthracite", hex: "#4a4b4d", family: "Grey" },
  black: { name: "Jet", hex: "#1d1d1f", family: "Black" },
  nero: { name: "Nero", hex: "#232325", family: "Black" },
  monochrome: { name: "Monochrome", hex: "#2b2b2b", family: "Black" },
  beige: { name: "Sand", hex: "#cdbb9c", family: "Beige" },
  oak: { name: "Oak", hex: "#b88a5a", family: "Brown" },
  walnut: { name: "Walnut", hex: "#6e4a30", family: "Brown" },
  ash: { name: "Ash", hex: "#c7b49b", family: "Beige" },
  honey: { name: "Honey", hex: "#c08a4a", family: "Brown" },
  smoked: { name: "Smoked", hex: "#5a4636", family: "Brown" },
  natural: { name: "Natural", hex: "#d2b48c", family: "Beige" },
  verde: { name: "Verde", hex: "#2f4a3e", family: "Green" },
  calacatta: { name: "Bianco", hex: "#f1efeb", family: "White" },
  pink: { name: "Petal", hex: "#e9c4c0", family: "Pink" },
};

// Each series becomes one product per colour.
const SERIES = [
  {
    key: "brisa", name: "Brisa", pattern: "zellige", style: "Zellige Effect", size: "10x10cm",
    finish: "Gloss", material: "Ceramic", surfaces: ["Wall"], rooms: ["Bathroom", "Kitchen"],
    pricePerM2: 54.95, m2PerBox: 0.5, colours: ["pearl", "sage", "teal", "blush"],
    blurb: "Hand-finished look with uneven edges and a deep glaze that shifts from tile to tile.",
  },
  {
    key: "cove", name: "Cove", pattern: "metro", style: "Metro", size: "7.5x30cm",
    finish: "Gloss", material: "Ceramic", surfaces: ["Wall"], rooms: ["Bathroom", "Kitchen"],
    pricePerM2: 27.95, m2PerBox: 1, colours: ["chalk", "black", "forest", "sky"],
    blurb: "A slim bevelled brick that suits splashbacks, showers and feature walls.",
  },
  {
    key: "halden", name: "Halden", pattern: "hexagon", style: "Hexagon", size: "20x23cm",
    finish: "Matt", material: "Porcelain", surfaces: ["Wall", "Floor"], rooms: ["Bathroom", "Kitchen", "Hallway"],
    pricePerM2: 38.95, m2PerBox: 0.8, colours: ["cream", "charcoal", "terracotta"],
    blurb: "Six-sided porcelain with a soft matt surface, tough enough for busy floors.",
  },
  {
    key: "lumen", name: "Lumen", pattern: "star", style: "Patterned", size: "13x13cm",
    finish: "Matt", material: "Porcelain", surfaces: ["Wall", "Floor"], rooms: ["Bathroom", "Hallway"],
    pricePerM2: 48.95, m2PerBox: 0.5, colours: ["chalk", "navy", "ochre"],
    blurb: "Eight-point stars locked with crosses for a classic interlocking floor.",
  },
  {
    key: "fable", name: "Fable", pattern: "encaustic", style: "Patterned", size: "20x20cm",
    finish: "Matt", material: "Porcelain", surfaces: ["Wall", "Floor"], rooms: ["Hallway", "Kitchen", "Bathroom"],
    pricePerM2: 43.95, m2PerBox: 1, colours: ["monochrome", "indigo", "rust", "olive"],
    blurb: "Printed porcelain inspired by old cement tiles, with a design that repeats every four tiles.",
  },
  {
    key: "marlow", name: "Marlow", pattern: "terrazzo", style: "Terrazzo", size: "60x60cm",
    finish: "Matt", material: "Porcelain", surfaces: ["Wall", "Floor"], rooms: ["Kitchen", "Bathroom", "Living Room"],
    pricePerM2: 35.95, m2PerBox: 1.08, colours: ["ivory", "grey", "pink"],
    blurb: "Large-format terrazzo effect with scattered chips and a calm base colour.",
  },
  {
    key: "orla", name: "Orla", pattern: "marble", style: "Marble Effect", size: "60x120cm",
    finish: "Polished", material: "Porcelain", surfaces: ["Wall", "Floor"], rooms: ["Bathroom", "Kitchen", "Living Room"],
    pricePerM2: 51.95, m2PerBox: 1.44, colours: ["calacatta", "nero", "verde"],
    blurb: "Polished slabs with soft veining and fewer grout lines thanks to the large size.",
  },
  {
    key: "rook", name: "Rook", pattern: "wood", style: "Wood Effect", size: "20x120cm",
    finish: "Matt", material: "Porcelain", surfaces: ["Floor"], rooms: ["Living Room", "Kitchen", "Hallway"],
    pricePerM2: 33.95, m2PerBox: 1.2, colours: ["oak", "walnut", "ash"],
    blurb: "Plank porcelain with the warmth of timber and none of the upkeep.",
  },
  {
    key: "sable", name: "Sable", pattern: "chevron", style: "Wood Effect", size: "9x60cm",
    finish: "Matt", material: "Porcelain", surfaces: ["Floor"], rooms: ["Living Room", "Kitchen", "Hallway"],
    pricePerM2: 40.95, m2PerBox: 0.86, colours: ["honey", "smoked", "natural"],
    blurb: "Short planks cut for a chevron layout that draws the eye along a room.",
  },
  {
    key: "tamsin", name: "Tamsin", pattern: "fishscale", style: "Fish Scale", size: "10x11cm",
    finish: "Gloss", material: "Ceramic", surfaces: ["Wall"], rooms: ["Bathroom", "Kitchen"],
    pricePerM2: 57.95, m2PerBox: 0.4, colours: ["chalk", "aqua", "emerald", "mustard"],
    blurb: "Rounded scales in a glossy glaze for showers, niches and splashbacks.",
  },
  {
    key: "dune", name: "Dune", pattern: "stone", style: "Stone Effect", size: "60x60cm",
    finish: "Anti-slip", material: "Porcelain", surfaces: ["Floor"], rooms: ["Outdoor", "Living Room"],
    pricePerM2: 38.95, m2PerBox: 0.72, colours: ["beige", "grey", "anthracite"],
    blurb: "20mm outdoor porcelain with a textured grip that matches the indoor version.",
  },
  {
    key: "ember", name: "Ember", pattern: "square", style: "Square", size: "15x15cm",
    finish: "Gloss", material: "Ceramic", surfaces: ["Wall"], rooms: ["Kitchen", "Bathroom"],
    pricePerM2: 31.95, m2PerBox: 1, colours: ["butter", "mint", "lilac", "cobalt"],
    blurb: "Simple glossy squares with a crackle glaze, ideal for colourful splashbacks.",
  },
];

function slug(text) {
  return text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const PRODUCTS = [];
let position = 0;
for (const s of SERIES) {
  for (const colourKey of s.colours) {
    const colour = COLOURS[colourKey];
    const name = `${s.name} ${colour.name}`;
    const handle = slug(name);
    const rand = seededRandom(handle);
    const reviewCount = Math.floor(rand() * 180) + 2;
    const rating = Math.round((4.3 + rand() * 0.7) * 10) / 10;
    const onSale = rand() < 0.18;
    const pricePerM2 = s.pricePerM2;
    PRODUCTS.push({
      handle,
      name,
      series: s.name,
      seriesKey: s.key,
      pattern: s.pattern,
      style: s.style,
      size: s.size,
      finish: s.finish,
      material: s.material,
      surfaces: s.surfaces,
      rooms: s.rooms,
      colourKey,
      colour: colour.name,
      colourFamily: colour.family,
      hex: colour.hex,
      pricePerM2,
      compareAtPerM2: onSale ? Math.round(pricePerM2 * 1.25 * 100) / 100 - 0.01 : null,
      m2PerBox: s.m2PerBox,
      pricePerBox: Math.round(pricePerM2 * s.m2PerBox * 100) / 100,
      rating,
      reviewCount,
      isNew: rand() < 0.2,
      inStock: rand() > 0.08,
      position: position++,
      description: s.blurb,
    });
  }
}

export const PRODUCT_BY_HANDLE = new Map(PRODUCTS.map((p) => [p.handle, p]));

// Collections are saved filters over the catalogue.
export const COLLECTIONS = [
  { handle: "all", title: "All Tiles", match: () => true, intro: "Every tile in the range, from tiny mosaics to large slabs." },
  { handle: "wall-tiles", title: "Wall Tiles", match: (p) => p.surfaces.includes("Wall"), intro: "Tiles for splashbacks, showers and feature walls." },
  { handle: "floor-tiles", title: "Floor Tiles", match: (p) => p.surfaces.includes("Floor"), intro: "Hard-wearing porcelain for every room in the house." },
  { handle: "bathroom-tiles", title: "Bathroom Tiles", match: (p) => p.rooms.includes("Bathroom"), intro: "Water-ready tiles for walls, floors and wet rooms." },
  { handle: "kitchen-tiles", title: "Kitchen Tiles", match: (p) => p.rooms.includes("Kitchen"), intro: "Splashbacks and floors that are easy to keep clean." },
  { handle: "hallway-tiles", title: "Hallway Tiles", match: (p) => p.rooms.includes("Hallway"), intro: "Make an entrance with pattern and tough porcelain." },
  { handle: "living-room-tiles", title: "Living Room Tiles", match: (p) => p.rooms.includes("Living Room"), intro: "Warm wood looks and calm stone effects for living spaces." },
  { handle: "outdoor-tiles", title: "Outdoor Tiles", match: (p) => p.rooms.includes("Outdoor"), intro: "Frost-resistant 20mm porcelain for patios and paths." },
  { handle: "zellige-effect-tiles", title: "Zellige Effect Tiles", match: (p) => p.style === "Zellige Effect", intro: "Glossy, uneven tiles inspired by handmade glazes." },
  { handle: "metro-tiles", title: "Metro Tiles", match: (p) => p.style === "Metro", intro: "Brick-shaped wall tiles in classic and bold colours." },
  { handle: "hexagon-tiles", title: "Hexagon Tiles", match: (p) => p.style === "Hexagon", intro: "Six-sided tiles for walls and floors." },
  { handle: "patterned-tiles", title: "Patterned Tiles", match: (p) => p.style === "Patterned", intro: "Stars, crosses and printed designs." },
  { handle: "marble-effect-tiles", title: "Marble Effect Tiles", match: (p) => p.style === "Marble Effect", intro: "The look of marble in practical porcelain." },
  { handle: "wood-effect-tiles", title: "Wood Effect Tiles", match: (p) => p.style === "Wood Effect", intro: "Planks and chevrons with a natural timber look." },
  { handle: "terrazzo-tiles", title: "Terrazzo Tiles", match: (p) => p.style === "Terrazzo", intro: "Speckled chips on calm backgrounds." },
  { handle: "fish-scale-tiles", title: "Fish Scale Tiles", match: (p) => p.style === "Fish Scale", intro: "Rounded scales for playful walls." },
  { handle: "green-tiles", title: "Green Tiles", match: (p) => p.colourFamily === "Green", intro: "From soft sage to deep forest." },
  { handle: "blue-tiles", title: "Blue Tiles", match: (p) => p.colourFamily === "Blue", intro: "Sky, teal, cobalt and navy." },
  { handle: "pink-tiles", title: "Pink Tiles", match: (p) => p.colourFamily === "Pink", intro: "Blush, rose and petal tones." },
  { handle: "white-tiles", title: "White Tiles", match: (p) => p.colourFamily === "White", intro: "Bright, clean whites in every shape." },
  { handle: "new-in", title: "New In", match: (p) => p.isNew, intro: "The latest additions to the range." },
  { handle: "sale", title: "Sale", match: (p) => p.compareAtPerM2 !== null, intro: "Reduced tiles while stocks last." },
];

export const COLLECTION_BY_HANDLE = new Map(COLLECTIONS.map((c) => [c.handle, c]));

export const ROOMS = [
  { title: "Bathroom", handle: "bathroom-tiles", scene: "bathroom", sample: "brisa-sage" },
  { title: "Kitchen", handle: "kitchen-tiles", scene: "kitchen", sample: "ember-butter" },
  { title: "Hallway", handle: "hallway-tiles", scene: "hallway", sample: "lumen-navy" },
  { title: "Living Room", handle: "living-room-tiles", scene: "living", sample: "rook-oak" },
  { title: "Outdoor", handle: "outdoor-tiles", scene: "outdoor", sample: "dune-sand" },
];

export const STYLES = [
  { title: "Zellige Effect", handle: "zellige-effect-tiles", sample: "brisa-teal" },
  { title: "Metro", handle: "metro-tiles", sample: "cove-forest" },
  { title: "Hexagon", handle: "hexagon-tiles", sample: "halden-terracotta" },
  { title: "Patterned", handle: "patterned-tiles", sample: "fable-indigo" },
  { title: "Marble Effect", handle: "marble-effect-tiles", sample: "orla-bianco" },
  { title: "Wood Effect", handle: "wood-effect-tiles", sample: "sable-honey" },
  { title: "Terrazzo", handle: "terrazzo-tiles", sample: "marlow-petal" },
  { title: "Fish Scale", handle: "fish-scale-tiles", sample: "tamsin-aqua" },
];

export const MENU = [
  {
    title: "Wall Tiles", url: "/collections/wall-tiles",
    columns: [
      { heading: "By room", links: [["Bathroom", "/collections/bathroom-tiles"], ["Kitchen", "/collections/kitchen-tiles"]] },
      { heading: "By style", links: [["Zellige effect", "/collections/zellige-effect-tiles"], ["Metro", "/collections/metro-tiles"], ["Fish scale", "/collections/fish-scale-tiles"], ["Patterned", "/collections/patterned-tiles"]] },
    ],
    feature: "tamsin-emerald",
  },
  {
    title: "Floor Tiles", url: "/collections/floor-tiles",
    columns: [
      { heading: "By room", links: [["Hallway", "/collections/hallway-tiles"], ["Living room", "/collections/living-room-tiles"], ["Outdoor", "/collections/outdoor-tiles"]] },
      { heading: "By style", links: [["Wood effect", "/collections/wood-effect-tiles"], ["Marble effect", "/collections/marble-effect-tiles"], ["Terrazzo", "/collections/terrazzo-tiles"], ["Hexagon", "/collections/hexagon-tiles"]] },
    ],
    feature: "sable-honey",
  },
  {
    title: "Shop by Colour", url: "/collections/all",
    columns: [
      { heading: "Colours", links: [["Green", "/collections/green-tiles"], ["Blue", "/collections/blue-tiles"], ["Pink", "/collections/pink-tiles"], ["White", "/collections/white-tiles"]] },
    ],
    feature: "brisa-blush",
  },
  { title: "Samples", url: "/pages/samples" },
  { title: "Inspiration", url: "/blogs/inspiration" },
  { title: "New In", url: "/collections/new-in" },
  { title: "Sale", url: "/collections/sale", highlight: true },
];

export const ARTICLES = [
  {
    handle: "choosing-grout-colour", title: "How to choose a grout colour", product: "cove-forest",
    excerpt: "Matching, contrasting or somewhere in between: what each choice does to a wall.",
    body: [
      "Grout changes how a tile reads from across the room. A matching grout makes the surface look like one block of colour, while a contrasting grout draws every joint and highlights the shape of each tile.",
      "For small, busy tiles such as metro or fish scale, a contrasting grout shows off the layout. For large-format tiles, a matching grout keeps the surface calm.",
      "Always test a few grout colours against a sample board before you commit. Light grout on floors shows dirt faster, so mid-tones are a safe choice for hallways and kitchens.",
    ],
  },
  {
    handle: "small-bathroom-ideas", title: "Six ideas for a small bathroom", product: "brisa-sage",
    excerpt: "Use size, layout and finish to make a compact room feel larger.",
    body: [
      "Larger tiles mean fewer grout lines, which helps a small floor feel more open. On walls, a vertical metro layout can make a low ceiling look taller.",
      "Glossy finishes bounce light around the room. Pair them with a matt floor tile for grip.",
      "Run the same floor tile into the shower area to avoid breaking up the space, and choose one feature wall rather than tiling every surface in a strong pattern.",
    ],
  },
  {
    handle: "how-many-tiles-do-i-need", title: "How many tiles do I need?", product: "halden-cream",
    excerpt: "A quick guide to measuring a room and allowing for cuts.",
    body: [
      "Measure the width and height of each wall, or the width and length of the floor, in metres. Multiply them to get the area in square metres and add the areas together.",
      "Add 10% for cuts and breakages. For diagonal layouts, chevrons and herringbone, allow 15%.",
      "Divide the total by the coverage of one box and round up. The calculator on each product page does this for you.",
    ],
  },
];

export const ARTICLE_BY_HANDLE = new Map(ARTICLES.map((a) => [a.handle, a]));

// Filter groups and sorts are shared with the browser code.
export const FILTER_GROUPS = FILTERS.map(([key, label]) => ({ key, label, get: (p) => facetValues(p, key) }));
export { SORTS };

// Settings and product fields shipped to the browser as /data/products.json.
export function browserCatalogue() {
  return {
    store: {
      freeDeliveryThreshold: STORE.freeDeliveryThreshold,
      deliveryFee: STORE.deliveryFee,
      maxFreeSamples: STORE.maxFreeSamples,
    },
    products: PRODUCTS.map((p) => ({
      handle: p.handle, name: p.name, style: p.style, size: p.size, finish: p.finish, material: p.material,
      surfaces: p.surfaces, rooms: p.rooms, colourFamily: p.colourFamily, pricePerM2: p.pricePerM2,
      pricePerBox: p.pricePerBox, m2PerBox: p.m2PerBox, rating: p.rating, reviewCount: p.reviewCount,
      isNew: p.isNew, inStock: p.inStock, position: p.position,
    })),
  };
}

const REVIEW_LINES = [
  ["Lovely colour", "The colour is even nicer in person. Our tiler said they were easy to cut."],
  ["Great service", "Samples arrived the next day and the full order came within the week."],
  ["Exactly as pictured", "Looks just like the photos. Very happy with how the wall turned out."],
  ["Good value", "Better price than anywhere else I looked and the quality feels solid."],
  ["Beautiful finish", "The glaze catches the light really nicely in the morning."],
  ["Would buy again", "Second time ordering. Packaging was careful and nothing broke."],
  ["A little variation", "Some tiles vary in shade more than expected, but that suits the look."],
  ["Easy to clean", "We used these in the kitchen and a quick wipe keeps them spotless."],
];
const REVIEWERS = ["Sam P.", "Alex R.", "Jordan K.", "Priya D.", "Chris M.", "Tomi A.", "Leah W.", "Hana S.", "Ravi B.", "Morgan T."];

export function reviewsFor(product, count = 6) {
  const rand = seededRandom("reviews:" + product.handle);
  const out = [];
  for (let i = 0; i < count; i++) {
    const [title, body] = REVIEW_LINES[Math.floor(rand() * REVIEW_LINES.length)];
    const stars = rand() < 0.8 ? 5 : rand() < 0.7 ? 4 : 3;
    const daysAgo = Math.floor(rand() * 300) + 3;
    out.push({ title, body, stars, author: REVIEWERS[Math.floor(rand() * REVIEWERS.length)], daysAgo });
  }
  return out;
}

export function ratingBreakdown(product) {
  const rand = seededRandom("breakdown:" + product.handle);
  const n = product.reviewCount;
  const five = Math.round(n * (0.7 + rand() * 0.2));
  const four = Math.round((n - five) * 0.6);
  const three = Math.round((n - five - four) * 0.6);
  const two = Math.round((n - five - four - three) * 0.5);
  const one = Math.max(0, n - five - four - three - two);
  return [five, four, three, two, one];
}
