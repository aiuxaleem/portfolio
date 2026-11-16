// Mobile test (15 November 2026): the site on emulated phones and tablets, where the quality gate's narrow desktop windows
// cannot see: a phone's layout viewport and pixel density, touch input (no hover, coarse pointer), the on-screen keyboard,
// landscape and rotation. Against a quality build in dist/ (QUALITY_BUILD=1 npm run build), or a live site with --origin.
//   node scripts/quality/check-mobile.mjs                         every route on three devices, then the touch tests
//   node scripts/quality/check-mobile.mjs --origin=https://... --routes=/admin/login --sweep-only
// Engine: the installed Edge or Chrome with Playwright's device profiles (touch, mobile viewport, device pixel ratio, user
// agent). It is emulation, not a real phone, and Safari's engine (WebKit) is not part of it.
//
// Sweep, every route on Galaxy S9+ (320 px, 4.5x, light), iPhone 15 Pro (393 px, 3x, dark) and iPad Mini (768 px, 2x, light):
//   viewport   the layout viewport stays the device width at scale 1 (a page wider than the screen would make a phone zoom out)
//   input-zoom every visible text field, select and text area is at least 16 px (iOS Safari zooms the page on focus below that)
//   image      every picture is sharp on the device (at least 1.8 source pixels per CSS pixel where a larger file exists)
//   errors     no script error and no failed request on the site's own origin
//   notes      text under 12 px, pictures far larger than needed, header height, the browser bar colour against the header
// Touch tests: the phone menu (tap open, focus inside, page behind inert and still, tap close, tap a link), the same in
// landscape (every link reachable and not covered), the header groups by tap on a tablet in landscape, the theme by tap
// (no hover style left behind, the browser bar colour follows), a card row swiped sideways (it snaps; the page does not
// move sideways), the image preview by tap, the contact form with the keyboard up (each field lands below the header),
// Show more, copy email, a video by tap, rotation both ways, and a touch scroll down Home with motion on (nothing stays hidden).
import fs from 'node:fs';
import { devices } from 'playwright-core';
import { serve, launch, routes, arg, revealAll } from '../lib.mjs';

const PORT = 4461;
const LIVE = arg('origin', '');
const origin = LIVE || `http://127.0.0.1:${PORT}`;
const OUT = 'reports/mobile'; fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const server = LIVE ? null : await serve('dist', PORT);
const browser = await launch();
const fails = []; const notes = []; const out = { sweep: {}, touch: {} };
const fail = m => { fails.push(m); console.log('  FAIL ' + m); };
const note = m => { notes.push(m); console.log('  NOTE ' + m); };

const ctxOf = (name, theme, extra = {}) => {
  const d = devices[name];
  return browser.newContext({ viewport: d.viewport, screen: d.screen, userAgent: d.userAgent, deviceScaleFactor: d.deviceScaleFactor, isMobile: d.isMobile, hasTouch: d.hasTouch, colorScheme: theme, reducedMotion: 'reduce', ...extra });
};
const url = (p, theme) => origin + encodeURI(p) + (p.includes('?') ? '&' : '?') + 'theme=' + theme;
const go = async (page, p, theme) => {
  const res = await page.goto(url(p, theme), { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('main h1, h1', { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  return res;
};
const pause = (page, ms) => page.waitForTimeout(ms);

/* ---------- Sweep ---------- */
const KEY = ['/', '/about', '/work', '/work/colaberry-design-system', '/case-studies/colaberry-design-system', '/blog/designing-for-two-users', '/contact', '/resources', '/ar', '/admin/login'];
const all = arg('routes', '') ? String(arg('routes')).split(',').map(p => ({ path: p }))
  : routes('dist').filter(r => !/^\/_states/.test(r.path) && !/^\/(job|clients)\/(case-studies|work)\/./.test(r.path));
const DEVICES = [['Galaxy S9+', 'light'], ['iPhone 15 Pro', 'dark'], ['iPad Mini', 'light']];

async function measure() {
  const vw = innerWidth, dpr = devicePixelRatio;
  const shown = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && !el.closest('[hidden], dialog:not([open]), [aria-hidden="true"]'); };
  const name = el => el.id ? '#' + el.id : el.getAttribute('name') ? `[name=${el.getAttribute('name')}]` : el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '');
  const inputs = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=range]):not([type=color]):not([type=file]), select, textarea')]
    .filter(shown).map(el => ({ field: name(el), size: parseFloat(getComputedStyle(el).fontSize) })).filter(f => f.size < 16);
  const widthOf = s => { const m = /\s(\d+)w\s*$/.exec(s.trim()); return m ? +m[1] : 0; };
  const images = [];
  for (const img of document.querySelectorAll('img')) {
    if (!img.complete || !img.naturalWidth || /\.svg(\?|$)/i.test(img.currentSrc || img.src)) continue;
    const r = img.getBoundingClientRect(); const cs = getComputedStyle(img);
    if (r.width < 120 || r.height < 40 || /blur/.test(cs.filter) || img.closest('[aria-hidden="true"], dialog:not([open])')) continue;
    /* For a picture with a srcset, naturalWidth is already divided by the density the browser chose, so the file's real
       size is read from a plain copy of the chosen file (from the cache). */
    const probe = new Image(); probe.src = img.currentSrc || img.src; try { await probe.decode(); } catch { continue; }
    const nw = probe.naturalWidth, nh = probe.naturalHeight;
    const scale = cs.objectFit === 'contain' || cs.objectFit === 'scale-down' ? Math.min(r.width / nw, r.height / nh) : cs.objectFit === 'cover' ? Math.max(r.width / nw, r.height / nh) : r.width / nw;
    const density = 1 / scale;
    const sets = [img.getAttribute('srcset') || '', ...[...(img.closest('picture')?.querySelectorAll('source') || [])].map(s => s.getAttribute('srcset') || '')];
    const maxW = Math.max(0, ...sets.flatMap(s => s.split(',')).map(widthOf));
    const file = (img.currentSrc || img.src).split('/').pop().split('?')[0].slice(0, 60);
    images.push({ file, cssWidth: Math.round(r.width), natural: nw, density: +density.toFixed(2), maxW, sizes: img.getAttribute('sizes') || '' });
  }
  const tiny = new Map();
  for (const el of document.querySelectorAll('body *')) {
    if (!['SCRIPT', 'STYLE', 'svg', 'SVG'].includes(el.tagName) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && shown(el)) {
      const s = parseFloat(getComputedStyle(el).fontSize); if (s < 12) { const k = `${name(el)} ${s}px`; tiny.set(k, (tiny.get(k) || 0) + 1); }
    }
  }
  const header = document.querySelector('[data-site-header], body > header, header');
  return {
    vw, scrollWidth: document.documentElement.scrollWidth, scale: +(visualViewport?.scale ?? 1).toFixed(3), dpr,
    inputs, images, tiny: [...tiny].map(([k, n]) => `${k} x${n}`),
    headerH: header ? Math.round(header.getBoundingClientRect().height) : 0, vh: innerHeight,
    themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '', headerBg: header ? getComputedStyle(header).backgroundColor : '',
    theme: document.documentElement.getAttribute('data-theme'),
  };
}

if (!arg('touch-only', false)) for (const [dev, theme] of DEVICES) {
  const d = devices[dev]; const k = `${dev} ${theme}`; out.sweep[k] = {};
  console.log(`\n[sweep] ${k} (${d.viewport.width}x${d.viewport.height}, ${d.deviceScaleFactor}x): ${all.length} routes`);
  const ctx = await ctxOf(dev, theme);
  let n = 0;
  for (const r of all) {
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push('script: ' + String(e.message).slice(0, 160)));
    page.on('response', res => { const u = new URL(res.url()); if (u.origin === new URL(origin).origin && res.status() >= 400 && !(res.request().resourceType() === 'document' && r.path === '/404')) errors.push(`${res.status()} ${u.pathname}`); });
    page.on('requestfailed', req => { const u = new URL(req.url()); if (u.origin === new URL(origin).origin && !/ERR_ABORTED/.test(req.failure()?.errorText || '')) errors.push(`failed ${u.pathname} ${req.failure()?.errorText}`); });
    try {
      await go(page, r.path, theme);
      await revealAll(page, d.viewport.height);
      const m = await page.evaluate(measure);
      const tag = `${k} ${r.path}`;
      if (m.vw !== d.viewport.width || m.scale !== 1) fail(`${tag}: the layout viewport is ${m.vw} px at scale ${m.scale} on a ${d.viewport.width} px screen`);
      if (m.scrollWidth > m.vw + 1) fail(`${tag}: the page is ${m.scrollWidth} px wide on a ${m.vw} px screen`);
      m.inputs.forEach(f => fail(`${tag}: ${f.field} is ${f.size} px, so iOS Safari zooms the page when it takes focus (16 px or more)`));
      const need = Math.min(m.dpr, 2) * 0.9;
      for (const im of m.images) {
        if (im.density < need && im.maxW > im.natural * 1.05) fail(`${tag}: ${im.file} is drawn at ${im.density} source px per CSS px (${im.cssWidth} px wide) while a ${im.maxW} px file exists (sizes="${im.sizes}")`);
        else if (im.density < need) note(`${tag}: ${im.file} is ${im.natural} px wide, the largest file there is, drawn ${im.cssWidth} px wide (${im.density} px per CSS px on a ${m.dpr}x screen)`);
        else if (im.density > m.dpr * 2.2 && im.natural > 1400) note(`${tag}: ${im.file} is ${im.natural} px for ${im.cssWidth} CSS px (${im.density}x on a ${m.dpr}x screen)`);
      }
      [...new Set(errors)].forEach(e => fail(`${tag}: ${e}`));
      out.sweep[k][r.path] = { headerH: m.headerH, vh: m.vh, tiny: m.tiny, themeColor: m.themeColor, headerBg: m.headerBg, theme: m.theme, images: m.images.length };
      if (KEY.includes(r.path)) await page.screenshot({ path: `${OUT}/shots/${dev.replace(/\W+/g, '-')}-${theme}${r.path === '/' ? '-home' : r.path.replace(/\W+/g, '-')}.png` });
    } catch (e) { fail(`${k} ${r.path}: did not load (${String(e.message).split('\n')[0]})`); }
    await page.close();
    if (++n % 20 === 0) console.log(`  ${n}/${all.length}`);
  }
  await ctx.close();
}

/* ---------- Touch tests ---------- */
/* A finger drag as raw touch events (down, ten moves, up). Chrome's Input.synthesizeScrollGesture moves nothing in the
   headless browser (measured 15 November 2026: a page and a card row stayed at 0), so it would make these tests pass on
   nothing; raw touch events scroll a row 303 px. */
async function swipe(cdp, page, x, y, dx, dy, steps = 10) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let s = 1; s <= steps; s++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(x + dx * s / steps), y: Math.round(y + dy * s / steps) }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const visibleOne = (page, sel) => page.locator(sel).filter({ visible: true }).first();
async function headerBottom(page) { return page.evaluate(() => { const h = document.querySelector('[data-site-header], body > header'); if (!h) return 0; const r = h.getBoundingClientRect(); const pos = getComputedStyle(h).position; return (pos === 'sticky' || pos === 'fixed') && r.bottom > 0 ? r.bottom : 0; }); }

async function touchTests() {
  // 1. The phone menu by tap, portrait, on a phone and on a tablet.
  for (const [dev, theme] of [['iPhone 15 Pro', 'dark'], ['Galaxy S9+', 'light'], ['iPad Mini', 'dark']]) {
    const k = `menu ${dev}`; const ctx = await ctxOf(dev, theme); const page = await ctx.newPage();
    await go(page, '/about', theme);
    const cdp = await ctx.newCDPSession(page);
    // Control: with the menu closed, the same drag moves the page, so "still" below means something.
    await page.evaluate(() => scrollTo(0, 600)); await pause(page, 200);
    await swipe(cdp, page, Math.round(devices[dev].viewport.width / 2), Math.round(devices[dev].viewport.height * 0.6), 0, -300); await pause(page, 900);
    const control = (await page.evaluate(() => scrollY)) - 600;
    if (control <= 0) fail(`${k}: control: a touch drag with the menu closed did not move the page (${control} px), so the test cannot judge it`);
    await page.evaluate(() => scrollTo(0, 600)); await pause(page, 200);
    const y0 = await page.evaluate(() => scrollY);
    await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 500);
    const st = await page.evaluate(() => { const m = document.querySelector('[data-menu]'); return { open: !m.hidden, expanded: document.querySelector('[data-menu-open]').getAttribute('aria-expanded'), focusIn: m.contains(document.activeElement), locked: getComputedStyle(document.documentElement).overflow === 'hidden' || document.documentElement.style.overflow === 'hidden', inert: !!document.querySelector('main')?.closest('[inert]'), links: m.querySelectorAll('a[href]').length }; });
    // A touch drag on the open menu must not move the page behind it.
    await swipe(cdp, page, Math.round(devices[dev].viewport.width / 2), Math.round(devices[dev].viewport.height * 0.6), 0, -300);
    /* A drag on the open menu scrolls the menu itself, which glides on after the finger lifts; a tap during the glide only
       stops it (as on a phone), so the next tap waits for it to settle. */
    await pause(page, 1600);
    st.pageMoved = (await page.evaluate(() => scrollY)) - y0; st.control = control;
    st.menuScrolled = await page.evaluate(() => { const m = document.querySelector('[data-menu]'); const s = [m, ...m.querySelectorAll('*')].find(e => e.scrollTop > 0); return s ? Math.round(s.scrollTop) : 0; });
    out.touch[k] = st;
    if (!st.open || st.expanded !== 'true') fail(`${k}: a tap on Menu did not open it`);
    if (!st.focusIn) fail(`${k}: focus did not move into the open menu`);
    if (!st.locked || !st.inert) fail(`${k}: the page behind the open menu is not locked and inert (locked ${st.locked}, inert ${st.inert})`);
    if (st.pageMoved !== 0) fail(`${k}: a touch drag on the open menu moved the page behind it by ${st.pageMoved} px`);
    await visibleOne(page, '[data-menu-close]').tap(); await pause(page, 400);
    const shut = await page.evaluate(() => ({ hidden: document.querySelector('[data-menu]').hidden, focus: document.activeElement?.hasAttribute('data-menu-open'), y: scrollY }));
    if (!shut.hidden) fail(`${k}: a tap on Close did not close the menu`);
    if (!shut.focus) fail(`${k}: focus did not return to Menu after Close`);
    if (shut.y !== y0) fail(`${k}: closing the menu moved the page from ${y0} to ${shut.y}`);
    await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 400);
    const target = page.locator('[data-menu] a[href="/work"], [data-menu] a[href="/writing"], [data-menu] a[href^="/"]').filter({ visible: true }).first();
    const href = await target.getAttribute('href');
    await Promise.all([page.waitForURL(u => new URL(u).pathname === href, { timeout: 30000 }).catch(() => {}), target.tap()]);
    await pause(page, 400);
    const after = await page.evaluate(() => ({ path: location.pathname, hidden: document.querySelector('[data-menu]')?.hidden, overflow: document.documentElement.style.overflow }));
    if (after.path !== href) fail(`${k}: a tap on the menu link ${href} landed on ${after.path}`);
    if (!after.hidden || after.overflow === 'hidden') fail(`${k}: after following a menu link the menu is open or the page still locked`);
    await ctx.close();
  }

  // 2. The phone menu in landscape: every link can be scrolled to and is not covered.
  for (const dev of ['iPhone SE landscape', 'iPhone 15 Pro landscape']) {
    const k = `menu ${dev}`; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
    await go(page, '/', 'dark');
    const hasMenu = await page.locator('[data-menu-open]').filter({ visible: true }).count();
    if (!hasMenu) { out.touch[k] = 'header shows the full navigation'; await ctx.close(); continue; }
    await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 500);
    const res = await page.evaluate(async () => {
      const m = document.querySelector('[data-menu]'); const links = [...m.querySelectorAll('a[href], button')].filter(a => a.offsetParent !== null);
      const blocked = [];
      for (const a of links) { a.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 30)); const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), r.top + r.height / 2); if (!(hit && (a === hit || a.contains(hit))) || r.bottom > innerHeight + 1 || r.top < -1) blocked.push((a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30)); }
      return { links: links.length, blocked, vh: innerHeight, headerH: Math.round(document.querySelector('[data-site-header], body > header').getBoundingClientRect().height) };
    });
    out.touch[k] = res;
    if (res.blocked.length) fail(`${k}: ${res.blocked.length} of ${res.links} menu items cannot be reached or are covered: ${res.blocked.join(', ')}`);
    if (res.headerH / res.vh > 0.3) note(`${k}: the header takes ${res.headerH} of ${res.vh} px in landscape`);
    await ctx.close();
  }

  // 3. Header groups by tap on a tablet in landscape (no hover there).
  {
    const dev = 'iPad Pro 11 landscape'; const k = `header groups ${dev}`; const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage();
    await go(page, '/about', 'light');
    const hover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    const groups = await page.locator('[data-nav-group] .nav-group-button').filter({ visible: true }).count();
    const res = { hover, groups, opened: [], closedByOutside: null, navigated: null };
    if (!groups) note(`${k}: no header groups shown at ${devices[dev].viewport.width} px (the phone menu is used)`);
    for (let i = 0; i < groups; i++) {
      const btn = page.locator('[data-nav-group] .nav-group-button').filter({ visible: true }).nth(i);
      await btn.tap(); await pause(page, 450);
      const st = await btn.evaluate(b => { const g = b.closest('[data-nav-group]'); const a = [...g.querySelectorAll('a[href]')].find(x => x.getBoundingClientRect().width > 0); if (!a) return { exp: b.getAttribute('aria-expanded'), link: null }; const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + 10, r.top + r.height / 2); return { exp: b.getAttribute('aria-expanded'), link: a.getAttribute('href'), reachable: !!hit && (hit === a || a.contains(hit)) }; });
      res.opened.push({ name: (await btn.textContent()).trim(), ...st });
      if (st.exp !== 'true' || !st.reachable) fail(`${k}: a tap on "${(await btn.textContent()).trim()}" did not open a card with a reachable link`);
      await btn.tap(); await pause(page, 350);
      if ((await btn.getAttribute('aria-expanded')) !== 'false') fail(`${k}: a second tap on "${(await btn.textContent()).trim()}" did not close it`);
    }
    if (groups) {
      const btn = page.locator('[data-nav-group] .nav-group-button').filter({ visible: true }).first();
      await btn.tap(); await pause(page, 400);
      await page.locator('main h1').tap({ force: true }); await pause(page, 350);
      res.closedByOutside = (await btn.getAttribute('aria-expanded')) === 'false';
      if (!res.closedByOutside) fail(`${k}: a tap outside did not close the open card`);
      await btn.tap(); await pause(page, 400);
      const link = btn.locator('xpath=ancestor::*[@data-nav-group]').locator('a[href^="/"]').filter({ visible: true }).first();
      const href = await link.getAttribute('href');
      await Promise.all([page.waitForURL(u => new URL(u).pathname === href, { timeout: 30000 }).catch(() => {}), link.tap()]);
      res.navigated = new URL(page.url()).pathname === href;
      if (!res.navigated) fail(`${k}: a tap on the card link ${href} did not open it`);
    }
    out.touch[k] = res;
    await ctx.close();
  }

  // 4. The theme by tap: it switches, the browser bar colour follows, and no hover style stays on the button.
  {
    const dev = 'Pixel 7'; const k = `theme ${dev}`; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
    await go(page, '/work', 'dark');
    const read = () => page.evaluate(() => { const h = document.querySelector('[data-site-header], body > header'); const b = [...document.querySelectorAll('[data-theme-toggle]')].find(x => x.getBoundingClientRect().width > 0); const cs = b && getComputedStyle(b); return { theme: document.documentElement.getAttribute('data-theme'), bar: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'), headerBg: getComputedStyle(h).backgroundColor, pageBg: getComputedStyle(document.body).backgroundColor, transform: cs?.transform, translate: cs?.translate, hover: matchMedia('(hover: hover)').matches, coarse: matchMedia('(pointer: coarse)').matches }; });
    const before = await read();
    const btn = visibleOne(page, '[data-theme-toggle]');
    if (!(await btn.count())) { await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 400); }
    await visibleOne(page, '[data-theme-toggle]').tap(); await pause(page, 900);
    const after = await read();
    out.touch[k] = { before, after };
    if (before.hover || !before.coarse) fail(`${k}: the device profile reports hover ${before.hover}, coarse pointer ${before.coarse}`);
    if (after.theme === before.theme) fail(`${k}: a tap on the theme button did not switch the theme`);
    if (after.bar === before.bar) note(`${k}: the browser bar colour stays ${after.bar} in both themes (page ${before.pageBg} dark, ${after.pageBg} light)`);
    if ((after.transform && after.transform !== 'none') || (after.translate && after.translate !== 'none')) fail(`${k}: the theme button keeps a moved state after the tap (transform ${after.transform}, translate ${after.translate})`);
    await ctx.close();
  }

  // 5. A card row swiped sideways: it scrolls, snaps to a card, and the page does not move sideways.
  {
    const dev = 'iPhone 15 Pro'; const k = `swipe ${dev}`; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
    await go(page, '/', 'dark');
    await page.addStyleTag({ content: '[data-page="home"] > section, [data-lazy-block] { content-visibility: visible !important; }' });
    const rows = await page.evaluate(() => [...document.querySelectorAll('[data-scroll-row]')].map((r, i) => ({ i, scrolls: r.scrollWidth > r.clientWidth + 2, label: r.getAttribute('aria-label') })));
    const res = { rows, swiped: [] };
    const cdp = await ctx.newCDPSession(page);
    for (const row of rows.filter(r => r.scrolls)) {
      const box = await page.evaluate(i => { const r = document.querySelectorAll('[data-scroll-row]')[i]; r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect(); return { x: Math.round(b.left + b.width * 0.7), y: Math.round(b.top + Math.min(b.height / 2, 120)) }; }, row.i);
      await pause(page, 300);
      await swipe(cdp, page, box.x, box.y, -220, 0);
      await pause(page, 1200);
      const st = await page.evaluate(i => { const r = document.querySelectorAll('[data-scroll-row]')[i]; const pad = parseFloat(getComputedStyle(r).scrollPaddingInlineStart) || parseFloat(getComputedStyle(r).paddingInlineStart) || 0; const left = r.getBoundingClientRect().left; const off = Math.min(...[...r.children].map(c => Math.abs(c.getBoundingClientRect().left - left - pad))); return { scrollLeft: Math.round(r.scrollLeft), snappedOff: Math.round(off), pageX: scrollX, docWidth: document.documentElement.scrollWidth, vw: innerWidth }; }, row.i);
      res.swiped.push({ label: row.label, ...st });
      if (st.scrollLeft <= 0) fail(`${k}: a swipe on the row "${row.label}" did not scroll it`);
      else if (st.snappedOff > 4) fail(`${k}: after a swipe the row "${row.label}" rests ${st.snappedOff} px off a card's start`);
      if (st.pageX !== 0 || st.docWidth > st.vw + 1) fail(`${k}: the swipe moved the page sideways (scrollX ${st.pageX}, width ${st.docWidth})`);
    }
    if (!rows.some(r => r.scrolls)) note(`${k}: no card row scrolls sideways on Home at ${devices[dev].viewport.width} px`);
    out.touch[k] = res;
    await ctx.close();
  }

  // 6. The image preview by tap.
  {
    const dev = 'iPhone 15 Pro'; const k = `preview ${dev}`; const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage();
    await go(page, '/work/colaberry-design-system', 'light');
    await page.locator('.project-cover a[data-preview]').first().tap(); await pause(page, 700);
    const st = await page.evaluate(() => { const d = document.querySelector('dialog[data-image-preview]'); const r = d.getBoundingClientRect(); const c = d.querySelector('[data-close]').getBoundingClientRect(); return { open: d.open, fits: r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, close: { w: Math.round(c.width), h: Math.round(c.height), inside: c.top >= 0 && c.right <= innerWidth } }; });
    if (!st.open) fail(`${k}: a tap on the cover did not open the preview`);
    if (!st.fits) fail(`${k}: the preview is larger than the screen`);
    if (st.close.w < 44 || st.close.h < 44 || !st.close.inside) fail(`${k}: Close is ${st.close.w} x ${st.close.h} px or off screen`);
    await page.locator('dialog[data-image-preview] [data-zoom="in"]').tap(); await pause(page, 300);
    st.level = await page.locator('dialog[data-image-preview] .image-preview-level').textContent();
    if (st.level.trim() !== '150%') fail(`${k}: a tap on Zoom in reads "${st.level.trim()}"`);
    await page.locator('dialog[data-image-preview] [data-close]').tap(); await pause(page, 400);
    st.closed = !(await page.evaluate(() => document.querySelector('dialog[data-image-preview]').open));
    if (!st.closed) fail(`${k}: a tap on Close did not close the preview`);
    // A picture in a post's body: the phone draws a file near its width, and the preview still opens the whole file (data-full).
    await go(page, '/blog/how-i-build-one-linkedin-infographic-a-day', 'light');
    const body = page.locator('.prose a[data-preview] img').first();
    await body.scrollIntoViewIfNeeded();
    await body.evaluate(i => (i.complete && i.naturalWidth ? 0 : new Promise(r => { i.addEventListener('load', r, { once: true }); setTimeout(r, 10000); })));
    const pic = await body.evaluate(i => ({ shown: i.currentSrc.split('/').pop(), full: i.dataset.full || '', href: i.closest('a').getAttribute('href') }));
    await body.tap(); await pause(page, 400);
    await page.waitForFunction(() => document.querySelector('dialog[data-image-preview] .image-preview-frame')?.getAttribute('data-state') === 'open', null, { timeout: 15000 }).catch(() => {});
    pic.opened = await page.evaluate(() => { const d = document.querySelector('dialog[data-image-preview]'); const i = d.querySelector('.image-preview-image'); return { open: d.open, src: (i.getAttribute('src') || '').split('/').pop(), natural: i.naturalWidth }; });
    st.body = pic;
    if (!pic.full || pic.href !== pic.full) fail(`${k}: the body picture's preview link is ${pic.href}, not its whole file ${pic.full}`);
    if (!pic.shown || pic.shown === pic.full.split('/').pop()) fail(`${k}: the phone draws the whole file ${pic.shown} in the post's body`);
    if (!pic.opened.open || pic.opened.src !== pic.full.split('/').pop() || pic.opened.natural < 3000) fail(`${k}: the preview opened ${pic.opened.src} (${pic.opened.natural} px), not the whole file`);
    out.touch[k] = st;
    await ctx.close();
  }

  // 7. The contact form with the on-screen keyboard up (the visible area shrinks to about 330 px).
  {
    const dev = 'iPhone 15 Pro'; const k = `keyboard ${dev}`; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
    await go(page, '/contact', 'dark');
    const fields = ['#contact-name', '#contact-email', '#contact-topic', '#contact-message'];
    const present = await page.locator(fields[0]).count();
    const res = { fields: [] };
    if (!present) note(`${k}: no contact form on /contact (no form id set)`);
    else {
      await page.setViewportSize({ width: devices[dev].viewport.width, height: 330 });
      for (const f of fields) {
        await page.evaluate(() => scrollTo(0, 0)); await pause(page, 100);
        await page.locator(f).tap(); await pause(page, 350);
        const hb = await headerBottom(page);
        const st = await page.evaluate(sel => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const lab = document.querySelector(`label[for="${el.id}"]`)?.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), labelTop: lab ? Math.round(lab.top) : null, focused: document.activeElement === el, vh: innerHeight }; }, f);
        res.fields.push({ f, hb: Math.round(hb), ...st });
        if (!st.focused) fail(`${k}: a tap on ${f} did not focus it`);
        if (st.top < hb - 1 || st.top > st.vh - 24) fail(`${k}: with the keyboard up ${f} starts at ${st.top} px, outside the visible ${Math.round(hb)} to ${st.vh} px`);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('[data-form-submit], [data-contact-form] [type=submit]').first().tap(); await pause(page, 600);
      const hb = await headerBottom(page);
      const sum = await page.evaluate(() => { const s = document.querySelector('[data-form-summary]'); if (!s || s.hidden) return null; const r = s.getBoundingClientRect(); return { top: Math.round(r.top), focusIn: s.contains(document.activeElement) || document.activeElement === s, vh: innerHeight }; });
      res.summary = sum;
      if (!sum) fail(`${k}: sending the empty form showed no error summary`);
      else if (sum.top < hb - 1 || sum.top > sum.vh - 24) fail(`${k}: the error summary starts at ${sum.top} px, outside the visible ${Math.round(hb)} to ${sum.vh} px`);
    }
    out.touch[k] = res;
    await ctx.close();
  }

  // 8. Show more, copy email and a video, by tap.
  {
    const dev = 'Galaxy S9+'; const ctx = await ctxOf(dev, 'light', { permissions: ['clipboard-read', 'clipboard-write'] }); const page = await ctx.newPage();
    await go(page, '/resources', 'light');
    const more = page.locator('[data-show-more]').filter({ visible: true }).first();
    if (await more.count()) {
      const count = () => page.evaluate(() => [...document.querySelectorAll('[data-show-more]')][0].closest('section, [data-resource-list], main').querySelectorAll('li:not([hidden])').length);
      const before = await count(); await more.tap(); await pause(page, 500);
      const st = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { tag: a.tagName, inView: r.top >= 0 && r.bottom <= innerHeight }; });
      const after = await count(); const hb = await headerBottom(page);
      const top = await page.evaluate(() => Math.round(document.activeElement.getBoundingClientRect().top));
      out.touch['show more Galaxy S9+'] = { before, after, focus: st, top, hb };
      if (after <= before) fail('show more Galaxy S9+: a tap on Show more added nothing');
      if (!st.inView || top < hb - 1) fail(`show more Galaxy S9+: focus went to a ${st.tag} at ${top} px, not visible below the header`);
    } else note('show more Galaxy S9+: no Show more button on /resources');
    await go(page, '/contact', 'light');
    const copy = page.locator('[data-email-copy] button').filter({ visible: true }).first();
    if (await copy.count()) {
      await copy.tap(); await pause(page, 400);
      const st = await page.evaluate(() => [...document.querySelectorAll('[data-email-copy]')].find(w => w.dataset.state)?.dataset.state || '');
      out.touch['copy email Galaxy S9+'] = st;
      if (st !== 'copied') fail(`copy email Galaxy S9+: a tap on Copy left the state "${st}"`);
    }
    await go(page, '/blog/rich-content-fixture', 'light');
    const play = page.locator('[data-embed-load]').filter({ visible: true }).first();
    if (await play.count()) {
      await play.scrollIntoViewIfNeeded(); await play.tap(); await pause(page, 800);
      const st = await page.evaluate(() => { const e = document.querySelector('[data-embed]:has(iframe), [data-embed][data-state="loading"], [data-embed][data-state="loaded"]'); return e ? { state: e.dataset.state, iframe: !!e.querySelector('iframe') } : null; });
      out.touch['video Galaxy S9+'] = st;
      if (!st) fail('video Galaxy S9+: a tap on the video facade did not start loading the player');
    } else note('video Galaxy S9+: no video facade on /blog/rich-content-fixture');
    await ctx.close();
  }

  // 9. Rotation both ways keeps the page inside the screen.
  {
    const dev = 'iPhone 15 Pro'; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
    const P = devices[dev].viewport, L = devices['iPhone 15 Pro landscape'].viewport; const res = {};
    for (const p of ['/', '/work', '/about', '/blog/designing-for-two-users', '/case-studies/colaberry-design-system']) {
      await go(page, p, 'dark'); await page.evaluate(() => scrollTo(0, 900)); await pause(page, 200);
      const check = async label => { await pause(page, 600); const m = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, vw: innerWidth, scale: +(visualViewport?.scale ?? 1).toFixed(3), menuOpen: document.querySelector('[data-menu]') ? !document.querySelector('[data-menu]').hidden : false })); res[`${p} ${label}`] = m; if (m.w > m.vw + 1 || m.scale !== 1) fail(`rotation ${dev} ${p} ${label}: ${m.w} px wide on ${m.vw} px at scale ${m.scale}`); };
      await page.setViewportSize(L); await check('to landscape');
      await page.setViewportSize(P); await check('back to portrait');
    }
    out.touch[`rotation ${dev}`] = res;
    await ctx.close();
  }

  // 10. A touch scroll down Home with motion on: every reveal ends, nothing in the page stays hidden.
  {
    const dev = 'iPhone 15 Pro'; const k = `motion ${dev}`; const ctx = await ctxOf(dev, 'dark', { reducedMotion: 'no-preference' }); const page = await ctx.newPage();
    await go(page, '/', 'dark'); await pause(page, 2500);
    const motion = await page.evaluate(() => document.documentElement.getAttribute('data-motion'));
    const cdp = await ctx.newCDPSession(page);
    for (let i = 0; i < 80; i++) {
      const atEnd = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4);
      if (atEnd) break;
      await swipe(cdp, page, 196, 520, 0, -420);
      await pause(page, 250);
    }
    const reached = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4);
    if (!reached) fail(`${k}: touch scrolling did not reach the end of Home, so the test cannot judge it`);
    await pause(page, 3000);
    const hidden = await page.evaluate(() => {
      const list = [];
      for (const el of document.querySelectorAll('main *')) {
        if (!['P', 'H1', 'H2', 'H3', 'H4', 'LI', 'A', 'SPAN', 'IMG', 'FIGURE', 'BLOCKQUOTE'].includes(el.tagName) || el.closest('[aria-hidden="true"], [hidden], details:not([open])')) continue;
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
        if (el.tagName !== 'IMG' && !el.textContent.trim()) continue;
        let o = 1; for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); o *= parseFloat(cs.opacity); if (cs.visibility === 'hidden') o = 0; }
        if (o < 0.5) list.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} "${el.textContent.trim().slice(0, 40)}" (${o.toFixed(2)})`);
      }
      return list;
    });
    out.touch[k] = { motion, hidden: hidden.slice(0, 20), count: hidden.length };
    if (motion !== 'on') note(`${k}: motion did not switch on (data-motion "${motion}")`);
    if (hidden.length) fail(`${k}: after a touch scroll to the end ${hidden.length} element(s) stay hidden: ${hidden.slice(0, 5).join('; ')}`);
    await ctx.close();
  }
}
if (!arg('sweep-only', false)) { console.log('\n[touch]'); await touchTests(); }

/* ---------- Report ---------- */
// The notes are summarised once per kind and route, not per device, so the list stays readable.
const summary = {};
for (const [k, pages] of Object.entries(out.sweep)) for (const [p, m] of Object.entries(pages)) {
  if (m.tiny.length) (summary.tinyText ??= {})[`${k} ${p}`] = m.tiny;
  (summary.header ??= {})[k] = Math.max(summary.header?.[k] || 0, m.headerH);
  (summary.bar ??= new Set()).add(`${m.theme}: bar ${m.themeColor}, header ${m.headerBg}`);
}
if (summary.bar) summary.bar = [...summary.bar];
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify({ origin, when: new Date().toISOString(), fails, notes, summary, out }, null, 1));
await browser.close(); server?.close();
console.log(`\n${notes.length} note(s); report in ${OUT}/report.json, first views in ${OUT}/shots/`);
if (fails.length) { console.log(`FAILED: ${fails.length} failure(s).`); process.exit(1); }
console.log('PASSED: 0 failures.');
