// Writes the before/after tables in docs/PERFORMANCE.md from the measurements in reports/perf/.
// node scripts/perf/report.mjs   (after weights.mjs and lighthouse.mjs have been run with --label=before and --label=after)
// The tables are placed between the two marker comments in the document; the text around them is written by hand.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib.mjs';

const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/perf', f), 'utf8'));
const lb = read('lighthouse-before.json'), la = read('lighthouse-after.json'), wb = read('weights-before.json'), wa = read('weights-after.json');
const row = cells => `| ${cells.join(' | ')} |`;
const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
const ok = (v, pass) => `${v}${pass ? '' : ' ✗'}`;

const lighthouse = rows => table(['Template', 'Performance', 'Accessibility', 'Best practices', 'SEO', 'LCP (s)', 'CLS', 'TBT (ms)', 'Transfer (KB)', 'Requests'],
  rows.map(r => [`${r.name} \`${r.route}\``, ok(r.performance, r.performance >= 95), ok(r.accessibility, r.accessibility >= 95), ok(r.bestPractices, r.bestPractices >= 95), ok(r.seo, r.seo >= 95), ok((r.lcpMs / 1000).toFixed(2), r.lcpMs < 2500), ok(r.cls, r.cls < 0.1), ok(r.tbtMs, r.tbtMs < 200), r.transferKB, r.requests]));
const weights = w => table(['Template', 'JS (KB gz)', 'CSS (KB gz)', 'Fonts (KB)', 'Font files', 'Images (KB)', 'Third-party hosts'],
  w.pages.map(p => [p.name, ok(p.jsKB, p.jsKB <= 100), ok(p.cssKB, p.cssKB <= 50), p.fontKB, p.fontFiles.length, p.imageKB, p.hosts.join(', ') || 'none']));
const lcp = table(['Template', 'LCP element (phone, Lighthouse)'], la.map(r => [r.name, '`' + (r.lcpElement || 'not reported').replace(/\|/g, '\\|').replace(/`/g, "'").slice(0, 150) + '`']));
const misses = la.flatMap(r => [r.performance < 95 && `${r.name}: performance ${r.performance}`, r.seo < 95 && `${r.name}: SEO ${r.seo}`, r.lcpMs >= 2500 && `${r.name}: LCP ${(r.lcpMs / 1000).toFixed(2)} s`, r.cls >= 0.1 && `${r.name}: CLS ${r.cls}`].filter(Boolean));
const sum = (w, k) => Math.round(w.pages.reduce((n, p) => n + p[k], 0) / w.pages.length);
const generated = `### Before (commit 0911d89, Phase 13)

Lighthouse, mobile, simulated slow 4G and 4x CPU slowdown. ✗ marks a value outside its budget.

${lighthouse(lb)}

What each page downloaded on a phone-sized screen:

${weights(wb)}

Build: ${wb.disk.totalKB} KB, ${wb.disk.images.length} images, ${wb.disk.fonts.length} font files in the build (fonts came from Google).

### After (this phase)

${lighthouse(la)}

${weights(wa)}

Build: ${wa.disk.totalKB} KB, ${wa.disk.images.length} images, ${wa.disk.fonts.length} font files (self-hosted subsets; a page downloads only the ones it uses).

Averages across the ${la.length} templates: LCP ${(lb.reduce((n, r) => n + r.lcpMs, 0) / lb.length / 1000).toFixed(2)} s before, ${(la.reduce((n, r) => n + r.lcpMs, 0) / la.length / 1000).toFixed(2)} s after; performance score ${Math.round(lb.reduce((n, r) => n + r.performance, 0) / lb.length)} before, ${Math.round(la.reduce((n, r) => n + r.performance, 0) / la.length)} after; CSS ${sum(wb, 'cssKB')} KB before, ${sum(wa, 'cssKB')} KB after.

Still outside a budget after this phase: ${misses.length ? misses.join('; ') : 'nothing'}.

### LCP element on each template

${lcp}
`;
const doc = path.join(ROOT, 'docs/PERFORMANCE.md'); let s = fs.readFileSync(doc, 'utf8');
const A = '<!-- measurements:start -->', B = '<!-- measurements:end -->';
if (!s.includes(A) || !s.includes(B)) throw new Error('markers not found in docs/PERFORMANCE.md');
s = s.slice(0, s.indexOf(A) + A.length) + '\n\n' + generated + '\n' + s.slice(s.indexOf(B));
fs.writeFileSync(doc, s); console.log('tables written;', misses.length, 'values still outside a budget:', misses.join('; '));
