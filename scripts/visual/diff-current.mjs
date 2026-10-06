// Compares a fresh capture with the current baseline (tests/baseline-current), file by file, and lists what changed,
// what is new and what is gone. node scripts/visual/diff-current.mjs --in=reports/visual-new [--promote]
// --promote replaces the baseline with the fresh capture (run it only after the changes are explained).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, arg } from '../lib.mjs';
import { diffPng } from './diff.mjs';

const fresh = path.join(ROOT, arg('in', 'reports/visual-new')), base = path.join(ROOT, 'tests/baseline-current');
const pngs = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.png')) : []);
const a = new Set(pngs(base)), b = new Set(pngs(fresh));
const out = { compared: 0, identical: 0, changed: [], added: [...b].filter(f => !a.has(f)), removed: [...a].filter(f => !b.has(f)) };
for (const f of b) { if (!a.has(f)) continue; out.compared++;
  const r = diffPng(path.join(base, f), path.join(fresh, f));
  if (r.same) out.identical++; else out.changed.push({ file: f, percent: r.sizeMismatch ? 'size differs' : +(100 * r.diffPixels / r.total).toFixed(3) }); }
const page = f => f.replace(/[-_.]\d{3,4}(x\d+)?[-_.](light|dark)\.png$/, '');
const group = list => Object.entries(list.reduce((m, x) => { const k = page(x.file || x); (m[k] ||= []).push(x.percent ?? ''); return m; }, {})).map(([k, v]) => `${k}: ${v.length} view(s)${v[0] !== '' ? `, max ${Math.max(...v.map(n => (typeof n === 'number' ? n : 100)))}%` : ''}`);
const report = { compared: out.compared, identical: out.identical, changedPages: group(out.changed), addedPages: group(out.added), removedPages: group(out.removed) };
fs.writeFileSync(path.join(fresh, 'diff-current.json'), JSON.stringify({ ...report, changed: out.changed }, null, 1));
console.log(JSON.stringify(report, null, 1));
if (process.argv.includes('--promote')) {
  for (const f of a) fs.unlinkSync(path.join(base, f));
  for (const f of b) fs.copyFileSync(path.join(fresh, f), path.join(base, f));
  console.log(`promoted ${b.size} screenshots to tests/baseline-current`);
}
