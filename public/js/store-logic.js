// Pure store rules shared by the browser (app.js) and the Node build/tests.
// No DOM access here, so it can be imported from either side.

export const PAGE_SIZE = 12;

export const FILTERS = [
  ["colour", "Colour"],
  ["style", "Style"],
  ["finish", "Finish"],
  ["material", "Material"],
  ["surface", "Suitable for"],
  ["size", "Size"],
];

export const SORTS = [
  ["featured", "Featured"],
  ["best-rated", "Best rated"],
  ["price-asc", "Price, low to high"],
  ["price-desc", "Price, high to low"],
  ["name-asc", "Name, A to Z"],
  ["newest", "Newest"],
];

export function facetValues(p, key) {
  switch (key) {
    case "colour": return [p.colourFamily];
    case "style": return [p.style];
    case "finish": return [p.finish];
    case "material": return [p.material];
    case "surface": return p.surfaces;
    case "size": return [p.size];
    default: return [];
  }
}

// ---------- Collection query (filter.<key>, price_min, price_max, sort_by) ----------

export function readQuery(search) {
  const params = new URLSearchParams(search);
  const filters = {};
  for (const [key] of FILTERS) {
    const values = params.getAll(`filter.${key}`).filter(Boolean).slice(0, 20);
    if (values.length) filters[key] = values;
  }
  const num = (v) => (v === null || v === "" || Number.isNaN(Number(v)) ? null : Math.max(0, Number(v)));
  const sortParam = params.get("sort_by");
  const sort = SORTS.some(([k]) => k === sortParam) ? sortParam : "featured";
  return { filters, priceMin: num(params.get("price_min")), priceMax: num(params.get("price_max")), sort };
}

export function queryToString(q) {
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(q.filters)) for (const v of values) params.append(`filter.${key}`, v);
  if (q.priceMin !== null) params.set("price_min", q.priceMin);
  if (q.priceMax !== null) params.set("price_max", q.priceMax);
  if (q.sort !== "featured") params.set("sort_by", q.sort);
  return params.toString();
}

const SORTERS = {
  featured: (a, b) => a.position - b.position,
  "best-rated": (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  "price-asc": (a, b) => a.pricePerM2 - b.pricePerM2,
  "price-desc": (a, b) => b.pricePerM2 - a.pricePerM2,
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  newest: (a, b) => Number(b.isNew) - Number(a.isNew) || b.position - a.position,
};

export function filterAndSort(products, q) {
  return products
    .filter((p) => {
      for (const [key, wanted] of Object.entries(q.filters)) {
        if (!facetValues(p, key).some((v) => wanted.includes(v))) return false;
      }
      if (q.priceMin !== null && p.pricePerM2 < q.priceMin) return false;
      if (q.priceMax !== null && p.pricePerM2 > q.priceMax) return false;
      return true;
    })
    .sort(SORTERS[q.sort] ?? SORTERS.featured);
}

// ---------- Search ----------

export function searchProducts(products, term, limit = 50) {
  const words = String(term ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (!words.length) return [];
  return products
    .map((p) => {
      const name = p.name.toLowerCase();
      const hay = `${name} ${p.style} ${p.colourFamily} ${p.finish} ${p.material} ${p.rooms.join(" ")} ${p.surfaces.join(" ")}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? (name.includes(w) ? 3 : 1) : -100), 0);
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.p.position - b.p.position)
    .slice(0, limit)
    .map((r) => r.p);
}

// ---------- Basket ----------
// Lines are plain objects { key, handle, type: "tile" | "sample", quantity } so they can live in localStorage.

export class CartError extends Error {}

const MAX_QTY = 999;
const round2 = (n) => Math.round(n * 100) / 100;

export function lineKey(handle, type) {
  return `${handle}:${type}`;
}

// Drops lines for unknown products or bad data, e.g. after the catalogue changes.
export function sanitiseLines(lines, byHandle, settings) {
  if (!Array.isArray(lines)) return [];
  const out = [];
  let samples = 0;
  for (const l of lines) {
    if (!l || !byHandle.has(l.handle) || !["tile", "sample"].includes(l.type)) continue;
    const key = lineKey(l.handle, l.type);
    if (out.some((x) => x.key === key)) continue;
    if (l.type === "sample") {
      if (samples >= settings.maxFreeSamples) continue;
      samples++;
      out.push({ key, handle: l.handle, type: "sample", quantity: 1 });
    } else {
      const qty = Number.parseInt(l.quantity, 10);
      if (Number.isInteger(qty) && qty >= 1) out.push({ key, handle: l.handle, type: "tile", quantity: Math.min(MAX_QTY, qty) });
    }
  }
  return out;
}

export function addLine(lines, product, { quantity = 1, type = "tile" } = {}, settings) {
  if (!product) throw new CartError("Product not found");
  if (!["tile", "sample"].includes(type)) throw new CartError("Unknown line type");
  const qty = Number.parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new CartError("Quantity must be between 1 and 999");
  if (type === "tile" && !product.inStock) throw new CartError(`${product.name} is out of stock`);

  const key = lineKey(product.handle, type);
  const existing = lines.find((l) => l.key === key);
  if (type === "sample") {
    if (existing) throw new CartError("This sample is already in your basket");
    if (lines.filter((l) => l.type === "sample").length >= settings.maxFreeSamples) {
      throw new CartError(`You can order up to ${settings.maxFreeSamples} free samples`);
    }
    return [...lines, { key, handle: product.handle, type, quantity: 1 }];
  }
  if (existing) {
    return lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + qty) } : l));
  }
  return [...lines, { key, handle: product.handle, type, quantity: qty }];
}

export function changeLine(lines, key, quantity) {
  const qty = Number.parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 0 || qty > MAX_QTY) throw new CartError("Quantity must be between 0 and 999");
  if (!lines.some((l) => l.key === key)) throw new CartError("Line not found");
  if (qty === 0) return lines.filter((l) => l.key !== key);
  return lines.map((l) => (l.key === key ? { ...l, quantity: l.type === "sample" ? 1 : qty } : l));
}

export function summarise(lines, byHandle, settings) {
  const items = lines.map((l) => {
    const p = byHandle.get(l.handle);
    const unit = l.type === "sample" ? 0 : p.pricePerBox;
    return {
      key: l.key,
      handle: p.handle,
      title: p.name,
      type: l.type,
      quantity: l.quantity,
      unit_price: unit,
      line_price: round2(unit * l.quantity),
      coverage_m2: l.type === "sample" ? 0 : round2(p.m2PerBox * l.quantity),
      image: `/img/p/${p.handle}/swatch.svg`,
      url: `/products/${p.handle}`,
      variant: l.type === "sample" ? "Free cut sample" : `Box of ${p.m2PerBox} m²`,
    };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.line_price, 0));
  const hasTiles = items.some((i) => i.type === "tile");
  const delivery = !hasTiles || subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
  return {
    item_count: items.reduce((s, i) => s + i.quantity, 0),
    sample_count: items.filter((i) => i.type === "sample").length,
    items,
    subtotal,
    delivery,
    total: round2(subtotal + delivery),
    has_tiles: hasTiles,
    free_delivery_remaining: hasTiles ? Math.max(0, round2(settings.freeDeliveryThreshold - subtotal)) : 0,
  };
}
