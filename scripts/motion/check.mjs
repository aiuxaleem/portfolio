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
// 7h. Fade mode (owner instruction, 6 November 2026): a person's browser that asks for reduced motion gets the reveals and
//     the first view as fades, opacity only and nothing moving, without the GSAP module; an automated browser under reduced
//     motion (navigator.webdriver, as every check and screenshot runs) gets the page as authored, which section 1 covers.
for (const route of ['/', '/about', '/posts']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort());
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const p = await ctx.newPage(); await p.goto(O + route, { waitUntil: 'commit' }); await p.waitForTimeout(150);
  const first = await p.evaluate(() => ({ mode: document.documentElement.getAttribute('data-motion'), h1: document.getAnimations().filter(a => a.effect?.target === document.querySelector('main h1') && a.animationName === 'fade-in').length, moving: document.getAnimations().filter(a => a.timeline instanceof DocumentTimeline && a.animationName && a.animationName !== 'fade-in' && !/ink-|edge/.test(a.animationName)).length }));
  await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__seen = []; new MutationObserver(ms => ms.forEach(m => { const t = m.target; if (m.attributeName === 'data-reveal-state' && t.dataset.revealState === 'in') { const s = getComputedStyle(t); window.__seen.push({ dur: parseFloat(s.transitionDuration), props: s.transitionProperty, transform: s.transform }); } })).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-reveal-state'] }); });
  const r = await p.evaluate(async () => { for (let y = 0; y <= document.documentElement.scrollHeight; y += 400) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); } await new Promise(r => setTimeout(r, 2000)); const seen = window.__seen; return { revealed: seen.length, shortest: Math.min(...seen.map(s => s.dur)), notOpacityOnly: seen.filter(s => s.props !== 'opacity').length, moved: seen.filter(s => s.transform !== 'none').length, module: performance.getEntriesByType('resource').filter(e => e.name.includes('/_m/')).length, left: document.querySelectorAll('[data-reveal-state]').length, invisible: [...document.querySelectorAll('main *')].filter(e => e.textContent.trim() && !e.closest('[hidden], [aria-hidden="true"], .cory-visually-hidden, details:not([open])') && (getComputedStyle(e).opacity === '0' || getComputedStyle(e).visibility === 'hidden')).length }; });
  out[`fade ${route}`] = { first, ...r };
  if (first.mode !== 'fade') fail(`${route} fade mode: html[data-motion] is "${first.mode}" for a person under reduced motion`);
  if (!first.h1 || first.moving) fail(`${route} fade mode: first view h1 fade ${first.h1}, ${first.moving} moving animations (none allowed)`);
  if (!r.revealed || r.shortest < 0.3 || r.notOpacityOnly || r.moved) fail(`${route} fade mode: ${r.revealed} reveals, shortest ${r.shortest} s, ${r.notOpacityOnly} not opacity-only, ${r.moved} moved`);
  if (r.module || r.left || r.invisible) fail(`${route} fade mode: module fetched ${r.module}, ${r.left} states left, ${r.invisible} elements invisible after a scroll`);
  await ctx.close();
}
console.log('fade mode: 3 pages as a person under reduced motion');

// 7i. Depth (owner request, 6 November 2026): on the portrait scene the tiles lead the page and the portrait lags it, the
//     "two users" line lags, a page's cover slides through its frame; each follows the scroll (reads differently at two
//     scroll positions, with opposite signs for near and far); nothing of it under reduced motion (fade mode or automation).
{
  const depth = async (p, sel) => p.evaluate(s => { const el = document.querySelector(s); return el ? parseFloat(getComputedStyle(el).translate.split(' ')[1] || '0') || 0 : null; }, sel);
  const { ctx, p } = await open('/');
  await p.waitForTimeout(600);
  const at = async (sel, frac) => { await p.evaluate(({ s, f }) => { const el = document.querySelector(s); scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * f, behavior: 'instant' }); }, { s: sel, f: frac }); await p.waitForTimeout(250); };
  await at('#about', 0.8); const tileA = await depth(p, '#about [data-hero-stage] > span[aria-hidden="true"]:nth-of-type(2)'), faceA = await depth(p, '#about [data-hero-stage] > div:has([data-image-box])');
  await at('#about', 0.1); const tileB = await depth(p, '#about [data-hero-stage] > span[aria-hidden="true"]:nth-of-type(2)'), faceB = await depth(p, '#about [data-hero-stage] > div:has([data-image-box])');
  await at('#two-users', 0.8); const lineA = await depth(p, '#two-users .two-users-figure'); await at('#two-users', 0.1); const lineB = await depth(p, '#two-users .two-users-figure');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  out['depth home'] = { tile: [tileA, tileB], face: [faceA, faceB], line: [lineA, lineB], overflow };
  if (tileA === null || faceA === null || lineA === null) fail('depth: a layer is missing on Home (tile, portrait or the two-users line)');
  else { if (!(tileA > tileB) || !(faceA < faceB)) fail(`depth: the tile should lead (${tileA} then ${tileB}) and the portrait lag (${faceA} then ${faceB}) as the scene scrolls up`); if (!(lineA < lineB)) fail(`depth: the two-users line should lag (${lineA} then ${lineB})`); }
  if (overflow) fail('depth: Home scrolls sideways');
  await ctx.close();
}
{
  const { ctx, p } = await open('/work/colaberry-design-system'); await p.waitForTimeout(600);
  /* Since L-60 (owner instruction, 9 November 2026: nothing uploaded is ever cut) the cover is shown whole in its frame, so the
     L-55 window that slid a 112% picture through a clipped frame no longer applies; the cover keeps its settle on the frame's
     view timeline. Checked: the picture is whole (contain, no taller than its frame) and is animated on scroll. */
  const r = await p.evaluate(async () => { const img = document.querySelector('main header .project-cover img'); if (!img) return null; const frame = img.closest('.project-cover'); const anims = document.getAnimations().filter(a => a.effect?.target === img).map(a => a.animationName); return { fit: getComputedStyle(img).objectFit, taller: img.getBoundingClientRect().height > frame.getBoundingClientRect().height * 1.01, anims, frameHeight: Math.round(frame.getBoundingClientRect().height) }; });
  out['depth cover'] = r;
  if (!r) fail('depth: no cover picture on the project page'); else if (r.fit !== 'contain' || r.taller || !r.anims.includes('settle')) fail(`depth: the cover should be whole in its frame and settle on scroll (fit ${r.fit}, taller ${r.taller}, animations ${r.anims.join(',')})`);
  await ctx.close();
}
for (const [label, o] of [['reduced motion (automation)', { motion: 'reduce' }], ['reduced motion (a person)', { motion: 'reduce', person: true }]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: o.motion }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort());
  if (o.person) await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const p = await ctx.newPage(); await p.goto(O + '/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  const moving = await p.evaluate(() => document.getAnimations().filter(a => !(a.timeline instanceof DocumentTimeline)).length);
  out[`depth ${label}`] = { scrollDriven: moving };
  if (moving) fail(`depth under ${label}: ${moving} scroll-driven animations running`);
  await ctx.close();
}
console.log('depth: the portrait scene and the two-users line on Home, a project cover, and none under reduced motion');

// 7j. Micro-interactions and sideways scrolling (owner request, 8 November 2026): the split halves come from their sides;
//     a header link grows its underline on hover; the copy button shows a check; the "worked with" strip drifts sideways
//     with the page and is wider than the screen; a row of cards on a phone scrolls sideways and snaps, is focusable only
//     then, and the page itself never scrolls sideways; in fade mode a button's colour still answers hover over time.
{
  const { ctx, p } = await open('/'); await p.waitForTimeout(2600);
  const sides = await p.evaluate(async () => { const split = document.querySelector('#about .cory-split'); if (!split) return null; scrollTo({ top: split.getBoundingClientRect().top + scrollY - innerHeight - 200, behavior: 'instant' }); await new Promise(r => setTimeout(r, 500)); const half = split.children[1]; const m = getComputedStyle(half).transform.match(/matrix\(([^)]+)\)/); const [x, y] = m ? m[1].split(',').slice(4).map(Number) : [0, 0]; return { owned: half.hasAttribute('data-motion-owned'), x, y, visibility: getComputedStyle(half).visibility }; });
  out['micro sides'] = sides;
  if (!sides) console.log('  note: no split section in the point of view for the side reveal');
  else if (!sides.owned || Math.abs(sides.x) < 16 || sides.y !== 0 || sides.visibility !== 'hidden') fail(`sides: ${JSON.stringify(sides)} (the second half should wait hidden, off to its side, owned by the head)`);
  await ctx.close();
}
{
  const { ctx, p } = await open('/about');
  const link = p.locator('.header-nav-link:not([aria-current])').first(); await p.mouse.move(2, 2); await p.waitForTimeout(300);
  const before = await link.evaluate(e => getComputedStyle(e, '::after').transform); await link.hover(); await p.waitForTimeout(700);
  const after = await link.evaluate(e => getComputedStyle(e, '::after').transform);
  out['micro nav underline'] = { before, after };
  if (!/matrix\(0/.test(before) || !/matrix\(1, 0, 0, 1, 0, 0\)|none/.test(after)) fail(`nav underline: ${before} then ${after} (should grow from 0 to full on hover)`);
  const copy = p.locator('[data-email-copy] button').first(); await copy.scrollIntoViewIfNeeded();
  await ctx.grantPermissions(['clipboard-write', 'clipboard-read']).catch(() => {});
  await copy.click(); await p.waitForTimeout(300);
  const copied = await p.evaluate(() => { const w = document.querySelector('[data-email-copy]'); return { state: w.dataset.state || null, check: getComputedStyle(w.querySelector('[data-icon-check]')).display, copyIcon: getComputedStyle(w.querySelector('[data-icon-copy]')).display, status: w.querySelector('[role=status]').textContent }; });
  out['micro copy'] = copied;
  if (copied.state !== 'copied' || copied.check !== 'block' || copied.copyIcon !== 'none') fail(`copy button: ${JSON.stringify(copied)} (should show the check while copied)`);
  await p.waitForTimeout(2400);
  const back = await p.evaluate(() => document.querySelector('[data-email-copy]').dataset.state || null);
  if (back) fail(`copy button: still "${back}" after the status cleared`);
  await ctx.close();
}
{
  const { ctx, p } = await open('/'); await p.waitForTimeout(600);
  const strip = await p.evaluate(async () => { const s = document.querySelector('[data-worked-strip]'); if (!s) return null; const band = s.closest('[aria-hidden="true"]'); const at = async f => { scrollTo({ top: band.getBoundingClientRect().top + scrollY - innerHeight * f, behavior: 'instant' }); await new Promise(r => setTimeout(r, 250)); return parseFloat(getComputedStyle(s).translate.split(' ')[0]) || 0; }; const a = await at(0.9), b = await at(0.1); return { a, b, wider: s.scrollWidth > innerWidth, wrap: getComputedStyle(s).flexWrap, copies: s.querySelectorAll('[data-strip-copy]').length, pageSideways: document.documentElement.scrollWidth > innerWidth }; });
  out['sideways strip'] = strip;
  if (!strip) fail('strip: the worked-with strip is missing');
  else if (!(strip.b < strip.a) || !strip.wider || strip.wrap !== 'nowrap' || strip.pageSideways) fail(`strip: ${JSON.stringify(strip)} (should drift left as the page scrolls, stand in one line wider than the screen, never scroll the page sideways)`);
  await ctx.close();
}
{
  const { ctx, p } = await open('/', { w: 390, h: 844, touch: true }); await p.waitForTimeout(600);
  const row = await p.evaluate(() => { const r = document.querySelector('[data-scroll-row]'); if (!r) return null; const s = getComputedStyle(r); return { display: s.display, overflowX: s.overflowX, snap: s.scrollSnapType, scrollable: r.scrollWidth > r.clientWidth + 2, tabIndex: r.tabIndex, label: r.getAttribute('aria-label'), pageSideways: document.documentElement.scrollWidth > innerWidth, cards: r.children.length }; });
  out['sideways row 390'] = row;
  if (!row) fail('row: no sideways row on Home');
  else if (row.display !== 'flex' || row.overflowX !== 'auto' || !/x/.test(row.snap) || !row.scrollable || row.tabIndex !== 0 || !row.label || row.pageSideways) fail(`row at 390: ${JSON.stringify(row)}`);
  // The keyboard reaches a card beyond the edge: focusing its link scrolls the row until the link is on screen.
  const reach = await p.evaluate(async () => { const link = document.querySelector('[data-scroll-row] > li:nth-child(2) a'); if (!link) return null; const before = link.getBoundingClientRect(); link.focus(); await new Promise(r => setTimeout(r, 800)); const r = link.getBoundingClientRect(); return { offBefore: before.right > innerWidth, left: Math.round(r.left), right: Math.round(r.right), onScreen: r.left >= 0 && r.right <= innerWidth, focused: document.activeElement === link }; });
  out['sideways row reach'] = reach;
  if (!reach || !reach.onScreen || !reach.focused || !reach.offBefore) fail(`row reach: ${JSON.stringify(reach)} (focusing the second card should scroll it on screen)`);
  await ctx.close();
  const wide = await open('/'); await wide.p.waitForTimeout(600);
  const r2 = await wide.p.evaluate(() => { const r = document.querySelector('[data-scroll-row]'); return { display: getComputedStyle(r).display, tabIndex: r.tabIndex, scrollable: r.scrollWidth > r.clientWidth + 2 }; });
  out['sideways row 1440'] = r2;
  if (r2.display !== 'grid' || r2.tabIndex !== -1 || r2.scrollable) fail(`row at 1440: ${JSON.stringify(r2)} (should be a grid and no tab stop)`);
  await wide.ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort());
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const p = await ctx.newPage(); await p.goto(O + '/about', { waitUntil: 'load' }); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const b = document.querySelector('.ui-button-secondary, .ui-button'); const s = getComputedStyle(b); return { mode: document.documentElement.dataset.motion, duration: s.transitionDuration.split(',')[0].trim(), props: s.transitionProperty, strip: document.querySelector('[data-worked-strip]') ? getComputedStyle(document.querySelector('[data-worked-strip]')).flexWrap : 'none' }; });
  out['micro fade mode'] = r;
  if (r.mode !== 'fade' || parseFloat(r.duration) < 0.15 || /transform|translate/.test(r.props)) fail(`fade mode button: ${JSON.stringify(r)} (colour should still answer over time, nothing should move)`);
  await ctx.close();
}
console.log('micro and sideways: the split sides, the nav underline, the copy check, the strip, the phone row, fade-mode colour');

// 7k. The calls to action (owner request, 8 November 2026): a primary button carries the inner highlight and the glow,
//     drifts its gradient and lifts two pixels on hover, keeps its label colour; a secondary takes the link colour on hover;
//     the hero's primary breathes once after its rise; a primary below the fold breathes as it scrolls in; the same component
//     in the admin shares the look (the sign-in page is the admin's one public page); under fade mode nothing moves.
{
  const { ctx, p } = await open('/'); await p.waitForTimeout(600);
  const hero = p.locator('[data-hero] [data-hero-ctas] a').first();
  const rest = await hero.evaluate(e => { const s = getComputedStyle(e); return { shadow: s.boxShadow, position: s.backgroundPosition, size: s.backgroundSize, color: s.color, transform: s.transform, anims: document.getAnimations().filter(a => a.effect?.target === e).map(a => a.animationName) }; });
  await hero.hover(); await p.waitForTimeout(700);
  const hov = await hero.evaluate(e => { const s = getComputedStyle(e); return { shadow: s.boxShadow, position: s.backgroundPosition, color: s.color, transform: s.transform }; });
  out['cta hero'] = { rest, hover: hov };
  if (!/inset/.test(rest.shadow) || !/160%/.test(rest.size)) fail(`cta: the hero primary lacks the inner highlight or the drifting gradient (${rest.shadow.slice(0, 80)} / ${rest.size})`);
  if (!rest.anims.includes('cta-breath')) fail(`cta: the hero primary does not breathe after its rise (${rest.anims.join(',')})`);
  if (hov.position === rest.position || hov.color !== rest.color || !/matrix\(1, 0, 0, 1, 0, -2/.test(hov.transform)) fail(`cta: on hover the gradient should drift, the label colour stay and the button lift 2 px (${rest.position} then ${hov.position}, ${rest.color} then ${hov.color}, ${hov.transform})`);
  const below = await p.evaluate(async () => { const b = [...document.querySelectorAll('main .ui-button-primary, main [data-ds-button="primary"]')].find(e => e.getBoundingClientRect().top > innerHeight * 1.5); if (!b) return null; scrollTo({ top: b.getBoundingClientRect().top + scrollY - innerHeight * 0.7, behavior: 'instant' }); await new Promise(r => setTimeout(r, 300)); const a = document.getAnimations().find(x => x.effect?.target === b && x.animationName === 'cta-breath'); return { found: !!a, scroll: a ? !(a.timeline instanceof DocumentTimeline) : null, progress: a && a.currentTime && typeof a.currentTime === 'object' ? Math.round(a.currentTime.value) : null }; });
  out['cta below'] = below;
  if (!below) console.log('  note: no primary call to action below the fold on Home');
  else if (!below.found || !below.scroll) fail(`cta: a primary below the fold should breathe on the scroll timeline (${JSON.stringify(below)})`);
  await ctx.close();
}
{
  const { ctx, p } = await open('/about'); await p.waitForTimeout(400);
  const sec = p.locator('main .ui-button-secondary').first(); await sec.scrollIntoViewIfNeeded(); await p.mouse.move(2, 2); await p.waitForTimeout(300);
  const a = await sec.evaluate(e => ({ color: getComputedStyle(e).color, border: getComputedStyle(e).borderColor, blur: getComputedStyle(e).backdropFilter })); await sec.hover(); await p.waitForTimeout(600);
  const b = await sec.evaluate(e => ({ color: getComputedStyle(e).color, border: getComputedStyle(e).borderColor }));
  out['cta secondary'] = { rest: a, hover: b };
  if (a.color === b.color || a.border === b.border) fail(`cta: a secondary should take the link colour and edge on hover (${JSON.stringify({ a, b })})`);
  await ctx.close();
}
{
  const { ctx, p } = await open('/admin/login'); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const b = document.querySelector('.ui-button-primary'); if (!b) return null; const s = getComputedStyle(b); return { shadow: /inset/.test(s.boxShadow), size: s.backgroundSize }; });
  out['cta admin'] = r;
  if (!r) console.log('  note: the admin sign-in page is not in this build (static build); the component is shared'); else if (!r.shadow || !/160%/.test(r.size)) fail(`cta admin: ${JSON.stringify(r)}`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort());
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const p = await ctx.newPage(); await p.goto(O + '/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  const r = await p.evaluate(() => { const b = document.querySelector('[data-hero] [data-hero-ctas] a'); return { breath: document.getAnimations().some(a => a.effect?.target === b && a.animationName === 'cta-breath'), props: getComputedStyle(b).transitionProperty }; });
  out['cta fade mode'] = r;
  if (r.breath || /transform/.test(r.props)) fail(`cta in fade mode: ${JSON.stringify(r)} (no breath, no movement)`);
  await ctx.close();
}
console.log('cta: the hero primary at rest and on hover, a primary below the fold on the scroll, a glass secondary, the admin, fade mode');

console.log('flow: heads and bodies on 3 pages, the heading wipe with and without the script, cascades on 5 lists, the first view on 13 pages, the menu card, the phone menu, the theme in both settings, the travelling picture in both settings');

await browser.close(); server.close();
fs.mkdirSync(path.join(ROOT, 'reports/motion'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/motion/check.json'), JSON.stringify({ fails, out }, null, 1));
console.log(fails.length ? `\nFAILED: ${fails.length}` : '\nPASSED'); process.exit(fails.length ? 1 : 0);
