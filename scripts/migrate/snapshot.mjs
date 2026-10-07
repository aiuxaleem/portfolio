// One-off migration helper: renders each legacy page in a browser and saves the resulting DOM as static HTML.
// The legacy runtime (React from a CDN) becomes a build-time step, so the public pages need no JavaScript to show content.
// Output per route in src/snapshots/: <name>.json = { title, description, lang, dir, langs, page, css, header, main, footer }
//   css     rules the runtime generated for hover/focus pseudo-classes on this page
//   header  markup of the Site Header host (skip link, spacer, bar)
//   main    markup of <main>
//   footer  markup of the Site Footer host
// <image-slot> (an editor component with a shadow DOM) is replaced by a plain <img> in a box with the same geometry.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, arg } from '../lib.mjs';

// By default every legacy page, into src/snapshots/. For a later pull of the design: --dir=<folder with the design files> --out=<folder> --only=home,home-ar
const only = String(arg('only', '')).split(',').filter(Boolean);
const PAGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/routes.legacy.json'), 'utf8')).filter(r => !only.length || only.includes(r.name));
const out = path.resolve(ROOT, String(arg('out', 'src/snapshots'))); fs.mkdirSync(out, { recursive: true });
const server = await serve(String(arg('dir', 'legacy')), 4430); const browser = await launch();
for (const route of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4430' + encodeURI(route.path) + (route.path.includes('?') ? '&' : '?') + 'theme=light', { waitUntil: 'load' });
  await page.waitForSelector('main h1'); await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2500);
  // Scroll through the page so every scroll-reveal has run and removed its temporary inline opacity/transform.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 400) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500);
  const snap = await page.evaluate(() => {
    const d = document.documentElement;
    // Rules the runtime inserted through the CSSOM (style-hover / style-focus attributes become generated classes).
    let css = '';
    for (const sheet of document.styleSheets) { if (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE' && !sheet.ownerNode.textContent.trim()) { try { css += [...sheet.cssRules].map(r => r.cssText).join('\n'); } catch (e) {} } }
    const root = document.getElementById('dc-root').cloneNode(true);
    root.querySelectorAll('script, template, style, noscript').forEach(n => n.remove());
    // image-slot -> box + img. The live element tells us whether an image is actually shown.
    const live = [...document.querySelectorAll('#dc-root image-slot')];
    [...root.querySelectorAll('image-slot')].forEach((slot, i) => {
      const img = live[i].shadowRoot && live[i].shadowRoot.querySelector('img');
      const shown = img && img.getAttribute('src') && img.complete && img.naturalWidth > 0 && getComputedStyle(img).display !== 'none';
      const box = document.createElement('span');
      box.setAttribute('data-image-box', slot.id || ''); box.setAttribute('data-alt', slot.getAttribute('placeholder') || '');
      box.setAttribute('style', 'display:block;position:relative;inline-size:100%;block-size:100%;aspect-ratio:3/2;overflow:hidden;' + (slot.getAttribute('style') || ''));
      if (shown) { const im = document.createElement('img'); im.setAttribute('src', '/' + slot.getAttribute('src').replace(/^\//, '')); im.setAttribute('alt', ''); im.setAttribute('width', img.naturalWidth); im.setAttribute('height', img.naturalHeight); im.setAttribute('style', 'position:absolute;display:block;max-width:none;left:50%;top:50%;width:100%;height:100%;transform:translate(-50%,-50%);object-fit:cover;'); /* same geometry the legacy component computed for a centred cover fit */ box.appendChild(im); }
      slot.replaceWith(box);
    });
    // Asset and page URLs: legacy files sat next to each other; the new site serves assets from the root.
    root.querySelectorAll('img[src]').forEach(im => { const s = im.getAttribute('src'); if (/^assets\//.test(s)) im.setAttribute('src', '/' + s); });
    root.querySelectorAll('[data-dc-tpl]').forEach(e => e.removeAttribute('data-dc-tpl'));
    // The browser cannot serialise `background: var(--gradient-text)` once background-clip is also set: it writes empty
    // longhands ("background-image: ;"). The only elements affected are the gradient-clipped words (one per page, plus accent metrics).
    root.querySelectorAll('[style]').forEach(e => {
      const st = e.getAttribute('style');
      if (/background-image:\s*;/.test(st)) e.setAttribute('style', st.replace(/background-(image|position-x|position-y|size|repeat|attachment|origin|color):\s*;\s*/g, '').replace(/background-clip:\s*text;?/, 'background: var(--gradient-text); -webkit-background-clip: text; background-clip: text;'));
    });
    // Hooks and fixes that do not change the rest state:
    // - buttons rendered by the legacy design system carried an inline `outline: none`; removing it lets the global focus ring show (finding M-01)
    // - the Email Copy markup gets the attributes the shared email-copy script binds to
    root.querySelectorAll('a[style], button[style]').forEach(e => { const st = e.getAttribute('style'); if (/outline:\s*none/.test(st)) e.setAttribute('style', st.replace(/outline:\s*none;?\s*/g, '')); });
    root.querySelectorAll('.sc-host[data-sc-name="Email Copy"] > span').forEach(e => { e.setAttribute('data-email-copy', ''); e.setAttribute('data-copied', 'Copied'); e.setAttribute('data-fallback', 'Selected. Press Ctrl+C or Cmd+C to copy.'); });
    // ---- Approved audit findings applied at snapshot time (docs/AUDIT_FINDINGS.md) ----
    // M-06: images get the text the legacy slot carried as its label; M-12 (part): intrinsic width and height on every image.
    root.querySelectorAll('[data-image-box] img').forEach((im, i) => { const label = im.parentElement.getAttribute('data-alt'); if (label) im.setAttribute('alt', label); });
    const liveImgs = [...document.querySelectorAll('#dc-root img')]; [...root.querySelectorAll('img')].filter(im => !im.parentElement.hasAttribute('data-image-box')).forEach((im, i) => { const l = liveImgs[i]; if (l && l.naturalWidth && !im.hasAttribute('width')) { im.setAttribute('width', l.naturalWidth); im.setAttribute('height', l.naturalHeight); } });
    // M-26: one icon stroke width.
    root.querySelectorAll('svg[stroke-width="2"]').forEach(s => s.setAttribute('stroke-width', '1.75'));
    // M-02: the font-size token gets its own name so the colour token --text-body resolves in both themes.
    root.querySelectorAll('[style]').forEach(e => { const st = e.getAttribute('style'); if (/font-size:\s*var\(--text-body\)/.test(st)) e.setAttribute('style', st.replace(/font-size:\s*var\(--text-body\)/g, 'font-size: var(--text-body-md)')); });
    // M-04, M-14: badges and tags may wrap. M-16, M-17: design-system buttons get CSS hover states.
    root.querySelectorAll('span[style]').forEach(e => { const st = e.getAttribute('style'); if (/border-radius:\s*var\(--radius-pill\)/.test(st) && /white-space:\s*nowrap/.test(st) && !e.closest('a, button')) e.setAttribute('data-badge', ''); });
    root.querySelectorAll('a[style], button[style]').forEach(e => { const st = e.getAttribute('style'); if (!/border-radius:\s*var\(--radius-pill\)/.test(st) || !/padding:\s*(11px 22px|15px 30px|8px 16px)/.test(st)) return; const v = /gradient-brand-deep/.test(st) ? 'primary' : /background:\s*var\(--action-ink\)/.test(st) ? 'ink' : /background:\s*var\(--surface-card\)/.test(st) ? 'secondary' : /background:\s*var\(--on-ink-fill\)/.test(st) ? 'on-ink' : /background:\s*var\(--on-ink-strong\)/.test(st) ? 'on-ink-solid' : /background:\s*transparent/.test(st) ? 'ghost' : ''; if (v) e.setAttribute('data-ds-button', v); });
    const host = name => [...root.querySelectorAll('.sc-host')].find(h => h.getAttribute('data-sc-name') === name);
    const header = host('Site Header'), footer = host('Site Footer'), main = root.querySelector('main');
    const extras = [...root.querySelector('.sc-host').children].filter(c => c !== header && c !== footer && c !== main).map(c => c.outerHTML).join('\n');
    return { title: document.title, description: (document.querySelector('meta[name="description"]') || {}).content || '', lang: d.lang, dir: d.dir, langs: d.getAttribute('data-langs'), page: d.getAttribute('data-page'), fonts: (document.querySelector('link[href*="fonts.googleapis.com/css2"]') || {}).href || '', css, header: header ? header.innerHTML : '', extras, main: main.outerHTML, footer: footer ? footer.innerHTML : '' };
  });
  fs.writeFileSync(path.join(out, route.name + '.json'), JSON.stringify(snap, null, 1));
  console.log(`${route.name}: main ${Math.round(snap.main.length / 1024)} KB, header ${Math.round(snap.header.length / 1024)} KB, footer ${Math.round(snap.footer.length / 1024)} KB, extras ${snap.extras.length} chars, generated css ${snap.css.length} chars`);
  await ctx.close();
}
await browser.close(); server.close();
