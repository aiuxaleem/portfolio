// Shared helpers for the quality and visual scripts.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Test viewports from CLAUDE.md 2.4. */
export const VIEWPORTS = [[320, 568], [360, 740], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080], [844, 390]];
export const QUICK_VIEWPORTS = [[390, 844], [1280, 720]];
export const THEMES = ['light', 'dark'];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain', '.pdf': 'application/pdf' };

/** Static server with gzip. Extensionless paths resolve to <path>.html (Astro "file" format). */
export function serve(dir, port) {
  const base = path.resolve(ROOT, dir);
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(base, p);
    if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
    if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found'); }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const headers = { 'content-type': type, 'cache-control': 'no-cache' };
      if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) { headers['content-encoding'] = 'gzip'; buf = zlib.gzipSync(buf); }
      res.writeHead(200, headers); res.end(buf);
    });
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

/** Uses the installed Edge or Chrome. Set QUALITY_BROWSER_CHANNEL to override (msedge, chrome). */
export function launch() {
  return chromium.launch({ channel: process.env.QUALITY_BROWSER_CHANNEL || 'msedge', headless: true });
}

/** Routes to test: for the built site, every URL in the sitemap plus /_states; for legacy, the fixed list. */
export function routes(target) {
  if (target === 'legacy') return JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/routes.legacy.json'), 'utf8'));
  const dist = path.join(ROOT, 'dist');
  const xml = fs.readdirSync(dist).filter(f => /^sitemap-\d+\.xml$/.test(f)).map(f => fs.readFileSync(path.join(dist, f), 'utf8')).join('');
  const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  const list = found.map(p => ({ name: p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-'), path: p }));
  if (fs.existsSync(path.join(dist, '_states.html'))) list.push({ name: 'states', path: '/_states' });
  return list;
}

export function arg(name, fallback) {
  const hit = process.argv.find(a => a.startsWith('--' + name + '='));
  if (hit) return hit.split('=').slice(1).join('=');
  return process.argv.includes('--' + name) ? true : fallback;
}

/** Opens a route with the theme forced by query string and waits for it to settle. */
export async function open(browser, origin, route, { width, height, theme, reducedMotion = 'reduce' }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion });
  const page = await ctx.newPage();
  const url = origin + encodeURI(route.path) + (route.path.includes('?') ? '&' : '?') + 'theme=' + theme;
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForSelector('main h1', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(target_settle(route));
  return { ctx, page };
}
const target_settle = route => (route.path.includes('.dc.html') ? 1500 : 200);

/** Scrolls through the page so scroll-revealed content is present, then returns to the top. */
export async function revealAll(page, viewportHeight) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(viewportHeight * 0.8)) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(60); }
  // Lazy images must be loaded and decoded before any measurement or screenshot, or two runs differ.
  await page.evaluate(async () => {
    const all = [...document.querySelectorAll('img')];
    document.querySelectorAll('image-slot').forEach(s => s.shadowRoot && all.push(...s.shadowRoot.querySelectorAll('img')));
    await Promise.all(all.map(img => { img.loading = 'eager'; return img.complete && img.naturalWidth ? img.decode().catch(() => {}) : new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); setTimeout(r, 8000); }); }));
  });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
}
