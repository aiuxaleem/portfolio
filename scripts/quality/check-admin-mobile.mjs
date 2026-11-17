// The admin area on a phone, signed in (16 November 2026, second mobile review, L-74): the owner runs the admin from his
// phone (it installs as an app and takes LinkedIn links from the share sheet), and check-admin-ui.mjs checks it only in
// desktop windows without touch. Against a running site with the admin and its database:
//   ADMIN_APP=1 npm run build && node scripts/quality/serve-production.mjs      (or npm run dev)
//   node scripts/quality/check-admin-mobile.mjs --origin=http://localhost:4323
// On Pixel 7 (light) and iPhone 15 Pro (dark): every page in the list at the device's width and density with touch, the
// gate's page checks, axe, fields of 16 px or more (iOS zooms the page below that) and the space between targets; then by
// touch: the bar at the foot of the screen (fixed, every item a full target, never over the end of the page), an editor
// with the keyboard up (a focused field is never under the save bar or the top bar), and the share page's refused state.
// It only reads: nothing is saved, published or deleted (the share page is given a link it refuses, which writes nothing).
// Ends with PASSED or FAILED.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { devices } from 'playwright-core';
import { ROOT, launch, arg } from '../lib.mjs';
import { pageChecks, targetSpacing } from './checks.mjs';

const origin = String(arg('origin', 'http://127.0.0.1:4321')).replace(/\/$/, '');
const local = name => { const f = path.join(ROOT, '.env.local'); if (!fs.existsSync(f)) return undefined; return fs.readFileSync(f, 'utf8').match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, 'm'))?.[1]; };
const EMAIL = process.env.ADMIN_EMAIL || local('ADMIN_EMAIL'), PASSWORD = process.env.ADMIN_PASSWORD || local('ADMIN_PASSWORD');
if (!EMAIL || !PASSWORD) { console.error('ADMIN_EMAIL and ADMIN_PASSWORD are needed (in .env.local).'); process.exit(1); }
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const HEADERS = { 'x-forwarded-for': '203.0.113.61, admin-mobile-check' };

/* The pages the owner reaches from a phone: the dashboard, each kind of list and editor he uses most, the new-entry form,
   the pictures, and the share page in both its states. An editor is opened on the first entry of its list. */
const ROUTES = [
  { name: 'sign-in', path: '/admin/login', signedOut: true },
  { name: 'dashboard', path: '/admin' },
  { name: 'linkedin-posts list', path: '/admin/linkedin-posts' }, { name: 'linkedin-posts editor', path: '/admin/linkedin-posts', first: true },
  { name: 'posts list', path: '/admin/posts' }, { name: 'posts editor', path: '/admin/posts', first: true },
  { name: 'projects editor', path: '/admin/projects', first: true },
  { name: 'opportunity new', path: '/admin/opportunities/new' },
  { name: 'images', path: '/admin/images' },
  { name: 'share', path: '/admin/share' }, { name: 'share refused', path: '/admin/share?url=https%3A%2F%2Fexample.com%2Fnot-a-post' },
];
const DEVICES = [['Pixel 7', 'light'], ['iPhone 15 Pro', 'dark']];

const browser = await launch(); const fails = [], notes = [], out = {}; const started = new Date().toISOString();
const fail = m => { fails.push(m); console.log('  FAIL ' + m); };
const note = m => { notes.push(m); console.log('  NOTE ' + m); };
const pause = (page, ms) => page.waitForTimeout(ms);

const session = await browser.newContext({ reducedMotion: 'reduce', extraHTTPHeaders: HEADERS });
{ const p = await session.newPage(); await p.goto(`${origin}/admin/login`, { waitUntil: 'networkidle' }); await p.fill('#login-email', EMAIL); await p.fill('#login-password', PASSWORD); await Promise.all([p.waitForLoadState('load'), p.click('button[type="submit"]')]); await p.waitForTimeout(500); if (!new URL(p.url()).pathname.replace(/\/$/, '').endsWith('/admin')) { console.error('Sign-in did not work: ' + p.url()); process.exit(1); } await p.close(); }
const cookies = await session.cookies(); const firsts = {};
const ctxOf = async (dev, theme, signedOut) => { const d = devices[dev]; const ctx = await browser.newContext({ viewport: d.viewport, screen: d.screen, userAgent: d.userAgent, deviceScaleFactor: d.deviceScaleFactor, isMobile: true, hasTouch: true, colorScheme: theme, reducedMotion: 'reduce', extraHTTPHeaders: HEADERS }); if (!signedOut) await ctx.addCookies(cookies); return ctx; };
const addr = async (page, route, theme) => {
  let p = route.path;
  if (route.first) { if (!(route.path in firsts)) { await page.goto(`${origin}${route.path}`, { waitUntil: 'load' }); firsts[route.path] = await page.evaluate(() => document.querySelector('.admin-list tbody th a')?.getAttribute('href') || ''); } if (!firsts[route.path]) return null; p = firsts[route.path]; }
  return `${origin}${p}${p.includes('?') ? '&' : '?'}theme=${theme}`;
};

/* ---------- Sweep ---------- */
for (const [dev, theme] of DEVICES) {
  const d = devices[dev]; console.log(`\n[admin sweep] ${dev} ${theme} (${d.viewport.width}x${d.viewport.height}, ${d.deviceScaleFactor}x)`);
  for (const route of ROUTES) {
    const tag = `${dev} ${theme} ${route.name}`;
    const ctx = await ctxOf(dev, theme, route.signedOut); const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push('script: ' + String(e.message).slice(0, 160)));
    try {
      const u = await addr(page, route, theme); if (!u) { fail(`${tag}: no entry to open, so the editor cannot be tested (the database has none of this kind)`); await ctx.close(); continue; }
      await page.goto(u, { waitUntil: 'load' }); await pause(page, 400);
      if (!route.signedOut && /\/admin\/login/.test(page.url())) throw new Error('was sent to the sign-in page');
      const m = await page.evaluate(() => {
        const shown = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden], dialog:not([open])'); };
        const small = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=range]):not([type=color]):not([type=file]), select, textarea')].filter(shown).map(el => ({ f: el.id || el.name || el.tagName.toLowerCase(), s: parseFloat(getComputedStyle(el).fontSize) })).filter(x => x.s < 16);
        return { vw: innerWidth, sw: document.documentElement.scrollWidth, scale: +(visualViewport?.scale ?? 1).toFixed(3), small };
      });
      if (m.vw !== d.viewport.width || m.scale !== 1) fail(`${tag}: the layout viewport is ${m.vw} px at scale ${m.scale}`);
      if (m.sw > m.vw + 1) fail(`${tag}: the page is ${m.sw} px wide on a ${m.vw} px screen`);
      m.small.forEach(x => fail(`${tag}: field ${x.f} is ${x.s} px, so iOS Safari zooms the page when it takes focus (16 px or more)`));
      for (const f of await page.evaluate(pageChecks)) fail(`${tag}: ${f.check}: ${f.detail}`);
      await page.addScriptTag({ content: AXE });
      for (const v of await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] })).violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s), first: ${String(v.nodes[0].target[0]).slice(0, 80)}`))) fail(`${tag}: axe: ${v}`);
      for (const s of await page.evaluate(targetSpacing)) fail(`${tag}: target-spacing: ${s}`);
      [...new Set(errors)].forEach(e => fail(`${tag}: ${e}`));
    } catch (e) { fail(`${tag}: did not load (${String(e.message).split('\n')[0]})`); }
    await ctx.close();
  }
}

/* ---------- Touch ---------- */
console.log('\n[admin touch]');
// The bar at the foot of the screen: fixed, each item a full target, and at the end of the page the last content sits above it.
for (const [dev, theme] of DEVICES) {
  const k = `tab bar ${dev}`; const ctx = await ctxOf(dev, theme); const page = await ctx.newPage();
  await page.goto(`${origin}/admin/linkedin-posts?theme=${theme}`, { waitUntil: 'load' }); await pause(page, 400);
  const st = await page.evaluate(async () => {
    const bar = document.querySelector('.admin-tabbar'); if (!bar || !bar.getBoundingClientRect().height) return null;
    const items = [...bar.querySelectorAll('a, button')].map(a => { const r = a.getBoundingClientRect(); return { name: a.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; });
    scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 400));
    const br = bar.getBoundingClientRect();
    const last = [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.width > 0 && e.children.length === 0 && (e.textContent.trim() || e.matches('a, button, input')); }).pop();
    const lr = last?.getBoundingClientRect();
    return { position: getComputedStyle(bar).position, top: Math.round(br.top), bottom: Math.round(br.bottom), vh: innerHeight, items, lastBottom: lr ? Math.round(lr.bottom) : null, last: last ? last.textContent.trim().slice(0, 30) : '' };
  });
  out[k] = st;
  if (!st) fail(`${k}: no bar at the foot of the screen on a phone`);
  else {
    if (st.position !== 'fixed' || Math.abs(st.bottom - st.vh) > 1) fail(`${k}: the bar is ${st.position} and ends at ${st.bottom} of ${st.vh} px`);
    st.items.filter(i => i.w < 44 || i.h < 44).forEach(i => fail(`${k}: "${i.name}" is ${i.w} x ${i.h} px`));
    if (st.lastBottom !== null && st.lastBottom > st.top + 1) fail(`${k}: at the end of the page "${st.last}" ends at ${st.lastBottom} px, under the bar that starts at ${st.top} px`);
  }
  // The Menu item opens the side panel by tap.
  const menu = page.locator('.admin-tabbar [data-admin-menu-proxy]');
  if (await menu.count()) { await menu.tap(); await pause(page, 500); const open = await page.evaluate(() => { const p = document.getElementById('admin-panel'); const r = p?.getBoundingClientRect(); return !!r && r.width > 0 && r.right > 0 && r.left < innerWidth; }); out[k].menuOpens = open; if (!open) fail(`${k}: a tap on Menu did not show the side panel`); }
  await ctx.close();
}
// An editor with the keyboard up: each field the owner types in, focused with a touch, stays clear of the save bar and the top bar.
for (const [dev, theme] of DEVICES) {
  const k = `editor keyboard ${dev}`; const ctx = await ctxOf(dev, theme); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  const u = await addr(page, ROUTES.find(r => r.name === 'linkedin-posts editor'), theme);
  if (!u) { fail(`${k}: no LinkedIn post to open, so the editor cannot be tested`); await ctx.close(); continue; }
  await page.goto(u, { waitUntil: 'load' }); await pause(page, 400);
  const ids = await page.evaluate(() => [...document.querySelectorAll('.admin-form :is(input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select)')].filter(e => e.getBoundingClientRect().height > 0 && e.id).map(e => '#' + CSS.escape(e.id)));
  const pick = [...new Set([ids[0], ids[Math.floor(ids.length / 2)], ids[ids.length - 1]].filter(Boolean))];
  const full = devices[dev].viewport; const res = [];
  for (const sel of pick) {
    await page.setViewportSize(full);
    const at = await page.evaluate(s => { const el = document.querySelector(s); scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight / 2); document.activeElement?.blur(); const r = el.getBoundingClientRect(); return { x: Math.round(r.left + Math.min(r.width / 2, 40)), y: Math.round(r.top + Math.min(r.height / 2, 20)) }; }, sel);
    await pause(page, 250);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(page, 300);
    await page.setViewportSize({ width: full.width, height: 330 }); await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'nearest' }), sel); await pause(page, 300);
    const st = await page.evaluate(s => {
      const el = document.querySelector(s); const r = el.getBoundingClientRect();
      const cy = r.top + Math.min(r.height / 2, 20), hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), cy);
      const bar = document.querySelector('.admin-savebar'); const b = bar?.getBoundingClientRect();
      const topbar = document.querySelector('.admin-topbar, .admin-bar, header'); const t = topbar && ['sticky', 'fixed'].includes(getComputedStyle(topbar).position) ? topbar.getBoundingClientRect().bottom : 0;
      return { focused: document.activeElement === el, top: Math.round(r.top), bottom: Math.round(r.bottom), covered: !(hit && (hit === el || el.contains(hit))), by: hit && hit !== el && !el.contains(hit) ? hit.tagName.toLowerCase() + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.split(' ')[0] : '') : '', barTop: b ? Math.round(b.top) : null, topBottom: Math.round(t), vh: innerHeight };
    }, sel);
    res.push({ sel, ...st });
    if (!st.focused) fail(`${k}: a touch on ${sel} did not focus it`);
    if (st.covered) fail(`${k}: with the keyboard up ${sel} is covered by ${st.by}`);
    else if (st.top < st.topBottom - 1) fail(`${k}: with the keyboard up ${sel} starts at ${st.top} px, under the top bar that ends at ${st.topBottom} px`);
    /* The save bar never covers the focused field (CLAUDE.md 2.11): at least its first two lines (48 px), where the caret is, stay above the bar. */
    if (st.barTop !== null && Math.min(st.bottom, st.top + 48) > st.barTop + 1) fail(`${k}: with the keyboard up the save bar (from ${st.barTop} px) covers ${sel}, whose first lines run to ${Math.min(st.bottom, st.top + 48)} px`);
  }
  out[k] = res;
  await ctx.close();
}
// The share page refuses a link that is not a LinkedIn post, says why, and keeps its box usable by tap.
{
  const k = 'share refused iPhone 15 Pro'; const ctx = await ctxOf('iPhone 15 Pro', 'dark'); const page = await ctx.newPage();
  await page.goto(`${origin}/admin/share?url=https%3A%2F%2Fexample.com%2Fnot-a-post&theme=dark`, { waitUntil: 'load' }); await pause(page, 400);
  const st = await page.evaluate(() => { const msg = document.querySelector('[role="alert"], .form-error, .admin-message, [data-state="error"]'); const field = document.querySelector('main input[type="url"], main input[name], main textarea'); const r = field?.getBoundingClientRect(); return { message: msg ? msg.textContent.trim().slice(0, 120) : '', field: !!field, fieldSize: r ? [Math.round(r.width), Math.round(r.height)] : null, font: field ? parseFloat(getComputedStyle(field).fontSize) : null }; });
  out[k] = st;
  if (!/LinkedIn/.test(st.message)) fail(`${k}: no message says the link was refused for not being a LinkedIn link (found "${st.message}")`);
  if (!st.field) fail(`${k}: no box to paste another link into`);
  await ctx.close();
}
note('the installed admin app has no service worker, so opened without a connection it shows the browser\'s own offline page (not tested here); the share-sheet target works on Android only (an iPhone uses the Shortcut in docs/LINKEDIN_CAPTURE.md)');

const dir = path.join(ROOT, 'reports/mobile'); fs.mkdirSync(path.join(dir, 'runs'), { recursive: true });
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const hash = t => createHash('sha256').update(t).digest('hex').slice(0, 12);
const provenance = { commit: sh('git rev-parse HEAD'), uncommitted: hash(sh('git status --porcelain') + sh('git diff')), browser: browser.version(), script: hash(fs.readFileSync(new URL(import.meta.url), 'utf8')) };
const when = new Date().toISOString(), report = JSON.stringify({ origin, started, when, provenance, fails, notes, out }, null, 1);
fs.writeFileSync(path.join(dir, 'admin-report.json'), report); fs.writeFileSync(path.join(dir, 'runs', `admin-${when.replace(/[:.]/g, '-')}.json`), report);
await browser.close(); await session.close().catch(() => {});
console.log(`\n${notes.length} note(s); report in reports/mobile/admin-report.json`);
if (fails.length) { console.log(`FAILED: ${fails.length} failure(s).`); process.exit(1); }
console.log('PASSED: 0 failures.');
