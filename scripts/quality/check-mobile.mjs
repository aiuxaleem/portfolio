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
//
// Since 16 November 2026 (second mobile review, L-74) the sweep also runs, inside each touch device, the gate's own page
// checks (checks.mjs) and axe, which the gate runs only in desktop windows without touch, so every rule under
// `pointer: coarse` or `hover: none` is now checked too; the space between touch targets (8 px, CLAUDE.md 2.4); and a pass at
// 302 px, the width a 393 px phone lays out at with the system text size at 130% (Chrome on Android applies it as zoom).
// The touch tests gained: the keyboard test with a real touch at the field (no automatic scrolling) and the browser's own
// focus scrolling to the next field; responsiveness (INP) from real taps with the processor slowed four times; the
// accessibility tree of the open menu, the preview and the error summary; the Arabic pages by touch; swipes at three
// widths with a vertical-drag control; real rotation (screen orientation); the landscape menu by touch; reduced motion as a
// visitor gets it (fades); slow 4G (layout shift and the largest paint), blocked pictures and JavaScript off; a two-finger
// pinch; the contact fields' keyboard and autofill; no :hover rule outside @media (hover: hover). A missing feature is a
// failure, not a note.
// `--quick` (used by `npm run quality:quick`) sweeps only the key routes.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { devices } from 'playwright-core';
import { serve, launch, routes, arg, revealAll } from '../lib.mjs';
import { pageChecks, settleImages, targetSpacing } from './checks.mjs';

const PORT = 4461;
const LIVE = arg('origin', '');
const origin = LIVE || `http://127.0.0.1:${PORT}`;
const OUT = 'reports/mobile'; fs.mkdirSync(`${OUT}/shots`, { recursive: true }); fs.mkdirSync(`${OUT}/runs`, { recursive: true });
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
/* A run against dist needs the quality build (QUALITY_BUILD=1): its fixture pages carry states some tests need (the video facade). */
if (!LIVE && !fs.existsSync('dist/_states.html')) { console.error('dist/ is not a quality build (no /_states): run QUALITY_BUILD=1 npm run build first.'); process.exit(1); }
const server = LIVE ? null : await serve('dist', PORT);
const browser = await launch();
/* What this run tested, recorded in its report so a result is tied to its code and build: the commit, a hash of the uncommitted
   changes, the build's time, the browser, this script, and the start and end. */
const started = new Date().toISOString();
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const hash = t => createHash('sha256').update(t).digest('hex').slice(0, 12);
const provenance = { commit: sh('git rev-parse HEAD'), uncommitted: hash(sh('git status --porcelain') + sh('git diff')), build: LIVE ? 'live' : fs.statSync('dist/index.html').mtime.toISOString(), browser: browser.version(), script: hash(fs.readFileSync(new URL(import.meta.url), 'utf8')) };
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
  : arg('quick', false) ? KEY.filter(p => LIVE || p !== '/admin/login').map(p => ({ path: p }))
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

const hoverStray = new Set();
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
      // The gate's page checks and axe, now with touch, a coarse pointer and the device's density.
      await page.evaluate(settleImages);
      for (const f of await page.evaluate(pageChecks)) fail(`${tag}: ${f.check}: ${f.detail}`);
      await page.addScriptTag({ content: AXE });
      for (const v of await page.evaluate(async tags => (await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })).violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s), first: ${String(v.nodes[0].target[0]).slice(0, 80)}`), AXE_TAGS)) fail(`${tag}: axe: ${v}`);
      if (d.isMobile) for (const s of await page.evaluate(targetSpacing)) fail(`${tag}: target-spacing: ${s}`);
      if (dev === DEVICES[0][0]) for (const sel of await page.evaluate(hoverLint)) hoverStray.add(sel);
      out.sweep[k][r.path] = { headerH: m.headerH, vh: m.vh, tiny: m.tiny, themeColor: m.themeColor, headerBg: m.headerBg, theme: m.theme, images: m.images.length };
      if (KEY.includes(r.path)) await page.screenshot({ path: `${OUT}/shots/${dev.replace(/\W+/g, '-')}-${theme}${r.path === '/' ? '-home' : r.path.replace(/\W+/g, '-')}.png` });
    } catch (e) { fail(`${k} ${r.path}: did not load (${String(e.message).split('\n')[0]})`); }
    await page.close();
    if (++n % 20 === 0) console.log(`  ${n}/${all.length}`);
  }
  await ctx.close();
}

for (const sel of hoverStray) fail(`hover rules (sweep): "${sel}" is a :hover rule outside @media (hover: hover), so it can stay on after a tap`);

/* The system text size at 130%: Chrome on Android applies it as page zoom, so a 393 px phone lays out at 302 px (under the
   320 px the rules ask for). Nothing may scroll sideways or be cut there; at 150% (262 px) a control off the screen fails and
   the other faults are notes. */
if (!arg('touch-only', false)) for (const [w, strict] of [[302, true], [262, false]]) {
  const base = devices['Pixel 7'];
  console.log(`\n[text size] ${w} px (${strict ? '130%, failures' : '150%, notes'}): ${all.length} routes`);
  const ctx = await browser.newContext({ viewport: { width: w, height: Math.round(w * 2.1) }, userAgent: base.userAgent, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce' });
  for (const r of all) {
    const page = await ctx.newPage();
    try {
      await go(page, r.path, 'light'); await revealAll(page, Math.round(w * 2.1));
      const found = (await page.evaluate(pageChecks)).filter(f => ['horizontal-scroll', 'text-clipped', 'target-off-screen', 'word-broken', 'number-unit-split'].includes(f.check));
      /* At 150% a control off the screen still fails: the menu button out of reach leaves the site without navigation. */
      for (const f of found) (strict || f.check === 'target-off-screen' ? fail : note)(`text ${w}px ${r.path}: ${f.check}: ${f.detail}`);
      if (strict) for (const sp of await page.evaluate(targetSpacing)) fail(`text ${w}px ${r.path}: target-spacing: ${sp}`);
    } catch (e) { fail(`text ${w}px ${r.path}: did not load (${String(e.message).split('\n')[0]})`); }
    await page.close();
  }
  await ctx.close();
}

/* Elements of the page's main region that stay under half opacity (or hidden) once scrolled into view. Runs in the page. */
function stillHidden() {
  const list = [];
  for (const el of document.querySelectorAll('main *')) {
    if (!['P', 'H1', 'H2', 'H3', 'H4', 'LI', 'A', 'SPAN', 'IMG', 'FIGURE', 'BLOCKQUOTE'].includes(el.tagName) || el.closest('[aria-hidden="true"], [hidden], details:not([open])')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (el.tagName !== 'IMG' && !el.textContent.trim()) continue;
    let o = 1; for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); o *= parseFloat(cs.opacity); if (cs.visibility === 'hidden') o = 0; }
    if (o < 0.5) list.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} "${el.textContent.trim().slice(0, 40)}" (${o.toFixed(2)})`);
  }
  return list;
}

/* :hover rules outside @media (hover: hover) in the page's stylesheets (CLAUDE.md 2.7): on a touch screen such a style stays
   on after a tap. Runs in the page. */
function hoverLint() {
  const out = [];
  const walk = (rules, inHover) => { for (const r of rules) {
    if (r instanceof CSSMediaRule) { const q = r.conditionText || r.media.mediaText; walk(r.cssRules, inHover || (/\(\s*hover\s*:\s*hover\s*\)/.test(q) && !/not\s*\(\s*hover/.test(q) && !/^\s*not\b/.test(q))); }
    else if (r instanceof CSSSupportsRule || (typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule) || (typeof CSSLayerBlockRule !== 'undefined' && r instanceof CSSLayerBlockRule)) walk(r.cssRules, inHover);
    else if (r instanceof CSSStyleRule) { if (!inHover && /:hover/.test(r.selectorText)) out.push(r.selectorText.slice(0, 120)); if (r.cssRules?.length) walk(r.cssRules, inHover); }
  } };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules, false); } catch {} }
  return out;
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

/* One test that throws must not take the others and the report with it: each test runs as a step, and an error is a failure. */
async function step(name, fn) {
  try { await fn(); } catch (e) { fail(`touch test ${name} stopped with an error: ${String(e.message).split('\n')[0].slice(0, 200)}`); }
}

async function touchTests() {
  // 1. The phone menu by tap, portrait, on a phone and on a tablet.
  await step('1', async () => {
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
  });

  // 2. The phone menu in landscape: every link can be scrolled to and is not covered.
  await step('2', async () => {
    for (const dev of ['iPhone SE landscape', 'iPhone 15 Pro landscape']) {
      const k = `menu ${dev}`; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
      await go(page, '/', 'dark');
      const hasMenu = await page.locator('[data-menu-open]').filter({ visible: true }).count();
      if (!hasMenu) {
        /* No menu button: the header itself must then carry the pages, on the screen and not covered. */
        const nav = await page.evaluate(() => [...document.querySelectorAll('[data-site-header] nav a[href], [data-site-header] nav button')].filter(a => { const r = a.getBoundingClientRect(); if (r.width < 1 || r.right > innerWidth + 1 || r.left < -1) return false; const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!hit && (hit === a || a.contains(hit)); }).length);
        out.touch[k] = { headerLinks: nav };
        if (nav < 3) fail(`${k}: no menu button and only ${nav} reachable link(s) in the header`);
        await ctx.close(); continue;
      }
      await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 500);
      const res = await page.evaluate(async () => {
        const m = document.querySelector('[data-menu]'); const links = [...m.querySelectorAll('a[href], button')].filter(a => a.offsetParent !== null);
        const blocked = [];
        for (const a of links) { a.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 30)); const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), r.top + r.height / 2); if (!(hit && (a === hit || a.contains(hit))) || r.bottom > innerHeight + 1 || r.top < -1) blocked.push((a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30)); }
        return { links: links.length, blocked, vh: innerHeight, headerH: Math.round(document.querySelector('[data-site-header], body > header').getBoundingClientRect().height) };
      });
      /* The same reach by finger: from the top of the menu, drags until its last item shows and can be hit (the check above
         scrolls by script, which proves the items are not covered but not that a finger gets there). */
      await page.evaluate(() => { const m = document.querySelector('[data-menu]'); m.scrollTop = 0; });
      const cdpL = await ctx.newCDPSession(page); const vp = devices[dev].viewport;
      let drags = 0, last = null;
      for (; drags < 12; drags++) {
        last = await page.evaluate(() => { const m = document.querySelector('[data-menu]'); const items = [...m.querySelectorAll('a[href], button')].filter(a => a.offsetParent !== null); const a = items[items.length - 1]; const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), r.top + r.height / 2); return { name: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30), visible: r.top >= 0 && r.bottom <= innerHeight + 1, hit: !!hit && (hit === a || a.contains(hit)) }; });
        if (last.visible && last.hit) break;
        await swipe(cdpL, page, Math.round(vp.width / 2), Math.round(vp.height * 0.75), 0, -Math.round(vp.height * 0.5)); await pause(page, 700);
      }
      res.lastByTouch = { ...last, drags };
      out.touch[k] = res;
      if (!(last.visible && last.hit)) fail(`${k}: after ${drags} finger drags the menu's last item "${last.name}" is still out of reach`);
      if (res.blocked.length) fail(`${k}: ${res.blocked.length} of ${res.links} menu items cannot be reached or are covered: ${res.blocked.join(', ')}`);
      if (res.headerH / res.vh > 0.3) note(`${k}: the header takes ${res.headerH} of ${res.vh} px in landscape`);
      await ctx.close();
    }
  });

  // 3. Header groups by tap on a tablet in landscape (no hover there).
  await step('3', async () => {
    {
      const dev = 'iPad Pro 11 landscape'; const k = `header groups ${dev}`; const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage();
      await go(page, '/about', 'light');
      const hover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
      const groups = await page.locator('[data-nav-group] .nav-group-button').filter({ visible: true }).count();
      const res = { hover, groups, opened: [], closedByOutside: null, navigated: null };
      if (!groups) fail(`${k}: no header groups shown at ${devices[dev].viewport.width} px, where the header carries them`);
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
        /* Outside means outside: a point near the screen's lower corner that no link covers (a forced tap on the page title could
           land on a link of the open card, which covers the title on a wide tablet, and leave the page). */
        const urlBeforeOutside = page.url();
        const spot = await page.evaluate(() => { for (const [x, y] of [[12, innerHeight - 12], [innerWidth - 12, innerHeight - 12], [12, Math.round(innerHeight / 2)]]) { const e = document.elementFromPoint(x, y); if (e && !e.closest('a, button, input, select, textarea, summary, [role="button"]')) return { x, y }; } return null; });
        if (spot) await page.touchscreen.tap(spot.x, spot.y); else fail(`${k}: no empty spot to tap outside the open card`);
        await pause(page, 350);
        if (page.url() !== urlBeforeOutside) fail(`${k}: the tap outside the card followed a link to ${page.url()}`);
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
  });

  // 4. The theme by tap: it switches, the browser bar colour follows, and no hover style stays on the button.
  await step('4', async () => {
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
      if (after.bar === before.bar) fail(`${k}: the browser bar colour stays ${after.bar} in both themes (page ${before.pageBg} dark, ${after.pageBg} light)`);
      if ((after.transform && after.transform !== 'none') || (after.translate && after.translate !== 'none')) fail(`${k}: the theme button keeps a moved state after the tap (transform ${after.transform}, translate ${after.translate})`);
      await ctx.close();
    }
  });

  // 5. A card row swiped sideways at three phone widths: it scrolls, snaps to a card, the page does not move sideways, and a
  //    vertical drag that starts on the row still scrolls the page (the trap of a mandatory snap with a contained overscroll).
  await step('5', async () => {
    for (const w of [360, 390, 414]) {
      const base = devices['iPhone 15 Pro']; const k = `swipe ${w}px`;
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, userAgent: base.userAgent, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', reducedMotion: 'reduce' });
      const page = await ctx.newPage();
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
        /* Math.abs: a right-to-left row reports a negative scrollLeft. */
        const urlBefore = page.url();
        const st = await page.evaluate(i => { const r = document.querySelectorAll('[data-scroll-row]')[i]; const pad = parseFloat(getComputedStyle(r).scrollPaddingInlineStart) || parseFloat(getComputedStyle(r).paddingInlineStart) || 0; const left = r.getBoundingClientRect().left; const off = Math.min(...[...r.children].map(c => Math.abs(c.getBoundingClientRect().left - left - pad))); return { scrollLeft: Math.round(Math.abs(r.scrollLeft)), snappedOff: Math.round(off), pageX: scrollX, docWidth: document.documentElement.scrollWidth, vw: innerWidth }; }, row.i);
        // Vertical control on the same row: a drag upward that starts on a card moves the page.
        const y0 = await page.evaluate(() => scrollY);
        await swipe(cdp, page, box.x, box.y, 0, -250); await pause(page, 900);
        st.verticalMoved = (await page.evaluate(() => scrollY)) - y0;
        res.swiped.push({ label: row.label, ...st });
        if (st.scrollLeft <= 0) fail(`${k}: a swipe on the row "${row.label}" did not scroll it`);
        else if (st.snappedOff > 4) fail(`${k}: after a swipe the row "${row.label}" rests ${st.snappedOff} px off a card's start`);
        if (st.pageX !== 0 || st.docWidth > st.vw + 1) fail(`${k}: the swipe moved the page sideways (scrollX ${st.pageX}, width ${st.docWidth})`);
        if (st.verticalMoved <= 0) fail(`${k}: a vertical drag that starts on the row "${row.label}" did not scroll the page`);
        if (page.url() !== urlBefore) fail(`${k}: a drag on the row "${row.label}" followed a card's link to ${page.url()}`);
      }
      /* Home has card rows below 520 px of container (L-56); none that scrolls means the feature broke. */
      if (!rows.some(r => r.scrolls)) fail(`${k}: no card row scrolls sideways on Home at ${w} px`);
      out.touch[k] = res;
      await ctx.close();
    }
  });

  // 6. The image preview by tap.
  await step('6', async () => {
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
  });

  // 7. The contact form with the on-screen keyboard up (the visible area shrinks to about 330 px).
  await step('7', async () => {
    {
      const dev = 'iPhone 15 Pro'; const k = `keyboard ${dev}`; const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage();
      await go(page, '/contact', 'dark');
      const fields = ['#contact-name', '#contact-email', '#contact-topic', '#contact-message'];
      const present = await page.locator(fields[0]).count();
      const res = { fields: [] };
      if (!present) fail(`${k}: no contact form on /contact (the build has no form id, so the form test cannot run)`);
      else {
        /* Each field is tapped with a raw touch at its own position on the full-height screen (Playwright's tap would first
           scroll the field clear of anything covering it, so a covered field would still pass: shown by the second review,
           16 November 2026, L-74). The touch lands on the field only if nothing covers it. The screen then shrinks to the
           height left above a keyboard (330 px) and the field is scrolled the way the browser brings a focused field into
           view; the next field is then reached with the keyboard's Next (Tab), which uses the browser's own focus scrolling
           and the page's scroll padding under the sticky header. In every case the field's centre must hit the field
           itself (nothing over it) and sit below the header. The visual-viewport model of iOS Safari and Chrome 108+ (the
           layout keeps its height and only the visible part shrinks) cannot be emulated in this engine: a real device or
           WebKit is needed for it. */
        const full = devices[dev].viewport;
        const cdpK = await ctx.newCDPSession(page);
        const probe = sel => page.evaluate(sel => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const cx = r.left + Math.min(r.width / 2, 40), cy = r.top + r.height / 2; const hit = document.elementFromPoint(cx, cy); return { top: Math.round(r.top), bottom: Math.round(r.bottom), cx: Math.round(cx), cy: Math.round(cy), covered: !(hit && (hit === el || el.contains(hit))), by: hit && hit !== el && !el.contains(hit) ? (hit.tagName.toLowerCase() + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.split(' ')[0] : '')) : '', focused: document.activeElement === el, vh: innerHeight }; }, sel);
        for (let i = 0; i < fields.length; i++) {
          const f = fields[i];
          await page.setViewportSize(full); await page.evaluate(sel => { const el = document.querySelector(sel); scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight / 2); document.activeElement?.blur(); }, f); await pause(page, 250);
          const before = await probe(f);
          await cdpK.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: before.cx, y: before.cy }] });
          await cdpK.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(page, 350);
          const tapped = await probe(f);
          if (!tapped.focused) fail(`${k}: a touch at ${f} (${before.cx}, ${before.cy}) did not focus it${before.covered ? `; ${before.by} covers it` : ''}`);
          await page.setViewportSize({ width: full.width, height: 330 }); await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'nearest' }), f); await pause(page, 300);
          const hb = await headerBottom(page); const up = await probe(f);
          res.fields.push({ f, hb: Math.round(hb), tapped: tapped.focused, ...up });
          if (up.covered || up.top < hb - 1 || up.top > up.vh - 24) fail(`${k}: with the keyboard up ${f} starts at ${up.top} px (visible ${Math.round(hb)} to ${up.vh} px)${up.covered ? `, covered by ${up.by}` : ''}`);
          if (i + 1 < fields.length) {
            await page.keyboard.press('Tab'); await pause(page, 350);
            const next = await probe(fields[i + 1]); const hb2 = await headerBottom(page);
            if (!next.focused) fail(`${k}: Next (Tab) from ${f} did not reach ${fields[i + 1]}`);
            /* The caret starts at the field's top: its first two lines (48 px) must show; a tall text area may run on below. */
            else if (next.covered || next.top < hb2 - 1 || next.top > next.vh - 48) fail(`${k}: Next (Tab) brought ${fields[i + 1]} to ${next.top} to ${next.bottom} px (visible ${Math.round(hb2)} to ${next.vh} px)${next.covered ? `, covered by ${next.by}` : ''}`);
          }
        }
        await page.setViewportSize({ width: full.width, height: 330 });
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
  });

  // 8. Show more, copy email and a video, by tap.
  await step('8', async () => {
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
      } else fail('show more Galaxy S9+: no Show more button on /resources (the library lists more than twelve)');
      await go(page, '/contact', 'light');
      const copy = page.locator('[data-email-copy] button').filter({ visible: true }).first();
      if (await copy.count()) {
        await copy.tap(); await pause(page, 400);
        const st = await page.evaluate(() => [...document.querySelectorAll('[data-email-copy]')].find(w => w.dataset.state)?.dataset.state || '');
        out.touch['copy email Galaxy S9+'] = st;
        if (st !== 'copied') fail(`copy email Galaxy S9+: a tap on Copy left the state "${st}"`);
      } else fail('copy email Galaxy S9+: no copy-email button on /contact');
      const videoPage = LIVE ? '/videos' : '/blog/rich-content-fixture';
      await go(page, videoPage, 'light');
      const play = page.locator('[data-embed-load]').filter({ visible: true }).first();
      if (await play.count()) {
        await play.scrollIntoViewIfNeeded(); await play.tap(); await pause(page, 800);
        const st = await page.evaluate(() => { const e = document.querySelector('[data-embed]:has(iframe), [data-embed][data-state="loading"], [data-embed][data-state="loaded"]'); return e ? { state: e.dataset.state, iframe: !!e.querySelector('iframe') } : null; });
        out.touch['video Galaxy S9+'] = st;
        if (!st) fail('video Galaxy S9+: a tap on the video facade did not start loading the player');
      } else fail(`video Galaxy S9+: no video facade on ${videoPage}${LIVE ? '' : ' (a quality build is needed: QUALITY_BUILD=1)'}`);
      await ctx.close();
    }
  });

  // 9. Rotation both ways, as the device reports it (screen size and orientation change and the page gets its events, not only
  //    a resized window), on a phone and a tablet: the page stays inside the screen, an open menu stays usable, and the
  //    reading place is kept (the text that was at the top of the screen is still on it).
  await step('9', async () => {
    for (const dev of ['iPhone 15 Pro', 'Galaxy S9+', 'iPad Mini']) {
      const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage(); const cdpR = await ctx.newCDPSession(page);
      const P = devices[dev].viewport, dpr = devices[dev].deviceScaleFactor; const res = {};
      const turn = async landscape => {
        const w = landscape ? P.height : P.width, h = landscape ? P.width : P.height;
        await cdpR.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true, screenWidth: w, screenHeight: h, screenOrientation: landscape ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 } });
        await pause(page, 700);
      };
      for (const p of ['/', '/work', '/about', '/blog/designing-for-two-users', '/case-studies/colaberry-design-system']) {
        await turn(false); await go(page, p, 'dark');
        await page.evaluate(() => { window.__turns = 0; screen.orientation?.addEventListener('change', () => window.__turns++); scrollTo(0, Math.min(1600, document.documentElement.scrollHeight / 3)); });
        await pause(page, 300);
        const anchor = await page.evaluate(() => { const hb = document.querySelector('[data-site-header], body > header')?.getBoundingClientRect().bottom || 0; const el = [...document.querySelectorAll('main p, main h2, main h3, main li')].find(e => { const r = e.getBoundingClientRect(); return r.top >= hb && r.top < innerHeight / 2 && e.textContent.trim().length > 20; }); if (!el) return null; el.setAttribute('data-anchor-probe', ''); return el.textContent.trim().slice(0, 40); });
        for (const [landscape, label] of [[true, 'to landscape'], [false, 'back to portrait']]) {
          await turn(landscape);
          const m = await page.evaluate(() => { const a = document.querySelector('[data-anchor-probe]'); const r = a?.getBoundingClientRect(); return { w: document.documentElement.scrollWidth, vw: innerWidth, scale: +(visualViewport?.scale ?? 1).toFixed(3), type: screen.orientation?.type, turns: window.__turns, anchorOn: a ? r.bottom > 0 && r.top < innerHeight : null }; });
          res[`${p} ${label}`] = m;
          if (m.w > m.vw + 1 || m.scale !== 1) fail(`rotation ${dev} ${p} ${label}: ${m.w} px wide on ${m.vw} px at scale ${m.scale}`);
          if (!String(m.type).startsWith(landscape ? 'landscape' : 'portrait')) fail(`rotation ${dev} ${p} ${label}: the page reports the orientation ${m.type}, so the rotation was not real`);
          if (anchor && m.anchorOn === false) note(`rotation ${dev} ${p} ${label}: the text that was at the top ("${anchor}") is no longer on the screen`);
        }
      }
      // An open menu across a rotation: still open, Close on the screen and working.
      if (await page.locator('[data-menu-open]').filter({ visible: true }).count()) {
        await turn(false); await go(page, '/about', 'dark');
        await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 500);
        await turn(true);
        const m = await page.evaluate(() => { const menu = document.querySelector('[data-menu]'); const c = [...document.querySelectorAll('[data-menu-close]')].find(x => x.getBoundingClientRect().width > 0); const r = c?.getBoundingClientRect(); return { open: !menu.hidden, close: r ? r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth : false }; });
        res.menuAcrossRotation = m;
        if (m.open && !m.close) fail(`rotation ${dev}: with the menu open, Close is off the screen after turning to landscape`);
        if (m.open) { await visibleOne(page, '[data-menu-close]').tap(); await pause(page, 400); if (!(await page.evaluate(() => document.querySelector('[data-menu]').hidden))) fail(`rotation ${dev}: Close did not close the menu after a rotation`); }
        /* Whether the rotation closed the menu or Close did, the page behind is usable again: not locked, not inert. */
        const after = await page.evaluate(() => ({ locked: document.documentElement.style.overflow === 'hidden', inert: !!document.querySelector('main')?.closest('[inert]'), hidden: document.querySelector('[data-menu]').hidden }));
        res.afterRotation = after;
        if (after.hidden && (after.locked || after.inert)) fail(`rotation ${dev}: with the menu closed after a rotation the page is still ${after.locked ? 'locked' : ''}${after.locked && after.inert ? ' and ' : ''}${after.inert ? 'inert' : ''}`);
      }
      out.touch[`rotation ${dev}`] = res;
      await ctx.close();
    }
  });

  // 10. A touch scroll down Home with motion on: every reveal ends, nothing in the page stays hidden.
  await step('10', async () => {
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
      const hidden = await page.evaluate(stillHidden);
      out.touch[k] = { motion, hidden: hidden.slice(0, 20), count: hidden.length };
      if (motion !== 'on') fail(`${k}: motion did not switch on (data-motion "${motion}"), so the test ran without it`);
      if (hidden.length) fail(`${k}: after a touch scroll to the end ${hidden.length} element(s) stay hidden: ${hidden.slice(0, 5).join('; ')}`);
      await ctx.close();
    }
  });

  // 11. Responsiveness from real taps, with the processor slowed four times (Lighthouse's phone setting) and motion on as most
  //     visitors have it: the longest event of each interaction, from the tap to the next paint (INP, CLAUDE.md 2.9; Event
  //     Timing entries with an interaction id, read from the page). Each interaction runs five times on a fresh page. Noise on
  //     a busy machine only ever adds time, so the fastest of the five is the interaction's own cost and is held to the 200 ms
  //     budget (a failure above it); the median is reported beside it (16 November 2026, L-74: medians of the same taps ranged
  //     from 24 to 720 ms between runs). One case taps as soon as the page has loaded, while the motion module still starts.
  //     A tap that records no interaction fails.
  await step('11', async () => {
    {
      const dev = 'Pixel 7'; const k = `inp ${dev}`; const res = {};
      const ctx = await ctxOf(dev, 'light', { reducedMotion: 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
      await ctx.addInitScript(() => { window.__inp = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.interactionId) window.__inp.push({ id: e.interactionId, d: Math.round(e.duration) }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {} });
      /* Each case: the page, the taps that set the scene (not measured), the tap that is measured, and how long the page settles first. */
      const CASES = [
        ['open the menu', '/about', [], p => visibleOne(p, '[data-menu-open]').tap()],
        ['switch the theme in the menu', '/about', [p => visibleOne(p, '[data-menu-open]').tap()], p => visibleOne(p, '[data-menu] [data-theme-toggle]').tap()],
        ['close the menu', '/about', [p => visibleOne(p, '[data-menu-open]').tap()], p => visibleOne(p, '[data-menu-close]').tap()],
        ['show more', '/resources', [], p => visibleOne(p, '[data-show-more]').tap()],
        ['open the image preview', '/work/colaberry-design-system', [], p => p.locator('.project-cover a[data-preview]').first().tap()],
        ['zoom in', '/work/colaberry-design-system', [p => p.locator('.project-cover a[data-preview]').first().tap()], p => p.locator('dialog[data-image-preview] [data-zoom="in"]').tap()],
        ['copy the email address', '/contact', [], p => visibleOne(p, '[data-email-copy] button').tap()],
        ['send the empty form', '/contact', [], p => p.locator('[data-form-submit], [data-contact-form] [type=submit]').first().tap()],
        ['open the menu at once after load', '/', [], p => visibleOne(p, '[data-menu-open]').tap(), 0],
      ];
      for (const [label, path, before, act, settleMs = 2500] of CASES) {
        const runs = [];
        for (let n = 0; n < 5; n++) {
          const page = await ctx.newPage(); const cdpI = await ctx.newCDPSession(page);
          if (settleMs === 0) await cdpI.send('Emulation.setCPUThrottlingRate', { rate: 4 });
          await go(page, path, 'light'); await pause(page, settleMs);
          for (const b of before) { await b(page); await pause(page, 700); }
          await cdpI.send('Emulation.setCPUThrottlingRate', { rate: 4 });
          await page.evaluate(() => { window.__inp = []; }); await act(page); await pause(page, 1500);
          runs.push(await page.evaluate(() => { const by = {}; for (const e of window.__inp) by[e.id] = Math.max(by[e.id] || 0, e.d); const v = Object.values(by); return v.length ? Math.max(...v) : null; }));
          await page.close();
        }
        const got = runs.filter(v => v !== null).sort((a, b) => a - b);
        const fastest = got.length === 5 ? got[0] : null, median = got.length === 5 ? got[2] : null;
        res[label] = { runs, fastest, median };
        if (fastest === null) fail(`${k}: ${label}: ${5 - got.length} of 5 taps recorded no interaction, so its responsiveness cannot be judged`);
        else if (fastest > 200) fail(`${k}: ${label} took at least ${fastest} ms from the tap to the next paint in five tries (${runs.join(', ')} ms), over the 200 ms budget`);
        else if (median > 200) note(`${k}: ${label}: fastest ${fastest} ms, median ${median} ms of ${runs.join(', ')} ms (the median over budget on this machine; the fastest is held to it)`);
      }
      out.touch[k] = res;
      await ctx.close();
    }
  });

  // 12. What a screen reader is given on a phone (the accessibility tree, read through the browser's own protocol): with the
  //     menu open only the menu is there (the page behind is left out) and it is a named dialog; the preview is a named dialog
  //     whose buttons have names and whose zoom level is announced; after an empty send the error summary is announced or
  //     takes focus and links to each field. A real VoiceOver and TalkBack pass is still a manual step.
  await step('12', async () => {
    {
      const dev = 'iPhone 15 Pro'; const k = `screen reader ${dev}`; const res = {};
      const ctx = await ctxOf(dev, 'dark'); const page = await ctx.newPage(); const cdpA = await ctx.newCDPSession(page);
      const tree = async () => (await cdpA.send('Accessibility.getFullAXTree')).nodes;
      const val = x => String(x?.value ?? ''); /* an AX property is { type, value } */
      await go(page, '/about', 'dark');
      await visibleOne(page, '[data-menu-open]').tap(); await pause(page, 600);
      let nodes = await tree();
      const mains = nodes.filter(n => !n.ignored && val(n.role) === 'main');
      const dialogs = nodes.filter(n => !n.ignored && val(n.role) === 'dialog');
      res.menu = { mains: mains.length, dialogs: dialogs.map(n => val(n.name)) };
      if (mains.length) fail(`${k}: with the menu open the page's main region is still in the accessibility tree`);
      if (!dialogs.length || !dialogs.every(n => val(n.name).trim())) fail(`${k}: the open menu is not a named dialog in the accessibility tree (${JSON.stringify(res.menu.dialogs)})`);
      await visibleOne(page, '[data-menu-close]').tap(); await pause(page, 400);
      await go(page, '/work/colaberry-design-system', 'dark');
      await page.locator('.project-cover a[data-preview]').first().tap(); await pause(page, 800);
      nodes = await tree();
      const pd = nodes.filter(n => !n.ignored && val(n.role) === 'dialog');
      const unnamed = nodes.filter(n => !n.ignored && val(n.role) === 'button' && !val(n.name).trim());
      const live = await page.evaluate(() => { const l = document.querySelector('dialog[data-image-preview] .image-preview-level'); return l ? !!l.closest('[aria-live], [role="status"], output') : false; });
      res.preview = { dialogs: pd.map(n => val(n.name)), unnamedButtons: unnamed.length, levelAnnounced: live };
      if (!pd.length || !pd.every(n => val(n.name).trim())) fail(`${k}: the image preview is not a named dialog (${JSON.stringify(res.preview.dialogs)})`);
      if (unnamed.length) fail(`${k}: ${unnamed.length} button(s) without a name while the preview is open`);
      if (!live) fail(`${k}: the preview's zoom level is not in a live region, so a screen reader does not hear it change`);
      await page.locator('dialog[data-image-preview] [data-close]').tap(); await pause(page, 400);
      await go(page, '/contact', 'dark');
      await page.locator('[data-form-submit], [data-contact-form] [type=submit]').first().tap(); await pause(page, 700);
      const sum = await page.evaluate(() => { const s = document.querySelector('[data-form-summary]'); if (!s || s.hidden) return null; const links = [...s.querySelectorAll('a[href^="#"]')]; return { announced: !!s.closest('[role="alert"], [aria-live]') || s.getAttribute('role') === 'alert', focused: s.contains(document.activeElement) || document.activeElement === s, links: links.length, linked: links.every(a => document.getElementById(a.getAttribute('href').slice(1))) }; });
      res.summary = sum;
      if (!sum) fail(`${k}: no error summary after an empty send`);
      else { if (!sum.announced && !sum.focused) fail(`${k}: the error summary is neither announced nor focused`); if (!sum.links || !sum.linked) fail(`${k}: the error summary does not link to each field (${sum.links} link(s))`); }
      // Card names: a card is one link, so its whole name is read on every swipe; a very long one is noted.
      for (const p of ['/work', '/case-studies', '/blog']) {
        await go(page, p, 'dark');
        const long = (await tree()).filter(n => !n.ignored && val(n.role) === 'link' && val(n.name).length > 160).map(n => `${val(n.name).length} characters: "${val(n.name).slice(0, 50)}…"`);
        if (long.length) note(`${k}: ${p}: ${long.length} link(s) with a name longer than 160 characters, e.g. ${long[0]}`);
      }
      out.touch[k] = res;
      await ctx.close();
    }
  });

  // 13. The Arabic pages by touch (right to left): inside the screen in both orientations, the menu or the header's own
  //     navigation reachable by tap, a picture's preview by tap.
  await step('13', async () => {
    {
      const dev = 'iPhone 15 Pro'; const res = {};
      const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage(); const cdpR = await ctx.newCDPSession(page);
      const P = devices[dev].viewport;
      const orient = (w, h, type) => cdpR.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 3, mobile: true, screenWidth: w, screenHeight: h, screenOrientation: { type, angle: type.startsWith('land') ? 90 : 0 } });
      for (const p of ['/ar', '/ar/case-studies/colaberry-design-system']) {
        const k = `arabic ${p}`; const r = {};
        await orient(P.width, P.height, 'portraitPrimary');
        await go(page, p, 'light');
        r.dir = await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.documentElement).direction);
        if (r.dir !== 'rtl') fail(`${k}: the page is not right to left (${r.dir})`);
        for (const [w, h, o] of [[P.width, P.height, 'portraitPrimary'], [P.height, P.width, 'landscapePrimary']]) {
          await orient(w, h, o); await pause(page, 600);
          const m = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, vw: innerWidth, x: scrollX }));
          r[o] = m;
          if (m.w > m.vw + 1 || m.x !== 0) fail(`${k} ${o}: ${m.w} px wide on ${m.vw} px (scrollX ${m.x})`);
        }
        await orient(P.width, P.height, 'portraitPrimary'); await pause(page, 400);
        const menu = page.locator('[data-menu-open]').filter({ visible: true });
        if (await menu.count()) {
          await menu.first().tap(); await pause(page, 500);
          const open = await page.evaluate(() => !document.querySelector('[data-menu]').hidden);
          if (!open) fail(`${k}: a tap on the menu button did not open the menu`);
          else { await visibleOne(page, '[data-menu-close]').tap(); await pause(page, 400); if (!(await page.evaluate(() => document.querySelector('[data-menu]').hidden))) fail(`${k}: Close did not close the menu`); }
          r.menu = open;
        } else {
          const nav = await page.evaluate(() => [...document.querySelectorAll('header a[href]')].filter(a => { const b = a.getBoundingClientRect(); return b.width > 0 && b.right <= innerWidth + 1 && b.left >= -1; }).length);
          r.headerLinks = nav;
          if (nav < 2) fail(`${k}: no menu button and fewer than two header links on the screen, so the other pages cannot be reached by tap`);
        }
        const pic = page.locator('a[data-preview]').filter({ visible: true }).first();
        if (await pic.count()) {
          await pic.scrollIntoViewIfNeeded(); await pic.tap(); await pause(page, 800);
          const st = await page.evaluate(() => { const d = document.querySelector('dialog[data-image-preview]'); return d ? { open: d.open } : null; });
          r.preview = st;
          if (!st?.open) fail(`${k}: a tap on a picture did not open the preview`);
          else await page.locator('dialog[data-image-preview] [data-close]').tap();
        }
        res[p] = r;
      }
      out.touch.arabic = res;
      await ctx.close();
    }
  });

  // 14. Reduced motion as a visitor gets it (fades, L-54): the head script gives fade mode to a real browser, not to an
  //     automated one, so the automation flag is hidden here. Home scrolled to the end by touch: nothing stays hidden.
  await step('14', async () => {
    {
      const dev = 'iPhone 15 Pro'; const k = `fade ${dev}`;
      const ctx = await ctxOf(dev, 'light'); await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); });
      const page = await ctx.newPage(); const cdpF = await ctx.newCDPSession(page);
      await go(page, '/', 'light'); await pause(page, 1500);
      const motion = await page.evaluate(() => document.documentElement.getAttribute('data-motion'));
      for (let i = 0; i < 80; i++) { if (await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4)) break; await swipe(cdpF, page, 196, 520, 0, -420); await pause(page, 250); }
      const reached = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4);
      await pause(page, 2500);
      const hidden = await page.evaluate(stillHidden);
      out.touch[k] = { motion, reached, hidden: hidden.slice(0, 10), count: hidden.length };
      if (motion !== 'fade') fail(`${k}: with reduced motion a real browser should get fade mode, got "${motion}"`);
      if (!reached) fail(`${k}: touch scrolling did not reach the end of Home, so the test cannot judge it`);
      if (hidden.length) fail(`${k}: after a touch scroll to the end ${hidden.length} element(s) stay hidden: ${hidden.slice(0, 5).join('; ')}`);
      await ctx.close();
    }
  });

  // 15. Slow 4G with the processor slowed four times: no layout shift while fonts and pictures arrive (CLS under 0.1,
  //     CLAUDE.md 2.9), on six templates (Home, a case study, a post, a project, Resources, the Arabic Home), through the load
  //     and a scroll to the end; and the largest paint (LCP) is
  //     recorded against the 2.5 s budget (a note) and fails past 4 s, where Core Web Vitals call it poor (the page may still
  //     be loading behind a slow line, but past 4 s a visitor on 4G waits too long whatever the machine).
  await step('15', async () => {
    {
      const dev = 'Galaxy S9+'; const res = {};
      const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage(); const cdpN = await ctx.newCDPSession(page);
      await page.addInitScript(() => { window.__lcp = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__lcp = Math.round(e.startTime); window.__lcpEl = e.element; } }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {} });
      await page.addInitScript(() => { window.__cls = 0; window.__shifts = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; if (e.value > 0.01) window.__shifts.push({ v: +e.value.toFixed(3), who: (e.sources || []).map(s => s.node ? (s.node.nodeName + (s.node.className && typeof s.node.className === 'string' ? '.' + s.node.className.split(' ')[0] : '')) : '').join(', ') }); } }).observe({ type: 'layout-shift', buffered: true }); } catch {} });
      await cdpN.send('Network.enable');
      /* DevTools' own Slow 4G preset (562.5 ms round trip, 1.6 Mbps x 0.9 down, 750 kbps x 0.9 up): Lighthouse's 150 ms is a simulated
         round trip, kinder by about 3.75 times for a real throttle (second review, 16 November 2026, L-74). */
      await cdpN.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: Math.round(1.6 * 0.9 * 1024 * 1024 / 8), uploadThroughput: Math.round(750 * 0.9 * 1024 / 8) });
      await cdpN.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdpN.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      for (const p of ['/', '/case-studies/colaberry-design-system', '/blog/designing-for-two-users', '/work/colaberry-design-system', '/resources', '/ar']) {
        await page.goto(url(p, 'light'), { waitUntil: 'load', timeout: 180000 }); await pause(page, 2000);
        const lcp = await page.evaluate(() => window.__lcp);
        /* The largest paint, if a picture, is never lazy-loaded and asks for high priority (CLAUDE.md 2.9). */
        const lcpImg = await page.evaluate(() => { const e = window.__lcpEl; if (!e || e.tagName !== 'IMG') return null; return { src: (e.currentSrc || e.src).split('/').pop().slice(0, 50), loading: e.getAttribute('loading'), priority: e.getAttribute('fetchpriority') }; });
        if (lcpImg && lcpImg.loading === 'lazy') fail(`slow 4G ${p}: the largest paint is the picture ${lcpImg.src}, which is lazy-loaded`);
        if (lcpImg && lcpImg.priority !== 'high') note(`slow 4G ${p}: the largest paint is the picture ${lcpImg.src} without fetchpriority="high"`);
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h; y += 500) { await page.evaluate(v => scrollTo(0, v), y); await pause(page, 120); }
        await pause(page, 1500);
        const m = await page.evaluate(() => ({ cls: +window.__cls.toFixed(3), shifts: window.__shifts.slice(0, 5) }));
        m.lcp = lcp; res[p] = m;
        if (m.cls >= 0.1) fail(`slow 4G ${p}: layout shift ${m.cls} (under 0.1): ${JSON.stringify(m.shifts)}`);
        if (!lcp) fail(`slow 4G ${p}: no largest paint was recorded`);
        else if (lcp > 4000) fail(`slow 4G ${p}: the largest paint came at ${lcp} ms (poor past 4,000 ms; budget 2,500)`);
        else if (lcp > 2500) note(`slow 4G ${p}: the largest paint came at ${lcp} ms (budget 2,500 ms; measured, not gated)`);
      }
      await cdpN.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      out.touch['slow 4G'] = res;
      await ctx.close();
    }
  });

  // 16. Pictures that fail to load (a blocked host, a dropped connection): the layout keeps each picture's space and the
  //     space shows a placeholder colour, not a hole (CLAUDE.md 2.6).
  await step('16', async () => {
    {
      const dev = 'iPhone 15 Pro'; const res = {};
      const ctx = await ctxOf(dev, 'dark'); await ctx.route(/\.(webp|avif|jpe?g|png)(\?|$)/i, r => r.abort());
      const page = await ctx.newPage();
      for (const p of ['/work', '/case-studies/colaberry-design-system', '/blog']) {
        await go(page, p, 'dark'); await revealAll(page, devices[dev].viewport.height).catch(() => {});
        const m = await page.evaluate(() => {
          const bad = [];
          for (const img of document.querySelectorAll('main img')) {
            const r = img.getBoundingClientRect(); if (r.width < 40 || img.closest('[aria-hidden="true"]') || /blur/.test(getComputedStyle(img).filter)) continue;
            const name = (img.getAttribute('src') || '').split('/').pop().slice(0, 40);
            if (r.height < 20) { bad.push(`${name} collapsed to ${Math.round(r.height)} px`); continue; }
            /* The placeholder must be the picture's own frame: the picture itself or a wrapper that holds nothing but it (a card,
               which holds the title and words too, does not count). */
            let painted = false;
            for (let n = img; n && n !== document.body; n = n.parentElement) { if (n !== img && n.textContent.trim()) break; const cs = getComputedStyle(n); if ((cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) || cs.backgroundImage !== 'none') { painted = true; break; } }
            if (!painted) bad.push(`${name} leaves a hole (no placeholder colour)`);
          }
          return { bad: bad.slice(0, 8), count: bad.length, wide: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        res[p] = m;
        if (m.count) fail(`blocked pictures ${p}: ${m.count} picture(s) without a placeholder: ${m.bad.slice(0, 3).join('; ')}`);
        if (m.wide) fail(`blocked pictures ${p}: the page scrolls sideways once pictures fail`);
      }
      out.touch['blocked pictures'] = res;
      await ctx.close();
    }
  });

  // 17. JavaScript off on a phone: the Menu link opens the site map, and every page's text shows once scrolled into view.
  await step('17', async () => {
    {
      const dev = 'iPhone 15 Pro'; const res = {};
      const ctx = await ctxOf(dev, 'light', { javaScriptEnabled: false }); const page = await ctx.newPage();
      for (const p of ['/', '/about', '/case-studies/colaberry-design-system', '/contact']) {
        await page.goto(url(p, 'light'), { waitUntil: 'load', timeout: 60000 });
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h; y += 500) { await page.evaluate(v => scrollTo(0, v), y); await pause(page, 60); }
        await pause(page, 1600); await page.evaluate(() => scrollTo(0, 0)); await pause(page, 1600);
        const hidden = await page.evaluate(stillHidden);
        res[p] = { hidden: hidden.length };
        if (hidden.length) fail(`no JavaScript ${p}: ${hidden.length} element(s) stay hidden: ${hidden.slice(0, 3).join('; ')}`);
      }
      await page.goto(url('/', 'light'), { waitUntil: 'load' });
      const link = page.locator('[data-menu-nojs]').filter({ visible: true }).first();
      if (!(await link.count())) fail('no JavaScript /: no Menu link in the header');
      else {
        const box = await link.boundingBox(); res.menuLink = box;
        if (box.width < 44 || box.height < 44) fail(`no JavaScript /: the Menu link is ${Math.round(box.width)} x ${Math.round(box.height)} px`);
        await Promise.all([page.waitForURL(u => new URL(u).pathname.startsWith('/sitemap'), { timeout: 30000 }).catch(() => {}), link.tap()]);
        if (!new URL(page.url()).pathname.startsWith('/sitemap')) fail(`no JavaScript /: the Menu link led to ${new URL(page.url()).pathname}, not the site map`);
      }
      out.touch['no JavaScript'] = res;
      await ctx.close();
    }
  });

  // 18. Pinch zoom with two fingers (raw touch points): the page zooms (the viewport never forbids it, CLAUDE.md 2.4, and
  //     nothing on the page swallows the gesture), on three pages.
  await step('18', async () => {
    {
      const dev = 'iPhone 15 Pro'; const res = {};
      const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage(); const cdpP = await ctx.newCDPSession(page);
      const pinch = async (cx, cy, from = 40, to = 160, steps = 12) => {
        await cdpP.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - from, y: cy, id: 1 }, { x: cx + from, y: cy, id: 2 }] });
        for (let s = 1; s <= steps; s++) { const d = from + (to - from) * s / steps; await cdpP.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(cx - d), y: cy, id: 1 }, { x: Math.round(cx + d), y: cy, id: 2 }] }); await page.waitForTimeout(16); }
        await cdpP.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(page, 600);
      };
      const vp = devices[dev].viewport;
      for (const p of ['/', '/case-studies/colaberry-design-system', '/contact']) {
        await go(page, p, 'light'); await page.evaluate(() => scrollTo(0, 400)); await pause(page, 300);
        await pinch(Math.round(vp.width / 2), Math.round(vp.height / 2));
        const scale = await page.evaluate(() => +(visualViewport?.scale ?? 1).toFixed(2));
        res[p] = scale;
        if (!(scale > 1.2)) fail(`pinch ${dev} ${p}: a two-finger pinch left the page at scale ${scale}`);
      }
      out.touch.pinch = res;
      await ctx.close();
    }
  });

  // 19. The contact form's fields tell the phone what they hold: the email field brings up the email keyboard and offers
  //     the saved address (type email, autocomplete email), the name field offers the saved name.
  await step('19', async () => {
    {
      const dev = 'iPhone 15 Pro'; const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage();
      await go(page, '/contact', 'light');
      const f = await page.evaluate(() => { const q = s => document.querySelector(s); const e = q('#contact-email'), n = q('#contact-name'); return e && n ? { emailType: e.type, emailAuto: e.getAttribute('autocomplete'), nameAuto: n.getAttribute('autocomplete'), emailInputmode: e.getAttribute('inputmode') } : null; });
      out.touch['form fields'] = f;
      if (!f) fail('form fields iPhone 15 Pro: no contact form on /contact');
      else {
        if (f.emailType !== 'email') fail(`form fields iPhone 15 Pro: the email field is type "${f.emailType}", so the phone shows the plain keyboard`);
        if (f.emailAuto !== 'email') fail(`form fields iPhone 15 Pro: the email field's autocomplete is "${f.emailAuto}", not email`);
        if (f.nameAuto !== 'name') fail(`form fields iPhone 15 Pro: the name field's autocomplete is "${f.nameAuto}", not name`);
      }
      await ctx.close();
    }
  });

  // 20. No hover style can stick after a tap: every :hover rule in the site's stylesheets sits inside @media (hover: hover)
  //     (CLAUDE.md 2.7). Read from the styles each page carries (the stylesheet is inlined into the page), on five pages.
  await step('20', async () => {
    {
      const res = {}; const stray = new Map();
      const ctx = await ctxOf('Pixel 7', 'light'); const page = await ctx.newPage();
      for (const p of ['/', '/about', '/contact', '/resources', '/case-studies/colaberry-design-system']) {
        await go(page, p, 'light');
        const found = await page.evaluate(hoverLint);
        res[p] = found.length; found.forEach(sel => stray.set(sel, (stray.get(sel) || 0) + 1));
      }
      out.touch['hover rules'] = { perPage: res, outside: [...stray.keys()].slice(0, 20) };
      for (const sel of stray.keys()) fail(`hover rules: "${sel}" is a :hover rule outside @media (hover: hover), so it can stay on after a tap`);
      await ctx.close();
    }
  });

  // 21. Motion on, as most visitors have it, on the key pages: scrolled to the end by touch, nothing scrolls sideways (parallax
  //     and reveals are where overflow appears), no text is cut, and nothing stays hidden.
  await step('21', async () => {
    {
      const dev = 'iPhone 15 Pro'; const res = {};
      const ctx = await ctxOf(dev, 'dark', { reducedMotion: 'no-preference' }); const page = await ctx.newPage(); const cdpM = await ctx.newCDPSession(page);
      for (const p of ['/about', '/work', '/case-studies/colaberry-design-system', '/blog/designing-for-two-users', '/resources']) {
        await go(page, p, 'dark'); await pause(page, 2000);
        for (let i = 0; i < 80; i++) { if (await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4)) break; await swipe(cdpM, page, 196, 520, 0, -420); await pause(page, 200); }
        const reached = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 4);
        await pause(page, 2500);
        const m = await page.evaluate(() => ({ wide: document.documentElement.scrollWidth > innerWidth + 1, x: scrollX }));
        const cut = (await page.evaluate(pageChecks)).filter(f => ['horizontal-scroll', 'text-clipped'].includes(f.check));
        const hidden = await page.evaluate(stillHidden);
        res[p] = { reached, wide: m.wide, cut: cut.length, hidden: hidden.length };
        if (!reached) fail(`motion on ${p}: touch scrolling did not reach the end, so the test cannot judge it`);
        if (m.wide || m.x !== 0) fail(`motion on ${p}: the page scrolls sideways with motion on`);
        cut.forEach(f => fail(`motion on ${p}: ${f.check}: ${f.detail}`));
        if (hidden.length) fail(`motion on ${p}: ${hidden.length} element(s) stay hidden: ${hidden.slice(0, 3).join('; ')}`);
      }
      out.touch['motion on pages'] = res;
      await ctx.close();
    }
  });

  // 22. The first view of a phone on its side (844 x 390, the gate's landscape size): the hero's main action is on the first
  //     screen on the pages whose words allow it (L-74 tightened the heroes for this), and never under the header.
  await step('22', async () => {
    {
      const res = {};
      const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, userAgent: devices['iPhone 15 Pro landscape'].userAgent, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      for (const p of ['/', '/work', '/contact', '/skills']) {
        await go(page, p, 'light');
        const m = await page.evaluate(() => { const a = document.querySelector('main [data-hero-ctas] a, main .site-hero-ctas a, main .contact-block-ctas a'); if (!a) return null; const r = a.getBoundingClientRect(); const hb = document.querySelector('[data-site-header]')?.getBoundingClientRect().bottom || 0; return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, hb: Math.round(hb), label: a.textContent.trim().slice(0, 30) }; });
        res[p] = m;
        if (!m) fail(`landscape first view ${p}: no hero action found`);
        else if (m.bottom > m.vh + 1 || m.top < m.hb - 1) fail(`landscape first view ${p}: "${m.label}" spans ${m.top} to ${m.bottom} px on a ${m.vh} px screen under a ${m.hb} px header`);
      }
      out.touch['landscape first view'] = res;
      await ctx.close();
    }
  });

  // 23. The phone menu with an external keyboard (a tablet with a keyboard case): Tab stays inside the open menu, Escape closes
  //     it and focus returns to the menu button.
  await step('23', async () => {
    {
      const dev = 'iPad Mini'; const k = `menu keyboard ${dev}`; const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage();
      await go(page, '/about', 'light');
      await visibleOne(page, '[data-menu-open]').focus(); await page.keyboard.press('Enter'); await pause(page, 600);
      let escaped = 0;
      for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => document.querySelector('[data-menu]').contains(document.activeElement)))) escaped++; }
      for (let i = 0; i < 5; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => document.querySelector('[data-menu]').contains(document.activeElement)))) escaped++; }
      await page.keyboard.press('Escape'); await pause(page, 500);
      const st = await page.evaluate(() => ({ hidden: document.querySelector('[data-menu]').hidden, back: document.activeElement?.hasAttribute('data-menu-open') }));
      out.touch[k] = { escaped, ...st };
      if (escaped) fail(`${k}: Tab left the open menu ${escaped} time(s) in 45 presses`);
      if (!st.hidden) fail(`${k}: Escape did not close the menu`);
      else if (!st.back) fail(`${k}: after Escape focus did not return to the menu button`);
      await ctx.close();
    }
  });

  // 24. The hero stacks swipe (L-76): a sideways finger drag on the front card brings the next card forward and does not
  //     open its link; a vertical drag on the card scrolls the page and leaves the stack alone; the arrow key on the front
  //     card moves the stack and keeps focus on the new front card. A missing stack fails.
  await step('24', async () => {
    const dev = 'Pixel 7'; const ctx = await ctxOf(dev, 'light'); const page = await ctx.newPage(); const cdpS = await ctx.newCDPSession(page); const res = {};
    for (const p of ['/work', '/case-studies', '/my-design-systems']) {
      await go(page, p, 'light'); await pause(page, 800);
      const count = () => page.evaluate(() => document.querySelector('[data-site-stack]')?.previousElementSibling?.querySelector('bdi')?.textContent?.trim() || '');
      const box = await page.evaluate(() => { const c = document.querySelector('[data-site-stack] [data-stack-card][data-pos="0"]'); if (!c) return null; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, n: document.querySelectorAll('[data-site-stack] [data-stack-card]').length }; });
      if (!box) { fail(`hero swipe ${p}: there is no hero stack`); continue; }
      if (box.n < 2) { note(`hero swipe ${p}: one card, nothing to swipe`); continue; }
      await pause(page, 300);
      const url0 = page.url(), c0 = await count();
      await swipe(cdpS, page, Math.round(box.x + box.w * 0.25), Math.round(box.y), -Math.round(box.w * 0.6), 0); await pause(page, 700);
      const c1 = await count(), stayed = page.url() === url0;
      const y0 = await page.evaluate(() => scrollY);
      await swipe(cdpS, page, Math.round(box.x), Math.round(box.y), 0, -220); await pause(page, 600);
      const c2 = await count(), y1 = await page.evaluate(() => scrollY);
      await page.evaluate(() => { document.querySelector('[data-site-stack]')?.scrollIntoView({ block: 'center' }); document.querySelector('[data-site-stack] [data-stack-card][data-pos="0"] a')?.focus(); });
      await page.keyboard.press('ArrowRight'); await pause(page, 500);
      const c3 = await count(), front = await page.evaluate(() => !!document.activeElement?.closest('[data-stack-card][data-pos="0"]'));
      res[p] = { cards: box.n, before: c0, afterSwipe: c1, stayed, afterVerticalDrag: c2, scrolled: y1 - y0, afterArrowKey: c3, focusOnFront: front };
      if (c1 === c0) fail(`hero swipe ${p}: a sideways swipe did not bring the next card forward (counter stayed ${c0})`);
      if (!stayed) fail(`hero swipe ${p}: the swipe opened the card's link`);
      if (c2 !== c1) fail(`hero swipe ${p}: a vertical drag on the card moved the stack (${c1} to ${c2})`);
      if (y1 - y0 < 50) fail(`hero swipe ${p}: a vertical drag on the card did not scroll the page (${y1 - y0} px)`);
      if (c3 === c2) fail(`hero swipe ${p}: the arrow key on the front card did not move the stack`);
      if (!front) fail(`hero swipe ${p}: after the arrow key, focus is not on the new front card`);
    }
    out.touch['hero swipe'] = res;
    await ctx.close();
  });

  // 25. Cards that stack on scroll (L-76), with motion on, on a phone and a laptop: a list of four or more is marked stacking;
  //     as the page scrolls each card sticks at or under the header (above it only when taller than the screen, and then with
  //     its foot on screen); a covered row recedes; a focused card comes to the front; nothing scrolls sideways. With
  //     reduced motion (the gate's own runs) the list stays as authored, unmarked.
  await step('25', async () => {
    const res = {};
    for (const [label, make] of [['iPhone 15 Pro', () => ctxOf('iPhone 15 Pro', 'dark', { reducedMotion: 'no-preference' })], ['laptop 1280 x 800', () => browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark', reducedMotion: 'no-preference' })]]) {
      const ctx = await make(); const page = await ctx.newPage();
      for (const p of ['/case-studies', '/my-design-systems', '/skills']) {
        await go(page, p, 'dark'); await pause(page, 1500);
        const marked = await page.evaluate(() => document.querySelectorAll('[data-stacking]').length);
        if (!marked) { const n = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('[data-stack-scroll]')].map(l => [...l.children].filter(li => !li.hidden).length))); if (n >= 4) fail(`stack on scroll ${label} ${p}: a list of ${n} cards is not stacking`); else note(`stack on scroll ${label} ${p}: no list of four or more`); continue; }
        const head = await headerBottom(page);
        let worst = 0, covered = 0, wide = false;
        for (let i = 0; i < 60; i++) {
          const m = await page.evaluate(top => {
            /* The header's edge as it is now: scrolled, it slides its bar of websites away (site.css), so the edge measured
               at the top of the page is not where it is while cards stick. */
            const hd = document.querySelector('[data-site-header], body > header'), hr = hd?.getBoundingClientRect();
            const h = hd && /sticky|fixed/.test(getComputedStyle(hd).position) && hr.bottom > 0 ? hr.bottom : top;
            const lis = [...document.querySelectorAll('[data-stacking] > li')].filter(li => !li.hidden);
            let bad = 0, rec = 0;
            for (const li of lis) {
              const r = li.getBoundingClientRect(); const stuck = getComputedStyle(li).position === 'sticky';
              if (!stuck) bad = Math.max(bad, 999);
              /* Judged only while its list runs on past the screen's foot, so the card should still be held; once the list's
                 end comes up, the stuck cards leave with it, as they should. */
              const listGoesOn = li.parentElement.getBoundingClientRect().bottom > innerHeight + 1;
              /* Whether it fits is judged by its layout height: a covered card is drawn up to 4% smaller (motion.css), which does not
                 make a card taller than the space fit. */
              if (listGoesOn && r.top < h - 1 && r.bottom < innerHeight - 1 && li.offsetHeight < innerHeight - h) bad = Math.max(bad, Math.round(h - r.top));
              if (Number(li.style.getPropertyValue('--stack-recede')) >= 0.98) rec++;
            }
            return { bad, rec, wide: document.documentElement.scrollWidth > innerWidth + 1, end: scrollY + innerHeight >= document.documentElement.scrollHeight - 4 };
          }, head);
          worst = Math.max(worst, m.bad); covered = Math.max(covered, m.rec); wide = wide || m.wide;
          if (m.end) break;
          await page.evaluate(() => scrollBy(0, 240)); await pause(page, 120);
        }
        /* Focus a card that is covered: it must come to the front, uncovered (2.4.11). */
        const focus = await page.evaluate(() => {
          const lis = [...document.querySelectorAll('[data-stacking] > li')].filter(li => !li.hidden);
          const target = lis.find(li => Number(li.style.getPropertyValue('--stack-recede')) > 0.5) || lis[0];
          const a = target?.querySelector('a, button'); if (!a) return { tested: false };
          a.focus(); const r = a.getBoundingClientRect(); const top = document.elementFromPoint(Math.min(innerWidth - 2, r.left + Math.min(20, r.width / 2)), Math.max(1, r.top + Math.min(10, r.height / 2)));
          return { tested: true, front: !!top && (target.contains(top) || top === target) };
        });
        res[`${label} ${p}`] = { lists: marked, worstAboveHeader: worst, rowsCovered: covered, sideways: wide, focus };
        if (worst === 999) fail(`stack on scroll ${label} ${p}: a card in a stacking list is not sticky`);
        else if (worst > 2) fail(`stack on scroll ${label} ${p}: a card that fits the screen stuck ${worst} px under the header's edge`);
        if (!covered) fail(`stack on scroll ${label} ${p}: no row receded as the next one covered it`);
        if (wide) fail(`stack on scroll ${label} ${p}: the page scrolls sideways`);
        if (focus.tested && !focus.front) fail(`stack on scroll ${label} ${p}: a focused card stays covered`);
      }
      await ctx.close();
    }
    {
      const ctx = await ctxOf('iPhone 15 Pro', 'dark'); const page = await ctx.newPage(); await go(page, '/case-studies', 'dark'); await pause(page, 800);
      const marked = await page.evaluate(() => document.querySelectorAll('[data-stacking]').length);
      res['reduced motion /case-studies'] = { marked };
      if (marked) fail('stack on scroll: with reduced motion a list still stacks');
      await ctx.close();
    }
    out.touch['stack on scroll'] = res;
  });
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
/* report.json is the latest run; every run is also kept under runs/ by its time, so a later run never overwrites the evidence of an earlier one. */
const when = new Date().toISOString(), report = JSON.stringify({ origin, started, when, args: process.argv.slice(2), provenance, fails, notes, summary, out }, null, 1);
fs.writeFileSync(`${OUT}/report.json`, report); fs.writeFileSync(`${OUT}/runs/${when.replace(/[:.]/g, '-')}.json`, report);
await browser.close(); server?.close();
console.log(`\n${notes.length} note(s); report in ${OUT}/report.json, first views in ${OUT}/shots/`);
if (fails.length) { console.log(`FAILED: ${fails.length} failure(s).`); process.exit(1); }
console.log('PASSED: 0 failures.');
