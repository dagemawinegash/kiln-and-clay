// Builds the site, then checks the output files, internal links and the shared store rules.
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { build } from "./build.js";
import {
  readQuery, queryToString, filterAndSort, searchProducts, addLine, changeLine, summarise, sanitiseLines, CartError,
} from "../public/js/store-logic.js";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

// Mirrors clean-URL hosting: /a/b -> a/b.html, / -> index.html, files as-is.
async function resolvesTo(dist, urlPath) {
  const clean = urlPath.replace(/\/+$/, "") || "/";
  if (clean === "/") return exists(join(dist, "index.html"));
  return (await exists(join(dist, clean))) || (await exists(join(dist, `${clean}.html`)));
}

const throws = (fn) => { try { fn(); return false; } catch (e) { return e instanceof CartError; } };

// ---------- Build output ----------

const result = await build();
const dist = result.dist;
check("build completes", result.files > 200, `${result.files} files`);

const files = await walk(dist);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
for (const required of ["index.html", "404.html", "search.html", "cart.html", "checkout.html", "collections/all.html",
  "products/brisa-sage.html", "pages/wishlist.html", "blogs/inspiration.html", "data/products.json", "js/app.js",
  "js/store-logic.js", "css/styles.css", "img/hero.svg", "img/p/brisa-sage/room.svg"]) {
  check(`dist has ${required}`, await exists(join(dist, required)));
}
check("no server code in dist", !files.some((f) => /server\.js$|[\\/]src[\\/]/.test(f)));

// Every internal link, image and script in every page points at a built file.
const broken = new Set();
for (const file of htmlFiles) {
  const text = await readFile(file, "utf8");
  for (const m of text.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (!(await resolvesTo(dist, m[1]))) broken.add(`${relative(dist, file).split(sep).join("/")} -> ${m[1]}`);
  }
}
check("all internal links resolve", broken.size === 0, [...broken].slice(0, 5).join(", "));

const allHtml = await readFile(join(dist, "collections/all.html"), "utf8");
const cardCount = (allHtml.match(/<li class="card"/g) ?? []).length;
const data = JSON.parse(await readFile(join(dist, "data/products.json"), "utf8"));
check("collection page contains every product card", cardCount === data.products.length, `${cardCount} cards`);
check("pages load app as a module", allHtml.includes('<script type="module" src="/js/app.js">'));
check("no inline scripts (CSP-safe)", htmlFiles.length > 0 && !(await Promise.all(htmlFiles.map((f) => readFile(f, "utf8")))).some((t) => /<script(?![^>]*src=)[^>]*>/.test(t)));

// ---------- Shared store rules ----------

const { products, store } = data;
const byHandle = new Map(products.map((p) => [p.handle, p]));

const q = readQuery("?filter.colour=Green&filter.finish=Gloss&sort_by=price-desc&price_max=60");
check("readQuery parses filters", q.filters.colour[0] === "Green" && q.sort === "price-desc" && q.priceMax === 60);
check("queryToString round-trips", readQuery(queryToString(q)).filters.finish[0] === "Gloss");
check("unknown sort falls back", readQuery("?sort_by=evil").sort === "featured");
const greenGloss = filterAndSort(products, q);
check("filters narrow results", greenGloss.length > 0 && greenGloss.every((p) => p.colourFamily === "Green" && p.finish === "Gloss"), `${greenGloss.length}`);
check("sort is applied", greenGloss.every((p, i) => i === 0 || greenGloss[i - 1].pricePerM2 >= p.pricePerM2));
check("price filter applied", filterAndSort(products, readQuery("?price_max=30")).every((p) => p.pricePerM2 <= 30));
check("search finds hexagons", searchProducts(products, "hexagon").length === 3);
check("search needs every word", searchProducts(products, "hexagon gloss").length === 0);

let lines = addLine([], byHandle.get("cove-jet"), { quantity: 3 }, store);
lines = addLine(lines, byHandle.get("cove-jet"), { quantity: 2 }, store);
check("adding again merges lines", lines.length === 1 && lines[0].quantity === 5);
for (const h of ["brisa-sage", "brisa-teal", "halden-cream", "lumen-navy", "fable-rust"]) {
  lines = addLine(lines, byHandle.get(h), { type: "sample" }, store);
}
check("sample limit enforced", throws(() => addLine(lines, byHandle.get("orla-nero"), { type: "sample" }, store)));
check("duplicate sample rejected", throws(() => addLine(lines, byHandle.get("brisa-sage"), { type: "sample" }, store)));
check("bad quantity rejected", throws(() => addLine(lines, byHandle.get("cove-jet"), { quantity: -4 }, store)));
check("unknown product rejected", throws(() => addLine(lines, undefined, { quantity: 1 }, store)));
const outOfStock = products.find((p) => !p.inStock);
if (outOfStock) check("out-of-stock tile rejected", throws(() => addLine([], outOfStock, { quantity: 1 }, store)));

let s = summarise(lines, byHandle, store);
check("samples are free", s.items.filter((i) => i.type === "sample").every((i) => i.line_price === 0));
check("delivery charged under threshold", s.subtotal < store.freeDeliveryThreshold && s.delivery === store.deliveryFee, `subtotal ${s.subtotal}`);
lines = changeLine(lines, "cove-jet:tile", 20);
s = summarise(lines, byHandle, store);
check("free delivery over threshold", s.subtotal >= store.freeDeliveryThreshold && s.delivery === 0, `subtotal ${s.subtotal}`);
lines = changeLine(lines, "cove-jet:tile", 0);
check("remove line", !lines.some((l) => l.key === "cove-jet:tile"));
check("samples-only basket ships free", summarise(lines, byHandle, store).delivery === 0);

const tampered = sanitiseLines([{ handle: "nope", type: "tile", quantity: 1 }, { handle: "cove-jet", type: "tile", quantity: "abc" },
  { handle: "cove-jet", type: "tile", quantity: 5000 }, "junk", null], byHandle, store);
check("tampered localStorage is cleaned", tampered.length === 1 && tampered[0].quantity === 999);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
