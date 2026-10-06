// Images in the first view of each template, at phone and desktop sizes, and how each one is loaded.
// CLAUDE.md 2.9: nothing in the first view is lazy; the LCP image is eager with fetchpriority="high"; everything below is lazy.
// The rules are enforced at the phone size, where the budgets are measured. At desktop size the same findings are
// listed as notes: a card that is in the first view on a wide screen is below it on a phone, and loading= is one value.
// node scripts/perf/first-view.mjs [--dir=dist]   -> reports/perf/first-view.json. Exit code 1 when a rule is broken.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, arg } from '../lib.mjs';
import { TEMPLATES } from './templates.mjs';

const PORT = 4412, O = `http://127.0.0.1:${PORT}`, server = await serve(arg('dir', 'dist'), PORT), browser = await launch();
const rows = [], problems = [], notes = [];
for (const [name, route] of TEMPLATES) for (const [w, h] of [[390, 844], [1280, 720]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
  await page.addInitScript(() => { window.__lcp = null; new PerformanceObserver(l => { const e = l.getEntries().at(-1); window.__lcp = { tag: e.element?.tagName, src: e.url || '', id: e.element?.id || '', text: (e.element?.textContent || '').trim().slice(0, 50), ms: Math.round(e.startTime) }; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
  await page.goto(O + route, { waitUntil: 'load' }); await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({ lcp: window.__lcp, images: [...document.images].map(i => { const b = i.getBoundingClientRect(); const s = getComputedStyle(i); return { src: (i.getAttribute('src') || '').slice(0, 80), current: i.currentSrc, loading: i.getAttribute('loading') || 'eager', priority: i.getAttribute('fetchpriority') || '', firstView: b.width > 0 && b.height > 0 && b.top < innerHeight && b.bottom > 0 && b.left < innerWidth && b.right > 0 && s.visibility !== 'hidden' && s.display !== 'none' }; }) }));
  const first = r.images.filter(i => i.firstView), below = r.images.filter(i => !i.firstView);
  const lcpImg = r.lcp?.tag === 'IMG' ? r.images.find(i => i.current === r.lcp.src) : null;
  const row = { name, viewport: `${w}x${h}`, lcp: r.lcp ? `${r.lcp.tag.toLowerCase()}${r.lcp.id ? '#' + r.lcp.id : ''} ${r.lcp.tag === 'IMG' ? path.basename(r.lcp.src).slice(0, 40) : JSON.stringify(r.lcp.text)}` : 'none', lcpImage: lcpImg ? `${lcpImg.loading}${lcpImg.priority ? ', fetchpriority ' + lcpImg.priority : ''}` : '-', firstView: first.length, lazyInFirstView: first.filter(i => i.loading === 'lazy').map(i => i.src), eagerBelow: below.filter(i => i.loading !== 'lazy').map(i => i.src) };
  rows.push(row);
  for (const s of row.lazyInFirstView) (w < 600 ? problems : notes).push(`${name} ${row.viewport}: lazy image in the first view: ${s}`);
  for (const s of row.eagerBelow) (w < 600 ? problems : notes).push(`${name} ${row.viewport}: image below the first view is not lazy: ${s}`);
  if (lcpImg && (lcpImg.loading === 'lazy' || lcpImg.priority !== 'high')) problems.push(`${name} ${row.viewport}: the LCP image is ${lcpImg.loading}${lcpImg.priority ? '' : ' without fetchpriority="high"'}: ${lcpImg.src}`);
  console.log(`${name.padEnd(13)} ${row.viewport.padEnd(9)} LCP ${row.lcp.padEnd(60).slice(0, 60)} ${row.lcpImage.padEnd(26)} first view ${row.firstView}, lazy there ${row.lazyInFirstView.length}, eager below ${row.eagerBelow.length}`);
  await ctx.close();
}
await browser.close(); server.close();
fs.mkdirSync(path.join(ROOT, 'reports/perf'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports/perf/first-view.json'), JSON.stringify({ rows, problems, notes }, null, 1));
if (notes.length) { console.log('\nNotes (desktop; one loading attribute cannot be right for both screen sizes, the phone decides):'); for (const n of notes) console.log('  - ' + n); }
if (problems.length) { console.log('\nProblems:'); for (const p of problems) console.log('  - ' + p); process.exit(1); }
console.log('\nPASSED: no lazy image in a first view, no eager image below one, every LCP image is eager with fetchpriority="high".');
