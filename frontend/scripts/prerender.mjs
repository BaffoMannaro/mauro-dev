#!/usr/bin/env node
/**
 * Minimal prerender for Vite + React Router (SPA).
 *
 * What it does:
 * - Serves `dist/` on a local HTTP server (SPA fallback to dist/index.html)
 * - Uses Playwright (chromium) to render each route
 * - Writes the final HTML to `dist/<route>/index.html`
 *
 * Route discovery:
 * - If `public/sitemap.xml` exists, it extracts <loc> URLs and prerenders those paths.
 * - Otherwise it falls back to a small list of static routes.
 *
 * Canonical / og:url:
 * - If `PRERENDER_SITE_URL` is set (e.g. https://superotech.ai), canonical + og:url are rewritten to that base.
 */

import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, ".."); // frontend/
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");

function fileExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeRouteToFile(outputRoot, routePath) {
  const cleaned = routePath.split("?")[0].split("#")[0];
  if (cleaned === "/") return path.join(outputRoot, "index.html");
  const outDir = path.join(outputRoot, cleaned.replace(/^\//, ""));
  ensureDir(outDir);
  return path.join(outDir, "index.html");
}

function guessMimeType(p) {
  if (p.endsWith(".html")) return "text/html; charset=utf-8";
  if (p.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (p.endsWith(".css")) return "text/css; charset=utf-8";
  if (p.endsWith(".json")) return "application/json; charset=utf-8";
  if (p.endsWith(".svg")) return "image/svg+xml";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".ico")) return "image/x-icon";
  if (p.endsWith(".woff")) return "font/woff";
  if (p.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function createStaticServer() {
  if (!fileExists(distDir)) {
    throw new Error(`dist directory not found at ${distDir}. Run build first.`);
  }
  const indexHtmlPath = path.join(distDir, "index.html");
  if (!fileExists(indexHtmlPath)) {
    throw new Error(`dist/index.html not found at ${indexHtmlPath}. Run build first.`);
  }

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const requestPath = decodeURIComponent(url.pathname);

      // Block directory traversal.
      const normalized = path.posix.normalize(requestPath);
      if (normalized.includes("..")) {
        res.writeHead(400);
        res.end("Bad Request");
        return;
      }

      // Serve file if it exists, otherwise SPA fallback to index.html.
      const localPath = path.join(distDir, normalized);
      let filePath = localPath;
      if (fileExists(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      const serveIndex =
        !fileExists(filePath) ||
        (!path.extname(filePath) && filePath !== indexHtmlPath) ||
        fs.statSync(filePath).isDirectory();

      if (serveIndex) filePath = indexHtmlPath;

      const body = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": guessMimeType(filePath) });
      res.end(body);
    } catch (e) {
      res.writeHead(500);
      res.end(`Server error: ${e?.message ?? e}`);
    }
  });

  return server;
}

function extractRoutesFromSitemap(xml) {
  // Keep it dependency-free: extract <loc> and <xhtml:link hreflang=".."> href.
  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter(Boolean);
  const altMatches = [...xml.matchAll(/<xhtml:link\b[^>]*\bhreflang=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*\/?>/gi)]
    .map((m) => ({ lang: (m[1] || "").toLowerCase(), href: m[2] }))
    .filter((m) => m.href);

  const items = [];

  for (const loc of locMatches) {
    try {
      const u = new URL(loc);
      items.push({ path: u.pathname || "/", lang: "it" });
    } catch {
      // ignore
    }
  }

  for (const alt of altMatches) {
    if (alt.lang !== "en" && alt.lang !== "it") continue;
    try {
      const u = new URL(alt.href);
      items.push({ path: u.pathname || "/", lang: alt.lang });
    } catch {
      // ignore
    }
  }

  // Deduplicate by path+lang
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${it.lang}:${it.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }

  // If multiple languages point to the same URL path, we can only write one HTML file.
  // Prefer Italian as default for shared URLs to avoid last-write-wins overwriting.
  const byPath = new Map();
  for (const it of out) {
    const existing = byPath.get(it.path);
    if (!existing) {
      byPath.set(it.path, it);
      continue;
    }
    if (existing.lang !== "it" && it.lang === "it") {
      byPath.set(it.path, it);
    }
  }
  return [...byPath.values()];
}

function defaultRoutes() {
  return [
    { path: "/", lang: "it" },
    { path: "/articles/", lang: "it" },
    { path: "/supero-finish/", lang: "it" },
    { path: "/comunicato-stampa-rebranding/", lang: "it" },
    { path: "/thank-you-page/", lang: "it" },
  ];
}

function rewriteCanonicalAndOgUrl(html, siteUrl, routePath) {
  if (!siteUrl) return html;
  const base = siteUrl.replace(/\/+$/, "");
  const url = `${base}${routePath === "/" ? "" : routePath}`;

  // Prefer react-helmet-async tags (they carry data-rh="true") so we don't accidentally rewrite commented examples.
  const canonicalHelmetTag = /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bdata-rh=["']true["'])[^>]*>/i;
  const canonicalAnyTag = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  const ogUrlHelmetTag = /<meta\b(?=[^>]*\bproperty=["']og:url["'])(?=[^>]*\bdata-rh=["']true["'])[^>]*>/i;
  const ogUrlAnyTag = /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i;

  function replaceAttr(tag, attrName, attrValue) {
    const attrRe = new RegExp(`\\b${attrName}=["'][^"']*["']`, "i");
    if (attrRe.test(tag)) return tag.replace(attrRe, `${attrName}="${attrValue}"`);
    // insert before closing '>'
    return tag.replace(/>$/, ` ${attrName}="${attrValue}">`);
  }

  // canonical: <link rel="canonical" href="...">
  html = html.replace(canonicalHelmetTag, (tag) => replaceAttr(tag, "href", url));
  html = html.replace(canonicalAnyTag, (tag) => replaceAttr(tag, "href", url));

  // og:url: <meta property="og:url" content="...">
  html = html.replace(ogUrlHelmetTag, (tag) => replaceAttr(tag, "content", url));
  html = html.replace(ogUrlAnyTag, (tag) => replaceAttr(tag, "content", url));

  return html;
}

function rewriteJsonLdOrigin(html, siteUrl) {
  if (!siteUrl) return html;
  const base = siteUrl.replace(/\/+$/, "");
  return html.replace(
    /(<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (_m, open, body, close) => {
      const rewritten = body
        .replace(/http:\/\/127\.0\.0\.1:\d+/g, base)
        .replace(/http:\/\/localhost:\d+/g, base);
      return `${open}${rewritten}${close}`;
    }
  );
}

function promoteHelmetTitle(html) {
  // Some scrapers take the first <title> only. react-helmet-async usually marks its title with data-rh="true".
  const headStart = html.search(/<head\b[^>]*>/i);
  if (headStart === -1) return html;
  const headOpenEnd = html.indexOf(">", headStart);
  if (headOpenEnd === -1) return html;
  const headClose = html.search(/<\/head>/i);
  if (headClose === -1 || headClose <= headOpenEnd) return html;

  const headInnerStart = headOpenEnd + 1;
  const headInner = html.slice(headInnerStart, headClose);

  const helmetTitleRe = /<title\b(?=[^>]*\bdata-rh=["']true["'])[^>]*>[\s\S]*?<\/title>/i;
  const anyTitleRe = /<title\b[^>]*>[\s\S]*?<\/title>/gi;

  const helmetTitleMatch = headInner.match(helmetTitleRe);
  if (!helmetTitleMatch) return html;

  const helmetTitleTag = helmetTitleMatch[0];
  const headWithoutTitles = headInner.replace(anyTitleRe, "");

  // Insert after <meta charset="..."> if present, otherwise at start of <head>.
  const charsetMetaRe = /<meta\b(?=[^>]*\bcharset=)[^>]*>/i;
  const charsetMatch = headWithoutTitles.match(charsetMetaRe);

  let newHeadInner;
  if (charsetMatch) {
    const charsetTag = charsetMatch[0];
    const idx = headWithoutTitles.indexOf(charsetTag);
    const insertPos = idx + charsetTag.length;
    newHeadInner =
      headWithoutTitles.slice(0, insertPos) + helmetTitleTag + headWithoutTitles.slice(insertPos);
  } else {
    newHeadInner = helmetTitleTag + headWithoutTitles;
  }

  return html.slice(0, headInnerStart) + newHeadInner + html.slice(headClose);
}

function forceHtmlLang(html, lang) {
  const lng = String(lang || "").toLowerCase().startsWith("en") ? "en" : "it";
  const htmlTagRe = /<html\b[^>]*>/i;
  const m = html.match(htmlTagRe);
  if (!m) return html;
  const tag = m[0];
  const hasLang = /\blang=["'][^"']*["']/i.test(tag);
  let newTag;
  if (hasLang) {
    newTag = tag.replace(/\blang=["'][^"']*["']/i, `lang="${lng}"`);
  } else {
    newTag = tag.replace(/>$/, ` lang="${lng}">`);
  }
  return html.replace(htmlTagRe, newTag);
}

function localeForLang(lang) {
  const normalized = String(lang || "").toLowerCase();
  if (normalized.startsWith("en")) return "en-US";
  return "it-IT";
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (e) {
    console.error(
      "Playwright is not installed. Run `yarn add -D playwright` (or `npm i -D playwright`) and then `npx playwright install chromium`."
    );
    throw e;
  }

  const siteUrl = process.env.PRERENDER_SITE_URL || "";

  const overrideRoutes = (process.env.PRERENDER_ROUTES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let routes = overrideRoutes.length
    ? overrideRoutes.map((p) => ({ path: p, lang: "it" }))
    : fileExists(sitemapPath)
      ? extractRoutesFromSitemap(readText(sitemapPath))
      : defaultRoutes();

  const limit = Number.parseInt(process.env.PRERENDER_LIMIT || "0", 10);
  if (Number.isFinite(limit) && limit > 0) routes = routes.slice(0, limit);
  if (routes.length === 0) {
    console.log("No routes found to prerender.");
    return;
  }

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const origin = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();

  try {
    for (const item of routes) {
      const locale = localeForLang(item.lang);
      console.log(`Prerendering ${item.path} [${item.lang}] ...`);

      const context = await browser.newContext({ locale });
      await context.addInitScript((lng) => {
        try {
          // Mark this run as prerender so index.html can skip GTM/analytics.
          window.__PRERENDER__ = true;
        } catch {
          // ignore
        }
        try {
          localStorage.setItem("i18nextLng", lng);
        } catch {
          // ignore
        }
        try {
          document.documentElement.lang = lng;
        } catch {
          // ignore
        }
      }, item.lang);

      // Extra safety: block third-party scripts during prerender (avoids polluting the HTML snapshot).
      await context.route("**/*", async (route) => {
        const url = route.request().url();
        if (
          /googletagmanager\.com/i.test(url) ||
          /google-analytics\.com/i.test(url) ||
          /connect\.facebook\.net/i.test(url) ||
          /facebook\.com\/tr/i.test(url) ||
          /snap\.licdn\.com/i.test(url) ||
          /iubenda\.com/i.test(url)
        ) {
          await route.abort();
          return;
        }
        await route.continue();
      });

      const page = await context.newPage();
      try {
        const url = `${origin}${item.path}`;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(250);

        let html = await page.content();
        html = rewriteCanonicalAndOgUrl(html, siteUrl, item.path);
        html = rewriteJsonLdOrigin(html, siteUrl);
        html = promoteHelmetTitle(html);
        html = forceHtmlLang(html, item.lang);

        const outFile = safeRouteToFile(distDir, item.path);
        fs.writeFileSync(outFile, html, "utf8");
      } finally {
        await page.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`Done. Wrote prerendered HTML into ${distDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
