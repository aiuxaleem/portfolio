// Writes tests/baseline-current/manifest.json: a hash for every current-baseline screenshot, and which approved change
// altered that screen relative to the legacy baseline. The attribution is by rule (page, width, theme), not per pixel.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from '../lib.mjs';

const dir = path.join(ROOT, 'tests/baseline-current');
const files = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort()) {
  const m = f.match(/^(.*)_(\d+)x(\d+)_(light|dark)\.png$/); if (!m) continue;
  const [, page, w, , theme] = m; const width = +w; const why = [];
  if (['videos', 'contact', 'states'].includes(page)) why.push('new page (Phase 5)');
  else {
    why.push('Phase 5 item 3: header and footer content requested by the owner');
    why.push('M-19 (header control spacing)', 'M-26 (icon stroke width)');
    if (theme === 'dark') why.push('M-02 (body text colour in dark theme)');
    if (width <= 360) why.push('M-03 (header at narrow widths)');
    if (/^(home|ar)$/.test(page) && width <= 414) why.push('M-04 (hero badge wraps)');
    if (page === 'blog-component-spec-files' && width <= 360) why.push('M-15 (code block)');
    if (/^(home|ar|work|case-studies|ar-case)/.test(page)) why.push('M-06/M-12 (plain images with cover fit; resampling differs from the legacy component)');
  }
  const buf = fs.readFileSync(path.join(dir, f));
  files[f] = { sha256: crypto.createHash('sha256').update(buf).digest('hex'), changedBy: why };
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ note: 'Current approved baseline, captured from the built site. Images are not tracked; regenerate with: node scripts/visual/capture.mjs --target=dist --out=tests/baseline-current', count: Object.keys(files).length, files }, null, 1));
console.log('manifest written for', Object.keys(files).length, 'screenshots');
