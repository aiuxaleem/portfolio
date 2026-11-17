// Contrast of each piece of text on the Services opening card against the brightest pixel directly behind it
// (text hidden, glow awake under the pointer, four samples), in both themes. node scripts/quality/services-card-contrast.mjs
import { serve, launch } from '../lib.mjs'; import { PNG } from 'pngjs';
const server = await serve('dist', 4497), b = await launch();
const lum = ([r, g, bl]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl); };
const ratio = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
let bad = 0;
for (const theme of ['light', 'dark']) for (const [w, h] of [[1280, 800], [390, 844]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'no-preference' }); const p = await c.newPage();
  await p.goto(`http://127.0.0.1:4497/services.html?theme=${theme}`, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const card = process.argv.includes('--last') ? p.locator('main [data-aurora]').last() : p.locator('main .cory-on-ink').first(); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  const texts = await card.evaluate(el => { const o = el.getBoundingClientRect(); return [...el.querySelectorAll('p, h2, a')].filter(t => t.textContent.trim()).map(t => { const s = getComputedStyle(t), r = t.getBoundingClientRect(); return { color: s.color, px: parseFloat(s.fontSize), weight: +s.fontWeight, sample: t.textContent.trim().slice(0, 30), x: Math.floor(r.left - o.left), y: Math.floor(r.top - o.top), w: Math.ceil(r.width), h: Math.ceil(r.height) }; }); });
  await card.evaluate(el => { el.querySelectorAll('p, h2, a').forEach(t => { t.style.visibility = 'hidden'; }); });
  const box = await card.boundingBox(); const worst = texts.map(() => null);
  // The pointer rests on each text in turn so the glow that follows it is at its brightest there.
  for (let i = 0; i < texts.length; i++) { const t = texts[i]; await p.mouse.move(box.x + t.x + t.w / 2, box.y + t.y + t.h / 2); await p.waitForTimeout(900);
    for (let n = 0; n < 2; n++) { const png = PNG.sync.read(await card.screenshot());
      for (let y = Math.max(0, t.y); y < Math.min(png.height, t.y + t.h); y++) for (let x = Math.max(0, t.x); x < Math.min(png.width, t.x + t.w); x++) { const k = (y * png.width + x) * 4, px = [png.data[k], png.data[k + 1], png.data[k + 2]]; if (!worst[i] || lum(px) > lum(worst[i])) worst[i] = px; }
      await p.waitForTimeout(500); } }
  console.log(`${theme} ${w}px`);
  texts.forEach((t, i) => { const m = t.color.match(/[\d.]+/g).map(Number), a = m[3] ?? 1, bg = worst[i]; const fg = m.slice(0, 3).map((v, k) => v * a + bg[k] * (1 - a)); const r = ratio(fg, bg); const need = t.px >= 24 || (t.px >= 18.66 && t.weight >= 700) ? 3 : 4.5; if (r < need) bad++; console.log(`   ${r.toFixed(2)}:1 ${r >= need ? 'ok  ' : 'FAIL'} (needs ${need}) on rgb(${bg.join(',')}) ${t.px}px/${t.weight} "${t.sample}"`); });
  await c.close();
}
await b.close(); server.close(); console.log(bad ? `\n${bad} below the threshold` : '\nAll text on the card meets its threshold.');
