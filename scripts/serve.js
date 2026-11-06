// Local preview of dist/ that behaves like a static host with clean URLs:
// /products/x -> products/x.html, / -> index.html, unknown paths -> 404.html.
// Only for previewing; production hosting is any static host.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const HEADERS = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

async function isFile(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

function inside(path) {
  return path.startsWith(DIST.endsWith(sep) ? DIST : DIST + sep);
}

async function resolve(urlPath) {
  let clean;
  try { clean = decodeURIComponent(urlPath); } catch { return null; }
  clean = clean.replace(/\/+$/, "") || "/";
  const candidates = clean === "/" ? ["index.html"] : [clean, `${clean}.html`, `${clean}/index.html`];
  for (const c of candidates) {
    const full = normalize(join(DIST, c));
    if (inside(full) && extname(full) && (await isFile(full))) return full;
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const file = await resolve(pathname);
  const target = file ?? join(DIST, "404.html");
  try {
    const body = await readFile(target);
    res.writeHead(file ? 200 : 404, { "Content-Type": MIME[extname(target)] ?? "application/octet-stream", ...HEADERS });
    res.end(body);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Run `npm run build` first.");
  }
}).listen(PORT, HOST, () => console.log(`Previewing dist/ at http://${HOST}:${PORT}`));
