// Renders the whole store to static files in dist/.
// Pages are written as <path>.html so hosts with "clean URLs" (Vercel, Netlify) serve /products/x from products/x.html.
import { mkdir, rm, writeFile, cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCTS, COLLECTIONS, ROOMS, ARTICLES, PRODUCT_BY_HANDLE, browserCatalogue } from "../src/data.js";
import { productImage, roomScene, PRODUCT_VIEWS } from "../src/images.js";
import { layout } from "../src/views/components.js";
import * as pages from "../src/views/pages.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");

let fileCount = 0;
let byteCount = 0;

async function write(relPath, contents) {
  const full = join(DIST, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, contents);
  fileCount++;
  byteCount += Buffer.byteLength(contents);
}

const page = (relPath, { title, description, body }) => write(relPath, layout({ title, description, body: String(body) }));

const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1f5c4a"/><g fill="#e9dfc9"><rect x="6" y="6" width="9" height="9" rx="1"/><rect x="17" y="6" width="9" height="9" rx="1"/><rect x="6" y="17" width="9" height="9" rx="1"/><rect x="17" y="17" width="9" height="9" rx="1"/></g></svg>';

export async function build() {
  const started = Date.now();
  await rm(DIST, { recursive: true, force: true });
  await cp(join(ROOT, "public"), DIST, { recursive: true });

  // Pages
  await page("index.html", { title: "Wall and floor tiles", body: pages.homePage() });
  for (const c of COLLECTIONS) {
    await page(`collections/${c.handle}.html`, { title: c.title, description: c.intro, body: pages.collectionPage(c, PRODUCTS.filter(c.match)) });
  }
  for (const p of PRODUCTS) {
    await page(`products/${p.handle}.html`, { title: p.name, description: p.description, body: pages.productPage(p) });
  }
  await page("search.html", { title: "Search", body: pages.searchPage() });
  await page("cart.html", { title: "Your basket", body: pages.cartPage() });
  await page("checkout.html", { title: "Checkout", body: pages.checkoutPage() });
  for (const handle of pages.CONTENT_PAGES) await page(`pages/${handle}.html`, pages.contentPage(handle));
  await page("blogs/inspiration.html", { title: "Inspiration", body: pages.blogPage() });
  for (const a of ARTICLES) {
    await page(`blogs/inspiration/${a.handle}.html`, { title: a.title, description: a.excerpt, body: pages.articlePage(a) });
  }
  await page("404.html", { title: "Not found", body: pages.notFoundPage() });

  // Images
  for (const p of PRODUCTS) {
    for (const view of PRODUCT_VIEWS) await write(`img/p/${p.handle}/${view}.svg`, productImage(p, view));
  }
  for (const r of ROOMS) await write(`img/room/${r.scene}.svg`, roomScene(PRODUCT_BY_HANDLE.get(r.sample), r.scene));
  await write("img/hero.svg", roomScene(PRODUCT_BY_HANDLE.get("brisa-teal"), "bathroom", 1600, 760));
  await write("img/favicon.svg", FAVICON);

  // Data for browser-side filtering, search and basket
  await write("data/products.json", JSON.stringify(browserCatalogue()));

  return { files: fileCount, bytes: byteCount, ms: Date.now() - started, dist: DIST };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = await build();
  console.log(`Built ${r.files} files (${(r.bytes / 1024 / 1024).toFixed(1)} MB) into ${r.dist} in ${r.ms} ms`);
}
