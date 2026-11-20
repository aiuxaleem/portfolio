// The text of the landing pages' first screens over their field (L-83; components/landing/landing-hero.astro,
// islands/landing.ts): every text box in the hero at 4.5:1 (3:1 for large text) or more against the worst pixel under it,
// with the live WebGL field (motion allowed: three moments as it drifts and follows the pointer) and with the CSS picture
// the checks and a page without JavaScript see, at six screen sizes in both themes. The text is hidden and the field
// photographed; the buttons, which carry their own fill, are left out. The page's decorative grid and the site field's
// dots and hairlines (layout/ai-field.astro, measured by check-field.mjs, step 3d) are hidden: they are 1 px marks under
// every page, not the surface the text sits on. Run by `npm run quality` (step 3e) against a production build, or with
// --origin= against a running site.
// usage: node scripts/quality/check-landing-field.mjs [--origin=http://localhost:4321] [--routes=/job,/clients] [--sizes=1440x900,...]
import { PNG } from 'pngjs';
import { serve, launch, arg } from '../lib.mjs';
const given = arg('origin', '');
const server = given ? null : await serve('dist', 4494);
const origin = given || 'http://127.0.0.1:4494';
const routesArg = arg('routes', '/job,/clients'), sizesArg = arg('sizes', '1440x900,1280x720,1024x768,768x1024,390x844,320x640');
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const browser = await launch();
let worst = Infinity, report = [];
const modes = process.env.FALLBACK === '1' ? [true] : process.env.FALLBACK === '0' ? [false] : [false, true];
for (const FB of modes) for (const route of routesArg.split(',')) for (const size of sizesArg.split(',')) for (const theme of ['dark', 'light']) {
  const [w, h] = size.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: FB ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(`${origin}${route}?theme=${theme}`, { waitUntil: 'load' });
  if (!FB) await p.waitForFunction(() => document.querySelector('[data-lp-field][data-ready]'), null, { timeout: 15000 });
  await p.waitForTimeout(1600);
  const items = await p.evaluate(keepGrid => {
    const out = [];
    const hero = document.querySelector('.lp-hero-inner');
    const walk = el => {
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) {
        const r = document.createRange(); r.selectNodeContents(n);
        for (const b of r.getClientRects()) if (b.width > 2 && b.top < innerHeight && b.bottom > 0) {
          const cs = getComputedStyle(el);
          const grad = /gradient/.test(cs.backgroundImage) && cs.color === 'rgba(0, 0, 0, 0)' ? cs.backgroundImage : '';
          const inButton = !!el.closest('.ui-button');
          if (!inButton) out.push({ text: n.textContent.trim().slice(0, 30), x: b.left, y: b.top, w: b.width, h: b.height, color: grad || cs.color, size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) });
        }
      }
      for (const c of el.children) walk(c);
    };
    walk(hero);
    const st = document.createElement('style'); st.id = 'probe-hide';
    st.textContent = '.lp-hero-inner, .lp-hero-inner * { color: transparent !important; -webkit-text-fill-color: transparent !important; background-image: none !important; text-shadow: none !important; } .lp-hero-inner .ui-button { visibility: hidden !important; } .lp-word, .lp-hero-foot, .lp-kicker, .lp-hero-inner { animation: none !important; } astro-dev-toolbar { display: none !important; }' + (keepGrid ? '' : ' [data-bg]::before, [data-bg]::after, .ai-field::before { display: none !important; }');
    document.head.append(st);
    return out;
  }, process.env.GRID === '1');
  const shots = [];
  for (let k = 0; k < 3; k++) { await p.mouse.move(w * (0.3 + 0.3 * k), h * 0.5); await p.waitForTimeout(700); shots.push(PNG.sync.read(await p.screenshot())); }
  const parse = c => [...c.matchAll(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/g)].map(m => [+m[1], +m[2], +m[3]]);
  for (const it of items) {
    const cols = parse(it.color); if (!cols.length) continue;
    let min = Infinity, at = null;
    for (const img of shots) for (let y = Math.max(0, Math.floor(it.y)); y < Math.min(img.height, Math.ceil(it.y + it.h)); y += 2) for (let x = Math.max(0, Math.floor(it.x)); x < Math.min(img.width, Math.ceil(it.x + it.w)); x += 2) {
      const i = (y * img.width + x) * 4; const bg = [img.data[i], img.data[i + 1], img.data[i + 2]];
      for (const c of cols) { const q = ratio(c, bg); if (q < min) { min = q; at = [x, y, ...bg]; } }
    }
    const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
    const need = large ? 3 : 4.5;
    report.push({ mode: FB ? 'css' : 'live', route, size, theme, text: it.text, ratio: +min.toFixed(2), need, at });
    if (min / need < worst) worst = min / need;
  }
  await ctx.close();
}
await browser.close(); server?.close();
const bad = report.filter(r => r.ratio < r.need);
const low = [...report].sort((a, b) => a.ratio / a.need - b.ratio / b.need).slice(0, 8);
console.log('lowest (ratio / needed):'); for (const r of low) console.log(`  ${r.ratio} / ${r.need}  ${r.mode} ${r.route} ${r.size} ${r.theme}  "${r.text}"  worst at ${JSON.stringify(r.at)}`);
for (const r of bad) console.log(`  FAIL ${r.ratio} / ${r.need}  ${r.mode} ${r.route} ${r.size} ${r.theme} "${r.text}"`);
console.log(bad.length ? `FAILED: ${bad.length} text boxes under their minimum` : `PASSED: ${report.length} text boxes, all at or above their minimum`);
process.exit(bad.length ? 1 : 0);
