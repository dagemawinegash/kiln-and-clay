// Shared page chrome and reusable fragments.
import { html, raw, money } from "../util.js";
import { STORE, MENU, PRODUCT_BY_HANDLE } from "../data.js";

const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  basket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.5 11h-11z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  sample: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
  returns: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
};

export const icon = (name) => raw(`<span class="icon icon--${name}">${ICONS[name]}</span>`);

export function stars(rating, count) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return html`<span class="stars" aria-label="Rated ${rating} out of 5${count ? ` from ${count} reviews` : ""}">
    <span class="stars__track">★★★★★<span class="stars__fill" style="width:${pct}%">★★★★★</span></span>
    ${count ? html`<span class="stars__count">(${count})</span>` : ""}
  </span>`;
}

export function priceBlock(p) {
  return html`<span class="price">
    ${p.compareAtPerM2 ? html`<s class="price__was">${money(p.compareAtPerM2)}</s>` : ""}
    <strong class="price__now ${p.compareAtPerM2 ? "price__now--sale" : ""}">${money(p.pricePerM2)}</strong><span class="price__unit">/m²</span>
  </span>`;
}

export function productCard(p, { lazy = true, hidden = false } = {}) {
  return html`<li class="card" data-handle="${p.handle}" ${raw(hidden ? "hidden" : "")}>
    <a class="card__media" href="/products/${p.handle}">
      <img src="/img/p/${p.handle}/swatch.svg" alt="${p.name}" width="600" height="600" ${raw(lazy ? 'loading="lazy"' : "")}>
      <img class="card__hover" src="/img/p/${p.handle}/room.svg" alt="" width="600" height="600" loading="lazy">
      <span class="card__badges">
        ${p.isNew ? html`<span class="badge">New</span>` : ""}
        ${p.compareAtPerM2 ? html`<span class="badge badge--sale">Sale</span>` : ""}
        ${!p.inStock ? html`<span class="badge badge--muted">Out of stock</span>` : ""}
      </span>
    </a>
    <wishlist-button class="card__wish" data-handle="${p.handle}">
      <button type="button" aria-pressed="false" aria-label="Save ${p.name} to wishlist">${icon("heart")}</button>
    </wishlist-button>
    <div class="card__body">
      <h3 class="card__title"><a href="/products/${p.handle}">${p.name}</a></h3>
      <p class="card__meta">${p.size} · ${p.finish} ${p.material}</p>
      ${stars(p.rating, p.reviewCount)}
      ${priceBlock(p)}
      <sample-button data-handle="${p.handle}">
        <button type="button" class="link-button">${icon("sample")} Order free sample</button>
      </sample-button>
    </div>
  </li>`;
}

function megaMenu() {
  return MENU.map((item, i) => {
    if (!item.columns) {
      return html`<li class="nav__item"><a class="nav__link ${item.highlight ? "nav__link--sale" : ""}" href="${item.url}">${item.title}</a></li>`;
    }
    const feature = PRODUCT_BY_HANDLE.get(item.feature);
    return html`<li class="nav__item">
      <mega-menu>
        <a class="nav__link" href="${item.url}" aria-expanded="false" aria-controls="mega-${i}">${item.title}</a>
        <div class="mega" id="mega-${i}" hidden>
          <div class="mega__inner container">
            ${item.columns.map((c) => html`<div class="mega__col">
              <p class="mega__heading">${c.heading}</p>
              <ul>${c.links.map(([label, url]) => html`<li><a href="${url}">${label}</a></li>`)}</ul>
            </div>`)}
            <div class="mega__col"><p class="mega__heading">Shop all</p><ul><li><a href="${item.url}">All ${item.title.toLowerCase()}</a></li><li><a href="/collections/new-in">New in</a></li><li><a href="/collections/sale">Sale</a></li></ul></div>
            ${feature ? html`<a class="mega__feature" href="/products/${feature.handle}">
              <img src="/img/p/${feature.handle}/room.svg" alt="" width="320" height="320" loading="lazy">
              <span>Featured: ${feature.name}</span>
            </a>` : ""}
          </div>
        </div>
      </mega-menu>
    </li>`;
  });
}

function mobileMenu() {
  return html`<mobile-menu-drawer>
    <div class="drawer drawer--left" id="MobileMenu" hidden>
      <div class="drawer__overlay" data-close></div>
      <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="drawer__head"><span class="drawer__title">Menu</span><button type="button" class="icon-button" data-close aria-label="Close menu">${icon("close")}</button></div>
        <nav class="mobile-nav">
          ${MENU.map((item) => item.columns
            ? html`<details><summary>${item.title}</summary><ul>
                ${item.columns.flatMap((c) => c.links).map(([label, url]) => html`<li><a href="${url}">${label}</a></li>`)}
                <li><a href="${item.url}">Shop all</a></li></ul></details>`
            : html`<a href="${item.url}">${item.title}</a>`)}
          <a href="/pages/wishlist">Wishlist</a>
          <a href="/pages/contact">Contact us</a>
        </nav>
      </div>
    </div>
  </mobile-menu-drawer>`;
}

function header() {
  return html`
  <promo-bar class="promo">
    <div class="promo__track container">
      <p class="promo__msg is-active">Up to ${STORE.maxFreeSamples} free cut samples, delivered next working day</p>
      <p class="promo__msg">Free delivery on tile orders over ${money(STORE.freeDeliveryThreshold)}</p>
      <p class="promo__msg">Demo store: no real orders are taken</p>
    </div>
  </promo-bar>
  <header class="header">
    <div class="header__inner container">
      <button type="button" class="icon-button header__menu" data-open-drawer="MobileMenu" aria-label="Open menu">${icon("menu")}</button>
      <a class="logo" href="/" aria-label="${STORE.name} home">
        <span class="logo__mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="logo__text">${STORE.name}</span>
      </a>
      <predictive-search class="search">
        <form action="/search" method="get" role="search" class="search__form">
          <label class="visually-hidden" for="SearchInput">Search tiles</label>
          <input id="SearchInput" type="search" name="q" placeholder="Search tiles, colours, rooms…" autocomplete="off"
            role="combobox" aria-expanded="false" aria-controls="SearchResults" aria-autocomplete="list">
          <button type="submit" class="icon-button" aria-label="Search">${icon("search")}</button>
        </form>
        <div class="search__results" id="SearchResults" role="listbox" hidden></div>
      </predictive-search>
      <div class="header__icons">
        <a class="icon-button" href="/pages/contact" aria-label="Help and contact">${icon("user")}</a>
        <a class="icon-button header__wish" href="/pages/wishlist" aria-label="Wishlist">${icon("heart")}<span class="bubble" data-wishlist-count hidden>0</span></a>
        <a class="icon-button" href="/cart" data-open-cart aria-label="Basket">${icon("basket")}<span class="bubble" data-cart-count hidden>0</span></a>
      </div>
    </div>
    <nav class="nav" aria-label="Main">
      <ul class="nav__list container">${megaMenu()}</ul>
    </nav>
  </header>
  ${mobileMenu()}`;
}

export function uspStrip() {
  return html`<section class="usp">
    <ul class="usp__list container">
      <li>${icon("sample")}<div><strong>Free cut samples</strong><span>Up to ${STORE.maxFreeSamples} per order</span></div></li>
      <li>${icon("truck")}<div><strong>Tracked delivery</strong><span>Free over ${money(STORE.freeDeliveryThreshold)}</span></div></li>
      <li>${icon("returns")}<div><strong>60-day returns</strong><span>On unopened boxes</span></div></li>
      <li>${icon("star")}<div><strong>Rated 4.8 / 5</strong><span>From placeholder reviews</span></div></li>
    </ul>
  </section>`;
}

function footer() {
  const col = (title, links) => html`<div class="footer__col"><p class="footer__heading">${title}</p><ul>${links.map(([l, u]) => html`<li><a href="${u}">${l}</a></li>`)}</ul></div>`;
  return html`<footer class="footer">
    <div class="footer__inner container">
      <div class="footer__brand">
        <a class="logo logo--light" href="/"><span class="logo__mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="logo__text">${STORE.name}</span></a>
        <p>${STORE.tagline}. A demo storefront built for learning; products and prices are placeholders.</p>
      </div>
      ${col("Shop", [["Wall tiles", "/collections/wall-tiles"], ["Floor tiles", "/collections/floor-tiles"], ["New in", "/collections/new-in"], ["Sale", "/collections/sale"]])}
      ${col("Help", [["Free samples", "/pages/samples"], ["Delivery", "/pages/delivery"], ["Contact us", "/pages/contact"], ["How many tiles do I need?", "/blogs/inspiration/how-many-tiles-do-i-need"]])}
      ${col("About", [["Our story", "/pages/about-us"], ["Inspiration", "/blogs/inspiration"], ["Wishlist", "/pages/wishlist"]])}
    </div>
    <div class="footer__base container"><span>© ${new Date().getFullYear()} ${STORE.name} (demo)</span><span>Images are generated placeholders</span></div>
  </footer>`;
}

function cartDrawerShell() {
  return html`<cart-drawer>
    <div class="drawer drawer--right" id="CartDrawer" hidden>
      <div class="drawer__overlay" data-close></div>
      <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Basket">
        <div class="drawer__head"><span class="drawer__title">Your basket</span><button type="button" class="icon-button" data-close aria-label="Close basket">${icon("close")}</button></div>
        <div class="drawer__notice" data-cart-notice hidden></div>
        <div class="drawer__body" data-cart-body><p class="muted">Loading…</p></div>
      </div>
    </div>
  </cart-drawer>`;
}

export function layout({ title, description = STORE.tagline, body, bodyClass = "" }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html`${title}`} | ${STORE.name}</title>
<meta name="description" content="${html`${description}`}">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/styles.css">
<script type="module" src="/js/app.js"></script>
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#Main">Skip to content</a>
${header()}
<main id="Main">${body}</main>
${footer()}
${cartDrawerShell()}
<div class="toast" role="status" aria-live="polite" hidden></div>
</body>
</html>`;
}
