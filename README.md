# Kiln & Clay

A static demo tile shop. Browse by room and style, filter and sort, search, order free samples, and fill a basket.

Products, prices and reviews are placeholders. Tile images are SVGs generated in code.

## Run

Requires Node.js 22+. No dependencies.

```bash
npm start        # build and preview at http://127.0.0.1:3000
npm run build    # build to dist/
npm run check    # build, check links, test store rules
```

## How it works

- `scripts/build.js` renders every page and image into `dist/`.
- Filtering, search, basket and wishlist run in the browser. The basket and wishlist are saved in `localStorage`.
- Checkout, newsletter and contact forms are demo only.

## Structure

```
scripts/      build, preview server, checks
src/          product data, SVG image generator, page templates
public/js/    browser code (store-logic.js holds the shared rules)
public/css/   styles
```

To add a tile range, add an entry to `SERIES` in `src/data.js`.

## Deploy

Works on any static host that serves `/page` from `page.html`. `vercel.json` is set up for Vercel.
