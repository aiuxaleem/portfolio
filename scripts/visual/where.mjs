// Where two screenshots differ: the bounding box of the changed pixels, and a cropped side-by-side picture of it.
// node scripts/visual/where.mjs <file name in tests/baseline-current> [--in=reports/visual-new]
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { ROOT, arg } from '../lib.mjs';

const name = process.argv[2], fresh = path.join(ROOT, arg('in', 'reports/visual-new'));
const a = PNG.sync.read(fs.readFileSync(path.join(ROOT, 'tests/baseline-current', name))), b = PNG.sync.read(fs.readFileSync(path.join(fresh, name)));
console.log(`baseline ${a.width}x${a.height}, new ${b.width}x${b.height}`);
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height); let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * a.width + x) * 4, j = (y * b.width + x) * 4; if (Math.abs(a.data[i] - b.data[j]) + Math.abs(a.data[i + 1] - b.data[j + 1]) + Math.abs(a.data[i + 2] - b.data[j + 2]) > 12) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
if (!n) { console.log('no differing pixels in the shared area'); process.exit(0); }
console.log(`${n} pixels differ, inside x ${x0}-${x1}, y ${y0}-${y1}`);
const pad = 40, cx = Math.max(0, x0 - pad), cy = Math.max(0, y0 - pad), cw = Math.min(w - cx, Math.min(900, x1 - x0 + 2 * pad)), ch = Math.min(h - cy, Math.min(500, y1 - y0 + 2 * pad));
const out = new PNG({ width: cw * 2 + 10, height: ch }); out.data.fill(255);
for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const o1 = (y * out.width + x) * 4, o2 = (y * out.width + x + cw + 10) * 4, i = ((cy + y) * a.width + cx + x) * 4, j = ((cy + y) * b.width + cx + x) * 4; for (let k = 0; k < 4; k++) { out.data[o1 + k] = a.data[i + k]; out.data[o2 + k] = b.data[j + k]; } }
const file = path.join(fresh, 'where-' + name); fs.writeFileSync(file, PNG.sync.write(out)); console.log('side by side (baseline left, new right):', path.relative(ROOT, file));
