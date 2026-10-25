// The page's field (src/components/layout/ai-field.astro): worst-case contrast of every text colour over a glow's peak.
// The glows are fixed, so any text can sit on a peak while the page scrolls; the field's glass veil lies between the glow
// and the text. Colours are read from the built page in each theme, so they are the real token values; the glow peaks
// are --glow-cyan (35%) and --glow-blue (30%) from tokens.css. Part of npm run quality (step 3d); alone, after a build:
// node scripts/quality/check-field.mjs
import { serve, launch } from '../lib.mjs';
const server = await serve('dist', 4493), browser = await launch(), p = await browser.newPage();
const parse = c => {
  let m = c.match(/^color\(srgb ([^)]+)\)/); if (m) { const [r, g, b, a = 1] = m[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: r * 255, g: g * 255, b: b * 255, a }; }
  m = c.match(/rgba?\(([^)]+)\)/); const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a };
};
const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const glows = { cyan: { r: 41, g: 190, b: 221, a: 0.35 }, blue: { r: 37, g: 138, b: 253, a: 0.30 } };
const texts = ['--text-strong', '--text-body', '--text-muted', '--text-subtle', '--text-link'];
let lowest = Infinity, fails = 0;
for (const theme of ['light', 'dark']) {
  await p.goto(`http://127.0.0.1:4493/?theme=${theme}`, { waitUntil: 'load' });
  const c = await p.evaluate(names => { const el = document.createElement('div'); document.body.append(el); const out = {}; for (const v of names) { el.style.color = `var(${v})`; out[v] = getComputedStyle(el).color; } el.remove(); return out; }, ['--surface-page', '--surface-glass', ...texts]);
  for (const [name, glow] of Object.entries(glows)) {
    const under = over(parse(c['--surface-glass']), over(glow, parse(c['--surface-page']))); // page, glow at its peak, the veil
    for (const t of texts) { const r = ratio(parse(c[t]), under); lowest = Math.min(lowest, r); if (r < 4.5) fails++; console.log(`${theme.padEnd(5)} ${name.padEnd(4)} ${t.padEnd(13)} ${r.toFixed(2)}`); }
  }
}
await browser.close(); server.close();
console.log(fails ? `FAILED: ${fails} below 4.5:1` : `PASSED: every text colour at 4.5:1 or more over a glow's peak (lowest ${lowest.toFixed(2)})`);
process.exit(fails ? 1 : 0);
