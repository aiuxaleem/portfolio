// Self-hosting the web fonts (CLAUDE.md 2.9). Run once, and again only when the font list changes:
//   node scripts/perf/fetch-fonts.mjs
// It asks Google Fonts for the same stylesheet the site used to link, downloads every woff2 file that stylesheet names
// into public/fonts/, and writes src/styles/fonts.css with the same @font-face rules pointing at the local files.
// The files are the ones visitors were already getting (already split into subsets by unicode-range), so text renders
// exactly as before. It also writes a metric-matched fallback face for Plus Jakarta Sans, so text set in the fallback
// while the font loads takes up the same space.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fromBuffer } from '@capsizecss/unpack';
import { ROOT } from '../lib.mjs';

const URL_ALL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@700;800&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const css = await (await fetch(URL_ALL, { headers: { 'User-Agent': UA } })).text();
if (!css.includes('@font-face')) throw new Error('Google Fonts did not return a stylesheet');

const dir = path.join(ROOT, 'public/fonts'); fs.mkdirSync(dir, { recursive: true });
const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map(m => m[1]))];
const names = new Map(); let total = 0;
const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)].map(m => ({ subset: m[1], body: m[2], url: (m[2].match(/url\(([^)]+)\)/) || [])[1], family: (m[2].match(/font-family: '([^']+)'/) || [])[1], weight: (m[2].match(/font-weight: (\d+)/) || [])[1] }));
// A variable font is returned once per weight with the same URL: merge those rules into one with a weight range.
const merged = [];
for (const b of blocks) { const prev = merged.find(m => m.url === b.url && m.subset === b.subset); if (prev) { prev.weights.push(+b.weight); continue; } merged.push({ ...b, weights: [+b.weight] }); }
// File name: family, subset, weight (or "variable") and a hash of the content, so a changed file gets a new name and
// the files can be cached for a year.
for (const f of fs.readdirSync(dir)) if (f.endsWith('.woff2')) fs.unlinkSync(path.join(dir, f));
for (const b of merged) { if (names.has(b.url)) continue; const buf = Buffer.from(await (await fetch(b.url)).arrayBuffer());
  const name = `${b.family.toLowerCase().replace(/\s+/g, '-')}-${b.subset}-${b.weights.length > 1 ? 'variable' : b.weights[0]}.${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8)}`;
  names.set(b.url, name); fs.writeFileSync(path.join(dir, name + '.woff2'), buf); total += buf.length; }
if (new Set(names.values()).size !== names.size) throw new Error('two font files were given the same name');
// Metric-matched fallback: Arial resized and re-spaced to the web font's metrics (same method as next/font and fontaine).
const ARIAL = { unitsPerEm: 2048, xWidthAvg: 904 };
const latin = merged.find(b => b.family === 'Plus Jakarta Sans' && b.subset === 'latin');
const m = await fromBuffer(fs.readFileSync(path.join(dir, names.get(latin.url) + '.woff2')));
const adjust = (m.xWidthAvg / m.unitsPerEm) / (ARIAL.xWidthAvg / ARIAL.unitsPerEm);
const pct = n => (n * 100).toFixed(2) + '%';
/* The fallback is limited to the characters Plus Jakarta Sans itself covers. Without that limit it would also catch
   characters the web font lacks (arrows, for example) and draw them in resized Arial instead of the system font. */
const covered = merged.filter(b => b.family === 'Plus Jakarta Sans').map(b => (b.body.match(/unicode-range: ([^;]+);/) || [])[1]).join(', ');
const fallback = `/* Fallback shown while Plus Jakarta Sans loads: Arial, scaled and spaced to the same metrics, so nothing moves on swap. */
@font-face { font-family: 'Plus Jakarta Sans Fallback'; src: local('Arial'); size-adjust: ${pct(adjust)}; ascent-override: ${pct(m.ascent / (m.unitsPerEm * adjust))}; descent-override: ${pct(Math.abs(m.descent) / (m.unitsPerEm * adjust))}; line-gap-override: ${pct(m.lineGap / (m.unitsPerEm * adjust))}; unicode-range: ${covered}; }
`;
const rules = merged.map(b => { const w = b.weights.length > 1 ? `${Math.min(...b.weights)} ${Math.max(...b.weights)}` : String(b.weights[0]);
  const range = (b.body.match(/unicode-range: ([^;]+);/) || [])[1]; const style = (b.body.match(/font-style: (\w+)/) || [])[1];
  return `/* ${b.family}, ${b.subset} */\n@font-face { font-family: '${b.family}'; font-style: ${style}; font-weight: ${w}; font-display: swap; src: url(/fonts/${names.get(b.url)}.woff2) format('woff2'); unicode-range: ${range}; }`; }).join('\n');
fs.writeFileSync(path.join(ROOT, 'src/styles/fonts.css'), `/* Self-hosted web fonts. Written by scripts/perf/fetch-fonts.mjs; do not edit by hand.\n   Each file is a subset; the browser downloads only the subsets a page uses. */\n${fallback}${rules}\n`);
const file = (family, subset, weight) => { const b = merged.find(x => x.family === family && x.subset === subset && (!weight || x.weights.includes(weight))); return `/fonts/${names.get(b.url)}.woff2`; };
// Preloaded: the Latin text face on every page; on Arabic pages also the Arabic body face (regular) and the Arabic heading face.
const preload = { latin: [file('Plus Jakarta Sans', 'latin')], arabic: [file('IBM Plex Sans Arabic', 'arabic', 400), file('Noto Kufi Arabic', 'arabic')] };
fs.writeFileSync(path.join(ROOT, 'src/styles/fonts.json'), JSON.stringify({ preload, files: [...names.values()].map(n => n + '.woff2') }, null, 2) + '\n');
console.log(`${urls.length} font files, ${(total / 1024).toFixed(0)} KB in public/fonts; ${merged.length} @font-face rules (from ${blocks.length}); fallback size-adjust ${pct(adjust)}; preload ${JSON.stringify(preload)}`);
for (const [u, n] of names) console.log(`  ${n}.woff2  ${(fs.statSync(path.join(dir, n + '.woff2')).size / 1024).toFixed(1)} KB`);
