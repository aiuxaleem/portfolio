// Full-page screenshots of every route at every viewport in both themes, motion reduced.
// npm run baseline:capture   -> tests/baseline/*.png + tests/baseline/manifest.json (only the manifest is tracked)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, VIEWPORTS, THEMES, serve, launch, routes, arg, open, revealAll } from '../lib.mjs';

const target = arg('target', 'legacy');
const out = path.resolve(ROOT, arg('out', 'tests/baseline'));
const only = arg('only', '');            // comma-separated route names
const sample = Number(arg('sample', 0)); // capture every Nth job only
fs.mkdirSync(out, { recursive: true });

const server = await serve(target === 'legacy' ? 'legacy' : 'dist', 4410);
const browser = await launch();
let jobs = [];
for (const route of routes(target)) { if (only && !only.split(',').includes(route.name)) continue; for (const [width, height] of VIEWPORTS) for (const theme of THEMES) jobs.push({ route, width, height, theme }); }
if (sample > 1) jobs = jobs.filter((_, i) => i % sample === 0);
const manifest = {}; let next = 0, done = 0;
async function worker() {
  while (next < jobs.length) {
    const { route, width, height, theme } = jobs[next++];
    const name = `${route.name}_${width}x${height}_${theme}.png`;
    const { ctx, page } = await open(browser, 'http://127.0.0.1:4410', route, { width, height, theme });
    await revealAll(page, height);
    // Freeze anything still moving and hide the caret so two runs of the same page are identical.
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent !important} canvas[data-scene-canvas]{visibility:hidden !important}' });
    await page.waitForTimeout(250);
    const buf = await page.screenshot({ fullPage: true, type: 'png' });
    fs.writeFileSync(path.join(out, name), buf);
    manifest[name] = { sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length, path: route.path };
    await ctx.close();
    if (++done % 20 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length}`);
  }
}
await Promise.all([worker(), worker(), worker()]);
await browser.close(); server.close();
const sorted = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]));
if (!sample && !only) fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ target, capturedFrom: 'legacy/ at the commit that contains this file', count: jobs.length, files: sorted }, null, 1));
console.log(`captured ${jobs.length} screenshots to ${path.relative(ROOT, out)}`);
