// Kiln & Clay storefront behaviour for the static build.
// Pages are pre-rendered HTML. This module adds filtering, search, the basket (localStorage) and the wishlist.
import {
  PAGE_SIZE, FILTERS, readQuery, queryToString, filterAndSort, searchProducts,
  addLine, changeLine, summarise, sanitiseLines,
} from "./store-logic.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const money = (n) => "£" + Number(n).toFixed(2);
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

function toast(message) {
  const el = $(".toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3200);
}

// ---------- Catalogue data (built into /data/products.json) ----------

let cataloguePromise;
function catalogue() {
  cataloguePromise ??= fetch("/data/products.json")
    .then((r) => {
      if (!r.ok) throw new Error("Could not load products");
      return r.json();
    })
    .then((data) => ({ ...data, byHandle: new Map(data.products.map((p) => [p.handle, p])) }));
  return cataloguePromise;
}

// ---------- Basket in localStorage ----------

const CART_KEY = "kc-cart";

const cart = {
  async lines() {
    const { byHandle, store } = await catalogue();
    let stored;
    try { stored = JSON.parse(localStorage.getItem(CART_KEY)); } catch { stored = []; }
    return sanitiseLines(stored, byHandle, store);
  },
  save(lines) {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  },
  async summary() {
    const { byHandle, store } = await catalogue();
    return summarise(await this.lines(), byHandle, store);
  },
  async add(handle, opts) {
    const { byHandle, store } = await catalogue();
    const lines = addLine(await this.lines(), byHandle.get(handle), opts, store);
    this.save(lines);
    return this.changed();
  },
  async change(key, quantity) {
    this.save(changeLine(await this.lines(), key, quantity));
    return this.changed();
  },
  async changed() {
    const s = await this.summary();
    setCartCount(s.item_count);
    document.dispatchEvent(new CustomEvent("cart:updated", { detail: s }));
    return s;
  },
};

function setCartCount(n) {
  $$("[data-cart-count]").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
}

// Another tab changed the basket or wishlist.
window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) cart.changed();
  if (e.key === wishlist.key) document.dispatchEvent(new CustomEvent("wishlist:updated"));
});

// HTML for basket views. Every value is escaped.
const cartViews = {
  lines(s, editable) {
    return `<ul class="cart-lines">${s.items.map((i) => `<li class="cart-line" data-key="${esc(i.key)}">
      <a href="${esc(i.url)}"><img src="${esc(i.image)}" alt="" width="80" height="80"></a>
      <div class="cart-line__info">
        <a href="${esc(i.url)}"><strong>${esc(i.title)}</strong></a>
        <span class="muted">${esc(i.variant)}${i.type === "tile" ? ` · ${esc(i.coverage_m2)} m²` : ""}</span>
        ${editable && i.type === "tile" ? `<quantity-input class="qty qty--small" data-line-key="${esc(i.key)}">
          <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
          <input type="number" value="${esc(i.quantity)}" min="0" max="999" aria-label="Quantity for ${esc(i.title)}">
          <button type="button" data-step="1" aria-label="Increase quantity">+</button></quantity-input>` : ""}
      </div>
      <div class="cart-line__price">
        <strong>${i.line_price ? money(i.line_price) : "Free"}</strong>
        ${editable ? `<button type="button" class="link-button" data-remove="${esc(i.key)}">Remove</button>` : ""}
      </div></li>`).join("")}</ul>`;
  },
  totals(s) {
    return `<dl class="totals"><dt>Subtotal</dt><dd>${money(s.subtotal)}</dd>
      <dt>Delivery</dt><dd>${s.delivery ? money(s.delivery) : "Free"}</dd>
      <dt class="totals__grand">Total</dt><dd class="totals__grand">${money(s.total)}</dd></dl>`;
  },
  freeBar(s, store) {
    if (!s.has_tiles) return "";
    const pct = Math.min(100, (s.subtotal / store.freeDeliveryThreshold) * 100);
    const text = s.free_delivery_remaining > 0
      ? `Spend <strong>${money(s.free_delivery_remaining)}</strong> more for free delivery`
      : "You've unlocked free delivery";
    return `<div class="free-bar"><p>${text}</p><span class="bar"><span style="width:${pct}%"></span></span></div>`;
  },
  tray(s, store) {
    const samples = s.items.filter((i) => i.type === "sample");
    const left = store.maxFreeSamples - samples.length;
    const slots = Array.from({ length: store.maxFreeSamples }, (_, n) => samples[n]
      ? `<li><img src="${esc(samples[n].image)}" alt="${esc(samples[n].title)}" title="${esc(samples[n].title)}" width="40" height="40"></li>`
      : `<li class="empty-slot"></li>`).join("");
    return `<div class="sample-tray" aria-label="Sample tray"><p><strong>Samples ${samples.length}/${store.maxFreeSamples}</strong>
      <span class="muted">${left > 0 ? `${left} more free` : "Tray full"}</span></p><ul>${slots}</ul></div>`;
  },
  empty() {
    return `<div class="cart-empty"><p>Your basket is empty.</p><a class="button" href="/collections/all">Browse tiles</a></div>`;
  },
};

// Remove buttons and quantity inputs inside a basket view.
function bindCartControls(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (btn) cart.change(btn.dataset.remove, 0).catch((err) => toast(err.message));
  });
  root.addEventListener("quantity-change", (e) => {
    cart.change(e.detail.key, e.detail.quantity).catch((err) => toast(err.message));
  });
}

// ---------- Drawers (cart, mobile menu) ----------

let lastFocus = null;
function openDrawer(drawer) {
  lastFocus = document.activeElement;
  drawer.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => drawer.classList.add("is-open"));
  $("[data-close]", drawer.querySelector(".drawer__panel"))?.focus();
}
function closeDrawer(drawer) {
  drawer.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => { drawer.hidden = true; }, 250);
  lastFocus?.focus?.();
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  $$(".drawer.is-open").forEach(closeDrawer);
  $$("mega-menu").forEach((m) => m.close());
  document.body.classList.remove("facets-open");
});

class MobileMenuDrawer extends HTMLElement {
  connectedCallback() {
    this.drawer = $(".drawer", this);
    $$("[data-open-drawer='MobileMenu']").forEach((b) => b.addEventListener("click", () => openDrawer(this.drawer)));
    $$("[data-close]", this).forEach((b) => b.addEventListener("click", () => closeDrawer(this.drawer)));
  }
}
customElements.define("mobile-menu-drawer", MobileMenuDrawer);

class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.drawer = $(".drawer", this);
    this.body = $("[data-cart-body]", this);
    this.notice = $("[data-cart-notice]", this);
    $$("[data-close]", this).forEach((b) => b.addEventListener("click", () => closeDrawer(this.drawer)));
    $$("[data-open-cart]").forEach((a) => a.addEventListener("click", (e) => {
      if (location.pathname === "/cart") return;
      e.preventDefault();
      this.open();
    }));
    bindCartControls(this.body);
    document.addEventListener("cart:updated", (e) => { if (!this.drawer.hidden) this.render(e.detail); });
    cart.summary().then((s) => setCartCount(s.item_count)).catch(() => {});
  }
  async render(summary) {
    const [s, { store }] = await Promise.all([summary ?? cart.summary(), catalogue()]);
    this.body.innerHTML = s.items.length
      ? `${cartViews.freeBar(s, store)}${cartViews.tray(s, store)}${cartViews.lines(s, true)}
         <div class="drawer__foot">${cartViews.totals(s)}<a class="button button--wide" href="/checkout">Checkout</a>
         <a class="link-button" href="/cart">View basket</a></div>`
      : cartViews.empty();
  }
  async open(message) {
    this.notice.hidden = !message;
    this.notice.textContent = message || "";
    await this.render();
    if (this.drawer.hidden) openDrawer(this.drawer);
  }
}
customElements.define("cart-drawer", CartDrawer);
const cartDrawer = () => $("cart-drawer");

class CartPage extends HTMLElement {
  connectedCallback() {
    bindCartControls(this);
    this.render();
    document.addEventListener("cart:updated", (e) => this.render(e.detail));
  }
  async render(summary) {
    const [s, { store }] = await Promise.all([summary ?? cart.summary(), catalogue()]);
    this.innerHTML = s.items.length
      ? `<div class="cart-page__layout"><div>${cartViews.freeBar(s, store)}${cartViews.lines(s, true)}</div>
         <aside class="cart-page__summary">${cartViews.tray(s, store)}${cartViews.totals(s)}
         <a class="button button--wide" href="/checkout">Checkout</a>
         <p class="muted">Demo store. Checkout does not take payment.</p></aside></div>`
      : cartViews.empty();
  }
}
customElements.define("cart-page", CartPage);

class CheckoutSummary extends HTMLElement {
  async connectedCallback() {
    const s = await cart.summary();
    this.innerHTML = s.items.length ? cartViews.lines(s, false) + cartViews.totals(s) : "<p>Your basket is empty.</p>";
  }
}
customElements.define("checkout-summary", CheckoutSummary);

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = $("input", this);
    $$("[data-step]", this).forEach((b) => b.addEventListener("click", () => {
      const min = Number(this.input.min || 0);
      const next = Math.max(min, Math.min(999, (Number(this.input.value) || 0) + Number(b.dataset.step)));
      this.input.value = next;
      this.input.dispatchEvent(new Event("change", { bubbles: true }));
    }));
    this.input.addEventListener("change", () => {
      if (!this.dataset.lineKey) return;
      this.dispatchEvent(new CustomEvent("quantity-change", {
        bubbles: true, detail: { key: this.dataset.lineKey, quantity: Math.max(0, Number.parseInt(this.input.value, 10) || 0) },
      }));
    });
  }
}
customElements.define("quantity-input", QuantityInput);

class SampleButton extends HTMLElement {
  connectedCallback() {
    $("button", this).addEventListener("click", async () => {
      try {
        await cart.add(this.dataset.handle, { type: "sample" });
        const { byHandle } = await catalogue();
        cartDrawer()?.open(`Free sample added: ${byHandle.get(this.dataset.handle).name}`);
      } catch (err) {
        toast(err.message);
      }
    });
  }
}
customElements.define("sample-button", SampleButton);

// ---------- Product page ----------

class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = $("form", this);
    this.qty = $("input[name=quantity]", this);
    this.summary = $("[data-buy-summary]", this);
    this.error = $("[data-error]", this);
    const perBox = Number(this.dataset.m2PerBox);
    const price = Number(this.dataset.pricePerBox);
    const update = () => {
      const n = Math.max(1, Number.parseInt(this.qty.value, 10) || 1);
      this.summary.textContent = `${n} ${n === 1 ? "box covers" : "boxes cover"} ${(n * perBox).toFixed(2)} m² · ${money(n * price)}`;
    };
    this.qty.addEventListener("input", update);
    this.qty.addEventListener("change", update);
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this.error.hidden = true;
      try {
        await cart.add(this.dataset.handle, { quantity: this.qty.value, type: "tile" });
        const { byHandle } = await catalogue();
        cartDrawer()?.open(`Added to basket: ${byHandle.get(this.dataset.handle).name}`);
      } catch (err) {
        this.error.textContent = err.message;
        this.error.hidden = false;
      }
    });
  }
  setQuantity(n) {
    this.qty.value = n;
    this.qty.dispatchEvent(new Event("change"));
  }
}
customElements.define("product-form", ProductForm);

class CoverageCalculator extends HTMLElement {
  connectedCallback() {
    this.width = $("[data-width]", this);
    this.height = $("[data-height]", this);
    this.wastage = $("[data-wastage-toggle]", this);
    this.result = $("[data-result]", this);
    [this.width, this.height, this.wastage].forEach((el) => el.addEventListener("input", () => this.calculate()));
  }
  calculate() {
    const w = Number(this.width.value);
    const h = Number(this.height.value);
    if (!(w > 0 && h > 0)) {
      this.result.textContent = "Enter your measurements to see how many boxes you need.";
      return;
    }
    const area = w * h;
    const total = area * (this.wastage.checked ? 1 + Number(this.dataset.wastage) : 1);
    const boxes = Math.ceil(total / Number(this.dataset.m2PerBox) - 1e-9);
    const text = document.createElement("span");
    text.textContent = `${area.toFixed(2)} m² area${this.wastage.checked ? `, ${total.toFixed(2)} m² with wastage` : ""}: you need ${boxes} ${boxes === 1 ? "box" : "boxes"}. `;
    const use = document.createElement("button");
    use.type = "button";
    use.className = "link-button";
    use.textContent = `Use ${boxes}`;
    use.addEventListener("click", () => this.closest("product-form")?.setQuantity(boxes));
    this.result.replaceChildren(text, use);
  }
}
customElements.define("coverage-calculator", CoverageCalculator);

class ProductGallery extends HTMLElement {
  connectedCallback() {
    const main = $("[data-main-image]", this);
    $$("[data-src]", this).forEach((b) => b.addEventListener("click", () => {
      main.src = b.dataset.src;
      $$("[data-src]", this).forEach((x) => x.classList.toggle("is-active", x === b));
    }));
  }
}
customElements.define("product-gallery", ProductGallery);

class SiteTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = $$("[role=tab]", this);
    this.tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => this.select(i));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = (i + (e.key === "ArrowRight" ? 1 : -1) + this.tabs.length) % this.tabs.length;
        this.select(next);
        this.tabs[next].focus();
      });
    });
  }
  select(index) {
    this.tabs.forEach((t, i) => {
      t.setAttribute("aria-selected", String(i === index));
      t.tabIndex = i === index ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = i !== index;
    });
  }
}
customElements.define("site-tabs", SiteTabs);

class StickyBar extends HTMLElement {
  connectedCallback() {
    const buy = $("product-form");
    if (!buy) return;
    new IntersectionObserver(([entry]) => {
      this.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
    }).observe(buy);
    $("[data-scroll-to-buy]", this).addEventListener("click", () => {
      buy.scrollIntoView({ behavior: "smooth", block: "center" });
      $("button[type=submit]", buy)?.focus({ preventScroll: true });
    });
  }
}
customElements.define("sticky-bar", StickyBar);

// ---------- Wishlist (localStorage) ----------

const wishlist = {
  key: "kc-wishlist",
  get() {
    try {
      const list = JSON.parse(localStorage.getItem(this.key));
      return Array.isArray(list) ? list.filter((h) => typeof h === "string") : [];
    } catch {
      return [];
    }
  },
  set(list) {
    localStorage.setItem(this.key, JSON.stringify(list.slice(0, 60)));
    document.dispatchEvent(new CustomEvent("wishlist:updated"));
  },
  toggle(handle) {
    const list = this.get();
    const i = list.indexOf(handle);
    if (i === -1) list.unshift(handle); else list.splice(i, 1);
    this.set(list);
    return i === -1;
  },
};

function updateWishlistCount() {
  const n = wishlist.get().length;
  $$("[data-wishlist-count]").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
}
document.addEventListener("wishlist:updated", updateWishlistCount);

class WishlistButton extends HTMLElement {
  connectedCallback() {
    this.button = $("button", this);
    this.label = $("[data-label]", this);
    this.sync();
    this.button.addEventListener("click", () => {
      toast(wishlist.toggle(this.dataset.handle) ? "Saved to wishlist" : "Removed from wishlist");
    });
    this.onUpdate = () => this.sync();
    document.addEventListener("wishlist:updated", this.onUpdate);
  }
  disconnectedCallback() {
    document.removeEventListener("wishlist:updated", this.onUpdate);
  }
  sync() {
    const on = wishlist.get().includes(this.dataset.handle);
    this.button.setAttribute("aria-pressed", String(on));
    this.classList.toggle("is-active", on);
    if (this.label) this.label.textContent = on ? "Saved to wishlist" : "Save to wishlist";
  }
}
customElements.define("wishlist-button", WishlistButton);

// Every product card is in the page, hidden. Show the saved ones in saved order.
class WishlistPage extends HTMLElement {
  connectedCallback() {
    this.grid = $("[data-wishlist-grid]", this);
    this.empty = $("[data-empty]", this);
    this.render();
    document.addEventListener("wishlist:updated", () => this.render());
  }
  render() {
    const saved = wishlist.get();
    const cards = new Map($$(":scope > .card", this.grid).map((c) => [c.dataset.handle, c]));
    cards.forEach((c) => { c.hidden = true; });
    const shown = saved.map((h) => cards.get(h)).filter(Boolean);
    shown.forEach((c) => { c.hidden = false; this.grid.append(c); });
    this.empty.hidden = shown.length > 0;
    this.empty.textContent = "You haven't saved any tiles yet. Tap the heart on a product to save it.";
  }
}
customElements.define("wishlist-page", WishlistPage);

// ---------- Collection filtering (all in the browser) ----------

// Shows, orders and pages the pre-rendered cards inside a results grid.
function showCards(grid, orderedHandles, limit) {
  const cards = new Map($$(":scope > .card", grid).map((c) => [c.dataset.handle, c]));
  cards.forEach((c) => { c.hidden = true; });
  orderedHandles.forEach((h, i) => {
    const c = cards.get(h);
    if (!c) return;
    c.hidden = i >= limit;
    grid.append(c);
  });
}

class CollectionFilters extends HTMLElement {
  async connectedCallback() {
    this.form = $("#FacetForm", this);
    this.grid = $("[data-product-grid]", this);
    this.sort = $("[data-sort]", this);
    this.chips = $("[data-active-filters]", this);
    this.empty = $("[data-empty]", this);
    this.moreWrap = $("[data-load-more-wrap]", this);
    this.showing = $("[data-showing]", this);
    this.count = $("[data-count]", this);
    this.countLabel = $("[data-count-label]", this);
    this.handles = new Set($$(":scope > .card", this.grid).map((c) => c.dataset.handle));
    this.limit = PAGE_SIZE;

    const { products } = await catalogue();
    this.base = products.filter((p) => this.handles.has(p.handle));

    this.form.addEventListener("input", debounce(() => this.update({ push: true }), 200));
    this.form.addEventListener("submit", (e) => e.preventDefault());
    this.sort.addEventListener("change", () => this.update({ push: true }));
    $("[data-load-more]", this).addEventListener("click", () => { this.limit += PAGE_SIZE; this.render(); });
    this.chips.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-remove-filter]");
      if (!chip) return;
      this.removeFilter(chip.dataset.removeFilter, chip.dataset.value);
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-facets]")) document.body.classList.add("facets-open");
      if (e.target.closest("[data-close-facets]")) document.body.classList.remove("facets-open");
    });
    window.addEventListener("popstate", () => this.loadFromUrl());
    this.loadFromUrl();
  }

  loadFromUrl() {
    const q = readQuery(location.search);
    $$("input[type=checkbox]", this.form).forEach((cb) => {
      const key = cb.name.slice("filter.".length);
      cb.checked = q.filters[key]?.includes(cb.value) ?? false;
    });
    this.form.price_min.value = q.priceMin ?? "";
    this.form.price_max.value = q.priceMax ?? "";
    this.sort.value = q.sort;
    this.limit = PAGE_SIZE;
    this.render(q);
  }

  queryFromForm() {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(this.form)) if (v !== "") params.append(k, v);
    if (this.sort.value !== "featured") params.set("sort_by", this.sort.value);
    return readQuery(params.toString());
  }

  update({ push }) {
    const q = this.queryFromForm();
    this.limit = PAGE_SIZE;
    if (push) {
      const qs = queryToString(q);
      history.pushState({}, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
    }
    this.render(q);
  }

  removeFilter(key, value) {
    if (key === "price") {
      this.form.price_min.value = "";
      this.form.price_max.value = "";
    } else if (key === "all") {
      $$("input[type=checkbox]", this.form).forEach((cb) => { cb.checked = false; });
      this.form.price_min.value = "";
      this.form.price_max.value = "";
    } else {
      const cb = $$("input[type=checkbox]", this.form).find((x) => x.name === `filter.${key}` && x.value === value);
      if (cb) cb.checked = false;
    }
    this.update({ push: true });
  }

  render(q = this.queryFromForm()) {
    const results = filterAndSort(this.base, q);
    showCards(this.grid, results.map((p) => p.handle), this.limit);
    this.count.textContent = results.length;
    this.countLabel.textContent = results.length === 1 ? "product" : "products";
    this.empty.hidden = results.length > 0;
    this.moreWrap.hidden = results.length <= this.limit;
    this.showing.textContent = `Showing ${Math.min(this.limit, results.length)} of ${results.length}`;

    for (const [key] of FILTERS) {
      const badge = $(`[data-facet-count="${key}"]`, this.form);
      const n = q.filters[key]?.length ?? 0;
      if (badge) { badge.hidden = n === 0; badge.textContent = n; }
    }

    const chips = [];
    for (const [key, values] of Object.entries(q.filters)) {
      for (const v of values) chips.push(`<button type="button" class="chip" data-remove-filter="${esc(key)}" data-value="${esc(v)}">${esc(v)} ✕</button>`);
    }
    if (q.priceMin !== null || q.priceMax !== null) {
      chips.push(`<button type="button" class="chip" data-remove-filter="price">${money(q.priceMin ?? 0)} to ${q.priceMax !== null ? money(q.priceMax) : "any"} ✕</button>`);
    }
    if (chips.length) chips.push(`<button type="button" class="link-button" data-remove-filter="all">Clear all</button>`);
    this.chips.innerHTML = chips.join("");
    this.chips.hidden = chips.length === 0;
  }
}
customElements.define("collection-filters", CollectionFilters);

// ---------- Search ----------

class SearchResults extends HTMLElement {
  async connectedCallback() {
    this.grid = $("[data-product-grid]", this);
    this.summary = $("[data-search-summary]", this);
    this.input = $("input[type=search]", this);
    const term = (new URLSearchParams(location.search).get("q") ?? "").slice(0, 80);
    this.input.value = term;
    const { products } = await catalogue();
    const results = searchProducts(products, term);
    showCards(this.grid, results.map((p) => p.handle), results.length);
    this.summary.textContent = term
      ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${term}”`
      : "Type a colour, style or room to search.";
  }
}
customElements.define("search-results", SearchResults);

class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.input = $("input[type=search]", this);
    this.results = $(".search__results", this);
    this.active = -1;
    this.input.addEventListener("input", debounce(() => this.query(), 150));
    this.input.addEventListener("keydown", (e) => this.onKey(e));
    this.input.addEventListener("focus", () => { if (this.results.innerHTML.trim()) this.show(); });
    document.addEventListener("click", (e) => { if (!this.contains(e.target)) this.hide(); });
  }
  async query() {
    const term = this.input.value.trim().slice(0, 80);
    if (term.length < 2) return this.hide();
    const { products } = await catalogue();
    const found = searchProducts(products, term, 6);
    this.results.innerHTML = found.length
      ? `<ul class="search__list">${found.map((p, i) => `<li role="option" id="search-opt-${i}" aria-selected="false">
          <a href="/products/${esc(p.handle)}"><img src="/img/p/${esc(p.handle)}/swatch.svg" alt="" width="56" height="56">
          <span><strong>${esc(p.name)}</strong><span class="muted">${esc(p.style)} · ${money(p.pricePerM2)}/m²</span></span></a></li>`).join("")}</ul>
         <a class="search__all" href="/search?q=${encodeURIComponent(term)}">See all results for “${esc(term)}”</a>`
      : `<p class="search__empty">No results for “${esc(term)}”</p>`;
    this.active = -1;
    this.show();
  }
  onKey(e) {
    const opts = $$("[role=option]", this.results);
    if (e.key === "Escape") return this.hide();
    if (!opts.length || !["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
    if (e.key === "Enter") {
      if (this.active >= 0) { e.preventDefault(); $("a", opts[this.active]).click(); }
      return;
    }
    e.preventDefault();
    this.active = (this.active + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
    opts.forEach((o, i) => o.setAttribute("aria-selected", String(i === this.active)));
    this.input.setAttribute("aria-activedescendant", opts[this.active].id);
  }
  show() { this.results.hidden = false; this.input.setAttribute("aria-expanded", "true"); }
  hide() { this.results.hidden = true; this.input.setAttribute("aria-expanded", "false"); this.input.removeAttribute("aria-activedescendant"); }
}
customElements.define("predictive-search", PredictiveSearch);

// ---------- Header and page furniture ----------

class MegaMenu extends HTMLElement {
  connectedCallback() {
    this.link = $(".nav__link", this);
    this.panel = $(".mega", this);
    let t;
    this.addEventListener("mouseenter", () => { clearTimeout(t); this.open(); });
    this.addEventListener("mouseleave", () => { t = setTimeout(() => this.close(), 120); });
    this.addEventListener("focusin", () => this.open());
    this.addEventListener("focusout", (e) => { if (!this.contains(e.relatedTarget)) this.close(); });
  }
  open() {
    $$("mega-menu").forEach((m) => m !== this && m.close());
    this.panel.hidden = false;
    this.link.setAttribute("aria-expanded", "true");
  }
  close() {
    this.panel.hidden = true;
    this.link.setAttribute("aria-expanded", "false");
  }
}
customElements.define("mega-menu", MegaMenu);

class PromoBar extends HTMLElement {
  connectedCallback() {
    const msgs = $$(".promo__msg", this);
    if (msgs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    setInterval(() => {
      msgs[i].classList.remove("is-active");
      i = (i + 1) % msgs.length;
      msgs[i].classList.add("is-active");
    }, 4500);
  }
}
customElements.define("promo-bar", PromoBar);

class CarouselSlider extends HTMLElement {
  connectedCallback() {
    const track = $(".carousel__track", this);
    const prev = $(".carousel__btn--prev", this);
    const next = $(".carousel__btn--next", this);
    const update = () => {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    $$("[data-dir]", this).forEach((b) => b.addEventListener("click", () => {
      track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.9, behavior: "smooth" });
    }));
    track.addEventListener("scroll", debounce(update, 60));
    update();
  }
}
customElements.define("carousel-slider", CarouselSlider);

// ---------- Demo forms (nothing leaves the browser) ----------

class NewsletterForm extends HTMLElement {
  connectedCallback() {
    const form = $("form", this);
    const msg = $(".newsletter__msg", this);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      msg.hidden = false;
      msg.textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())
        ? "Thanks! This is a demo, so no email was saved."
        : "Please enter a valid email address.";
    });
  }
}
customElements.define("newsletter-form", NewsletterForm);

class ContactForm extends HTMLElement {
  connectedCallback() {
    const form = $("form", this);
    const note = $(".form-note", this);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.hidden = false;
      note.textContent = form.checkValidity() ? "Thanks. This is a demo, so your message was not sent." : "Please fill in every field.";
    });
  }
}
customElements.define("contact-form", ContactForm);

updateWishlistCount();
