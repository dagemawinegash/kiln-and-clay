// Procedural SVG artwork: tile surfaces, sample boards and simple room scenes.
// Everything is drawn from product data, so no photos are needed.
import { seededRandom, shade, mix, luminance } from "./util.js";

const f = (n) => Math.round(n * 10) / 10;

function parseSize(size) {
  const m = /([\d.]+)x([\d.]+)/.exec(size);
  return m ? [Number(m[1]), Number(m[2])] : [20, 20];
}

function groutFor(hex) {
  return luminance(hex) > 0.6 ? shade(hex, -0.18) : mix(hex, "#d9d6cf", 0.55);
}

// ---------- Pattern painters. Each returns SVG markup covering 0..w x 0..h. ----------

function paintGrid(p, w, h, ppc, rand, { variation, highlight, radius }) {
  const [tw, th] = parseSize(p.size).map((d) => d * ppc);
  const g = Math.max(1.2, ppc * 0.25);
  let out = `<rect width="${w}" height="${h}" fill="${groutFor(p.hex)}"/>`;
  for (let y = 0; y < h; y += th) {
    for (let x = 0; x < w; x += tw) {
      const jx = (rand() - 0.5) * g * 0.8;
      const jy = (rand() - 0.5) * g * 0.8;
      const fill = shade(p.hex, (rand() - 0.5) * variation);
      out += `<rect x="${f(x + g / 2 + jx)}" y="${f(y + g / 2 + jy)}" width="${f(tw - g)}" height="${f(th - g)}" rx="${radius}" fill="${fill}"/>`;
      if (highlight) {
        out += `<ellipse cx="${f(x + tw * (0.3 + rand() * 0.4))}" cy="${f(y + th * (0.25 + rand() * 0.3))}" rx="${f(tw * 0.28)}" ry="${f(th * 0.16)}" fill="#fff" opacity="${f(0.08 + rand() * 0.18)}"/>`;
      }
    }
  }
  return out;
}

function paintMetro(p, w, h, ppc, rand) {
  const [a, b] = parseSize(p.size);
  const th = Math.min(a, b) * ppc;
  const tw = Math.max(a, b) * ppc;
  const g = Math.max(1.2, ppc * 0.25);
  let out = `<rect width="${w}" height="${h}" fill="${groutFor(p.hex)}"/>`;
  let row = 0;
  for (let y = 0; y < h; y += th, row++) {
    for (let x = row % 2 ? -tw / 2 : 0; x < w; x += tw) {
      const fill = shade(p.hex, (rand() - 0.5) * 0.08);
      out += `<rect x="${f(x + g / 2)}" y="${f(y + g / 2)}" width="${f(tw - g)}" height="${f(th - g)}" rx="${f(g)}" fill="${fill}"/>`;
      out += `<rect x="${f(x + g * 1.6)}" y="${f(y + g * 1.6)}" width="${f(tw - g * 3.2)}" height="${f(th - g * 3.2)}" rx="${f(g)}" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="${f(g * 0.8)}"/>`;
    }
  }
  return out;
}

function paintHexagon(p, w, h, ppc, rand) {
  const [, tall] = parseSize(p.size);
  const r = (tall * ppc) / 2;
  const hw = Math.sqrt(3) * r;
  const g = Math.max(1.2, ppc * 0.3);
  let out = `<rect width="${w}" height="${h}" fill="${groutFor(p.hex)}"/>`;
  let row = 0;
  for (let cy = 0; cy < h + r; cy += r * 1.5, row++) {
    for (let cx = row % 2 ? hw / 2 : 0; cx < w + hw; cx += hw) {
      const rr = r - g / 2;
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 180) * (60 * k - 30);
        pts.push(`${f(cx + rr * Math.cos(ang))},${f(cy + rr * Math.sin(ang))}`);
      }
      out += `<polygon points="${pts.join(" ")}" fill="${shade(p.hex, (rand() - 0.5) * 0.1)}"/>`;
    }
  }
  return out;
}

function starPoints(cx, cy, outer, inner) {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const rad = k % 2 === 0 ? outer : inner;
    const ang = (Math.PI / 8) * k;
    pts.push(`${f(cx + rad * Math.cos(ang))},${f(cy + rad * Math.sin(ang))}`);
  }
  return pts.join(" ");
}

function paintStar(p, w, h, ppc, rand) {
  const s = parseSize(p.size)[0] * ppc;
  const cross = luminance(p.hex) > 0.7 ? "#2d3b58" : "#f1ede4";
  let out = `<rect width="${w}" height="${h}" fill="${cross}"/>`;
  for (let y = 0; y < h + s; y += s) {
    for (let x = 0; x < w + s; x += s) {
      out += `<polygon points="${starPoints(x, y, s * 0.6, s * 0.43)}" fill="${shade(p.hex, (rand() - 0.5) * 0.08)}" stroke="${groutFor(cross)}" stroke-width="${f(Math.max(1, ppc * 0.25))}"/>`;
    }
  }
  return out;
}

function paintEncaustic(p, w, h, ppc, rand) {
  const s = parseSize(p.size)[0] * ppc;
  const paper = "#efe9dc";
  const accent = shade(p.hex, 0.35);
  let out = `<rect width="${w}" height="${h}" fill="${paper}"/>`;
  for (let y = 0; y < h; y += s) {
    for (let x = 0; x < w; x += s) {
      const wear = 1 - rand() * 0.12;
      out += `<g opacity="${f(wear)}">`;
      for (const [qx, qy] of [[x, y], [x + s, y], [x, y + s], [x + s, y + s]]) {
        out += `<circle cx="${f(qx)}" cy="${f(qy)}" r="${f(s * 0.36)}" fill="${p.hex}"/>`;
        out += `<circle cx="${f(qx)}" cy="${f(qy)}" r="${f(s * 0.2)}" fill="${accent}"/>`;
      }
      const c = s / 2;
      out += `<polygon points="${f(x + c)},${f(y + s * 0.18)} ${f(x + s * 0.82)},${f(y + c)} ${f(x + c)},${f(y + s * 0.82)} ${f(x + s * 0.18)},${f(y + c)}" fill="${p.hex}"/>`;
      out += `<circle cx="${f(x + c)}" cy="${f(y + c)}" r="${f(s * 0.12)}" fill="${paper}"/>`;
      out += `</g>`;
      out += `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" fill="none" stroke="#cfc8b8" stroke-width="${f(Math.max(1, ppc * 0.2))}"/>`;
    }
  }
  return out;
}

function paintTerrazzo(p, w, h, ppc, rand) {
  const s = parseSize(p.size)[0] * ppc;
  const chips = [shade(p.hex, -0.35), shade(p.hex, 0.5), "#c9a27a", "#6b7b8c", "#e2d6c4", "#8a5a44", "#2f2f2f"];
  let out = `<rect width="${w}" height="${h}" fill="${p.hex}"/>`;
  const count = Math.round((w * h) / 260);
  for (let i = 0; i < count; i++) {
    const cx = rand() * w;
    const cy = rand() * h;
    const r = 1.5 + rand() * rand() * 9;
    const n = 4 + Math.floor(rand() * 3);
    const pts = [];
    for (let k = 0; k < n; k++) {
      const ang = (Math.PI * 2 * k) / n + rand() * 0.6;
      const rr = r * (0.6 + rand() * 0.6);
      pts.push(`${f(cx + rr * Math.cos(ang))},${f(cy + rr * Math.sin(ang))}`);
    }
    out += `<polygon points="${pts.join(" ")}" fill="${chips[Math.floor(rand() * chips.length)]}" opacity="${f(0.55 + rand() * 0.45)}"/>`;
  }
  out += gridLines(w, h, s, s, groutFor(p.hex), Math.max(1, ppc * 0.2));
  return out;
}

function paintMarble(p, w, h, ppc, rand) {
  const [a, b] = parseSize(p.size);
  const vein = luminance(p.hex) > 0.6 ? "#8d8e93" : mix(p.hex, "#ffffff", 0.7);
  let out = `<rect width="${w}" height="${h}" fill="${p.hex}"/>`;
  out += `<g filter="url(#soft)" fill="none" stroke="${vein}">`;
  const veins = 6 + Math.floor(rand() * 4);
  for (let i = 0; i < veins; i++) {
    const y0 = rand() * h;
    const y1 = y0 + (rand() - 0.3) * h * 0.8;
    const c1 = [w * 0.3, y0 + (rand() - 0.5) * h * 0.5];
    const c2 = [w * 0.7, y1 + (rand() - 0.5) * h * 0.5];
    out += `<path d="M -20 ${f(y0)} C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(w + 20)} ${f(y1)}" stroke-width="${f(0.8 + rand() * 3)}" stroke-opacity="${f(0.25 + rand() * 0.45)}"/>`;
  }
  out += `</g>`;
  out += gridLines(w, h, Math.max(a, b) * ppc, Math.min(a, b) * ppc, groutFor(p.hex), Math.max(1, ppc * 0.15));
  return out;
}

function paintWood(p, w, h, ppc, rand) {
  const [a, b] = parseSize(p.size);
  const ph = Math.min(a, b) * ppc;
  const pl = Math.max(a, b) * ppc;
  const gap = Math.max(1, ppc * 0.2);
  let out = `<rect width="${w}" height="${h}" fill="${shade(p.hex, -0.35)}"/>`;
  for (let y = 0; y < h; y += ph) {
    for (let x = -rand() * pl; x < w; x += pl) {
      const tone = shade(p.hex, (rand() - 0.5) * 0.22);
      out += `<rect x="${f(x + gap / 2)}" y="${f(y + gap / 2)}" width="${f(pl - gap)}" height="${f(ph - gap)}" fill="${tone}"/>`;
      out += woodGrain(x, y, pl, ph, p.hex, rand);
    }
  }
  return out;
}

function woodGrain(x, y, len, ht, hex, rand) {
  let out = "";
  const lines = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < lines; i++) {
    const gy = y + ht * ((i + 0.5) / lines) + (rand() - 0.5) * ht * 0.1;
    const amp = ht * 0.06;
    out += `<path d="M ${f(x + 2)} ${f(gy)} q ${f(len / 4)} ${f(amp)} ${f(len / 2)} 0 t ${f(len / 2 - 4)} 0" fill="none" stroke="${shade(hex, -0.3)}" stroke-opacity="0.3" stroke-width="0.8"/>`;
  }
  if (rand() < 0.35) {
    out += `<ellipse cx="${f(x + len * (0.2 + rand() * 0.6))}" cy="${f(y + ht / 2)}" rx="${f(ht * 0.25)}" ry="${f(ht * 0.12)}" fill="${shade(hex, -0.35)}" opacity="0.35"/>`;
  }
  return out;
}

function paintChevron(p, w, h, ppc, rand) {
  const [a, b] = parseSize(p.size);
  const ph = Math.min(a, b) * ppc;
  const cw = (Math.max(a, b) * ppc) / Math.SQRT2;
  let out = `<rect width="${w}" height="${h}" fill="${shade(p.hex, -0.35)}"/>`;
  let col = 0;
  for (let x0 = 0; x0 < w; x0 += cw, col++) {
    const up = col % 2 === 0;
    for (let y = -cw; y < h + ph; y += ph) {
      const yl = y + (up ? cw : 0);
      const yr = y + (up ? 0 : cw);
      const tone = shade(p.hex, (rand() - 0.5) * 0.22);
      out += `<polygon points="${f(x0)},${f(yl)} ${f(x0 + cw)},${f(yr)} ${f(x0 + cw)},${f(yr + ph - 1)} ${f(x0)},${f(yl + ph - 1)}" fill="${tone}"/>`;
      out += `<line x1="${f(x0 + 2)}" y1="${f(yl + ph / 2)}" x2="${f(x0 + cw - 2)}" y2="${f(yr + ph / 2)}" stroke="${shade(p.hex, -0.3)}" stroke-opacity="0.25" stroke-width="0.8"/>`;
    }
  }
  return out;
}

function paintFishscale(p, w, h, ppc, rand) {
  const r = (parseSize(p.size)[0] * ppc) / 2;
  const grout = groutFor(p.hex);
  let out = `<rect width="${w}" height="${h}" fill="${grout}"/>`;
  const rows = [];
  let row = 0;
  for (let cy = 0; cy < h + r * 2; cy += r, row++) rows.push([cy, row]);
  for (const [cy, rw] of rows.reverse()) {
    for (let cx = rw % 2 ? r : 0; cx < w + r * 2; cx += r * 2) {
      const fill = shade(p.hex, (rand() - 0.5) * 0.12);
      out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - 0.8)}" fill="${fill}" stroke="${grout}" stroke-width="${f(Math.max(1, ppc * 0.25))}"/>`;
      out += `<ellipse cx="${f(cx - r * 0.25)}" cy="${f(cy + r * 0.45)}" rx="${f(r * 0.35)}" ry="${f(r * 0.14)}" fill="#fff" opacity="0.18"/>`;
    }
  }
  return out;
}

function paintStone(p, w, h, ppc) {
  const s = parseSize(p.size)[0] * ppc;
  let out = `<rect width="${w}" height="${h}" fill="${p.hex}"/>`;
  out += `<rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.45"/>`;
  out += gridLines(w, h, s, s, groutFor(p.hex), Math.max(1.2, ppc * 0.3));
  return out;
}

function gridLines(w, h, sx, sy, colour, width) {
  let out = `<g stroke="${colour}" stroke-width="${f(width)}">`;
  for (let x = sx; x < w; x += sx) out += `<line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${h}"/>`;
  for (let y = sy; y < h; y += sy) out += `<line x1="0" y1="${f(y)}" x2="${w}" y2="${f(y)}"/>`;
  return out + `</g>`;
}

const PAINTERS = {
  zellige: (p, w, h, ppc, r) => paintGrid(p, w, h, ppc, r, { variation: 0.3, highlight: true, radius: 2 }),
  square: (p, w, h, ppc, r) => paintGrid(p, w, h, ppc, r, { variation: 0.1, highlight: true, radius: 1 }),
  metro: paintMetro,
  hexagon: paintHexagon,
  star: paintStar,
  encaustic: paintEncaustic,
  terrazzo: paintTerrazzo,
  marble: paintMarble,
  wood: paintWood,
  chevron: paintChevron,
  fishscale: paintFishscale,
  stone: paintStone,
};

const SHARED_DEFS = `
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.35"/></feComponentTransfer></filter>
  <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.08"/></linearGradient>
  <linearGradient id="shadeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.12"/><stop offset="0.25" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></radialGradient>`;

function field(product, w, h, ppc, seed) {
  const rand = seededRandom(`${product.handle}:${seed}:${w}x${h}`);
  const painter = PAINTERS[product.pattern] ?? PAINTERS.square;
  let out = painter(product, w, h, ppc, rand);
  if (["Gloss", "Polished"].includes(product.finish)) {
    out += `<rect width="${w}" height="${h}" fill="url(#gloss)"/>`;
  }
  return out;
}

function svgDoc(w, h, body, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label.replace(/[<>&"]/g, "")}"><defs>${SHARED_DEFS}</defs>${body}</svg>`;
}

function swatchScale(product, zoom = 1) {
  const max = Math.max(...parseSize(product.size));
  return Math.min(12, Math.max(2.5, 600 / (max * 3.5))) * zoom;
}

// ---------- Room furniture, drawn around (0, 0) = centre of the floor line. ----------

const BRASS = "#c4a265";

const FURNITURE = {
  bathroom: () => `
    <ellipse cx="0" cy="40" rx="270" ry="18" fill="#000" opacity="0.16"/>
    <path d="M -250 -150 Q -250 32 -140 32 L 140 32 Q 250 32 250 -150 Z" fill="#fbfaf7" stroke="#d9d5cd" stroke-width="2"/>
    <rect x="-264" y="-168" width="528" height="24" rx="12" fill="#ffffff" stroke="#d9d5cd" stroke-width="2"/>
    <circle cx="-180" cy="36" r="10" fill="${BRASS}"/><circle cx="180" cy="36" r="10" fill="${BRASS}"/>
    <rect x="214" y="-300" width="10" height="135" fill="${BRASS}"/>
    <path d="M 219 -300 q -50 0 -50 34" stroke="${BRASS}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <rect x="-375" y="-80" width="70" height="80" rx="6" fill="#d8c8ae"/>
    <ellipse cx="-358" cy="-130" rx="22" ry="55" fill="#4f7a55" transform="rotate(-18 -358 -130)"/>
    <ellipse cx="-322" cy="-140" rx="20" ry="62" fill="#5f8d62" transform="rotate(16 -322 -140)"/>
    <rect x="-180" y="-430" width="150" height="200" rx="75" fill="#e6ecee" stroke="${BRASS}" stroke-width="6"/>`,
  kitchen: () => `
    <rect x="-400" y="-250" width="640" height="24" fill="#b48a5c"/>
    <rect x="-392" y="-226" width="624" height="226" fill="#e9e4da"/>
    <g fill="none" stroke="#cfc8bb" stroke-width="2">
      <rect x="-382" y="-216" width="146" height="206"/><rect x="-226" y="-216" width="146" height="206"/>
      <rect x="-70" y="-216" width="146" height="206"/><rect x="86" y="-216" width="136" height="206"/>
    </g>
    <g fill="${BRASS}"><rect x="-250" y="-130" width="5" height="40"/><rect x="-216" y="-130" width="5" height="40"/><rect x="62" y="-130" width="5" height="40"/><rect x="96" y="-130" width="5" height="40"/></g>
    <ellipse cx="-280" cy="-262" rx="48" ry="14" fill="#f6f2ea" stroke="#d9d3c6"/>
    <rect x="120" y="-330" width="34" height="80" rx="14" fill="#7e9a86"/>
    <rect x="-330" y="-470" width="260" height="12" fill="#b48a5c"/>
    <rect x="-310" y="-530" width="40" height="60" rx="6" fill="#efe8da"/><rect x="-255" y="-515" width="34" height="45" rx="6" fill="#cdbca2"/><rect x="-205" y="-540" width="30" height="70" rx="6" fill="#ffffff"/>
    <line x1="40" y1="-900" x2="40" y2="-500" stroke="#333" stroke-width="2"/>
    <path d="M 0 -500 L 80 -500 L 60 -470 L 20 -470 Z" fill="#2f2f2f"/>
    <g stroke="#6e5a44" stroke-width="7" stroke-linecap="round"><line x1="300" y1="-180" x2="280" y2="0"/><line x1="350" y1="-180" x2="370" y2="0"/></g>
    <ellipse cx="325" cy="-182" rx="48" ry="12" fill="#8a6c4f"/>`,
  hallway: () => `
    <rect x="150" y="-440" width="210" height="440" fill="#2f4146"/>
    <g fill="none" stroke="#3f5459" stroke-width="6"><rect x="175" y="-410" width="160" height="170"/><rect x="175" y="-210" width="160" height="180"/></g>
    <circle cx="180" cy="-220" r="8" fill="${BRASS}"/>
    <rect x="-340" y="-200" width="320" height="14" fill="#8a6440"/>
    <g stroke="#8a6440" stroke-width="8"><line x1="-325" y1="-186" x2="-325" y2="0"/><line x1="-35" y1="-186" x2="-35" y2="0"/></g>
    <circle cx="-180" cy="-350" r="72" fill="#dfe7ea" stroke="${BRASS}" stroke-width="7"/>
    <rect x="-150" y="-260" width="26" height="60" rx="10" fill="#c66f4a"/>
    <rect x="-410" y="-90" width="60" height="90" rx="6" fill="#d8c8ae"/>
    <ellipse cx="-380" cy="-150" rx="40" ry="70" fill="#4f7a55"/>`,
  living: () => `
    <ellipse cx="-40" cy="20" rx="320" ry="14" fill="#000" opacity="0.15"/>
    <rect x="-320" y="-270" width="560" height="140" rx="34" fill="#8c9a8f"/>
    <rect x="-330" y="-160" width="580" height="120" rx="26" fill="#7e8d82"/>
    <rect x="-360" y="-210" width="70" height="170" rx="30" fill="#76857a"/><rect x="210" y="-210" width="70" height="170" rx="30" fill="#76857a"/>
    <rect x="-250" y="-200" width="110" height="70" rx="18" fill="#d8b98f"/>
    <g stroke="#4a3a2c" stroke-width="8"><line x1="-300" y1="-40" x2="-305" y2="10"/><line x1="230" y1="-40" x2="235" y2="10"/></g>
    <line x1="340" y1="-420" x2="340" y2="0" stroke="#2c2c2c" stroke-width="5"/>
    <path d="M 300 -470 L 380 -470 L 400 -410 L 280 -410 Z" fill="#efe6d4"/>
    <ellipse cx="340" cy="2" rx="40" ry="8" fill="#2c2c2c"/>`,
  outdoor: () => `
    <rect x="-420" y="-150" width="190" height="150" rx="8" fill="#9a8f80"/>
    <ellipse cx="-325" cy="-200" rx="110" ry="80" fill="#557a4d"/>
    <rect x="230" y="-120" width="150" height="120" rx="8" fill="#9a8f80"/>
    <ellipse cx="305" cy="-170" rx="85" ry="70" fill="#628a57"/>
    <ellipse cx="0" cy="-150" rx="80" ry="12" fill="#2f2f2f"/>
    <g stroke="#2f2f2f" stroke-width="6"><line x1="0" y1="-150" x2="0" y2="0"/><line x1="-40" y1="0" x2="40" y2="0"/></g>
    <g stroke="#2f2f2f" stroke-width="5" fill="none"><path d="M -150 0 L -140 -110 L -95 -110"/><path d="M -140 -60 L -90 -60 L -85 0"/><path d="M 150 0 L 140 -110 L 95 -110"/><path d="M 140 -60 L 90 -60 L 85 0"/></g>`,
};

const ROOM_FOR = { Bathroom: "bathroom", Kitchen: "kitchen", Hallway: "hallway", "Living Room": "living", Outdoor: "outdoor" };

export function roomScene(product, scene = ROOM_FOR[product.rooms[0]] ?? "living", W = 800, H = 800) {
  const floorY = Math.round(H * 0.7);
  const onWall = product.surfaces.includes("Wall");
  const ppc = 3;
  let body = "";

  if (scene === "outdoor") {
    body += `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd6e6"/><stop offset="1" stop-color="#eef3ef"/></linearGradient>`;
    body += `<rect width="${W}" height="${floorY}" fill="url(#sky)"/>`;
    body += `<rect y="${floorY - 140}" width="${W}" height="140" fill="#b9ad9b"/>`;
  } else if (onWall) {
    body += `<svg width="${W}" height="${floorY}">${field(product, W, floorY, ppc, "room-wall")}</svg>`;
  } else {
    body += `<rect width="${W}" height="${floorY}" fill="#ebe5da"/>`;
    body += `<rect y="${floorY - 26}" width="${W}" height="26" fill="#f7f4ee"/>`;
  }

  const floorH = H - floorY;
  if (onWall && scene !== "outdoor") {
    body += `<rect y="${floorY}" width="${W}" height="${floorH}" fill="#d6cfc3"/>`;
  } else {
    const planeH = Math.ceil(floorH / 0.45);
    body += `<g transform="translate(0 ${floorY}) scale(1 0.45)"><svg width="${W}" height="${planeH}">${field(product, W, planeH, ppc * 1.4, "room-floor")}</svg></g>`;
  }
  body += `<rect y="${floorY}" width="${W}" height="${floorH}" fill="url(#shadeTop)"/>`;
  // On wide (hero) images keep the furniture right of centre so text on the left stays readable.
  const centreX = W > H * 1.5 ? W * 0.68 : W / 2;
  body += `<g transform="translate(${centreX} ${floorY})">${FURNITURE[scene]()}</g>`;
  body += `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`;
  return svgDoc(W, H, body, `${product.name} in a ${scene} setting`);
}

function sampleBoard(product) {
  const W = 800;
  const board = 460;
  const x0 = (W - board) / 2;
  const ppc = swatchScale(product, 0.8);
  let body = `<rect width="${W}" height="${W}" fill="#efebe4"/>`;
  body += `<rect x="${x0 + 14}" y="${x0 + 22}" width="${board}" height="${board}" rx="6" fill="#000" opacity="0.18" filter="url(#soft)"/>`;
  body += `<svg x="${x0}" y="${x0}" width="${board}" height="${board}">${field(product, board, board, ppc, "board")}</svg>`;
  body += `<rect x="${x0}" y="${x0}" width="${board}" height="${board}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="2"/>`;
  body += `<rect x="${x0}" y="${x0 + board + 30}" width="220" height="44" rx="4" fill="#ffffff"/>`;
  body += `<text x="${x0 + 16}" y="${x0 + board + 58}" font-family="Georgia, serif" font-size="18" fill="#333">${product.series} · ${product.size}</text>`;
  return svgDoc(W, W, body, `${product.name} sample board`);
}

export function productImage(product, view) {
  switch (view) {
    case "swatch":
      return svgDoc(600, 600, field(product, 600, 600, swatchScale(product), "swatch"), `${product.name} tiles`);
    case "closeup":
      return svgDoc(800, 800, field(product, 800, 800, swatchScale(product, 2.2), "closeup"), `${product.name} close up`);
    case "room":
      return roomScene(product);
    case "board":
      return sampleBoard(product);
    default:
      return null;
  }
}

export const PRODUCT_VIEWS = ["room", "swatch", "closeup", "board"];
