// Page templates rendered to static HTML at build time.
// Dynamic parts (filters, search results, basket, wishlist) are filled in by public/js/app.js.
import { html, raw, money } from "../util.js";
import {
  STORE, PRODUCTS, PRODUCT_BY_HANDLE, ROOMS, STYLES, ARTICLES, SORTS, reviewsFor, ratingBreakdown,
} from "../data.js";
import { facetCounts, priceBounds } from "../catalog.js";
import { PRODUCT_VIEWS } from "../images.js";
import { productCard, stars, priceBlock, icon, uspStrip } from "./components.js";

// ---------------- Home ----------------

function carousel(title, products, link) {
  return html`<section class="section">
    <div class="container">
      <div class="section__head"><h2>${title}</h2>${link ? html`<a class="link-arrow" href="${link}">View all</a>` : ""}</div>
      <carousel-slider class="carousel">
        <button type="button" class="carousel__btn carousel__btn--prev" data-dir="-1" aria-label="Previous slide">${icon("chevronLeft")}</button>
        <ul class="carousel__track grid-cards">${products.map((p) => productCard(p))}</ul>
        <button type="button" class="carousel__btn carousel__btn--next" data-dir="1" aria-label="Next slide">${icon("chevronRight")}</button>
      </carousel-slider>
    </div>
  </section>`;
}

export function homePage() {
  const hero = PRODUCT_BY_HANDLE.get("brisa-teal");
  const best = [...PRODUCTS].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10);
  const fresh = PRODUCTS.filter((p) => p.isNew).slice(0, 10);
  return html`
  <section class="hero">
    <img class="hero__img" src="/img/hero.svg" alt="" width="1600" height="760">
    <div class="hero__content container">
      <p class="eyebrow">New season colours</p>
      <h1>Glazed tiles with character</h1>
      <p>Uneven edges, deep colour and a finish that catches the light. Order free samples before you decide.</p>
      <div class="hero__actions">
        <a class="button" href="/collections/zellige-effect-tiles">Shop ${hero.style.toLowerCase()}</a>
        <a class="button button--ghost" href="/pages/samples">How samples work</a>
      </div>
    </div>
  </section>
  ${uspStrip()}
  <section class="section">
    <div class="container">
      <div class="section__head"><h2>Shop by room</h2></div>
      <ul class="tiles tiles--rooms">
        ${ROOMS.map((r) => html`<li><a class="tile-link" href="/collections/${r.handle}">
          <img src="/img/room/${r.scene}.svg" alt="" width="800" height="800" loading="lazy">
          <span class="tile-link__label">${r.title}</span></a></li>`)}
      </ul>
    </div>
  </section>
  ${carousel("Best sellers", best, "/collections/all?sort_by=best-rated")}
  <section class="section section--tint">
    <div class="container">
      <div class="section__head"><h2>Shop by style</h2></div>
      <ul class="tiles tiles--styles">
        ${STYLES.map((s) => html`<li><a class="tile-link tile-link--small" href="/collections/${s.handle}">
          <img src="/img/p/${s.sample}/swatch.svg" alt="" width="600" height="600" loading="lazy">
          <span class="tile-link__label">${s.title}</span></a></li>`)}
      </ul>
    </div>
  </section>
  <section class="section">
    <div class="container split">
      <img class="split__img" src="/img/p/fable-indigo/board.svg" alt="" width="800" height="800" loading="lazy">
      <div class="split__text">
        <p class="eyebrow">Try before you buy</p>
        <h2>Free cut samples, next working day</h2>
        <p>Choose up to ${STORE.maxFreeSamples} samples from any product page. See the colour in your own light, next to your units and paint.</p>
        <a class="button" href="/pages/samples">Order samples</a>
      </div>
    </div>
  </section>
  ${carousel("New in", fresh, "/collections/new-in")}
  <section class="section">
    <div class="container">
      <div class="section__head"><h2>Inspiration and advice</h2><a class="link-arrow" href="/blogs/inspiration">All articles</a></div>
      <ul class="articles">${ARTICLES.map(articleCard)}</ul>
    </div>
  </section>
  ${newsletter()}`;
}

function newsletter() {
  return html`<section class="newsletter">
    <div class="container newsletter__inner">
      <div><h2>Get 10% off your first tile order</h2><p>Join the list for new colours and project ideas. Demo only: nothing is sent or stored.</p></div>
      <newsletter-form>
        <form class="newsletter__form" novalidate>
          <label class="visually-hidden" for="NewsletterEmail">Email address</label>
          <input id="NewsletterEmail" type="email" name="email" placeholder="Email address" required>
          <button class="button" type="submit">Sign up</button>
        </form>
        <p class="newsletter__msg" role="status" hidden></p>
      </newsletter-form>
    </div>
  </section>`;
}

function articleCard(a) {
  return html`<li class="article-card"><a href="/blogs/inspiration/${a.handle}">
    <img src="/img/p/${a.product}/room.svg" alt="" width="800" height="800" loading="lazy">
    <h3>${a.title}</h3><p>${a.excerpt}</p></a></li>`;
}

// ---------------- Collection ----------------
// Every product in the collection is rendered. The browser filters, sorts and pages them
// from the URL query, so filtered links (e.g. ?filter.colour=Green) still work on a static host.

function facetsForm(base) {
  const bounds = priceBounds(base);
  return html`<facet-filters-form class="facets">
    <form id="FacetForm" novalidate>
      <div class="facets__head"><h2>Filter by</h2><button type="button" class="icon-button facets__close" data-close-facets aria-label="Close filters">${icon("close")}</button></div>
      ${facetCounts(base).map((g) => html`<details class="facet" open>
        <summary>${g.label}<span class="facet__count" data-facet-count="${g.key}" hidden></span></summary>
        <ul>${g.values.map(([value, count]) => html`<li><label class="check">
          <input type="checkbox" name="filter.${g.key}" value="${value}">
          <span>${value}</span><span class="muted">(${count})</span></label></li>`)}</ul>
      </details>`)}
      <details class="facet" open>
        <summary>Price per m²</summary>
        <div class="price-range">
          <label>From £<input type="number" name="price_min" min="0" max="${bounds.max}" step="1" placeholder="${bounds.min}"></label>
          <label>To £<input type="number" name="price_max" min="0" max="${bounds.max}" step="1" placeholder="${bounds.max}"></label>
        </div>
      </details>
    </form>
  </facet-filters-form>`;
}

function resultsGrid(products, { emptyTitle, emptyText }) {
  return html`<div id="CollectionGrid" class="collection__results">
    <div class="toolbar">
      <button type="button" class="button button--ghost toolbar__filters" data-open-facets>Filters</button>
      <p class="toolbar__count"><strong data-count>${products.length}</strong> <span data-count-label>${products.length === 1 ? "product" : "products"}</span></p>
      <label class="toolbar__sort">Sort by
        <select data-sort aria-label="Sort products">
          ${SORTS.map(([k, label]) => html`<option value="${k}">${label}</option>`)}
        </select>
      </label>
    </div>
    <div class="active-filters" data-active-filters hidden></div>
    <div class="empty" data-empty hidden><h3>${emptyTitle}</h3><p>${emptyText}</p></div>
    <ul class="grid-cards grid-cards--collection" data-product-grid>${products.map((p, i) => productCard(p, { lazy: i > 3 }))}</ul>
    <div class="load-more" data-load-more-wrap hidden>
      <p class="muted" data-showing></p>
      <button type="button" class="button button--ghost" data-load-more>Load more</button>
    </div>
  </div>`;
}

export function collectionPage(collection, base) {
  return html`<div class="collection container">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span>${collection.title}</span></nav>
    <header class="collection__head">
      <h1>${collection.title}</h1>
      <p>${collection.intro}</p>
    </header>
    <collection-filters class="collection__layout">
      <aside class="collection__sidebar" id="FacetsDrawer">${facetsForm(base)}</aside>
      ${resultsGrid(base, { emptyTitle: "No tiles match these filters", emptyText: "Try removing a filter or widening the price range." })}
    </collection-filters>
  </div>`;
}

// ---------------- Search ----------------
// All products are rendered; the browser shows the ones that match ?q=.

export function searchPage() {
  return html`<div class="container section">
    <h1>Search</h1>
    <search-results>
      <form class="search-page__form" action="/search" method="get" role="search">
        <label class="visually-hidden" for="SearchPageInput">Search tiles</label>
        <input id="SearchPageInput" type="search" name="q" placeholder="Try “green bathroom” or “hexagon”">
        <button class="button" type="submit">Search</button>
      </form>
      <p class="muted" data-search-summary>Type a colour, style or room to search.</p>
      <ul class="grid-cards grid-cards--collection" data-product-grid>${PRODUCTS.map((p) => productCard(p))}</ul>
    </search-results>
  </div>`;
}


// ---------------- Product ----------------

export function productPage(p) {
  const related = PRODUCTS.filter((x) => x.handle !== p.handle && (x.series === p.series || x.style === p.style)).slice(0, 8);
  const reviews = reviewsFor(p);
  const breakdown = ratingBreakdown(p);
  const [w, h] = p.size.replace("cm", "").split("x");
  const tilesPerBox = Math.round((p.m2PerBox * 10000) / (Number(w) * Number(h)));
  return html`<div class="product container">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/collections/all">Tiles</a> / <span>${p.name}</span></nav>
    <div class="product__layout">
      <product-gallery class="gallery">
        <div class="gallery__main"><img src="/img/p/${p.handle}/${PRODUCT_VIEWS[0]}.svg" alt="${p.name}" width="800" height="800" data-main-image></div>
        <ul class="gallery__thumbs">
          ${PRODUCT_VIEWS.map((v, i) => html`<li><button type="button" class="${i === 0 ? "is-active" : ""}" data-src="/img/p/${p.handle}/${v}.svg" aria-label="Show ${v} view">
            <img src="/img/p/${p.handle}/${v}.svg" alt="" width="120" height="120" loading="lazy"></button></li>`)}
        </ul>
      </product-gallery>

      <div class="product__info">
        <p class="eyebrow">${p.style}</p>
        <h1>${p.name} ${p.surfaces.length === 1 ? p.surfaces[0] : "Wall & Floor"} Tile</h1>
        <a href="#Reviews" class="product__rating">${stars(p.rating, p.reviewCount)}</a>
        <div class="product__price">${priceBlock(p)}<span class="muted">${money(p.pricePerBox)} per box (${p.m2PerBox} m²)</span></div>
        <ul class="spec-pills"><li>${p.size}</li><li>${p.finish}</li><li>${p.material}</li><li>${p.surfaces.join(" & ")}</li></ul>

        <product-form data-handle="${p.handle}" data-m2-per-box="${p.m2PerBox}" data-price-per-box="${p.pricePerBox}">
          <form class="buy" novalidate>
            <coverage-calculator class="calc" data-m2-per-box="${p.m2PerBox}" data-wastage="${STORE.wastage}">
              <details>
                <summary>How much do I need?</summary>
                <div class="calc__body">
                  <p class="muted">Enter your area in metres. We add ${STORE.wastage * 100}% for cuts.</p>
                  <div class="calc__row">
                    <label>Width (m)<input type="number" inputmode="decimal" min="0" step="0.01" data-width></label>
                    <span aria-hidden="true">×</span>
                    <label>Height / length (m)<input type="number" inputmode="decimal" min="0" step="0.01" data-height></label>
                  </div>
                  <label class="check"><input type="checkbox" data-wastage-toggle checked> Add ${STORE.wastage * 100}% wastage</label>
                  <p class="calc__result" data-result aria-live="polite">Enter your measurements to see how many boxes you need.</p>
                </div>
              </details>
            </coverage-calculator>
            <div class="buy__row">
              <quantity-input class="qty">
                <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
                <input type="number" name="quantity" value="1" min="1" max="999" aria-label="Quantity in boxes">
                <button type="button" data-step="1" aria-label="Increase quantity">+</button>
              </quantity-input>
              <button class="button button--wide" type="submit" ${raw(p.inStock ? "" : "disabled")}>${p.inStock ? "Add to basket" : "Out of stock"}</button>
            </div>
            <p class="buy__summary" data-buy-summary>1 box covers ${p.m2PerBox} m² · ${money(p.pricePerBox)}</p>
            <p class="form-error" data-error role="alert" hidden></p>
          </form>
        </product-form>

        <div class="sample-box">
          <div><h2>Try before you buy</h2><p>A free cut sample of ${p.name}, delivered next working day.</p></div>
          <sample-button data-handle="${p.handle}"><button type="button" class="button button--ghost">${icon("sample")} Order free sample</button></sample-button>
        </div>

        <wishlist-button class="product__wish" data-handle="${p.handle}">
          <button type="button" class="link-button" aria-pressed="false">${icon("heart")} <span data-label>Save to wishlist</span></button>
        </wishlist-button>

        <div class="accordions">
          <details open><summary>Description</summary><p>${p.description} ${p.colour} is part of the ${p.series} range, available in ${PRODUCTS.filter((x) => x.series === p.series).length} colours.</p></details>
          <details><summary>Product information</summary>
            <dl class="specs">
              <dt>Size</dt><dd>${p.size}</dd><dt>Finish</dt><dd>${p.finish}</dd><dt>Material</dt><dd>${p.material}</dd>
              <dt>Colour</dt><dd>${p.colour} (${p.colourFamily})</dd><dt>Coverage per box</dt><dd>${p.m2PerBox} m²</dd>
              <dt>Tiles per box</dt><dd>About ${tilesPerBox}</dd><dt>Suitable for</dt><dd>${p.surfaces.join(", ")}</dd>
            </dl></details>
          <details><summary>Suitable rooms</summary><p>${p.rooms.join(", ")}.</p></details>
          <details><summary>Delivery</summary><p>Samples are free. Tile orders over ${money(STORE.freeDeliveryThreshold)} get free tracked delivery; otherwise delivery is ${money(STORE.deliveryFee)}. This is a demo store, so nothing ships.</p></details>
          <details><summary>Fitting advice</summary><p>Use a flexible adhesive for porcelain and a tile leveller for large formats. Mix tiles from several boxes as you lay them to blend natural shade variation.</p></details>
        </div>
      </div>
    </div>

    <section class="reviews section" id="Reviews">
      <div class="section__head"><h2>Customer reviews</h2></div>
      <site-tabs class="tabs">
        <div role="tablist" class="tabs__list">
          <button role="tab" aria-selected="true" aria-controls="tab-reviews" id="tab-btn-reviews">Reviews (${p.reviewCount})</button>
          <button role="tab" aria-selected="false" aria-controls="tab-questions" id="tab-btn-questions" tabindex="-1">Questions</button>
        </div>
        <div role="tabpanel" id="tab-reviews" aria-labelledby="tab-btn-reviews">
          <div class="reviews__summary">
            <div class="reviews__score"><strong>${p.rating.toFixed(1)}</strong>${stars(p.rating)}<span class="muted">${p.reviewCount} placeholder reviews</span></div>
            <ul class="reviews__bars">${breakdown.map((n, i) => html`<li><span>${5 - i} ★</span><span class="bar"><span style="width:${p.reviewCount ? (n / p.reviewCount) * 100 : 0}%"></span></span><span class="muted">${n}</span></li>`)}</ul>
          </div>
          <ul class="reviews__list">${reviews.map((r) => html`<li class="review">
            ${stars(r.stars)}<h3>${r.title}</h3><p>${r.body}</p><p class="muted">${r.author} · ${r.daysAgo} days ago · Verified buyer (placeholder)</p></li>`)}</ul>
        </div>
        <div role="tabpanel" id="tab-questions" aria-labelledby="tab-btn-questions" hidden>
          <ul class="faq">
            <li><h3>Can I use this tile in a shower?</h3><p>${p.surfaces.includes("Wall") ? "Yes. Seal the grout and use a waterproof adhesive." : "This tile is made for floors. Choose a wall tile for shower walls."}</p></li>
            <li><h3>Will the colour match my sample?</h3><p>Shades vary between production batches. Order everything you need at once and keep one box spare.</p></li>
          </ul>
        </div>
      </site-tabs>
    </section>

    ${related.length ? html`<section class="section">
      <div class="section__head"><h2>You may also like</h2></div>
      <carousel-slider class="carousel">
        <button type="button" class="carousel__btn carousel__btn--prev" data-dir="-1" aria-label="Previous slide">${icon("chevronLeft")}</button>
        <ul class="carousel__track grid-cards">${related.map((x) => productCard(x))}</ul>
        <button type="button" class="carousel__btn carousel__btn--next" data-dir="1" aria-label="Next slide">${icon("chevronRight")}</button>
      </carousel-slider>
    </section>` : ""}
  </div>
  <sticky-bar class="sticky-bar" hidden>
    <div class="container sticky-bar__inner">
      <img src="/img/p/${p.handle}/swatch.svg" alt="" width="48" height="48">
      <span><strong>${p.name}</strong> ${priceBlock(p)}</span>
      <button type="button" class="button" data-scroll-to-buy>Add to basket</button>
    </div>
  </sticky-bar>`;
}

// ---------------- Cart ----------------
// Basket contents live in localStorage, so these pages are shells that app.js fills in.

export function cartPage() {
  return html`<div class="container section cart-page">
    <h1>Your basket</h1>
    <cart-page><p class="muted" data-cart-loading>Loading your basket…</p></cart-page>
    <noscript><p>The basket needs JavaScript turned on.</p></noscript>
  </div>`;
}

export function checkoutPage() {
  return html`<div class="container section narrow">
    <h1>Checkout</h1>
    <div class="notice"><p><strong>This is a demo store.</strong> Checkout is switched off, so no payment is taken and nothing ships.</p></div>
    <checkout-summary><p class="muted">Loading your basket…</p></checkout-summary>
    <a class="button button--ghost" href="/cart">Back to basket</a>
  </div>`;
}


// ---------------- Content pages ----------------

export function contentPage(handle) {
  const pages = {
    "about-us": ["Our story", html`<p>${STORE.name} is a made-up tile shop used to practise building an e-commerce storefront. The layout follows common tile-retailer patterns: browse by room and style, filter, order free samples, then buy by the box.</p>
      <p>Every product, review and image on this site is a placeholder. Images are drawn in code from each product's pattern and colour.</p>`],
    samples: ["Free samples", html`<ol class="steps">
        <li><strong>Pick up to ${STORE.maxFreeSamples}.</strong> Use “Order free sample” on any product card or page.</li>
        <li><strong>Check your tray.</strong> The basket shows your sample tray and how many free slots remain.</li>
        <li><strong>See them at home.</strong> Look at samples in daylight and lamplight before ordering full boxes.</li>
      </ol><a class="button" href="/collections/all">Browse tiles</a>`],
    delivery: ["Delivery", html`<p>Samples are always free. Tile orders over ${money(STORE.freeDeliveryThreshold)} get free tracked delivery. Smaller tile orders cost ${money(STORE.deliveryFee)}.</p><p>Demo store: nothing is shipped.</p>`],
    contact: ["Contact us", html`<contact-form><form class="contact-form" novalidate>
        <label>Name<input name="name" required maxlength="80"></label>
        <label>Email<input type="email" name="email" required maxlength="120"></label>
        <label>Message<textarea name="message" rows="5" required maxlength="2000"></textarea></label>
        <button class="button" type="submit">Send</button>
        <p class="form-note" role="status" hidden></p>
      </form></contact-form><p class="muted">Demo only: messages are not sent or stored.</p>`],
    wishlist: ["Wishlist", html`<wishlist-page><p class="muted" data-empty>Loading your saved tiles…</p>
      <ul class="grid-cards grid-cards--collection" data-wishlist-grid>${PRODUCTS.map((p) => productCard(p, { hidden: true }))}</ul></wishlist-page>`],
  };
  const page = pages[handle];
  if (!page) return null;
  return { title: page[0], body: html`<div class="container section narrow page"><h1>${page[0]}</h1>${page[1]}</div>` };
}

export const CONTENT_PAGES = ["about-us", "samples", "delivery", "contact", "wishlist"];

export function blogPage() {
  return html`<div class="container section"><h1>Inspiration and advice</h1><ul class="articles">${ARTICLES.map(articleCard)}</ul></div>`;
}

export function articlePage(a) {
  const p = PRODUCT_BY_HANDLE.get(a.product);
  return html`<article class="container section narrow article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/blogs/inspiration">Inspiration</a> / <span>${a.title}</span></nav>
    <h1>${a.title}</h1>
    <img src="/img/p/${a.product}/room.svg" alt="" width="800" height="800">
    ${a.body.map((para) => html`<p>${para}</p>`)}
    ${p ? html`<p>Tile shown: <a href="/products/${p.handle}">${p.name}</a>.</p>` : ""}
  </article>`;
}

export function notFoundPage() {
  return html`<div class="container section narrow page"><h1>Page not found</h1><p>The page you were looking for doesn't exist.</p><a class="button" href="/collections/all">Browse tiles</a></div>`;
}
