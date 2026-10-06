// Proves the baseline is repeatable: re-captures a sample of legacy views and compares them with tests/baseline.
// npm run baseline:verify [-- --sample=13]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, arg } from '../lib.mjs';
import { diffPng } from './diff.mjs';

const sample = arg('sample', 13);
const tmp = path.join(ROOT, 'reports/baseline-recheck'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
const only = arg('only', '');
spawnSync(`node scripts/visual/capture.mjs --target=legacy --out=reports/baseline-recheck ${only ? '--only=' + only : '--sample=' + sample}`, { cwd: ROOT, shell: true, stdio: 'inherit' });
let same = 0; const changed = [];
for (const f of fs.readdirSync(tmp).filter(f => f.endsWith('.png'))) {
  const base = path.join(ROOT, 'tests/baseline', f);
  if (!fs.existsSync(base)) { changed.push(`${f}: no baseline file`); continue; }
  const r = diffPng(base, path.join(tmp, f), path.join(tmp, f.replace('.png', '.diff.png')));
  if (r.same) same++; else changed.push(`${f}: ${r.sizeMismatch || r.diffPixels + ' of ' + r.total + ' pixels differ'}`);
}
console.log(`\n${same} of ${same + changed.length} re-captured views are pixel-identical to the baseline.`);
changed.forEach(c => console.log('  - ' + c));
process.exit(changed.length ? 1 : 0);
