// Motion audit (Phase 17, section 2): a video and screenshots of every page at 390 and 1440 px in both themes, scrolling
// the whole page, then hovering every interactive element (1440 only: a phone has no hover) and recording what changes.
// node scripts/motion/audit.mjs [--dir=dist] [--only=home,about]   -> reports/motion/audit/ (videos, screenshots, audit.json)
// Run against a production build. Changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, THEMES, serve, launch, routes, arg } from '../lib.mjs';

const dir = arg('dir', 'dist'), only = arg('only', '') ? String(arg('only')).split(',') : null;
const out = path.join(ROOT, 'reports/motion/audit'); fs.mkdirSync(out, { recursive: true });
const PORT = 4440, O = `http://127.0.0.1:${PORT}`, server = await serve(dir, PORT), browser = await launch();
const pages = [...routes(dir), { name: '404', path: '/404' }].filter(r => r.name !== 'states' && (!only || only.includes(r.name)));
const PROPS = ['transform', 'opacity', 'boxShadow', 'backgroundColor', 'backgroundImage', 'color', 'filter', 'textDecorationLine', 'borderColor', 'outlineStyle'];
const result = { build: dir, pages: {} };

for (const route of pages) for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of THEMES) {
  const key = `${route.name}-${w}-${theme}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'no-preference', hasTouch: w < 600, recordVideo: { dir: out, size: { width: w, height: h } } });
  await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort());
  const p = await ctx.newPage(); const t0 = Date.now();
  await p.goto(`${O}${route.path}?theme=${theme}`, { waitUntil: 'load' });
  // what moves while the page loads: sample running animations and elements in transition for the first second
  const load = await p.evaluate(async () => { const seen = new Set(); const end = performance.now() + 1000; while (performance.now() < end) { for (const a of document.getAnimations()) { const e = a.effect?.target; seen.add(`${a.constructor.name}: ${a.animationName || a.transitionProperty || '?'} on ${e ? e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') : '?'}`); } await new Promise(r => setTimeout(r, 50)); } return [...seen]; });
  await p.screenshot({ path: path.join(out, `${key}-top.png`) });
  // scroll the whole page, sampling running animations as sections enter
  const scroll = await p.evaluate(async () => { const seen = new Set(); const hidden = new Set(); const step = Math.round(innerHeight * 0.6); for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 140)); for (const a of document.getAnimations()) seen.add(a.animationName || a.transitionProperty || '?'); for (const e of document.querySelectorAll('main *')) { const r = e.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && r.width > 0 && getComputedStyle(e).opacity === '0' && e.textContent.trim() && !e.closest('[hidden], [aria-hidden="true"], .cory-visually-hidden')) hidden.add(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')); } } return { animationsWhileScrolling: [...seen], invisibleTextInView: [...hidden].slice(0, 8), height: document.documentElement.scrollHeight, smooth: getComputedStyle(document.documentElement).scrollBehavior }; });
  await p.screenshot({ path: path.join(out, `${key}-full.png`), fullPage: true });
  await p.evaluate(() => scrollTo(0, 0));
  let hover = null;
  if (w >= 1024) { // hover every interactive element, and record what changed
    const count = await p.evaluate(() => [...document.querySelectorAll('a[href], button, summary, input, textarea, [role="button"], .project-card')].filter(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !e.closest('[hidden], [inert], [aria-hidden="true"]') && !e.disabled; }).map((e, i) => { e.dataset.ma = String(i); return 1; }).length);
    const kinds = {}; let none = [];
    for (let i = 0; i < count; i++) { const loc = p.locator(`[data-ma="${i}"]`); try { await loc.scrollIntoViewIfNeeded({ timeout: 800 });
        const read = () => loc.evaluate((e, PROPS) => { const s = getComputedStyle(e); const inner = e.querySelector('svg, img, .project-card-cta svg'); const o = Object.fromEntries(PROPS.map(k => [k, s[k]])); if (inner) o.innerTransform = getComputedStyle(inner).transform; const card = e.closest('.project-card'); if (card && card !== e) { o.cardTransform = getComputedStyle(card).transform; o.cardShadow = getComputedStyle(card).boxShadow; } return { o, transition: s.transitionProperty + ' ' + s.transitionDuration + ' ' + s.transitionTimingFunction, label: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 32), kind: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').slice(0, 2).join('.') : '') + (e.hasAttribute('data-link') ? '[data-link]' : '') + (e.hasAttribute('data-ds-button') ? `[data-ds-button=${e.getAttribute('data-ds-button')}]` : '') + (e.hasAttribute('data-nav-link') ? '[data-nav-link]' : '') }; }, PROPS);
        const a = await read(); await loc.hover({ timeout: 800, force: true }); await p.waitForTimeout(280); const b = await read();
        const changed = Object.keys(b.o).filter(k => a.o[k] !== b.o[k]);
        const k = (kinds[a.kind] ||= { count: 0, changes: {}, transition: a.transition, example: a.label }); k.count++; for (const c of changed) k.changes[c] = (k.changes[c] || 0) + 1; if (!changed.length) none.push(a.label);
      } catch {} }
    await p.mouse.move(2, 2);
    hover = { interactive: count, kinds, noHoverResponse: [...new Set(none)].slice(0, 30), noHoverCount: none.length };
  }
  await p.waitForTimeout(200); const video = p.video(); await ctx.close();
  if (video) { const src = await video.path(); const dest = path.join(out, `${key}.webm`); try { fs.renameSync(src, dest); } catch {} }
  result.pages[key] = { route: route.path, viewport: `${w}x${h}`, theme, seconds: +((Date.now() - t0) / 1000).toFixed(1), onLoad: load, ...scroll, hover };
  console.log(`${key.padEnd(52)} load: ${load.length} moving, scroll: ${scroll.animationsWhileScrolling.length} moving, invisible text in view: ${scroll.invisibleTextInView.length}${hover ? `, hovered ${hover.interactive}, ${hover.noHoverCount} with no visible response` : ''}`);
}
await browser.close(); server.close();
fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify(result, null, 1));
console.log(`\n${Object.keys(result.pages).length} recordings in ${path.relative(ROOT, out)}`);
