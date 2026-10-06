// Debug helper: prints computed-style differences between a legacy page and its migrated version for every element with text.
// node scripts/migrate/compare-styles.mjs "/About.dc.html" /about [light|dark] [width]
import { serve, launch } from '../lib.mjs';
const [legacyPath, newPath, theme = 'light', width = '1280'] = process.argv.slice(2);
const a = await serve('legacy', 4450), b = await serve('dist', 4451); const browser = await launch();
const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'opacity', 'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'transform', 'filter', 'textDecorationLine', 'borderTopColor', 'boxShadow', 'webkitTextFillColor'];
async function grab(origin, p) {
  const ctx = await browser.newContext({ viewport: { width: +width, height: 720 }, colorScheme: theme, reducedMotion: 'reduce' }); const page = await ctx.newPage();
  await page.goto(origin + encodeURI(p) + (p.includes('?') ? '&' : '?') + 'theme=' + theme, { waitUntil: 'load' }); await page.waitForSelector('main h1'); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += 500) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(80); } await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800);
  const rows = await page.evaluate(PROPS => { const out = []; const w = document.createTreeWalker(document.querySelector('#dc-root') || document.body, NodeFilter.SHOW_ELEMENT); while (w.nextNode()) { const e = w.currentNode; if (/SCRIPT|STYLE|TEMPLATE/.test(e.tagName) || (e.tagName === 'IMG' && e.parentElement.hasAttribute('data-image-box'))) continue; const r = e.getBoundingClientRect(); if (!r.width && !r.height) continue; const s = getComputedStyle(e); const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue.trim()).join(' ').slice(0, 30); out.push({ tag: e.tagName.toLowerCase(), text: own, box: [r.left, r.top + scrollY, r.width, r.height].map(v => Math.round(v * 100) / 100).join(','), css: Object.fromEntries(PROPS.map(k => [k, s[k]])) }); } return out; }, PROPS);
  await ctx.close(); return rows;
}
const L = await grab('http://127.0.0.1:4450', legacyPath), N = await grab('http://127.0.0.1:4451', newPath);
console.log('elements: legacy', L.length, 'new', N.length);
let shown = 0; const kinds = {};
for (let i = 0; i < Math.min(L.length, N.length); i++) {
  const l = L[i], n = N[i]; const diffs = PROPS.filter(k => l.css[k] !== n.css[k]); if (l.box !== n.box) diffs.push('box');
  if (!diffs.length) continue; for (const d of diffs) kinds[d] = (kinds[d] || 0) + 1;
  if (shown++ < 14) console.log(`<${l.tag}> "${l.text}"`, diffs.map(k => k === 'box' ? `box ${l.box} -> ${n.box}` : `${k}: ${String(l.css[k]).slice(0, 60)} -> ${String(n.css[k]).slice(0, 60)}`).join(' | '));
}
console.log('differences by property:', JSON.stringify(kinds));
await browser.close(); a.close(); b.close();
