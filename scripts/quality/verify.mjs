// Independent verification pass (Phase 15): the checks `npm run quality` does not run.
// node scripts/quality/verify.mjs [--dir=dist] [--only=keyboard,contrast,...]   -> reports/verify/verify.json
// Run it against a quality build (QUALITY_BUILD=1) so /_states and the fixture pages are included.
//   keyboard   Tab through every page: every interactive element is reached, focus is always visible, not hidden under
//              the sticky header, and the order follows the reading order.
//   names      Accessibility tree: landmarks, heading outline, link and button names, form labels, embed controls.
//              This reads what a screen reader would be given. It is not a screen reader test.
//   contrast   Every visible text node against its real background, both themes, at rest; links and buttons also on
//              hover and on keyboard focus.
//   zoom       200% zoom (a 640 CSS px wide window) and the WCAG 1.4.12 text-spacing override: no sideways scroll, no clipped text.
//   motion     prefers-reduced-motion on and off: what animates, and for how long.
//   theme      The theme button on every page: switches, is announced, and the choice survives a reload.
//   fold       First view at 1280x720 and 390x844: who, what level, and one primary action, without scrolling. Screenshots.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, THEMES, serve, launch, routes, arg } from '../lib.mjs';

const dir = arg('dir', 'dist'), only = arg('only', '') ? String(arg('only')).split(',') : null, want = k => !only || only.includes(k);
const PORT = 4420, O = `http://127.0.0.1:${PORT}`, server = await serve(dir, PORT), browser = await launch();
/* Every page in the sitemap, plus /_states (added by routes() when it is built) and the 404 page, which no sitemap lists. */
const all = [...new Set([...routes(dir).map(r => r.path.replace(/\/$/, '') || '/'), '/404'])];
const out = { build: dir, pages: all.length, sections: {} }, shots = path.join(ROOT, 'reports/verify'); fs.mkdirSync(shots, { recursive: true });
const slug = r => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-'));
const open = async (route, { width = 1280, height = 720, theme = 'light', reducedMotion = 'reduce', scale = 1 } = {}) => { const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort()); const p = await ctx.newPage(); await p.goto(`${O}${route}${route.includes('?') ? '&' : '?'}theme=${theme}`, { waitUntil: 'load' }); await p.waitForTimeout(350); return { ctx, p }; };
const section = (name, data) => { out.sections[name] = data; console.log(`\n== ${name}: ${data.summary}`); for (const f of (data.findings || []).slice(0, 25)) console.log('  - ' + f); if ((data.findings || []).length > 25) console.log(`  ... and ${data.findings.length - 25} more (see reports/verify/verify.json)`); };

// ---------------------------------------------------------------- keyboard
if (want('keyboard')) { const findings = [], per = {};
  for (const route of all) for (const [w, h] of [[1280, 720], [390, 844]]) { const { ctx, p } = await open(route, { width: w, height: h });
    const expected = await p.evaluate(() => [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return !e.disabled && e.type !== 'hidden' && s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 && !e.closest('[inert], [hidden], [aria-hidden="true"]'); }).map((e, i) => { e.dataset.vk = String(i); return i; }).length);
    const seen = new Set(); let stops = 0, noRing = [], hiddenUnderHeader = [], backwards = 0, last = null;
    for (let i = 0; i < expected + 12; i++) { await p.keyboard.press('Tab');
      const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e), r = e.getBoundingClientRect(); const header = document.querySelector('[data-site-header]'); const hb = header ? header.getBoundingClientRect().bottom : 0;
        const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== 'none' || (e.closest('.project-card') && getComputedStyle(e.closest('.project-card')).boxShadow !== 'none');
        return { k: e.dataset.vk, name: (e.getAttribute('aria-label') || e.textContent || e.name || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40), ring, top: Math.round(r.top + scrollY), left: Math.round(r.left), covered: !!header && !header.contains(e) && r.bottom <= hb + 1 && r.top < hb && (() => { const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(t === e || e.contains(t)); })(), inView: r.bottom > 0 && r.top < innerHeight }; });
      if (!f) continue; if (f.k !== undefined && seen.has(f.k)) break; if (f.k !== undefined) seen.add(f.k); stops++;
      if (!f.ring) noRing.push(f.name); if (f.covered) hiddenUnderHeader.push(f.name); if (!f.inView) findings.push(`${route} ${w}: focus moved off screen to "${f.name}"`);
      if (last && f.top < last.top - 120) backwards++; last = f; }
    const missed = await p.evaluate(seenKeys => [...document.querySelectorAll('[data-vk]')].filter(e => !seenKeys.includes(e.dataset.vk)).map(e => (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)), [...seen]);
    per[`${route} ${w}`] = { interactive: expected, reached: seen.size, noRing: noRing.length, coveredByHeader: hiddenUnderHeader.length, backwardsJumps: backwards };
    if (missed.length) findings.push(`${route} ${w}: ${missed.length} not reached by Tab: ${missed.slice(0, 4).join(' | ')}`);
    if (noRing.length) findings.push(`${route} ${w}: ${noRing.length} focus stops with no visible ring: ${[...new Set(noRing)].slice(0, 4).join(' | ')}`);
    if (hiddenUnderHeader.length) findings.push(`${route} ${w}: ${hiddenUnderHeader.length} focus stops under the sticky header: ${hiddenUnderHeader.slice(0, 3).join(' | ')}`);
    if (backwards > 2) findings.push(`${route} ${w}: focus jumped upward ${backwards} times (order may not follow the page)`);
    await ctx.close(); }
  const t = Object.values(per).reduce((a, r) => ({ i: a.i + r.interactive, r: a.r + r.reached }), { i: 0, r: 0 });
  section('keyboard', { summary: `${Object.keys(per).length} page views walked; ${t.r} of ${t.i} interactive elements reached by Tab; ${findings.length} findings`, findings, per }); }

// ---------------------------------------------------------------- names (accessibility tree)
if (want('names')) { const findings = [], per = {};
  for (const route of all) { const { ctx, p } = await open(route);
    const r = await p.evaluate(() => { const name = e => (e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') || '').split(' ').map(id => document.getElementById(id)?.textContent || '').join(' ') || e.textContent || e.getAttribute('alt') || e.getAttribute('title') || '').trim().replace(/\s+/g, ' ');
      const vis = e => { const s = getComputedStyle(e), b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && !e.closest('[hidden], [aria-hidden="true"], [inert]') && (b.width > 0 || b.height > 0); };
      const lm = [...document.querySelectorAll('header, nav, main, footer, aside, section[aria-label], section[aria-labelledby], form[aria-label], form[aria-labelledby], [role="region"], [role="search"], [role="banner"], [role="contentinfo"]')].filter(vis).filter(e => !(e.tagName === 'HEADER' || e.tagName === 'FOOTER') || !e.closest('article, section, main, aside, nav')).map(e => `${e.getAttribute('role') || e.tagName.toLowerCase()}: ${name(e).slice(0, 40) && (e.hasAttribute('aria-label') || e.hasAttribute('aria-labelledby')) ? name(e).slice(0, 40) : ''}`);
      const heads = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(vis).map(h => ({ l: +h.tagName[1], t: h.textContent.trim().replace(/\s+/g, ' ').slice(0, 50) }));
      const links = [...document.querySelectorAll('a[href]')].filter(vis).map(a => ({ n: name(a) || (a.querySelector('img') ? a.querySelector('img').alt : ''), h: a.getAttribute('href'), blank: a.target === '_blank', says: /new tab|تبويب/i.test(name(a)) }));
      const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(vis).map(b => ({ n: name(b), pressed: b.getAttribute('aria-pressed'), expanded: b.getAttribute('aria-expanded') }));
      const fields = [...document.querySelectorAll('input:not([type=hidden]), textarea, select')].filter(vis).map(f => ({ id: f.id, label: !!(f.id && document.querySelector(`label[for="${f.id}"]`)) || !!f.getAttribute('aria-label') || !!f.closest('label'), describedByOk: (f.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).every(id => document.getElementById(id)) }));
      const imgs = [...document.images].filter(vis).map(i => ({ alt: i.getAttribute('alt'), src: (i.getAttribute('src') || '').slice(-40), decorative: !!i.closest('[aria-hidden="true"]') }));
      const embeds = [...document.querySelectorAll('[data-embed]')].map(e => ({ kind: e.dataset.embed, control: name(e.querySelector('[data-embed-load]') || e), fallbackLink: !!e.querySelector('a[href]') }));
      const live = [...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')].filter(vis).map(e => `${e.getAttribute('role') || 'aria-live=' + e.getAttribute('aria-live')}: "${e.textContent.trim().slice(0, 30)}"`);
      return { lang: document.documentElement.lang, title: document.title, lm, heads, links, buttons, fields, imgs, embeds, live }; });
    const f = (msg) => findings.push(`${route}: ${msg}`);
    if (!r.lang) f('no lang'); if (r.heads.filter(h => h.l === 1).length !== 1) f(`${r.heads.filter(h => h.l === 1).length} h1`);
    r.heads.forEach((h, i) => { if (i && h.l - r.heads[i - 1].l > 1) f(`heading level skips from h${r.heads[i - 1].l} to h${h.l} at "${h.t}"`); });
    for (const kind of ['main', 'banner', 'contentinfo']) { const tag = { main: 'main', banner: 'header', contentinfo: 'footer' }[kind]; const n = r.lm.filter(l => l.startsWith(tag + ':') || l.startsWith(kind + ':')).length; if (route !== '/_states' && n !== 1) f(`${n} ${kind} landmarks`); }
    const dupLm = r.lm.filter((l, i) => r.lm.indexOf(l) !== i && !l.endsWith(': ') ); if (dupLm.length) f(`landmarks share a name: ${[...new Set(dupLm)].join(' | ')}`);
    const navs = r.lm.filter(l => l.startsWith('nav:')); if (navs.length > 1 && navs.some(n => n.endsWith(': '))) f(`${navs.length} nav landmarks, ${navs.filter(n => n.endsWith(': ')).length} without a name`);
    for (const l of r.links) { if (!l.n) f(`link with no name -> ${l.h}`); else if (/^(read more|click here|here|more|link|learn more)$/i.test(l.n)) f(`vague link name "${l.n}" -> ${l.h}`); if (l.blank && !l.says) f(`"${l.n.slice(0, 30)}" opens a new tab without saying so`); }
    const byName = {}; for (const l of r.links) if (l.n) (byName[l.n] ||= new Set()).add(l.h.replace(/#.*$/, '')); for (const [n, hs] of Object.entries(byName)) if (hs.size > 1 && !/^(العربية|English)/.test(n)) f(`same link name "${n.slice(0, 30)}" goes to ${hs.size} places: ${[...hs].slice(0, 3).join(', ')}`);
    for (const b of r.buttons) if (!b.n) f('button with no name');
    for (const x of r.fields) { if (!x.label) f(`field #${x.id} has no label`); if (!x.describedByOk) f(`field #${x.id} aria-describedby points at a missing element`); }
    for (const i of r.imgs) if (i.alt === null) f(`image without alt: ${i.src}`);
    for (const e of r.embeds) { if (!e.control) f(`${e.kind} embed control has no name`); if (!e.fallbackLink) f(`${e.kind} embed has no fallback link`); }
    per[route] = { landmarks: r.lm.length, headings: r.heads.map(h => h.l).join(''), links: r.links.length, buttons: r.buttons.length, fields: r.fields.length, images: r.imgs.length, emptyAlt: r.imgs.filter(i => i.alt === '').length, embeds: r.embeds.length, live: r.live };
    await ctx.close(); }
  section('names', { summary: `${all.length} pages read; ${findings.length} findings`, findings, per }); }

// ---------------------------------------------------------------- contrast
const CONTRAST = `(() => {
  const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const stops = img => [...img.matchAll(/rgba?\\([^)]+\\)/g)].map(m => parse(m[0])).filter(Boolean);
  // Background behind an element: its own and its ancestors' colours and gradients, composited. Returns every colour
  // the text may sit on (a gradient gives one per stop), or null when an image is involved.
  window.__bg = el => { let layers = []; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage && s.backgroundImage !== 'none' && !/\\b\\d+px\\s*$/.test(s.backgroundSize.split(',')[0]) && s.webkitBackgroundClip !== 'text') { if (/url\\(/.test(s.backgroundImage)) return null; layers.push(stops(s.backgroundImage)); } const c = parse(s.backgroundColor); if (c && c.a > 0) { layers.push([c]); if (c.a === 1) break; } }
    let bases = [{ r: 255, g: 255, b: 255, a: 1 }]; for (const layer of layers.reverse()) { const next = []; for (const base of bases) for (const c of layer) next.push(over(c, base)); bases = next.slice(0, 16); } return bases; };
  window.__contrast = el => { const s = getComputedStyle(el); const fg = parse(s.color); if (!fg) return null; let host = null; for (let e = el; e && !host; e = e.parentElement) { const c = getComputedStyle(e); if (c.webkitBackgroundClip === 'text' || c.backgroundClip === 'text') host = e; else if (parse(c.color)?.a !== 0) break; } const clip = !!host;
    const bgs = window.__bg(clip ? host.parentElement : el); if (!bgs) return { unknown: 'image' };
    const fgs = clip ? stops(getComputedStyle(host).backgroundImage) : [fg]; let worst = 99; for (const b of bgs) for (const f of fgs) worst = Math.min(worst, ratio(over({ ...f, a: f.a * parseFloat(s.opacity || 1) }, b), b));
    const size = parseFloat(s.fontSize), bold = +s.fontWeight >= 700; const large = size >= 24 || (size >= 18.66 && bold); return { ratio: +worst.toFixed(2), need: large ? 3 : 4.5, size, bold, color: s.color }; };
  window.__scan = () => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const done = new Set();
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || done.has(el)) continue; done.add(el);
      const s = getComputedStyle(el), b = el.getBoundingClientRect(); if (s.display === 'none' || s.visibility === 'hidden' || b.width < 1 || b.height < 1 || el.closest('[hidden], [aria-hidden="true"], .cory-visually-hidden, script, style, noscript, svg, [inert]') || el.closest(':disabled')) continue;
      let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity); if (op < 0.05) continue;
      const c = window.__contrast(el); if (!c) continue; out.push({ ...c, opacity: op, text: n.textContent.trim().slice(0, 40), where: (el.closest('[id]')?.id || el.closest('section, header, footer, nav, main')?.tagName.toLowerCase() || '') + ' ' + el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') }); }
    return out; };
})()`;
if (want('contrast')) { const findings = [], per = {}; let nodes = 0, unknown = 0, states = 0;
  for (const route of all) for (const theme of THEMES) { const { ctx, p } = await open(route, { theme, height: 900 }); await p.evaluate(CONTRAST);
    const rest = await p.evaluate(() => window.__scan()); nodes += rest.length; unknown += rest.filter(r => r.unknown).length;
    const bad = rest.filter(r => r.ratio !== undefined && (r.ratio < r.need - 0.01 || r.opacity < 0.999 && r.ratio * r.opacity < r.need));
    const seen = new Set(); for (const b of bad) { const key = `${b.where}|${b.color}|${b.ratio}`; if (seen.has(key)) continue; seen.add(key); findings.push(`${route} ${theme}: ${b.ratio}:1 (needs ${b.need}) "${b.text}" in ${b.where}, ${b.size}px${b.bold ? ' bold' : ''}${b.opacity < 0.999 ? ', opacity ' + b.opacity.toFixed(2) : ''}`); }
    // hover and keyboard focus on a sample of each kind of control
    const kinds = await p.evaluate(() => { const groups = {}; for (const e of document.querySelectorAll('a[href], button')) { const s = getComputedStyle(e), b = e.getBoundingClientRect(); if (s.display === 'none' || s.visibility === 'hidden' || b.width < 1 || e.closest('[hidden], [inert], [aria-hidden="true"]') || e.disabled) continue; const k = (e.className && typeof e.className === 'string' ? e.className.split(' ').slice(0, 2).join('.') : '') + '|' + (e.hasAttribute('data-link') ? 'data-link' : '') + '|' + (e.closest('.cory-ink, .project-cta, footer, [data-site-header], .embed-failed') ? 'ink-or-chrome:' + (e.closest('footer') ? 'footer' : e.closest('[data-site-header]') ? 'header' : 'ink') : 'page') + '|' + e.tagName; if (!groups[k]) { groups[k] = true; e.dataset.vc = k; } } return Object.keys(groups); });
    for (const k of kinds.slice(0, 40)) { const loc = p.locator(`[data-vc="${k.replace(/"/g, '\\"')}"]`).first(); try { await loc.scrollIntoViewIfNeeded({ timeout: 1500 });
        for (const mode of ['hover', 'focus']) { if (mode === 'hover') await loc.hover({ timeout: 1500, force: true }); else { await p.mouse.move(0, 0); await loc.focus({ timeout: 1500 }); } await p.waitForTimeout(260);
          const r = await loc.evaluate(el => { const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); const own = ownText ? window.__contrast(el) : null; const inner = [...el.querySelectorAll('*')].filter(c => [...c.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !c.closest('.cory-visually-hidden')).map(c => window.__contrast(c)).filter(Boolean); const all = [own, ...inner].filter(x => x && x.ratio !== undefined); const worst = all.sort((a, b) => a.ratio - a.need - (b.ratio - b.need))[0]; const s = getComputedStyle(el); const ringColor = s.outlineStyle !== 'none' ? s.outlineColor : null; let ring = null; if (ringColor) { const bg = window.__bg(el.parentElement); const m = ringColor.match(/[\d.]+/g).map(Number); if (bg) { const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }; const a = lum({ r: m[0], g: m[1], b: m[2] }); ring = Math.min(...bg.map(b => { const y = lum(b); return (Math.max(a, y) + 0.05) / (Math.min(a, y) + 0.05); })); } } return { worst, ring: ring && +ring.toFixed(2), text: el.textContent.trim().slice(0, 30) }; });
          states++; if (r.worst && r.worst.ratio < r.worst.need - 0.01) findings.push(`${route} ${theme}: on ${mode}, ${r.worst.ratio}:1 (needs ${r.worst.need}) "${r.text}" [${k}]`);
          if (mode === 'focus' && r.ring !== null && r.ring < 3) findings.push(`${route} ${theme}: focus ring ${r.ring}:1 against its surroundings (needs 3) on "${r.text}" [${k}]`); } } catch {} }
    per[`${route} ${theme}`] = { textElements: rest.length, belowAA: bad.length, onImage: rest.filter(r => r.unknown).length, controlKinds: kinds.length };
    await ctx.close(); }
  const uniq = [...new Set(findings.map(f => f.replace(/^\S+ /, '')))];
  section('contrast', { summary: `${nodes} text elements measured on ${all.length} pages in 2 themes, ${states} hover and focus states; ${findings.length} findings (${uniq.length} distinct); ${unknown} text elements sit on an image and could not be measured`, findings, per }); }

// ---------------------------------------------------------------- zoom and text spacing
if (want('zoom')) { const findings = [], per = {};
  const SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';
  const probe = () => { const clipped = []; for (const el of document.querySelectorAll('h1, h2, h3, h4, p, li, a, button, span, dd, dt, label, figcaption, td, th')) { const s = getComputedStyle(el), b = el.getBoundingClientRect(); if (s.display === 'none' || s.visibility === 'hidden' || b.width < 1 || !el.textContent.trim() || el.closest('.cory-visually-hidden, [hidden], [aria-hidden="true"], [inert]')) continue; if (el.closest('.post-code, .post-table, [data-cover-fallback]')) continue; const hide = s.overflowX !== 'visible' || s.overflowY !== 'visible'; if (hide && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) && !/auto|scroll/.test(s.overflowX + s.overflowY) && s.webkitLineClamp === 'none') { const range = document.createRange(); const cut = [...el.querySelectorAll('*'), el].some(c => [...c.childNodes].some(n => { if (n.nodeType !== 3 || !n.textContent.trim()) return false; range.selectNodeContents(n); const t = range.getBoundingClientRect(); return t.width > 0 && (t.right > b.right + 2 || t.left < b.left - 2 || t.bottom > b.bottom + 2 || t.top < b.top - 2); })); if (cut) clipped.push(el.textContent.trim().slice(0, 30)); } if (b.right > innerWidth + 2 && !el.closest('[data-work-row], .post-table, .post-code')) clipped.push('off the right edge: ' + el.textContent.trim().slice(0, 30)); }
    const overlaps = []; const blocks = [...document.querySelectorAll('main h1, main h2, main h3, main p, main li')].filter(e => e.getBoundingClientRect().height > 0 && !e.closest('[hidden], [aria-hidden="true"], [data-cover-fallback], .embed-frame, details:not([open]) > :not(summary)') && (() => { for (let c = e.parentElement; c; c = c.parentElement) { const cs = getComputedStyle(c); if (cs.overflow !== 'visible' && c.getBoundingClientRect().height < 2) return false; } return true; })()); for (let i = 1; i < blocks.length; i++) { const a = blocks[i - 1].getBoundingClientRect(), b = blocks[i].getBoundingClientRect(); if (blocks[i - 1].contains(blocks[i]) || blocks[i].contains(blocks[i - 1])) continue; if (b.top < a.bottom - 6 && b.bottom > a.top + 6 && b.left < a.right - 6 && b.right > a.left + 6) overlaps.push(blocks[i].textContent.trim().slice(0, 30)); }
    return { scroll: document.documentElement.scrollWidth > innerWidth + 1, scrollBy: document.documentElement.scrollWidth - innerWidth, clipped: [...new Set(clipped)].slice(0, 5), overlaps: [...new Set(overlaps)].slice(0, 5) }; };
  for (const route of all) { const r = {};
    { const { ctx, p } = await open(route, { width: 640, height: 360, scale: 2 }); r.zoom200 = await p.evaluate(probe); await ctx.close(); }
    for (const w of [320, 1280]) { const { ctx, p } = await open(route, { width: w, height: 720 }); await p.addStyleTag({ content: SPACING }); await p.waitForTimeout(250); r['spacing' + w] = await p.evaluate(probe); await ctx.close(); }
    { const { ctx, p } = await open(route, { width: 320, height: 256, scale: 4 }); r.zoom400 = await p.evaluate(probe); await ctx.close(); }
    per[route] = r;
    for (const [k, v] of Object.entries(r)) { if (v.scroll) findings.push(`${route} ${k}: page scrolls sideways by ${v.scrollBy}px`); if (v.clipped.length) findings.push(`${route} ${k}: clipped text: ${v.clipped.join(' | ')}`); if (v.overlaps.length) findings.push(`${route} ${k}: overlapping text: ${v.overlaps.join(' | ')}`); } }
  section('zoom', { summary: `${all.length} pages at 200% zoom (640px), 400% (320px), and with the text-spacing override at 320 and 1280; ${findings.length} findings`, findings, per }); }

// ---------------------------------------------------------------- motion
if (want('motion')) { const findings = [], per = {};
  for (const route of all) { const r = {};
    for (const mode of ['no-preference', 'reduce']) { const { ctx, p } = await open(route, { reducedMotion: mode }); await p.evaluate(() => scrollTo(0, 400)); await p.waitForTimeout(300);
      r[mode] = await p.evaluate(() => { const running = document.getAnimations().filter(a => a.playState === 'running'); const props = new Set(), long = []; let infinite = 0; for (const el of document.querySelectorAll('*')) { const s = getComputedStyle(el); if (s.transitionDuration && s.transitionDuration !== '0s') { for (const pr of s.transitionProperty.split(',').map(x => x.trim())) props.add(pr); const d = Math.max(...s.transitionDuration.split(',').map(parseFloat)); if (d > 1) long.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${d}s`); } if (s.animationName !== 'none' && s.animationIterationCount === 'infinite') infinite++; }
        return { running: running.length, infinite, transitionProps: [...props].sort(), long: [...new Set(long)].slice(0, 4), smoothScroll: getComputedStyle(document.documentElement).scrollBehavior }; }); await ctx.close(); }
    per[route] = r;
    if (r.reduce.running > 0) findings.push(`${route}: ${r.reduce.running} animations still running with reduced motion on`);
    if (r.reduce.infinite > 0) findings.push(`${route}: ${r.reduce.infinite} looping animations with reduced motion on`);
    if (r.reduce.smoothScroll === 'smooth') findings.push(`${route}: smooth scrolling stays on with reduced motion`);
    const layout = r['no-preference'].transitionProps.filter(x => /^(width|height|top|left|right|bottom|margin|padding|inset|all)/.test(x)); if (layout.length) findings.push(`${route}: transitions on layout properties: ${layout.join(', ')}`);
    if (r['no-preference'].long.length) findings.push(`${route}: transitions longer than 1s: ${r['no-preference'].long.join(' | ')}`); }
  section('motion', { summary: `${all.length} pages with reduced motion off and on; ${findings.length} findings`, findings, per }); }

// ---------------------------------------------------------------- theme
if (want('theme')) { const findings = [], per = {};
  for (const route of all.filter(r => r !== '/_states')) { const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark', reducedMotion: 'reduce' }); await ctx.route(u => !u.hostname.startsWith('127.0.0.1'), r => r.abort()); const p = await ctx.newPage(); await p.goto(O + route, { waitUntil: 'load' });
    const read = () => p.evaluate(() => { const b = document.querySelector('[data-theme-toggle]'); return { theme: document.documentElement.dataset.theme, pressed: b?.getAttribute('aria-pressed'), name: b?.getAttribute('aria-label') || b?.textContent.trim(), tag: b?.tagName, scheme: getComputedStyle(document.documentElement).colorScheme, bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]')?.content }; });
    const a = await read(); await p.locator('[data-theme-toggle]').first().focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200); const b = await read(); await p.reload({ waitUntil: 'load' }); const c = await read();
    per[route] = { followsSystem: a.theme, afterToggle: b.theme, afterReload: c.theme, names: [a.name, b.name], pressed: [a.pressed, b.pressed], colorScheme: [a.scheme, b.scheme] };
    if (a.theme !== 'dark') findings.push(`${route}: does not follow the system dark setting on first visit (${a.theme})`);
    if (a.tag !== 'BUTTON') findings.push(`${route}: theme control is a ${a.tag}`); if (!a.name) findings.push(`${route}: theme button has no name`);
    if (b.theme === a.theme) findings.push(`${route}: the theme button did not switch the theme`); if (a.pressed === b.pressed && a.name === b.name) findings.push(`${route}: the theme button's state is not announced`);
    if (c.theme !== b.theme) findings.push(`${route}: the choice was lost on reload`); if (a.bg === b.bg) findings.push(`${route}: the page background did not change`);
    if (!String(b.scheme).includes(b.theme)) findings.push(`${route}: color-scheme is "${b.scheme}" in ${b.theme} theme`);
    await ctx.close(); }
  section('theme', { summary: `${Object.keys(per).length} pages: system preference, toggle from the keyboard, reload; ${findings.length} findings`, findings, per }); }

// ---------------------------------------------------------------- first view
if (want('fold')) { const findings = [], per = {}; fs.mkdirSync(path.join(shots, 'fold'), { recursive: true });
  for (const route of all.filter(r => r !== '/_states' && !/fixture|\/tag\/|\/page\//.test(r))) for (const [w, h] of [[1280, 720], [390, 844]]) { const { ctx, p } = await open(route, { width: w, height: h });
    const r = await p.evaluate(() => { const inView = e => { if (!e) return false; const b = e.getBoundingClientRect(); return b.height > 0 && b.top >= 0 && b.bottom <= innerHeight + 1; }; const partly = e => { if (!e) return false; const b = e.getBoundingClientRect(); return b.height > 0 && b.top < innerHeight && b.bottom > 0; };
      const h1 = document.querySelector('main h1'); const lead = h1 && [...h1.parentElement.querySelectorAll('p')].find(x => x.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_PRECEDING && x.textContent.trim().length > 40);
      const primary = [...document.querySelectorAll('main .ui-button-primary, main [data-ds-button="primary"]')].filter(partly); const action = [...document.querySelectorAll('main a.ui-button, main button.ui-button, main [data-ds-button], main a[data-link]')].filter(inView);
      const text = document.body.innerText; return { h1: h1?.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), h1InView: inView(h1), leadInView: inView(lead), primaryInView: primary.length, actionInView: action.length, firstAction: action[0]?.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), saysWho: /Aleem/i.test(text.slice(0, 1500)), saysLevel: /Senior|Lead|Principal/i.test([h1?.textContent, lead?.textContent, document.querySelector('main')?.innerText.slice(0, 600)].join(' ')) }; });
    await p.screenshot({ path: path.join(shots, 'fold', `${slug(route)}-${w}.png`) });
    per[`${route} ${w}`] = r;
    if (!r.h1InView) findings.push(`${route} ${w}x${h}: the h1 is not fully in the first view`); if (!r.leadInView && !/404/.test(route)) findings.push(`${route} ${w}x${h}: no supporting sentence fully in the first view`);
    if (r.actionInView === 0) findings.push(`${route} ${w}x${h}: no action in the first view`); if (r.primaryInView > 1) findings.push(`${route} ${w}x${h}: ${r.primaryInView} primary buttons in the first view`);
    if (!r.saysLevel && ['/', '/about', '/resume'].includes(route)) findings.push(`${route} ${w}x${h}: the first view does not state a level (Senior, Lead or Principal)`);
    await ctx.close(); }
  section('fold', { summary: `${Object.keys(per).length} first views captured to reports/verify/fold/; ${findings.length} findings`, findings, per }); }

await browser.close(); server.close();
const file = path.join(shots, only ? `verify-${only.join('-')}.json` : 'verify.json'); fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`\nwritten: ${path.relative(ROOT, file)}; total findings: ${Object.values(out.sections).reduce((n, s) => n + (s.findings || []).length, 0)}`);
