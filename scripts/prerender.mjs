// Postbuild step (runs automatically after `npm run build` via the "postbuild"
// script - see package.json) that snapshots the public marketing routes into
// static HTML so crawlers, link-unfurlers (WhatsApp, etc.), and first paint
// don't depend on client-side JS running first. The rest of the app stays a
// pure SPA - this only touches the routes listed below.
//
// How it works: serve the just-built dist/ locally (mirroring Netlify's
// static-file-then-SPA-fallback behaviour), open each route in a real headless
// Chromium (via Puppeteer) so client-only browser APIs behave normally, wait
// for React to mount and react-helmet-async to set the per-page <title>/meta,
// then save the fully-rendered DOM back into dist/<route>/index.html.
//
// Fails the whole build (non-zero exit) on any snapshot error, deliberately -
// shipping a stale/broken prerendered page is worse than failing the deploy.

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const PORT = 4174;

// Keep in sync with sitemap.xml / robots.txt - these are the only routes this
// script touches. Add a new route here (and to the sitemap) when a new public
// marketing page should be prerendered too.
const ROUTES = ['/', '/compare-plans', '/how-to', '/features', '/salah', '/jummah-guide'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// react-helmet-async marks every tag it manages with data-rh="true" but never
// removes the *static* title/meta/canonical tags already baked into
// dist/index.html by the other page - it only knows about tags it inserted
// itself, so both end up in the DOM after mount. Non-prerendered routes still
// need those static tags as their only fallback, so we can't remove them from
// index.html; instead we strip just the stale duplicates out of each
// snapshot's saved HTML, keeping only the data-rh="true" (Helmet-managed) copy.
const DEDUPE_PATTERNS = [
  /name="description"/,
  /property="og:title"/,
  /property="og:description"/,
  /property="og:url"/,
  /name="twitter:title"/,
  /name="twitter:description"/,
  /rel="canonical"/,
];

function stripStaleStaticHeadTags(html) {
  return html.replace(/<(meta|link)\b[^>]*>/g, (tag) => {
    if (tag.includes('data-rh="true"')) return tag;
    return DEDUPE_PATTERNS.some((re) => re.test(tag)) ? '' : tag;
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        let filePath = path.join(DIST_DIR, urlPath);
        let stat = await fsp.stat(filePath).catch(() => null);

        if (stat?.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
          stat = await fsp.stat(filePath).catch(() => null);
        }
        if (!stat) {
          // SPA fallback, mirrors netlify.toml's "/* -> /index.html" redirect.
          filePath = path.join(DIST_DIR, 'index.html');
          stat = await fsp.stat(filePath).catch(() => null);
        }
        if (!stat) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });
    server.listen(PORT, () => resolve(server));
    server.on('error', reject);
  });
}

function outputPathFor(route) {
  if (route === '/') return path.join(DIST_DIR, 'index.html');
  const clean = route.replace(/^\/+|\/+$/g, '');
  return path.join(DIST_DIR, clean, 'index.html');
}

async function snapshotRoute(browser, route) {
  const context = await browser.createBrowserContext(); // fresh, cookie-free per route
  try {
    const page = await context.newPage();
    const url = `http://localhost:${PORT}${route}`;
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    if (!response || !response.ok()) {
      throw new Error(`unexpected response status ${response?.status()}`);
    }

    // Helmet updates <head> synchronously during React's commit phase; give
    // it two animation frames to be safe before reading the DOM back out.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    );

    const title = await page.title();
    if (!title || !title.trim()) {
      throw new Error('page rendered with an empty <title> - Helmet likely did not mount');
    }

    const rawHtml = await page.content();
    const html = `<!doctype html>\n${stripStaleStaticHeadTags(rawHtml)}`;

    const outPath = outputPathFor(route);
    await fsp.mkdir(path.dirname(outPath), { recursive: true });
    await fsp.writeFile(outPath, html, 'utf8');

    console.log(`[prerender] ${route} -> ${path.relative(DIST_DIR, outPath)} ("${title}")`);
  } finally {
    await context.close();
  }
}

async function main() {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('[prerender] dist/index.html not found - run `vite build` before this script.');
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const failures = [];
  try {
    for (const route of ROUTES) {
      try {
        await snapshotRoute(browser, route);
      } catch (err) {
        failures.push(route);
        console.error(`[prerender] FAILED ${route}:`, err.message || err);
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length > 0) {
    console.error(
      `[prerender] ${failures.length}/${ROUTES.length} route(s) failed - failing the build ` +
        `rather than shipping a stale or broken snapshot: ${failures.join(', ')}`
    );
    process.exit(1);
  }

  console.log(`[prerender] done - ${ROUTES.length} route(s) snapshotted.`);
}

main().catch((err) => {
  console.error('[prerender] fatal error:', err);
  process.exit(1);
});
