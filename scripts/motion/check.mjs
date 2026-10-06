// Motion behaviour check (Phase 17): scroll reveals, the hover states added in MO-D2, the Home deck swap, smooth scrolling
// and the reading progress bar.
// node scripts/motion/check.mjs [--dir=dist]   -> reports/motion/check.json, exit code 1 on any failure
// Run against a production build. Changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, routes, arg } from '../lib.mjs';

const dir = arg('dir', 'dist'), PORT = 4442, O = `http://127.0.0.1:${PORT}`, server = await serve(dir, PORT), browser = await launch();
const fails = [], out = {};
const fail = m => { fails.push(m); console.log('  FAIL ' + m); };
const open = async (route, { w = 1440, h = 900, motion = 'no-preference', js = true, touch = false } = {}) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: motion, javaScriptEnabled: js, hasTouch: touch, isMobile: touch }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort()); const p = await ctx.newPage(); await p.goto(O + route, { waitUntil: 'load' }); await p.waitForTimeout(250); return { ctx, p }; };
const pages = routes(dir).filter(r => r.name !== 'states').map(r => r.path);

// 1. Reveals: nothing in the first view is hidden, every pending block fades in when scrolled to, and no state is left behind.
let withReveals = 0;
for (const route of pages) for (const [w, h] of [[390, 844], [1440, 900]]) {
  const { ctx, p } = await open(route, { w, h });
  const start = await p.evaluate(() => { const pend = [...document.querySelectorAll('[data-reveal-state="pending"]')]; return { pending: pend.length, inFirstView: pend.filter(e => e.getBoundingClientRect().top < innerHeight).length }; });
  const seen = await p.evaluate(async () => { let animated = 0, hiddenInView = 0; for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.5)) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); animated += document.getAnimations().filter(a => a.transitionProperty === 'opacity' && a.effect?.target?.dataset.revealState === 'in').length ? 1 : 0; }
    await new Promise(r => setTimeout(r, 2300)); for (const e of document.querySelectorAll('main *, footer *')) if (getComputedStyle(e).opacity === '0' && e.textContent.trim() && !e.closest('[hidden], [aria-hidden="true"], .cory-visually-hidden')) hiddenInView++;
    return { animated, hiddenInView, left: document.querySelectorAll('[data-reveal-state]').length, leftVar: [...document.querySelectorAll('[style*="--i"]')].length }; });
  out[`reveal ${route} ${w}`] = { ...start, ...seen }; if (seen.animated) withReveals++;
  if (start.inFirstView) fail(`${route} ${w}: ${start.inFirstView} blocks hidden inside the first view`);
  if (start.pending && !seen.animated) fail(`${route} ${w}: ${start.pending} pending blocks but no fade was seen`);
  if (start.pending > 12) fail(`${route} ${w}: ${start.pending} blocks restyled at load (the reveal should mark only blocks about to scroll in)`);
  if (seen.left || seen.hiddenInView) fail(`${route} ${w}: ${seen.left} blocks still carry a reveal state, ${seen.hiddenInView} elements invisible after scrolling`);
  await ctx.close();
}
console.log(`reveals: ${pages.length} pages x 2 widths, ${withReveals} views have blocks that reveal`);
if (!withReveals) fail('no page has any revealing block');
for (const [label, o] of [['reduced motion', { motion: 'reduce' }], ['JavaScript off', { js: false }]]) for (const route of ['/', '/ar', '/services']) { const { ctx, p } = await open(route, o); const r = await p.evaluate(() => ({ state: document.querySelectorAll('[data-reveal-state]').length, smooth: getComputedStyle(document.documentElement).scrollBehavior })); out[`${label} ${route}`] = r; if (r.state) fail(`${route} with ${label}: ${r.state} blocks have a reveal state`); if (label === 'reduced motion' && r.smooth !== 'auto') fail(`${route}: smooth scrolling is on under reduced motion`); await ctx.close(); }

// 2. Hover states added in MO-D2 (and that they do not apply on a touch screen).
const HOVER = [['/', 'button[aria-label="Previous case study"]'], ['/', 'button[aria-label="Next case study"]'], ['/ar', 'div:has(+ [data-hero-stack]) button >> nth=0'], ['/ar', 'div:has(+ [data-hero-stack]) button >> nth=1'], ['/ar', '#guides [data-card-fill] > .sc-host-x > a'], ['/services', 'summary >> nth=0'], ['/services', 'summary >> nth=1'], ['/services', 'summary >> nth=2'], ['/resume', '.resume-contact a >> nth=0'], ['/resume', '.resume-contact a >> nth=1'], ['/resume', '.resume-contact a >> nth=2']];
const read = loc => loc.evaluate(e => { const s = getComputedStyle(e); return [s.transform, s.backgroundColor, s.color, s.boxShadow].join(' | '); });
for (const [route, sel] of HOVER) { const { ctx, p } = await open(route); const loc = p.locator(sel); await loc.scrollIntoViewIfNeeded(); await p.mouse.move(2, 2); await p.waitForTimeout(700); const a = await read(loc); await loc.hover(); await p.waitForTimeout(350); const b = await read(loc); out[`hover ${route} ${sel}`] = { before: a, after: b }; if (a === b) fail(`${route} ${sel}: no change on hover`); await ctx.close(); }
{ const { ctx, p } = await open('/services', { w: 390, h: 844, touch: true }); const loc = p.locator('summary >> nth=0'); await loc.scrollIntoViewIfNeeded(); const a = await read(loc); await loc.tap(); await p.waitForTimeout(350); const b = await read(loc); const hoverMedia = await p.evaluate(() => matchMedia('(hover: hover)').matches); out['touch /services summary'] = { hoverMedia, before: a, after: b }; if (hoverMedia) console.log('  note: this browser reports hover: hover in touch emulation; sticky-hover test skipped'); else if (a !== b) fail('/services: a tapped question keeps a hover style on a touch screen'); await ctx.close(); }
console.log(`hover: ${HOVER.length} elements`);

// 3. Home deck: a swap moves the cards (transform transitions run) and ends in the resting poses.
for (const route of ['/', '/ar']) { const { ctx, p } = await open(route); const next = p.locator('div:has(+ [data-hero-stack]) button >> nth=1'); if (!(await next.count())) { fail(`${route}: deck buttons not found`); await ctx.close(); continue; } await next.click(); await p.waitForTimeout(60);
  const mid = await p.evaluate(() => document.getAnimations().filter(a => a.transitionProperty === 'transform' && a.effect?.target?.hasAttribute('data-stack-card')).length); await p.waitForTimeout(500);
  const end = await p.evaluate(() => ({ running: document.getAnimations().filter(a => a.effect?.target?.hasAttribute?.('data-stack-card')).length, front: [...document.querySelectorAll('[data-stack-card]')].findIndex(c => c.dataset.pos === '0') }));
  out[`deck ${route}`] = { cardsMoving: mid, ...end }; if (mid < 2) fail(`${route}: only ${mid} deck cards animate on a swap`); if (end.running || end.front !== 1) fail(`${route}: deck did not settle on the second card`); await ctx.close(); }
console.log('deck: 2 pages');

// 4. Smooth scrolling is on when motion is allowed.
{ const { ctx, p } = await open('/case-studies/colaberry-design-system'); const s = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior); out.smooth = s; if (s !== 'smooth') fail(`scroll-behavior is ${s} with motion allowed`); await ctx.close(); }

// 5. Reading progress bar on articles and case studies: empty at the top, full at the end, empty under reduced motion.
for (const route of ['/case-studies/colaberry-design-system', '/blog/component-spec-files', '/ar/case-studies/colaberry-design-system']) {
  const width = async (motion, f) => { const { ctx, p } = await open(route, { motion }); const w = await p.evaluate(async f => { const b = document.querySelector('[data-progress]'); if (!b) return -1; if (!CSS.supports('animation-timeline: scroll()')) return -2; scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }); await new Promise(r => setTimeout(r, 300)); return Math.round(100 * b.getBoundingClientRect().width / innerWidth); }, f); await ctx.close(); return w; };
  const r = { top: await width('no-preference', 0), end: await width('no-preference', 1), reducedEnd: await width('reduce', 1) }; out[`progress ${route}`] = r;
  if (r.top === -1) fail(`${route}: no progress bar`); else if (r.top === -2) console.log('  note: this browser has no scroll timelines; progress bar not measured'); else if (r.top > 3 || r.end < 99 || r.reducedEnd !== 0) fail(`${route}: progress bar is ${r.top}% at the top, ${r.end}% at the end, ${r.reducedEnd}% under reduced motion`); }
console.log('progress bar: 3 pages');

await browser.close(); server.close();
fs.mkdirSync(path.join(ROOT, 'reports/motion'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/motion/check.json'), JSON.stringify({ fails, out }, null, 1));
console.log(fails.length ? `\nFAILED: ${fails.length}` : '\nPASSED'); process.exit(fails.length ? 1 : 0);
