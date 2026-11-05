// Motion behaviour check (Phase 17): scroll reveals, the hover states added in MO-D2, the Home deck swap, smooth scrolling,
// the reading progress bar, since 1 November 2026 the GSAP first view and scroll reveals of islands/motion.ts, and since
// 5 November 2026 the flow: head-then-body sections, cascading lists, the first view on every page, the menus, the theme
// cross-fade and the picture that travels from a card to its page (section 7).
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

// 3. Home deck, and the stacks on the audience websites' first screens: a swap moves the cards (transform transitions run)
//    and ends in the resting poses.
for (const route of ['/', '/ar', '/job', '/clients']) { const { ctx, p } = await open(route); const next = p.locator('div:has(+ [data-hero-stack]) button >> nth=1'); if (!(await next.count())) { fail(`${route}: deck buttons not found`); await ctx.close(); continue; } await next.click(); await p.waitForTimeout(60);
  const mid = await p.evaluate(() => document.getAnimations().filter(a => a.transitionProperty === 'transform' && a.effect?.target?.hasAttribute('data-stack-card')).length); await p.waitForTimeout(500);
  // A swap must settle: no time-based animation is left on a card. Scroll-linked ones (the cards fanning out as the page
  // scrolls, motion.css) follow the scroll, not the clock, so they are not counted.
  const end = await p.evaluate(() => ({ running: document.getAnimations().filter(a => a.effect?.target?.hasAttribute?.('data-stack-card') && a.timeline instanceof DocumentTimeline).length, front: [...document.querySelectorAll('[data-stack-card]')].findIndex(c => c.dataset.pos === '0') }));
  out[`deck ${route}`] = { cardsMoving: mid, ...end }; if (mid < 2) fail(`${route}: only ${mid} deck cards animate on a swap`); if (end.running || end.front !== 1) fail(`${route}: deck did not settle on the second card`); await ctx.close(); }
console.log('deck: 4 pages (Home, Arabic Home, and the first-screen stacks of the two audience websites)');

// 4. Smooth scrolling is on when motion is allowed.
{ const { ctx, p } = await open('/case-studies/colaberry-design-system'); const s = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior); out.smooth = s; if (s !== 'smooth') fail(`scroll-behavior is ${s} with motion allowed`); await ctx.close(); }

// 5. Reading progress bar on articles and case studies: empty at the top, full at the end, empty under reduced motion.
for (const route of ['/case-studies/colaberry-design-system', '/blog/component-spec-files', '/ar/case-studies/colaberry-design-system']) {
  const width = async (motion, f) => { const { ctx, p } = await open(route, { motion }); const w = await p.evaluate(async f => { const b = document.querySelector('[data-progress]'); if (!b) return -1; if (!CSS.supports('animation-timeline: scroll()')) return -2; scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }); await new Promise(r => setTimeout(r, 300)); return Math.round(100 * b.getBoundingClientRect().width / innerWidth); }, f); await ctx.close(); return w; };
  const r = { top: await width('no-preference', 0), end: await width('no-preference', 1), reducedEnd: await width('reduce', 1) }; out[`progress ${route}`] = r;
  if (r.top === -1) fail(`${route}: no progress bar`); else if (r.top === -2) console.log('  note: this browser has no scroll timelines; progress bar not measured'); else if (r.top > 3 || r.end < 99 || r.reducedEnd !== 0) fail(`${route}: progress bar is ${r.top}% at the top, ${r.end}% at the end, ${r.reducedEnd}% under reduced motion`); }
console.log('progress bar: 3 pages');

// 6. GSAP (islands/motion.ts): fetched after the load event and only with motion allowed, it owns the section heads and the
//    other blocks in its header, nothing it touches stays hidden or styled once it has played, the first view is the CSS
//    intro in every case, and with reduced motion or without JavaScript the module is not even fetched.
/* Elements with text that cannot be seen; `onScreen` limits it to the first screen (below the fold a block may be hidden
   while it waits to scroll in, by design). */
const invisible = onScreen => [...document.querySelectorAll('main *')].filter(e => e.textContent.trim() && !e.closest('[hidden], [aria-hidden="true"], .cory-visually-hidden, details:not([open])') && (!onScreen || (e.getBoundingClientRect().top < innerHeight && e.getBoundingClientRect().bottom > 0)) && (getComputedStyle(e).visibility === 'hidden' || getComputedStyle(e).opacity === '0')).length;
const probe = () => ({ flag: document.documentElement.dataset.motion, fetched: performance.getEntriesByType('resource').filter(e => e.name.includes('/_m/motion')).length, owned: document.querySelectorAll('[data-motion-owned]').length, lines: document.querySelectorAll('.motion-line').length, cssIntro: document.getAnimations().some(a => a.animationName === 'title-in') || !document.querySelector('.site-hero-title, #hero-title, .hero-split-words > h1') });
for (const route of ['/', '/ar', '/work', '/about', '/blog/component-spec-files', '/job', '/clients']) {
  const { ctx, p } = await open(route);
  const atLoad = await p.evaluate(probe);
  await p.waitForTimeout(2600);
  const after = await p.evaluate(`(() => { const invisible = ${invisible}; const r = (${probe})(); return { ...r, hidden: invisible(true) }; })()`);
  // Scroll through; then everything the script owns must be back as authored.
  const scrolled = await p.evaluate(`(async () => { const invisible = ${invisible}; for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.5)) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); } await new Promise(r => setTimeout(r, 2800));
    const owned = [...document.querySelectorAll('[data-motion-owned]')]; return { owned: owned.length, lines: document.querySelectorAll('.motion-line, .motion-line-mask').length, styled: owned.filter(e => /opacity|visibility|transform|--draw/.test(e.getAttribute('style') || '')).length, drawn: [...document.querySelectorAll('[data-core-link]')].filter(e => e.style.getPropertyValue('--core-draw')).length, hidden: invisible(), label: !!document.querySelector('main h2[aria-label]') }; })()`);
  out[`gsap ${route}`] = { atLoad, after, scrolled };
  if (atLoad.flag !== 'on') fail(`${route}: html[data-motion] is "${atLoad.flag}" with motion allowed`);
  if (!atLoad.cssIntro) fail(`${route}: the CSS first view (title-in) is not running with motion allowed`);
  if (after.fetched !== 1) fail(`${route}: the GSAP module was fetched ${after.fetched} times (once expected, after load)`);
  if (!after.owned) fail(`${route}: no block is owned by motion.ts 2.6 s after load`);
  if (after.hidden) fail(`${route}: ${after.hidden} elements with text invisible in the first view`);
  if (scrolled.lines || scrolled.styled || scrolled.drawn || scrolled.hidden || scrolled.label) fail(`${route}: after scrolling, ${scrolled.lines} split lines, ${scrolled.styled} owned blocks still styled, ${scrolled.drawn} diagram lines still drawing, ${scrolled.hidden} elements invisible, aria-label left ${scrolled.label}`);
  await ctx.close();
}
for (const [label, o] of [['reduced motion', { motion: 'reduce' }], ['JavaScript off', { js: false }]]) for (const route of ['/', '/ar', '/work']) {
  const { ctx, p } = await open(route, o); await p.waitForTimeout(1500);
  const r = await p.evaluate(probe);
  out[`gsap ${label} ${route}`] = r;
  if (r.flag || r.fetched || r.owned || r.lines) fail(`${route} with ${label}: data-motion "${r.flag}", module fetched ${r.fetched} times, ${r.owned} owned blocks, ${r.lines} split lines`);
  if (label === 'JavaScript off' && !r.cssIntro) fail(`${route} without JavaScript: the CSS first view (title-in) is not running`);
  await ctx.close();
}
console.log('gsap: 7 pages with motion, 3 with reduced motion, 3 without JavaScript');

// 7. Flow (owner, 5 November 2026, "a good animated front end with proper flow"): a section's head brings the body that sits
//    with it, hidden together and shown head first; nothing is moved by both scripts; the stylesheet's heading wipe gives
//    way to the script's lines (and stays for the page without the script); every list cascades item by item; every page's
//    first view has its title rising; the header's menu card and the phone menu open and close with a fade; the theme
//    cross-fades; the picture travels from a card to its page and back, and nothing is left named afterwards.
const watchBoth = () => { window.__both = 0; window.__grouped = 0; new MutationObserver(ms => ms.forEach(m => { const t = m.target; if (m.attributeName !== 'data-reveal-state' || t.dataset.revealState !== 'in') return; if (t.hasAttribute('data-motion-owned')) window.__both++; if (t.style.getPropertyValue('--i')) window.__grouped++; })).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-reveal-state'] }); };
const scrollThrough = async () => { for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.5)) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); } await new Promise(r => setTimeout(r, 2800)); };
// 7a. The head and its body: hidden together as they approach, the body shown after the heading's first line.
for (const route of ['/about', '/resources', '/ai-tools']) {
  const { ctx, p } = await open(route);
  await p.evaluate(watchBoth); await p.waitForTimeout(2600);
  const r = await p.evaluate(async () => {
    const hidden = el => { const s = getComputedStyle(el); return s.visibility === 'hidden' || s.opacity === '0'; };
    for (const head of [...document.querySelectorAll('[data-motion-owned]')].filter(b => b.querySelector(':scope > h2') && b.getBoundingClientRect().top > innerHeight * 1.8)) {
      const h2 = head.querySelector(':scope > h2');
      const body = [...head.parentElement.querySelectorAll('[data-motion-owned]')].filter(el => el !== head && !head.contains(el) && !el.contains(head) && (el.compareDocumentPosition(head) & Node.DOCUMENT_POSITION_PRECEDING));
      if (!body.length) continue;
      scrollTo({ top: head.getBoundingClientRect().top + scrollY - innerHeight - 120, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
      const prepped = { head: hidden(h2) || !!head.querySelector('.motion-line'), body: body.filter(hidden).length, of: body.length };
      scrollTo({ top: head.getBoundingClientRect().top + scrollY - innerHeight * 0.5, behavior: 'instant' });
      const t0 = performance.now(); let lineAt = -1, bodyAt = -1;
      while (performance.now() - t0 < 3000 && (lineAt < 0 || bodyAt < 0)) {
        await new Promise(r => requestAnimationFrame(r));
        const line = head.querySelector('.motion-line') || h2;
        if (lineAt < 0 && !hidden(line)) lineAt = performance.now() - t0;
        if (bodyAt < 0 && parseFloat(getComputedStyle(body[0]).opacity) > 0.5) bodyAt = performance.now() - t0;
      }
      return { head: head.className || head.tagName, prepped, lineAt: Math.round(lineAt), bodyAt: Math.round(bodyAt) };
    }
    return null;
  });
  await p.evaluate(scrollThrough);
  const both = await p.evaluate(() => window.__both);
  out[`flow head ${route}`] = { ...r, both };
  if (!r) fail(`${route}: no section head below the fold with a body of its own`);
  else { if (!r.prepped.head || r.prepped.body !== r.prepped.of) fail(`${route}: as the head approaches, head hidden ${r.prepped.head}, ${r.prepped.body} of ${r.prepped.of} body items hidden`); if (r.lineAt < 0 || r.bodyAt < 0 || r.bodyAt - r.lineAt < 250) fail(`${route}: heading line visible at ${r.lineAt} ms, body at ${r.bodyAt} ms (the body should follow the heading)`); }
  if (both) fail(`${route}: ${both} blocks were revealed by reveal.ts although motion.ts owns them`);
  await ctx.close();
}
// 7b. The heading wipe: none with the script, present without it (where the browser has view timelines).
for (const [label, o, want] of [['with the script', {}, 0], ['without JavaScript', { js: false }, 1]]) {
  const { ctx, p } = await open('/about', o); await p.waitForTimeout(2600);
  const r = await p.evaluate(() => ({ supported: CSS.supports('animation-timeline: view()'), wipes: document.getAnimations().filter(a => /^wipe/.test(a.animationName)).length, heads: document.querySelectorAll('.page-section-head > h2, .page-section-head > .page-h2').length }));
  out[`flow wipe ${label}`] = r;
  if (!r.supported) console.log('  note: this browser has no view timelines; the heading wipe is not measured');
  else if (want ? !r.wipes : r.wipes) fail(`/about ${label}: ${r.wipes} heading wipes (expected ${want ? 'one per head' : 'none'}, ${r.heads} heads)`);
  await ctx.close();
}
// 7c. Lists cascade: posts, articles, videos, the sitemap, the About tiles, the footer's columns.
for (const route of ['/posts', '/articles', '/videos', '/sitemap', '/about']) {
  const { ctx, p } = await open(route);
  await p.evaluate(watchBoth); await p.waitForTimeout(2600); await p.evaluate(scrollThrough);
  const r = await p.evaluate(() => ({ grouped: window.__grouped, both: window.__both, left: document.querySelectorAll('[data-reveal-state], [style*="--i"]').length }));
  out[`flow cascade ${route}`] = r;
  if (!r.grouped) fail(`${route}: no list item cascaded (none got a stagger step)`);
  if (r.both) fail(`${route}: ${r.both} blocks were revealed by reveal.ts although motion.ts owns them`);
  if (r.left) fail(`${route}: ${r.left} elements still carry a reveal state or stagger step`);
  await ctx.close();
}
// 7d. The first view: the title rises out of its mask and what sits with it follows, on every page.
for (const route of ['/posts', '/videos', '/resources', '/now', '/sitemap', '/resume', '/blog', '/about', '/contact', '/work/colaberry-design-system', '/case-studies/colaberry-design-system', '/blog/component-spec-files', '/404.html']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort()); const p = await ctx.newPage();
  await p.goto(O + route, { waitUntil: 'commit' }); await p.waitForTimeout(250);
  const r = await p.evaluate(() => { const h1 = document.querySelector('main h1'); const anims = document.getAnimations().filter(a => a.timeline instanceof DocumentTimeline); return { title: anims.some(a => a.animationName === 'title-in' && a.effect.target === h1), follow: anims.filter(a => a.animationName === 'rise-in' && a.effect.target.parentElement === h1?.parentElement).length, cover: anims.some(a => a.effect.target.closest?.('.project-cover')), body: anims.some(a => a.effect.target.closest?.('.prose, .post-body, .case-body, .resume-block')) }; });
  out[`flow first view ${route}`] = r;
  if (!r.title || !r.follow) fail(`${route}: first view: title rising ${r.title}, ${r.follow} pieces following`);
  if (r.cover || r.body) fail(`${route}: first view moves the cover (${r.cover}) or reading text (${r.body})`);
  await ctx.close();
}
// 7e. The header's menu card and the phone menu: a fade in, a fade out, then gone.
{
  const { ctx, p } = await open('/about');
  const discrete = await p.evaluate(() => CSS.supports('transition-behavior: allow-discrete'));
  await p.locator('.nav-group-button').first().click(); await p.waitForTimeout(40);
  const opening = await p.evaluate(() => { const panel = document.querySelector('.nav-group-button[aria-expanded="true"] + .nav-panel'); return { display: panel && getComputedStyle(panel).display, fading: document.getAnimations().some(a => a.effect?.target === panel && a.transitionProperty === 'opacity') }; });
  await p.waitForTimeout(800);
  const open_ = await p.evaluate(() => { const panel = document.querySelector('.nav-group-button[aria-expanded="true"] + .nav-panel'); return { opacity: panel && getComputedStyle(panel).opacity, items: [...panel.querySelectorAll('li')].every(li => getComputedStyle(li).opacity === '1') }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(40);
  const closing = await p.evaluate(() => { const panel = document.querySelector('.nav-panel'); return { display: getComputedStyle(panel).display, fading: document.getAnimations().some(a => a.effect?.target === panel && a.transitionProperty === 'opacity') }; });
  await p.waitForTimeout(600);
  const closed = await p.evaluate(() => getComputedStyle(document.querySelector('.nav-panel')).display);
  out['flow menu card'] = { discrete, opening, open: open_, closing, closed };
  if (opening.display !== 'block' || !opening.fading || open_.opacity !== '1' || !open_.items) fail(`menu card: opens display ${opening.display}, fading ${opening.fading}, settles at opacity ${open_.opacity}, items shown ${open_.items}`);
  if (discrete && (closing.display !== 'block' || !closing.fading)) fail(`menu card: closing display ${closing.display}, fading ${closing.fading}`);
  if (closed !== 'none') fail(`menu card: still ${closed} after closing`);
  await ctx.close();
}
{
  const { ctx, p } = await open('/about', { w: 390, h: 844, touch: true });
  await p.locator('[data-menu-open]').tap(); await p.waitForTimeout(40);
  const opening = await p.evaluate(() => { const menu = document.querySelector('[data-menu]'); return { display: getComputedStyle(menu).display, fading: document.getAnimations().some(a => a.effect?.target === menu && a.transitionProperty === 'opacity'), groups: document.getAnimations().filter(a => a.effect?.target?.matches?.('.menu-group, .menu-foot')).length }; });
  await p.waitForTimeout(1000);
  const open_ = await p.evaluate(() => { const menu = document.querySelector('[data-menu]'); return { opacity: getComputedStyle(menu).opacity, groups: [...menu.querySelectorAll('.menu-group, .menu-foot')].every(g => getComputedStyle(g).opacity === '1' && getComputedStyle(g).translate === 'none') }; });
  await p.locator('[data-menu-close]').tap(); await p.waitForTimeout(700);
  const closed = await p.evaluate(() => ({ display: getComputedStyle(document.querySelector('[data-menu]')).display, focus: document.activeElement?.hasAttribute('data-menu-open') }));
  out['flow phone menu'] = { opening, open: open_, closed };
  if (opening.display !== 'flex' || !opening.fading || !opening.groups || open_.opacity !== '1' || !open_.groups) fail(`phone menu: opens ${opening.display}, fading ${opening.fading}, ${opening.groups} groups moving, settles at ${open_.opacity}, groups in place ${open_.groups}`);
  if (closed.display !== 'none' || !closed.focus) fail(`phone menu: after closing display ${closed.display}, focus back on the button ${closed.focus}`);
  await ctx.close();
}
// 7f. The theme cross-fades (a view transition marked on the root while it runs); with reduced motion it changes at once.
for (const [label, motion, want] of [['motion allowed', 'no-preference', true], ['reduced motion', 'reduce', false]]) {
  const { ctx, p } = await open('/about', { motion });
  await p.evaluate(() => { window.__vt = []; new MutationObserver(ms => ms.forEach(m => { if (m.attributeName === 'data-vt') window.__vt.push(document.documentElement.dataset.vt || ''); })).observe(document.documentElement, { attributes: true }); });
  const before = await p.evaluate(() => document.documentElement.dataset.theme);
  await p.locator('[data-theme-toggle]').first().click(); await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ theme: document.documentElement.dataset.theme, vt: window.__vt, api: 'startViewTransition' in document }));
  out[`flow theme ${label}`] = { before, ...r };
  if (r.theme === before) fail(`theme (${label}): still ${r.theme} after the button`);
  if (r.api && (want ? (r.vt[0] !== 'theme' || r.vt[r.vt.length - 1] !== '') : r.vt.length)) fail(`theme (${label}): root marks ${JSON.stringify(r.vt)} (expected ${want ? 'theme then cleared' : 'none'})`);
  await ctx.close();
}
// 7g. The picture travels: leaving /work for a project names the card's picture, arriving names the cover, and the names
//     come off; going back names the cover and then the card. Under reduced motion nothing is named.
for (const [label, motion] of [['motion allowed', 'no-preference'], ['reduced motion', 'reduce']]) {
  const { ctx, p } = await open('/work', { motion });
  const api = await p.evaluate(() => 'onpagereveal' in window && 'navigation' in window);
  if (!api) { console.log('  note: this browser has no cross-document view transitions; the travelling picture is not measured'); await ctx.close(); break; }
  await p.evaluate(() => sessionStorage.clear());
  const link = p.locator('.project-card .project-card-link').first(); const href = (await link.getAttribute('href')).replace(/\/$/, '');
  await link.click(); await p.waitForURL(u => u.pathname.replace(/\/$/, '') === href, { timeout: 15000 }); await p.waitForTimeout(1500);
  const there = await p.evaluate(() => ({ swap: sessionStorage.getItem('motion-cover-swap'), reveal: sessionStorage.getItem('motion-cover-reveal'), named: document.querySelectorAll('[style*="view-transition-name"]').length, flag: document.documentElement.hasAttribute('data-vt-cover') }));
  await p.goBack(); await p.waitForURL(u => /^\/work(\.html)?$/.test(u.pathname), { timeout: 15000 }); await p.waitForTimeout(1500);
  const back = await p.evaluate(() => ({ swap: sessionStorage.getItem('motion-cover-swap'), reveal: sessionStorage.getItem('motion-cover-reveal'), named: document.querySelectorAll('[style*="view-transition-name"]').length, flag: document.documentElement.hasAttribute('data-vt-cover') }));
  out[`flow cover ${label}`] = { href, there, back };
  if (motion === 'reduce') { if (there.swap || there.reveal || back.swap || back.reveal) fail(`cover (${label}): the picture was named ${JSON.stringify({ there, back })}`); }
  else {
    if (there.swap !== href || there.reveal !== href) fail(`cover (${label}): leaving /work named ${there.swap}, arriving named ${there.reveal} (expected ${href} both)`);
    if (back.swap !== '/work' || !back.reveal) fail(`cover (${label}): going back named ${back.swap} on leaving and ${back.reveal} on arriving (expected /work both)`);
  }
  if (there.named || there.flag || back.named || back.flag) fail(`cover (${label}): a name or the root mark was left behind ${JSON.stringify({ there, back })}`);
  await ctx.close();
}
console.log('flow: heads and bodies on 3 pages, the heading wipe with and without the script, cascades on 5 lists, the first view on 13 pages, the menu card, the phone menu, the theme in both settings, the travelling picture in both settings');

await browser.close(); server.close();
fs.mkdirSync(path.join(ROOT, 'reports/motion'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/motion/check.json'), JSON.stringify({ fails, out }, null, 1));
console.log(fails.length ? `\nFAILED: ${fails.length}` : '\nPASSED'); process.exit(fails.length ? 1 : 0);
