// Checks a build that has had a folder applied (apply-base.mjs): serves it under that folder the way GitHub Pages does,
// opens every page, follows every internal link, and fails if anything is requested outside the folder or does not load.
// node scripts/pages/check-base.mjs --base=/portfolio [--dir=dist] [--live=https://aiuxaleem.github.io]
// With --live it checks the published site instead of the local build.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, launch, arg } from '../lib.mjs';

const base = '/' + String(arg('base', '')).replace(/^\/+|\/+$/g, ''), dir = path.resolve(ROOT, String(arg('dir', 'dist'))), live = arg('live', '') ? String(arg('live')).replace(/\/$/, '') : '';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.txt': 'text/plain', '.pdf': 'application/pdf', '.md': 'text/markdown', '.ico': 'image/x-icon' };
let server, origin = live;
if (!live) {
  // GitHub Pages behaviour: a folder address without a trailing slash redirects to the one with it; a folder serves its
  // index.html; an extensionless address serves the .html file of that name; anything else is the 404 page.
  server = http.createServer((req, res) => { const url = decodeURIComponent(req.url.split('?')[0]);
    if (url !== base && !url.startsWith(base + '/')) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('outside the folder'); }
    const rel = url.slice(base.length) || '/'; let file = path.join(dir, rel);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) { if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); } file = path.join(file, 'index.html'); }
    else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(dir, '404.html'))); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' }); res.end(fs.readFileSync(file)); });
  await new Promise(r => server.listen(4460, '127.0.0.1', r)); origin = 'http://127.0.0.1:4460';
}
const host = new URL(origin).host, start = origin + base + '/';
const browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
await ctx.route(u => u.host !== host, r => r.abort()); // other sites are not this check's business
const queue = [start], seen = new Set(queue), problems = []; let pages = 0, requests = 0;
while (queue.length) { const url = queue.shift(); const p = await ctx.newPage(); const bad = [];
  p.on('response', r => { const u = new URL(r.url()); if (u.host !== host) return; requests++; if (!u.pathname.startsWith(base + '/') && u.pathname !== base) bad.push(`outside the folder: ${u.pathname}`); else if (r.status() >= 400) bad.push(`${r.status()} ${u.pathname}`); });
  p.on('pageerror', e => bad.push('script error: ' + String(e).slice(0, 80)));
  try { await p.goto(url, { waitUntil: 'load', timeout: 45000 }); await p.evaluate(async () => { for (const i of document.images) i.loading = 'eager'; await new Promise(r => setTimeout(r, 400)); });
    const found = await p.evaluate(() => ({ links: [...document.querySelectorAll('a[href]')].map(a => a.href), broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.currentSrc || i.src), assets: [...document.querySelectorAll('link[href], [srcset], [imagesrcset]')].flatMap(e => e.href ? [e.href] : []) }));
    for (const b of found.broken) bad.push('broken image: ' + b);
    for (const href of found.links) { let u; try { u = new URL(href); } catch { continue; } if (u.host !== host) continue; u.hash = '';
      if (!u.pathname.startsWith(base + '/') && u.pathname !== base) { bad.push(`link leaves the folder: ${u.pathname}`); continue; }
      if (/\.(pdf|png|jpe?g|webp|svg|xml|md|zip)$/i.test(u.pathname)) { if (!seen.has(u.href)) { seen.add(u.href); const r = await ctx.request.get(u.href); requests++; if (r.status() >= 400) bad.push(`${r.status()} ${u.pathname}`); } continue; }
      if (!seen.has(u.href)) { seen.add(u.href); queue.push(u.href); } }
  } catch (e) { bad.push('did not load: ' + String(e).slice(0, 80)); }
  pages++; if (bad.length) problems.push(`${url.replace(origin, '')}\n    ` + [...new Set(bad)].slice(0, 8).join('\n    ')); await p.close(); }
// The files a visitor never clicks to but browsers and search engines ask for.
for (const f of ['/sitemap-index.xml', '/sitemap-0.xml', '/robots.txt', '/rss.xml', '/og/home.png', '/assets/favicon.svg']) { const r = await ctx.request.get(origin + base + f); requests++; if (r.status() >= 400) problems.push(`${r.status()} ${base + f}`); else if (/\.(xml|txt)$/.test(f)) { const t = await r.text(); const wrong = [...t.matchAll(new RegExp(`https?://${host.replace(/\./g, '\\.')}(/[^<\\s"]*)?`, 'g'))].map(m => m[1] || '/').filter(pth => !pth.startsWith(base + '/') && pth !== base); if (wrong.length) problems.push(`${f} lists addresses outside the folder: ${[...new Set(wrong)].slice(0, 3).join(', ')}`); } }
{ const r = await ctx.request.get(origin + base + '/no-such-page-xyz'); if (r.status() !== 404) problems.push(`an unknown address returned ${r.status()}, expected the 404 page`); }
await browser.close(); server?.close();
console.log(`${pages} pages opened, ${requests} requests on ${origin}${base}/`);
if (problems.length) { console.log(`FAILED: ${problems.length} problem(s)\n  ` + problems.join('\n  ')); process.exit(1); }
console.log('PASSED: every page, link, image and file stays inside the folder and loads.');
