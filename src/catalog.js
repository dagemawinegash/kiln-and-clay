// Build-time helpers for collection pages. Filtering and sorting run in the browser (public/js/store-logic.js).
import { FILTER_GROUPS } from "./data.js";

// Facet counts are computed against the collection's base list, like storefront filtering.
export function facetCounts(base) {
  return FILTER_GROUPS.map((g) => {
    const counts = new Map();
    for (const p of base) for (const v of g.get(p)) counts.set(v, (counts.get(v) ?? 0) + 1);
    return { ...g, values: [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])) };
  });
}

export function priceBounds(base) {
  const prices = base.map((p) => p.pricePerM2);
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}
