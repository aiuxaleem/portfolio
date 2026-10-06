// Compares the built site with the legacy baseline, page by page.
// tests/visual-map.json maps a new route to the baseline name it must match, e.g. { "/about": "about" }.
// npm run visual [-- --only=/about,/work] [--summary]
// Build with LEGACY_PARITY=1 to compare the header and footer with their legacy content.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, VIEWPORTS, THEMES, serve, launch, open, revealAll } from '../lib.mjs';
import { diffPng } from './diff.mjs';

const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/visual-map.json'), 'utf8'));
const only = process.argv.find(a => a.startsWith('--only='));
const pairs = Object.entries(map.pages).filter(([route]) => !only || only.slice(7).split(',').includes(route));
if (!pairs.length) { console.log('No pages to compare.'); process.exit(0); }
const out = path.join(ROOT, 'reports/visual'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const server = await serve('dist', 4420); const browser = await launch();
const jobs = [];
for (const [route, baseName] of pairs) for (const [width, height] of VIEWPORTS) for (const theme of THEMES) jobs.push({ route, baseName, width, height, theme });
let next = 0, same = 0; const changed = [];
async function worker() {
  while (next < jobs.length) {
    const { route, baseName, width, height, theme } = jobs[next++];
    const name = `${baseName}_${width}x${height}_${theme}.png`;
    const base = path.join(ROOT, 'tests/baseline', name);
    if (!fs.existsSync(base)) { changed.push({ name, page: baseName, note: 'baseline missing (run npm run baseline:capture)' }); continue; }
    const { ctx, page } = await open(browser, 'http://127.0.0.1:4420', { name: baseName, path: route }, { width, height, theme });
    await revealAll(page, height);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent !important} canvas[data-scene-canvas]{visibility:hidden !important}' });
    await page.waitForTimeout(250);
    const shot = path.join(out, name); fs.writeFileSync(shot, await page.screenshot({ fullPage: true, type: 'png' })); await ctx.close();
    const r = diffPng(base, shot, path.join(out, name.replace('.png', '.diff.png')));
    if (r.same) { same++; fs.rmSync(shot); } else changed.push({ name, page: baseName, note: r.sizeMismatch || `${r.diffPixels} of ${r.total} pixels differ (${(100 * r.diffPixels / r.total).toFixed(3)}%)`, pixels: r.diffPixels });
  }
}
await Promise.all([worker(), worker(), worker()]);
await browser.close(); server.close();
changed.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ same, changed }, null, 1));
console.log(`\n${same} of ${jobs.length} views match the baseline exactly.`);
const byPage = {}; for (const c of changed) (byPage[c.page] = byPage[c.page] || []).push(c);
for (const [page, list] of Object.entries(byPage)) { console.log(`  ${page}: ${list.length} view(s) differ`); if (!process.argv.includes('--summary')) list.slice(0, 4).forEach(c => console.log(`    - ${c.name}: ${c.note}`)); }
if (changed.length) console.log('Differing screenshots and diff images are in reports/visual/.');
process.exit(changed.length ? 1 : 0);
