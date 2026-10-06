// What each page of the built site downloads, measured in a real browser: JavaScript, CSS, fonts and images
// (transfer size as served with gzip), which hosts are contacted, and how each image is loaded.
// node scripts/perf/weights.mjs --label=before [--dir=dist]   -> reports/perf/weights-<label>.json
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT, serve, launch, arg } from '../lib.mjs';
import { TEMPLATES } from './templates.mjs';

const label = arg('label', 'run'), dir = arg('dir', 'dist'), PORT = 4411, O = `http://127.0.0.1:${PORT}`;
const server = await serve(dir, PORT), browser = await launch(), rows = [];
const kb = n => +(n / 1024).toFixed(1);
for (const [name, route] of TEMPLATES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const res = [];
  page.on('response', async r => { try { const body = await r.body(); const enc = r.headers()['content-encoding']; res.push({ url: r.url(), type: r.request().resourceType(), bytes: enc === 'gzip' ? zlib.gzipSync(body).length : body.length }); } catch {} });
  await page.goto(O + route, { waitUntil: 'networkidle' });
  const sum = t => res.filter(r => r.type === t).reduce((n, r) => n + r.bytes, 0);
  const html = await page.content();
  const inlineJs = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].reduce((n, m) => n + zlib.gzipSync(m[1]).length, 0);
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((n, m) => n + zlib.gzipSync(m[1]).length, 0);
  const images = await page.evaluate(() => [...document.images].map(i => { const r = i.getBoundingClientRect(); return { src: (i.currentSrc || i.src).replace(location.origin, '').slice(0, 90), loading: i.loading, fetchpriority: i.getAttribute('fetchpriority'), hasSize: i.hasAttribute('width') && i.hasAttribute('height'), srcset: i.hasAttribute('srcset'), aboveFold: r.top < innerHeight && r.bottom > 0 && r.width > 0, natural: `${i.naturalWidth}x${i.naturalHeight}`, shown: `${Math.round(r.width)}x${Math.round(r.height)}` }; }));
  rows.push({ name, route, jsKB: kb(sum('script') + inlineJs), cssKB: kb(sum('stylesheet') + inlineCss), fontKB: kb(sum('font')), fontFiles: res.filter(r => r.type === 'font').map(r => `${path.basename(new URL(r.url).pathname).slice(0, 50)} ${kb(r.bytes)} KB`), imageKB: kb(sum('image')), imagesLoaded: res.filter(r => r.type === 'image').length, htmlKB: kb(sum('document')),
    hosts: [...new Set(res.map(r => new URL(r.url).host).filter(h => !h.startsWith('127.0.0.1')))], images,
    lazyAboveFold: images.filter(i => i.aboveFold && i.loading === 'lazy').map(i => i.src), eagerBelowFold: images.filter(i => !i.aboveFold && i.loading !== 'lazy').map(i => i.src), noSize: images.filter(i => !i.hasSize).map(i => i.src) });
  const r = rows.at(-1); console.log(`${name.padEnd(13)} JS ${r.jsKB} KB, CSS ${r.cssKB} KB, fonts ${r.fontKB} KB (${r.fontFiles.length} files), images ${r.imageKB} KB (${r.imagesLoaded}), hosts: ${r.hosts.join(', ') || 'none'}`);
  await ctx.close();
}
await browser.close(); server.close();
// Files on disk: largest images and fonts in the build
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const all = walk(path.join(ROOT, dir)).map(f => ({ file: path.relative(path.join(ROOT, dir), f).replace(/\\/g, '/'), kb: kb(fs.statSync(f).size) }));
const by = re => all.filter(f => re.test(f.file)).sort((a, b) => b.kb - a.kb);
const disk = { images: by(/\.(png|jpe?g|webp|avif|gif|svg)$/i).filter(f => !f.file.startsWith('og/')), fonts: by(/\.(woff2?|ttf|otf)$/i), totalKB: kb(all.reduce((n, f) => n + f.kb * 1024, 0)) };
fs.mkdirSync(path.join(ROOT, 'reports/perf'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports/perf', `weights-${label}.json`), JSON.stringify({ pages: rows, disk }, null, 1));
console.log(`\nbuild: ${disk.totalKB} KB in ${all.length} files; ${disk.images.length} images (largest: ${disk.images.slice(0, 5).map(f => `${f.file} ${f.kb} KB`).join('; ')}); ${disk.fonts.length} font files`);
